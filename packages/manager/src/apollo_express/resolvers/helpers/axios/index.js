import axios from 'axios'
import config from 'config'
import https from 'https'

const { PORT, NAMESPACE } = config.get('apollo_express')
const { IP_DEFAULT, PORT: GENIAS_PORT, CREDENTIALS } = config.get('genias')

export const axiosLocalhostInstance = axios.create({
  baseURL: `http://127.0.0.1:${PORT}/${NAMESPACE}`,
  validateStatus: function (status) {
    return (status >= 200 && status < 300) || status === 412 //il 412 lo uso come identificativo di una risposta errata
  },
})

export const axiosGeniasInstance = axios.create({
  baseURL: `https://${IP_DEFAULT}:${GENIAS_PORT}/api/`,
  headers: { 'Content-Type': 'application/json' },
  httpsAgent: new https.Agent({ rejectUnauthorized: false }),
})

async function login () {
  const response = await axiosGeniasInstance.post('User/SignIn', CREDENTIALS)
  const setCookieHeader = response.headers['set-cookie']
  if (setCookieHeader) {
    const cookies = setCookieHeader.map(cookie => cookie.split(';')[0])
    axiosGeniasInstance.defaults.headers.common['Cookie'] = cookies.join('; ')
  }
}

axiosGeniasInstance.interceptors.response.use(
  response => response,
  async error => {
    if (error.response.status === 401) {
      await login()
      const originalRequest = error.config
      return axiosGeniasInstance(originalRequest)
    }
    return Promise.reject(error)
  }
)

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
