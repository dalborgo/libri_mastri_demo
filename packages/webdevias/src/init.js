import { cFunctions, log } from '@adapter/common'

const isProd = cFunctions.isProd()
const REACT_APP = isProd ? 'REACT_APP' : 'REACT_APP_DEV'
const wlh = window.location.hostname
const ORIGIN = window.location.origin
const PROTOCOL = window.location.protocol || 'http:'
const BACKEND_PORT = PROTOCOL === 'http:' ? process.env[`${REACT_APP}_BACKEND_PORT`] : parseInt(process.env[`${REACT_APP}_BACKEND_PORT`], 10) + 2000
const HOST = `${PROTOCOL}//${wlh}:${BACKEND_PORT}`
const SERVER = process.env[`${REACT_APP}_COUCHBASE_FOR_LINK`] ? process.env[`${REACT_APP}_COUCHBASE_FOR_LINK`] : wlh
const BUCKET = process.env[`${REACT_APP}_BUCKET_FOR_LINK`] || 'libri_mastri'
const POLLING_MILLI = process.env[`${REACT_APP}_POLLING_MILLI`] || 300000
log.info(`Environment: ${isProd ? 'Production' : 'Development'}`)
log.info(`Polling interval in seconds: ${parseInt(POLLING_MILLI, 10) / 1000}`)
export const envConfig = {
  BACKEND_PORT,
  IS_PROD: isProd,
  HOST,
  BUCKET,
  MAX_UPLOAD_MB: process.env[`${REACT_APP}_MAX_UPLOAD_MB`] || 20,
  LOG_LEVEL: process.env[`${REACT_APP}_LOG_LEVEL`] || 'INFO',
  ORIGIN,
  POLLING_MILLI,
  PROTOCOL,
  SERVER,
}

log.setLevel(isProd ? log.levels[envConfig.LOG_LEVEL] : log.levels.TRACE) // Be sure to call setLevel method in order to apply plugin
log.table = isProd ? () => null : console.table // eslint-disable-line no-console
log.dir = isProd ? () => null : console.dir // eslint-disable-line no-console
log.table(envConfig)
