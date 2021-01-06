import axios from 'axios'
import config from 'config'

const { PORT, NAMESPACE } = config.get('apollo_express')

export const axiosLocalhostInstance = axios.create({
  baseURL: `http://127.0.0.1:${PORT}/${NAMESPACE}`,
  validateStatus: function (status) {
    return (status >= 200 && status < 300) || status === 412 //il 412 lo uso come identificativo di una risposta errata
  },
})
export const axiosGraphqlQuery = async (query, variables) => {
  try {
    const data = JSON.stringify({ query, variables })
    const config = {
      method: 'post',
      url: `http://127.0.0.1:${PORT}/graphql`,
      headers: { 'Content-Type': 'application/json' },
      data,
    }
    const { data: dataResponse } = await axios(config)
    return { ok: true, results: dataResponse.data, errors: dataResponse.errors }
  } catch (err) {
    return { ok: false, message: err.message, err }
  }
}
