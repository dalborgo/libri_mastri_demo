import couchbase from '../'
import config from 'config'
import Q from 'q'

const { BUCKET_DEFAULT } = config.get('couchbase')

async function createPrimaryIndex (bucket = BUCKET_DEFAULT, options, returnProm, defer = false) {
  try {
    if (!bucket) {return { ok: false, message: 'Bucket is undefined!' }}
    const deferIndex = defer ? ' WITH {"defer_build":true}' : ''
    const queryString = `CREATE PRIMARY INDEX \`${bucket}_primary\` ON \`${bucket}\`${deferIndex}`
    if (returnProm) {return couchbase.execQuery(queryString, options, returnProm)}
    const { ok, message, results, err } = await couchbase.execQuery(queryString, options, returnProm)
    if (!ok) {return { ok, message, err }}
    return { ok, results }
  } catch (err) {
    return { ok: false, message: err.message, err }
  }
}

async function createIndex (index, options, returnProm, defer = false) {
  try {
    if (!index) {return { ok: false, message: 'Index is undefined!' }}
    const deferIndex = defer ? ' WITH {"defer_build":true}' : ''
    const queryString = `${index}${deferIndex}`
    if (returnProm) {return couchbase.execQuery(queryString, options, returnProm)}
    const { ok, message, results, err } = await couchbase.execQuery(queryString, options, returnProm)
    if (!ok) {return { ok, message, err }}
    return { ok, results }
  } catch (err) {
    return { ok: false, message: err.message, err }
  }
}

async function buildIndices (options) {
  const opt = couchbase.normOptions(options)
  const conn = couchbase.buildConnection(opt)
  try {
    const resp = await Q.ninvoke(conn.manager(), 'buildDeferredIndexes')
    return { ok: true, results: resp }
  } catch (err) {
    return { ok: false, message: err.message, err }
  }
}

export default {
  buildIndices,
  createIndex,
  createPrimaryIndex,
}
