import { bucket } from './db'
import Q from 'q'
import log from '@adapter/common/src/winston'

const DataLoader = require('dataloader')
const couchbase = require('couchbase')
const nq = couchbase.N1qlQuery

export const childLoader = new DataLoader(async keys => {
  const { _name } = bucket
  log.debug('keys', keys)
  const query = nq.fromString(`SELECT v.*, v.username id FROM ${_name} v WHERE _type = 'USER' AND father IN ${JSON.stringify(keys)}`)
  log.debug('childLoader query start')
  const [results] = await Q.ninvoke(bucket, 'query', query)
  log.verbose('childLoader query ended')
  const childUserMap = {}
  results.forEach(child => {
    if (childUserMap[child.father]) {
      childUserMap[child.father].push(child)
    } else {
      childUserMap[child.father] = [child]
    }
  })
  return keys.map(key => childUserMap[key])
}, { cache: true })

