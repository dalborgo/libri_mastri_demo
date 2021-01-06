import config from 'config'
import log from '@adapter/common/src/winston'

const { IP_DEFAULT, BUCKET_DEFAULT, ADMIN_DEFAULT = BUCKET_DEFAULT, PASSWORD_DEFAULT = ADMIN_DEFAULT || BUCKET_DEFAULT, REG_USER, REG_PASS } = config.get('couchbase')
const couchbase = require('couchbase')
const lounge = require('lounge')
const ottoman = require('ottoman')
const registryOttoman = new ottoman.Ottoman()
const cluster = new couchbase.Cluster(`couchbase://${IP_DEFAULT}`)
const registryBucket = cluster.openBucket(REG_USER, REG_PASS)
registryOttoman.store = new ottoman.CbStoreAdapter(registryBucket, couchbase)
log.silly('connect lounge')
cluster.authenticate(ADMIN_DEFAULT, PASSWORD_DEFAULT)
const bucket = cluster.openBucket(BUCKET_DEFAULT)
lounge.connect({
  bucket,
}, null)

export {
  bucket,
  lounge,
  registryOttoman,
}
