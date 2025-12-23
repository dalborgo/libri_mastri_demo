import { axiosGeniasInstance, axiosLocalhostInstance } from '../../../resolvers/helpers/axios'
import isString from 'lodash/isString'
import { Policy } from '../../../models'
import { bucket } from '../../../db'
import get from 'lodash/get'

function isCompanyFromCF (cf) {
  if (!cf) {
    return false
  }
  
  // Rimuovo spazi e maiuscolo
  cf = cf.trim().toUpperCase()
  
  // Partita IVA: 11 cifre
  const partitaIvaRegex = /^[0-9]{11}$/
  return partitaIvaRegex.test(cf)
}

function getGenderFromCF (cf) {
  if (!cf || cf.length !== 16) {
    return null // non valido
  }
  
  // Il giorno di nascita è in posizioni 9-10 (indice 9 e 10 zero-based)
  const dayPart = cf.substring(9, 11)
  const day = parseInt(dayPart, 10)
  
  if (isNaN(day)) {
    return null
  }
  
  // Giorno > 31 significa femmina (40 in più)
  return day > 31 ? 'F' : 'M'
}

function addRouters (router) {
  router.get('/genias/cliente/search', async (req, res) => {
    try {
      const { data: results } = await axiosGeniasInstance.post('Cliente/Search', { partita_iva: '00469480347' })
      res.send({ ok: true, results })
    } catch (error) {
      res.send({ ok: false, error: error.message, code: error.response.status })
    }
  })
  router.post('/genias/cliente/search', async (req, res) => {
    const { partita_iva } = req.body
    try {
      const { data: results } = await axiosGeniasInstance.post('Cliente/Search', { partita_iva })
      res.send({ ok: true, results })
    } catch (error) {
      res.send({ ok: false, error: error.message, code: error.response.status })
    }
  })
  router.post('/genias/producer/search', async (req, res) => {
    const { partita_iva } = req.body
    try {
      const { data: results } = await axiosGeniasInstance.post('Produttore/Search', { partita_iva })
      res.send({ ok: true, results })
    } catch (error) {
      res.send({ ok: false, error: error.message, code: error.response.status })
    }
  })
  router.post('/genias/polizza/search', async (req, res) => {
    const { num_polizza } = req.body
    try {
      const { data: results } = await axiosGeniasInstance.post('Polizza/Search', { num_polizza })
      res.send({ ok: true, results })
    } catch (error) {
      res.send({ ok: false, error: error.message, code: error.response.status })
    }
  })
  router.post('/genias/polizza/create', async (req, res) => {
    //statusCode da non usare
    const { applicazioni, statusCode, currentHolder, producer, ...rest } = req.body
    try {
      const { _name } = bucket
      const numPolizzaIterno = rest['numPolizzaIterno']
      {
        const query = 'SELECT COUNT(1) AS count FROM ' + _name + ' lb '
                      + 'WHERE _type = "MB_POLICY" '
                      + 'AND lb.number = "' + numPolizzaIterno + '"'
        const [{ count }] = await Policy.getByQuery(query)
        const exists = count > 0
        if (exists) {
          return res.send({ ok: false, error: `Polizza con numero interno ${numPolizzaIterno} già presente!` })
        }
      }
      const query = 'SELECT TO_STRING(MAX(TO_NUMBER(lb.numPolizzaCompagnia)) + 1) AS nextNumPolizza FROM ' + _name + ' lb '
                    + 'WHERE _type = "MB_POLICY" AND state.isPolicy = TRUE'
      const [{ nextNumPolizza }] = await Policy.getByQuery(query)
      const skippedNumbers = [583580016, 583582036]
      
      let next = parseInt(nextNumPolizza, 10)
      while (skippedNumbers.includes(next)) {
        next++
      }
      
      let numPolizzaCompagnia = next
      console.log('numPolizzaCompagnia:', numPolizzaCompagnia)
      //return res.send({ ok: true, results: {} })
      numPolizzaCompagnia = String(numPolizzaCompagnia || 583580020)
      const partial = {}
      //partial['statusCode'] = ''
      partial['numPolizzaCompagnia'] = numPolizzaCompagnia
      //partial['debug'] = true
      const policy = {
        ...rest,
        num_polizza: numPolizzaCompagnia,
      }
      console.log('policy:', JSON.stringify(policy, null, 2))
      //console.log('applicazioni:', JSON.stringify(applicazioni, null, 2))
      {
        const { data: results } = await axiosGeniasInstance.post('Polizza/Create', policy)
        partial['statusCode'] = results
        partial['numPolizzaCompagnia'] = numPolizzaCompagnia
        console.log('results:', results)
      }
      {
        const body = {
          descrizione: 'CVT LIBRO MATRICOLA',
          gg_statistiche: 360,
          numero: numPolizzaCompagnia || numPolizzaIterno,
          numeroStatusPolizza: partial['statusCode'],
          tipo_operazione: 2,
        }
        const { data: results } = await axiosGeniasInstance.post('LibroMatricola/ManagementLibroMatricola', body)
        partial['libroMatricolaNumber'] = results
      }
      {
        //console.log(JSON.stringify(applicazioni[0], null, 2))
        let counter = 1
        for (const applicazione_ of applicazioni) {
          const { state, ...applicazione } = applicazione_
          const body = {
            ...applicazione,
            num_compagnia: applicazione['num_compagnia'] || numPolizzaCompagnia,
            cod_lm: partial['libroMatricolaNumber'],
          }
          console.log('body:', body)
          const { data: results } = await axiosGeniasInstance.post('LibroMatricola/ManagementApplicazioniLM', body)
          console.log('results:', results)
          counter++
        }
      }
      console.log('partial:', partial)
      res.send({ ok: true, results: partial })
    } catch (error) {
      const data = error.response.data
      console.log('error.response:', JSON.stringify(error.response.data, null, 2))
      const errors = isString(data) ? { responseError: [data] } : data.errors
      //console.log('errors:', errors)
      res.send({ ok: false, errors, code: data.status, message: data.title })
    }
  })
  router.post('/genias/polizza/create_application', async (req, res) => {
    const { applicazioni, statusCode } = req.body
    try {
      const partial = {}
      {
        const body = {
          numeroStatusPolizza: statusCode,
        }
        const { data: results = [] } = await axiosGeniasInstance.post('LibroMatricola/SearchLibriMatricola', body)
        partial['libroMatricolaNumber'] = get(results, '[0].cod_lm')
      }
      {
        //console.log(JSON.stringify(applicazioni[0], null, 2))
        partial['vehicleSent'] = []
        let counter = 1
        for (const applicazione_ of applicazioni) {
          const { state, ...applicazione } = applicazione_
          const body = {
            ...applicazione,
            cod_lm: partial['libroMatricolaNumber'],
          }
          const { data: results } = await axiosGeniasInstance.post('LibroMatricola/ManagementApplicazioniLM', body)
          console.log('results:', results)
          partial['vehicleSent'].push(
            {
              licensePlate: applicazione['targa'],
              newState: applicazione['dotazione'] === 'INCLUSIONE' ? 'ADDED_CONFIRMED' : 'DELETED_CONFIRMED',
              state,
              type: 'setVehicleStateByIndex',
            }
          )
          counter++
        }
      }
      res.send({ ok: true, results: partial })
    } catch (error) {
      const data = error.response.data
      console.log('error.response:', JSON.stringify(error.response.data, null, 2))
      const errors = isString(data) ? { responseError: [data] } : data.errors
      //console.log('errors:', errors)
      res.send({ ok: false, errors, code: data.status, message: data.title })
    }
  })
  router.post('/genias/polizza/create_registry', async (req, res) => {
    const { currentHolder = {}, producer = {} } = req.body
    try {
      const partial = {}
      console.log('currentHolder:', currentHolder)
      console.log('producer:', producer)
      
      const isCompany = isCompanyFromCF(currentHolder['id'])
      const output = {
        cod_gruppocliente: 1,
        cod_lingua: 1,
        cod_valuta: 1,
        cognome_ragioneSociale: currentHolder['surname'],
        flag_cliente_diretto: true,
        flag_contraentepolizza: currentHolder['isMain'],
        flag_eliminato: false,
        flag_intrattativa: false,
        flag_natoinitalia: true,
        lista_indirizzi: [
          {
            lista_interlocutori: [{
              cod_interlocutore: 1,
              nominativo: producer['nominativo'],
              ruolo: ' ',
              flag_adminlettere: true,
              flag_sinistrilettere: true,
              flag_tecnico: true,
              flag_regolazioni: true,
              flag_antiriciclaggio: true,
              flag_fattura: true,
              flag_preventivatore: true,
            }],
            citta: currentHolder['city'],
            descrizione: isCompany ? 'SEDE LEGALE' : 'RESIDENZA',
            flag_principale: true,
            indirizzo: `${currentHolder['address']} ${currentHolder['address_number']}`,
            cod_indirizzo: 1,
            stato: 104,
            provincia: currentHolder['state'],
            cap: String(currentHolder['zip']),
            flag_antiriciclaggio: false,
            cod_produttore: producer['cod_produttore'],
          },
        ],
        sesso: isCompany ? 'S' : getGenderFromCF(currentHolder['id']),
        cod_naturagiuridica: Number(currentHolder['natura']),
        cod_unit: 1,
        cod_sede: 1,
        cod_commerciale: 1,
        tipo_operazione: 2,
        lista_produttori: [{
          cod_produttore: producer['cod_produttore'],
          flag_gestore_cliente: true,
        }],
        lista_attivita: [
          {
            cod_attivita: Number(currentHolder['activity']),
          },
        ],
      }
      if (output['tipo_operazione'] === 3) {
        output['cod_cliente'] = 0
      }
      if (isCompany) {
        output['partita_iva'] = currentHolder['id']
      } else {
        output['codice_fiscale'] = currentHolder['id']
      }
      
      console.log('output:', JSON.stringify(output, null, 2))
      const { data: results } = await axiosGeniasInstance.post('Cliente/Create', output)
      console.log('results:', results)
      res.send({ ok: true, results: partial })
    } catch (error) {
      const data = error.response.data
      console.log('error.response:', JSON.stringify(error.response.data, null, 2))
      const errors = isString(data) ? { responseError: [data] } : data.errors
      //console.log('errors:', errors)
      res.send({ ok: false, errors, code: data.status, message: data.title })
    }
  })
  router.get('/genias/polizza/get_frazionamenti', async (req, res) => {
    try {
      const { data: results } = await axiosGeniasInstance.get('Polizza/GetFrazionamenti')
      res.send({ ok: true, results })
    } catch (error) {
      res.send({ ok: false, error: error.message, code: error.response.status })
    }
  })
  router.post('/genias/get_all', async (req, res) => {
    const {
      partita_iva_producer,
      partita_iva_signer,
      num_prev_polizza,
      partita_iva_cosigners,
      numPolizzaCompagnia,
    } = req.body
    console.log('partita_iva_signer:', partita_iva_signer)
    const partial = {}
    console.log('num_prev_polizza:', num_prev_polizza)
    try {
      {
        const { data } = await axiosLocalhostInstance('genias/cliente/search', {
          data: { partita_iva: partita_iva_signer },
          method: 'POST',
        })
        partial['signer'] = data.ok ? data.results : []
      }
      if (partita_iva_cosigners.length) {
        const results = await Promise.all(
          partita_iva_cosigners.map(async vat => {
            const { data } = await axiosLocalhostInstance('genias/cliente/search', {
              data: { partita_iva: vat },
              method: 'POST',
            })
            return data.ok ? data.results : []
          })
        )
        partial['cosigners'] = results.flat()
        console.log('partial:', partial)
      }
      {
        const { data } = await axiosLocalhostInstance('genias/producer/search', {
          data: { partita_iva: partita_iva_producer },
          method: 'POST',
        })
        partial['producer'] = data.ok ? data.results : []
      }
      console.log('num_prev_polizza:', num_prev_polizza)
      {
        const { data } = await axiosLocalhostInstance('genias/polizza/search', {
          //data: { num_polizza: '583580015' },
          data: { num_polizza: num_prev_polizza },
          method: 'POST',
        })
        partial['previous'] = data.ok ? data.results : []
      }
      console.log('numPolizzaCompagnia:', numPolizzaCompagnia)
      if (!partial['previous'].length) {
        const { data } = await axiosLocalhostInstance('genias/polizza/search', {
          //data: { num_polizza: '583580015' },
          data: { num_polizza: numPolizzaCompagnia },
          method: 'POST',
        })
        partial['previous'] = data.ok ? data.results : []
      }
      {
        const { data } = await axiosLocalhostInstance('genias/polizza/get_frazionamenti')
        partial['paymentFract'] = data.ok ? data.results : []
      }
      //console.log('partial:', partial)
      res.send({ ok: true, results: partial })
    } catch (error) {
      const code = get(error, 'response.status')
      res.send({ ok: false, error: error.message, code })
    }
  })
  router.post('/genias/polizza/create', async (req, res) => {
    const { data } = req.body
    res.send({ ok: true, results: data })
  })
  router.get('/genias/test', async (req, res) => {
    const { _name } = bucket
    const query = 'SELECT TO_STRING(MAX(TO_NUMBER(lb.numPolizzaCompagnia)) + 1) AS nextNumPolizza FROM ' + _name + ' lb '
                  + 'WHERE _type = "MB_POLICY" AND state.isPolicy = TRUE'
    const [{ nextNumPolizza }] = await Policy.getByQuery(query)
    res.send({ ok: true, results: nextNumPolizza })
  })
}

export default {
  addRouters,
}
