import Bluebird from 'bluebird'
import Swagger from 'swagger-client'
import httpMessageParser from 'http-message-parser'
import spec from './json/sgadmin20'
import config from 'config'

const __logSwaggerReq = require('debug')('man:swaggerReq')

Bluebird.config({ cancellation: true })
const { IP_DEFAULT, BUCKET_DEFAULT, SWAGGER_TIMEOUT = 120000, API_ADMIN_PORT = '4985' } = config.get('couchbase')

const getTimeout = (ms = SWAGGER_TIMEOUT) => new Bluebird((resolve, reject, onCancel) => {
  const id = setTimeout(resolve, ms, { ok: false, statusText: `swagger execute timeout ${ms} ms` })
  onCancel(() => clearTimeout(id))
})

async function execute (operationId, parameters, host) {
  const timeout = getTimeout()
  try {
    const client = await getClient(host)
    __logSwaggerReq('host:', host)
    __logSwaggerReq('operationId:', operationId)
    __logSwaggerReq('parameters:', parameters)
    const { ok, obj: results, statusText: message } = await Promise.race([client.execute({
      operationId,
      parameters,
    }), timeout])
    timeout.cancel()
    if (!ok) { return { ok, message }}
    return { ok: true, results }
  } catch ({ message }) {
    timeout.cancel()
    return { ok: false, message }
  }
}

async function executeMultiPart (operationId, parameters, objectGroup, host) {
  const timeout = getTimeout()
  try {
    const client = await getClient(host)
    __logSwaggerReq('operationId:', operationId)
    __logSwaggerReq('parameters:', parameters)
    const { ok, data, statusText: message } = await Promise.race([client.execute({
      operationId,
      parameters,
    }), timeout])
    timeout.cancel()
    if (!ok) { return { ok, message }}
    const parsedMessage = httpMessageParser(data)
    let { multipart } = parsedMessage
    multipart = multipart.length > 1 ? multipart : [parsedMessage]
    let results = objectGroup ? {} : [], cont = 0
    for (let { headers, body } of multipart) {
      const ct = headers['Content-Type']
      if (ct.startsWith('application/json')) {
        const json = JSON.parse(body.toString())
        const id = json[objectGroup] || cont++
        if (objectGroup) {
          results[id] = json
        } else {
          results.push(json)
        }
      } else {
        const id = cont++
        if (objectGroup) {
          results[id] = body
        } else {
          results.push(body)
        }
      }
    }
    return { ok: true, results }
  } catch ({ message }) {
    timeout.cancel()
    return { ok: false, message }
  }
}

async function getApis (host) {
  const { apis } = await getClient(host)
  return apis
}

function getClient (host = `${IP_DEFAULT}`) {
  spec.host = `${host}:${API_ADMIN_PORT}`
  return new Swagger({ spec }) //return promise
}

const postDbBulkDocs = async (docs, db = BUCKET_DEFAULT, host) => execute('post__db___bulk_docs', {
  db,
  BulkDocsBody: { docs },
}, host)

const postDbBulkGet = async (docs, objectGroup = '', db = BUCKET_DEFAULT, host) => {
  const res = await executeMultiPart('post__db___bulk_get', {
    db,
    BulkGetBody: { docs },
  }, objectGroup, host) //if objectGroup is '' returns an array
  res.ok && res.results.forEach(doc => {if (doc.error) {console.warn('postDbBulkGet errors:', doc)}})
  return res
}

const getDbDoc = async (doc, db = BUCKET_DEFAULT, host) => {
  const res = await execute('get__db___doc_', {
    db,
    doc,
  }, host)
  if (res.message === 'Not Found') {res.message = `${doc} is missing!`}
  return res
}

const postDbDesignDdoc = async (views, db = BUCKET_DEFAULT, host) => execute('put__db___design__ddoc_', {
  db,
  ddoc: db,
  body: views,
}, host)

export default {
  execute,
  getApis,
  getDbDoc,
  postDbBulkDocs,
  postDbBulkGet,
  postDbDesignDdoc,
}
