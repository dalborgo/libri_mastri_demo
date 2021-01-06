import { cFunctions } from '@adapter/common'
import axios from 'axios'
import config from 'config'
import Q from 'q'
import log from '@adapter/common/src/winston'
import compose from 'lodash/fp/compose'

const couchbase = require('couchbase')
const WebSocket = require('websocket').w3cwebsocket
const nq = couchbase.N1qlQuery
const vq = couchbase.ViewQuery
const { IP_DEFAULT, BUCKET_DEFAULT, ADMIN_DEFAULT, PASSWORD_DEFAULT } = config.get('couchbase')
const RECOVER_SEQ = 3

const debug = require('debug')

function connect ({ ip, bucket, admin, password }) {
  const cluster = new couchbase.Cluster(`couchbase://${ip}`)
  if (password) {
    cluster.authenticate(admin, password)
    return cluster.openBucket(bucket)
  } else {
    return cluster.openBucket(bucket)
  }
}

async function getVersion () {
  try {
    const url = `http://${IP_DEFAULT}:8091/versions`
    const { data: { implementationVersion: results } } = await axios.get(url)
    return { ok: true, results }
  } catch (err) {
    return { ok: false, message: err.message }
  }
}

async function getLastSeq (options) {
  const opt = normOptions(options)
  const conn = connect(opt)
  try {
    const resp = await Q.ninvoke(conn, 'get', '_sync:seq')
    return resp.value
  } catch (err) {
    log.error(err.message)
    return RECOVER_SEQ
  }
}

async function getDoc (key, options) {
  const opt = normOptions(options)
  const conn = connect(opt)
  try {
    const resp = await Q.ninvoke(conn, 'get', key)
    return { ok: true, results: resp.value }
  } catch (err) {
    log.error(err.message)
    return { ok: false, message: err.message, err }
  }
}

async function replaceDoc (key, value, options) {
  const opt = normOptions(options)
  const conn = connect(opt)
  try {
    const resp = await Q.ninvoke(conn, 'replace', key, value)
    return { ok: true, results: resp }
  } catch (err) {
    log.error(err.message)
    return { ok: false, message: err.message, err }
  }
}

function normOptions (options = {}) {
  const opt = {}
  opt.ip = IP_DEFAULT
  opt.bucket = BUCKET_DEFAULT
  opt.admin = ADMIN_DEFAULT || options.bucket || opt.bucket
  opt.password = PASSWORD_DEFAULT || BUCKET_DEFAULT  //VARIED FOR PROJECT LIBRI MASTRI / used to distinguish version 4 from 5+
  opt.req_plus = false
  return { ...opt, ...options }
}

function buildConnection (opt) {
  const { connection } = opt
  if (connection && connection.constructor && connection.constructor.name === 'Bucket') {
    return connection
  } else {
    return connect(opt)
  }
}

function manageResults (rows, chain, callback, label) {
  log.log('Total docs:', rows.length)
  return chain.then(() => callback(rows)).then(({ ok, results, message }) => {
    if (ok) {
      log.log(`${label} RAN SUCCESSFULLY:`, JSON.stringify(results, null, 1))
    } else {
      log.error(`${label} ERROR OCCURRED:`, JSON.stringify(message, null, 1))
    }
  }).catch(({ message }) => {log.error(message)})
}

function wsChanges (callback, _params = {}, label = 'TASK', _options) {
  let chain = Promise.resolve()
  const listener = async () => {
    const since = await getLastSeq()
    const params = {
      active_only: true,
      filter: 'sync_gateway/bychannel',
      since,
      ..._params,
    }
    const options = normOptions(_options)
    
    const client = new WebSocket(`ws://${options.ip}:4984/${options.bucket}/_changes?feed=websocket`)
    
    client.onerror = function () {
      log.error('WebSocket connection error')
    }
    
    client.onopen = function () {
      client.send(Buffer.from(JSON.stringify(params)))
      log.log('WebSocket has been opened')
    }
    
    client.onclose = function () {
      log.log('WebSocket closed')
      listener(since).then() //to reopen
    }
    
    client.onmessage = function ({ data }) {
      try {
        if (typeof data === 'string') {
          log.log(`Received: "${data}"`)
          const results = JSON.parse(data)
          if (results && results.length) {
            chain = manageResults(results, chain, callback, label)
          }
        }
      } catch (err) {
        log.error(err.message)
      }
    }
  }
  listener().then()
}

function longPollChanges (callback, _params = {}, label = 'TASK', startSeq, _options) {
  let chain = Promise.resolve()
  const listener = async since => {
    log.log(`Couchbase listener (ls ${since}): waiting for events...`)
    const params = {
      active_only: true,
      feed: 'longpoll',
      filter: 'sync_gateway/bychannel',
      since,
      ..._params,
    }
    const options = normOptions(_options)
    try {
      const { data: { results, last_seq } } = await axios.post(`http://${options.ip}:4984/${options.bucket}/_changes`, params)
      if (results && results.length) {
        chain = manageResults(results, chain, callback, label)
      }
      listener(last_seq).then()
    } catch (err) {
      log.error(err.message)
      setTimeout(() => listener(since).then(), 10000)
    }
  }
  getLastSeq().then(since => {
    listener(startSeq || since).then()
  }).catch(err => {
    log.error(err.message)
  })
}

async function execQuery (query, options, returnProm = false) {
  const opt = normOptions(options)
  const conn = buildConnection(opt)
  //<editor-fold desc="DEBUG VARS">
  const debugTime = debug('ast:time')
    , debugRes = debug('ast:res')
    , debugQuery = debug('ast:query')
  //</editor-fold>
  debugQuery('query', query)
  const stringQuery = nq.fromString(query)
  opt.req_plus && stringQuery.consistency(nq.Consistency.REQUEST_PLUS)
  debugTime('start')
  try {
    if (returnProm) {return Q.ninvoke(conn, 'query', stringQuery)}
    const [results, requestInfo] = await Q.ninvoke(conn, 'query', stringQuery) //return array
    debugQuery('query', requestInfo)
    debugTime('end')
    conn.disconnect()
    return { ok: true, results }
  } catch (err) {
    debugRes(err)
    debugTime('end')
    conn.disconnect()
    return { ok: false, err, message: err.message }
  }
}

const toStale = stale => inp => stale ? inp : inp.stale(vq.Update.BEFORE)
const toOrder = descending => inp => descending ? inp.order(vq.Order.DESCENDING) : inp
const toRange = (startkey, endkey, descending) => inp => (startkey || endkey) ? descending ? inp.range(endkey, startkey) : inp.range(startkey, endkey) : inp
const composeView = (val, startkey, endkey, descending, stale) => compose(toStale(stale), toOrder(descending), toRange(startkey, endkey))(val, startkey, endkey, descending, stale)

/**
 * @param params
 * startkey e endkey devono esserci entrambi
 * @param options
 * @param returnProm
 */

async function execView (params = {}, options, returnProm = false) {
  const opt = normOptions(options)
  const { ddoc, view, stale = false, descending = true, startkey, endkey } = params
  const conn = buildConnection(opt)
  //<editor-fold desc="DEBUG VARS">
  const debugTime = debug('ast:time')
    , debugRes = debug('ast:res')
    , debugQuery = debug('ast:query')
  //</editor-fold>
  debugQuery('params', params)
  let query = vq.from(ddoc || opt.bucket, view)
  query = composeView(query, startkey, endkey, descending, stale)
  debugTime('start')
  try {
    if (returnProm) {return Q.ninvoke(conn, 'query', query)}
    const [results, requestInfo] = await Q.ninvoke(conn, 'query', query)
    debugQuery('query', requestInfo)
    debugTime('end')
    conn.disconnect()
    return { ok: true, results }
  } catch (err) {
    debugRes(err)
    debugTime('end')
    conn.disconnect()
    return { ok: false, err, message: err.message }
  }
}

async function execQueryService (statement, options, returnProm = false) {
  const { ip, admin, password } = normOptions(options)
  const auth = cFunctions.getAuth(admin, password)
  //<editor-fold desc="DEBUG VARS">
  const debugTime = debug('ast:time')
    , debugRes = debug('ast:res')
    , debugStatement = debug('ast:statement')
  //</editor-fold>
  debugStatement('statement', statement)
  debugTime('start')
  try {
    const params = {
      data: { statement },
      headers: { Authorization: auth },
      method: 'POST',
      url: `http://${ip}:8093/query/service`,
    }
    if (returnProm) {return axios(params)}
    const { data: { results } } = await axios(params)
    debugTime('end')
    return { ok: true, results }
  } catch (err) {
    debugRes(err)
    debugTime('end')
    return { ok: false, err, message: err.message }
  }
}

async function execViewService (params, options, returnProm = false) {
  const { ip, admin, password, bucket } = normOptions(options)
  const { ddoc, view, stale = false, descending = false, startkey, endkey } = params
  const auth = cFunctions.getAuth(admin, password)
  //<editor-fold desc="DEBUG VARS">
  const debugTime = debug('ast:time')
    , debugRes = debug('ast:res')
    , debugStatement = debug('ast:statement')
  //</editor-fold>
  debugStatement('view', view)
  debugTime('start')
  try {
    const start = startkey ? `&startkey=${startkey}` : ''
    const end = endkey ? `&endkey=${endkey}` : ''
    const params = {
      headers: { Authorization: auth },
      url: `http://${ip}:8092/${bucket}/_design/${ddoc || bucket}/_view/${view}?stale=${stale}&descending=${descending}${start}${end}`,
    }
    if (returnProm) {return axios(params)}
    const { data: { rows } } = await axios(params)
    debugTime('end')
    return { ok: true, results: rows }
  } catch (err) {
    debugRes(err)
    debugTime('end')
    return { ok: false, err, message: err.message }
  }
}

async function getIndexStatus (options, returnProm = false) {
  const { ip, admin, password, bucket } = normOptions(options)
  const auth = cFunctions.getAuth(admin, password)
  try {
    const params = {
      headers: { Authorization: auth },
      method: 'GET',
      url: `http://${ip}:8091/indexStatus`,
    }
    if (returnProm) {return axios(params)}
    const { data: { indexes } } = await axios(params)
    let errors = false, results = []
    indexes.forEach(index => {
      errors |= index.status !== 'Ready'
      index.bucket === bucket && results.push({ name: index.index, status: index.status, bucket: index.bucket })
    })
    errors && log.warn('Some error on indices!')
    return { ok: true, results }
  } catch (err) {
    return { ok: false, err, message: err.message }
  }
}

export default {
  buildConnection,
  composeView,
  connect,
  execQuery,
  execQueryService,
  execView,
  execViewService,
  getDoc,
  getIndexStatus,
  getVersion,
  longPollChanges,
  normOptions,
  replaceDoc,
  wsChanges,
}
