import { cFunctions } from '@adapter/common'
import couchbase from '../'
import axios from 'axios'
import qs from 'qs'
import find from 'lodash/find'

const FIRST_OPERATION_TIMEOUT = 60000

async function createBucket (statement, options, returnProm = false) {
  try {
    const { ip, bucket, admin, password } = couchbase.normOptions(options)
    const auth = cFunctions.getAuth(admin, password)
    if (!bucket) {
      return { ok: false, err: {}, message: 'createBucket: bucket(admin) undefined!' }
    }
    try {
      const params = {
        data: qs.stringify(statement),
        headers: { Authorization: auth, 'Content-Type': 'application/x-www-form-urlencoded' },
        method: 'POST',
        timeout: FIRST_OPERATION_TIMEOUT,
        url: `http://${ip}:8091/pools/default/buckets`,
        validateStatus: status => status >= 200 && status <= 503,
      }
      if (returnProm) {return axios(params)}
      const { data: { errors } } = await axios(params)
      if (errors) {return { ok: false, message: JSON.stringify(errors, null, 2) }}
      return { ok: true, results: {} }
    } catch (err) {
      return { ok: false, message: err.message, err }
    }
  } catch (err) {
    return { ok: false, message: err.message, err }
  }
}

async function createRbacUser (user, statement, options, returnProm = false) {
  try {
    const { ip, bucket, admin, password } = couchbase.normOptions(options)
    const auth = cFunctions.getAuth(admin, password)
    if (!bucket) {
      return { ok: false, err: {}, message: 'createRbacUser: bucket(admin) undefined!' }
    }
    if (!user) {
      return { ok: false, err: {}, message: 'createRbacUser: user undefined!' }
    }
    try {
      const params = {
        data: qs.stringify(statement),
        headers: { Authorization: auth, 'Content-Type': 'application/x-www-form-urlencoded' },
        method: 'PUT',
        url: `http://${ip}:8091/settings/rbac/users/local/${user}`,
        validateStatus: status => status >= 200 && status <= 503,
      }
      if (returnProm) {return axios(params)}
      const { data: { errors } } = await axios(params)
      if (errors) {return { ok: false, message: JSON.stringify(errors, null, 2) }}
      return { ok: true, results: {} }
    } catch (err) {
      return { ok: false, message: err.message, err }
    }
  } catch (err) {
    return { ok: false, message: err.message, err }
  }
}

async function deleteRbacUser (user, options, returnProm = false) {
  try {
    const { ip, bucket, admin, password } = couchbase.normOptions(options)
    const auth = cFunctions.getAuth(admin, password)
    if (!bucket) {
      return { ok: false, err: {}, message: 'deleteRbacUser: bucket(admin) undefined!' }
    }
    if (!user) {
      return { ok: false, err: {}, message: 'deleteRbacUser: user undefined!' }
    }
    try {
      const params = {
        headers: { Authorization: auth, 'Content-Type': 'application/x-www-form-urlencoded' },
        method: 'DELETE',
        url: `http://${ip}:8091/settings/rbac/users/local/${user}`,
        validateStatus: status => status >= 200 && status <= 503,
      }
      if (returnProm) {return axios(params)}
      const { data: { errors } } = await axios(params)
      if (errors) {return { ok: false, message: JSON.stringify(errors, null, 2) }}
      return { ok: true, results: {} }
    } catch (err) {
      return { ok: false, message: err.message, err }
    }
  } catch (err) {
    return { ok: false, message: err.message, err }
  }
}

async function getIndexStatus (filter, options, returnProm = false) {
  try {
    const { ip, bucket, admin, password } = couchbase.normOptions(options)
    const auth = cFunctions.getAuth(admin, password)
    if (!bucket) {
      return { ok: false, err: {}, message: 'getIndexStatus: bucket(admin) undefined!' }
    }
    try {
      const params = {
        headers: { Authorization: auth },
        method: 'GET',
        url: `http://${ip}:9102/getIndexStatus`,
        validateStatus: status => status >= 200 && status <= 503,
      }
      if (returnProm) {return axios(params)}
      const { data } = await axios(params)
      let { errors, status } = data
      if (errors) {return { ok: false, message: JSON.stringify(errors, null, 2) }}
      if (filter) {
        if (filter.bucket) {
          status = find(status, { bucket: filter.bucket })
        }
        if (filter.name) {
          status = find(status, { name: filter.name })
        }
      }
      return { ok: true, results: status }
    } catch (err) {
      return { ok: false, message: err.message, err }
    }
  } catch (err) {
    return { ok: false, message: err.message, err }
  }
}

async function getBucketStatus (target, options, returnProm = false) {
  try {
    const { ip, bucket, admin, password } = couchbase.normOptions(options)
    const auth = cFunctions.getAuth(admin, password)
    if (!bucket) {
      return { ok: false, err: {}, message: 'getBucketStatus: bucket(admin) undefined!' }
    }
    if (!target) {
      return { ok: false, err: {}, message: 'getBucketStatus: target undefined!' }
    }
    try {
      const params = {
        headers: { Authorization: auth },
        method: 'GET',
        url: `http://${ip}:8091/pools/default/buckets/${target}`,
        validateStatus: status => status >= 200 && status <= 503,
      }
      if (returnProm) {return axios(params)}
      const { data } = await axios(params)
      let { errors, nodes } = data
      if (errors) {return { ok: false, message: JSON.stringify(errors, null, 2) }}
      const [firstNode] = nodes
      return { ok: true, results: firstNode.status }
    } catch (err) {
      return { ok: false, message: err.message, err }
    }
  } catch (err) {
    return { ok: false, message: err.message, err }
  }
}

export default {
  createBucket,
  createRbacUser,
  deleteRbacUser,
  getBucketStatus,
  getIndexStatus,
}
