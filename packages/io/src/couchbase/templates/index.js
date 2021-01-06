import couchbase from '../'

async function getByChannels (channels, bucket, type, wrapper, options, returnProm = false) {
  channels = !Array.isArray(channels) ? [channels] : channels
  type = type ? ` AND type='${type}'` : ''
  wrapper = wrapper ? `OBJECT_CONCAT(b,{"_id":meta().id},{"_rev":meta().xattrs._sync.rev}) ${wrapper}` : 'meta().id _id, meta().xattrs._sync.rev _rev, b.*'
  const query = `SELECT ${wrapper} from ${bucket} b where ARRAY_INTERSECT(OBJECT_NAMES(meta().xattrs._sync.channels),${JSON.stringify(channels)})${type}`
  return couchbase.execQuery(query, options, returnProm)
}

export default {
  getByChannels,
}
