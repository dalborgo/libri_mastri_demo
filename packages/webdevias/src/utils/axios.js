import axios from 'axios'
import log from '@adapter/common/src/log'
import { envConfig } from 'init'
import readBlob from 'read-blob'
import FileSaver from 'file-saver'

const instance = axios.create({
  baseURL: `${envConfig.HOST}/apollo`,
  validateStatus: function (status) {
    return (status >= 200 && status < 300) || status === 412 //il 412 lo uso come identificativo di una risposta errata
  },
})

export async function manageFile (endpoint, fileName, type, data, options = {}) {
  try {
    const {
      method = 'POST',
      same = false,
      toDownload = false,
    } = options
    const response = await instance(endpoint, {
      data,
      method,
      responseType: 'blob',
    })
    if (response.status === 412) {
      const json = await readBlob(response.data, 'application/json')
      return JSON.parse(json)
    } else {
      const file = new File([response.data], fileName, { type })
      if (toDownload) {
        FileSaver.saveAs(file)
      } else {
        const exportUrl = URL.createObjectURL(file)
        window.open(exportUrl, same ? '_self' : '_blank')
        URL.revokeObjectURL(exportUrl)
      }
      return { ok: true }
    }
  } catch (err) {
    log.error(err.message)
    return { ok: false, message: err.message, err }
  }
}

export const axiosGraphqlQuery = async (query, variables) => {
  try {
    const data = JSON.stringify({ query, variables })
    const config = {
      method: 'post',
      url: `${envConfig.HOST}/graphql`,
      headers: { 'Content-Type': 'application/json' },
      data,
    }
    const { data: dataResponse } = await axios(config)
    return { ok: true, results: dataResponse.data, errors: dataResponse.errors }
  } catch (err) {
    return { ok: false, message: err.message, err }
  }
}

export async function bdxQuery (endpoint, data, options = {}) {
  try {
    const {
      method = 'POST',
    } = options
    const response = await instance(endpoint, {
      data,
      method,
    })
    return { ok: true, results: response.data }
  } catch (err) {
    log.error(err.message)
    return { ok: false, message: err.message, err }
  }
}

export async function checkRegulation (endpoint, data, options = {}) {
  try {
    const {
      method = 'POST',
    } = options
    const response = await instance(endpoint, {
      data,
      method,
    })
    return { ok: true, results: response.data }
  } catch (err) {
    log.error(err.message)
    return { ok: false, message: err.message, err }
  }
}

export async function regulationsQuery (endpoint, data, options = {}) {
  try {
    const {
      method = 'POST',
    } = options
    const response = await instance(endpoint, {
      data,
      method,
    })
    return { ok: true, results: response.data }
  } catch (err) {
    log.error(err.message)
    return { ok: false, message: err.message, err }
  }
}

export async function getGenias(endpoint, data, options = {}) {
  try {
    const {
      method = 'POST',
    } = options
    const response = await instance(endpoint, {
      data,
      method,
    })
    return response.data
  } catch (err) {
    log.error(err.message)
    return { ok: false, message: err.message, err }
  }
}

export default instance
