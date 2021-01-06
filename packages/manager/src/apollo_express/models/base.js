import { bucket, lounge } from '../db'
import { couchbase as couchbase_, ioFormatters } from '@adapter/io'
import Q from 'q'
import isEqual from 'lodash/isEqual'
import { cFunctions } from '@adapter/common'
import log from '@adapter/common/src/winston'

const couchbase = require('couchbase')
const knex = require('knex')({ client: 'mysql' })
const nq = couchbase.N1qlQuery
const vq = couchbase.ViewQuery

export const baseSchema = lounge.schema({
  _type: String,
})
export const timeSchema = lounge.schema({
  _createdAt: String,
  _updatedAt: String,
})
export const cursorSchema = lounge.schema({
  _cursor: String,
})
export const casSchema = lounge.schema()

baseSchema.pre('save', function (next) {
  this._type = this.modelName
  next()
})
timeSchema.pre('save', function (next) {
  this._createdAt = this._createdAt || (new Date()).toISOString()
  this._updatedAt = (new Date()).toISOString()
  next()
})
cursorSchema.pre('save', function (next) {
  this._cursor = cFunctions.toBase64(this.getDocumentKeyValue())
  next()
})

async function execQuery (stringQuery, params = [], reqPlus = false) {
  params = !Array.isArray(params) ? [params] : params
  const query = nq.fromString(stringQuery)
  log.debug('stringQuery', stringQuery)
  reqPlus && query.consistency(nq.Consistency.REQUEST_PLUS)
  const [results] = await Q.ninvoke(bucket, 'query', query, params)
  log.verbose('finished!')
  return results
}

baseSchema.static('getAll', async function (orderBy, onlyIds = false) {
  const { _name } = bucket
  const id = this.getDocumentKeyKey()
  const [field, dir = 'asc'] = Array.isArray(orderBy) ? orderBy : [null]
  const labelSort = field ? ` ORDER BY ${field} ${dir}` : ''
  const prefix = onlyIds ? 'RAW' : 'v.*,'
  const stringQuery = `SELECT ${prefix} v.${id} id FROM ${_name} v WHERE _type = '${this.modelName}'${labelSort}`
  return execQuery(stringQuery)
})

baseSchema.static('getKnex', function (onlyIds = false) {
  const { _name } = bucket
  const id = this.getDocumentKeyKey()
  const columns = []
  columns.push(`v.${id} as id`)
  !onlyIds && columns.push('v.*')
  return knex.select(columns).from(`${_name} as v`).where({ _type: this.modelName })
})

baseSchema.static('getByQuery', async function (stringQuery, params, reqPlus) {
  if (stringQuery.constructor.name === 'Builder') {
    stringQuery = stringQuery.toQuery()
  }
  return execQuery(stringQuery, params, reqPlus)
})

baseSchema.static('getByView', async function (params = {}) {
  const { _name } = bucket
  const { ddoc, view, stale = false, descending = true, startkey, endkey } = params
  let query = vq.from(ddoc || _name, view)
  query = couchbase_.composeView(query, startkey, endkey, descending, stale)
  const [results] = await Q.ninvoke(bucket, 'query', query)
  return results
})

baseSchema.static('count', async function (objs) {
  const { _name } = bucket
  const objToQuery = ioFormatters.objToQueryConditions(objs)
  const query = nq.fromString(`SELECT RAW COUNT(*) FROM ${_name} WHERE _type = '${this.modelName}'${objToQuery}`)
  const [counts] = await Q.ninvoke(bucket, 'query', query)
  return counts[0]
})

baseSchema.method('getId', function () {
  return this.getDocumentKeyValue()
})

baseSchema.method('getKey', function () {
  return this.getDocumentKeyValue(true)
})

baseSchema.method('isModified', async function (prop) {
  const sch = lounge.getModel(this.modelName)
  const origin = await sch.findById(this.id)
  if (!origin) {return true}
  if (this.get(prop) && origin.get(prop)) {
    return !isEqual(this[prop], origin[prop])
  }
  return !prop ? !isEqual(this, origin) : true
})

baseSchema.virtual('id', String, {
  get: function () {
    return this.getDocumentKeyValue()
  },
})

casSchema.virtual('_cas', String, {
  get: function () {
    return this.getCAS(true).toString()
  },
})
