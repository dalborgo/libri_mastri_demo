import { axiosGeniasInstance } from '../../../resolvers/helpers/axios'

function addRouters (router) {
  router.get('/genias/cliente/search', async (req, res) => {
    try {
      const { data: results } = await axiosGeniasInstance.post('Cliente/Search', { partita_iva: '00469480347' })
      res.send({ ok: true, results })
    } catch (error) {
      res.status(500).send({ ok: false, error: error.message, code: error.response.status })
    }
  })
  router.post('/genias/cliente/search', async (req, res) => {
    const { partita_iva } = req.body
    try {
      const { data: results } = await axiosGeniasInstance.post('Cliente/Search', { partita_iva })
      res.send({ ok: true, results })
    } catch (error) {
      res.status(500).send({ ok: false, error: error.message, code: error.response.status })
    }
  })
}

export default {
  addRouters,
}
