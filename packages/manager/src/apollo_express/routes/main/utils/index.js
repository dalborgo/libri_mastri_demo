import * as Models from '../../../models'
import parse from 'csv-parse'
import { couchIndices } from '@adapter/io'
import { bucket } from '../../../db'
import log from '@adapter/common/src/winston'
import getStream from 'get-stream'
import get from 'lodash/get'
import padStart from 'lodash/padStart'
import Q from 'q'
import * as loaders from '../../../loaders'
import fs from 'fs'
import { axiosGraphqlQuery } from '../../../resolvers/helpers/axios'
import { validation } from '@adapter/common'

function addRouters (router) {
  router.get('/utils/ensure_indices', async (req, res) => {
    const promises = [], output = []
    let ok = true
    const { _name } = bucket
    const options = { connection: bucket }
    
    //region CUSTOM SKIP
    const skipModels = ['GS', 'REGISTRY']
    //endregion
    
    //region STANDARD INDICES
    const primaryQuery = couchIndices.createPrimaryIndex(_name, options, true, true)
    promises.push(primaryQuery)
    const typeQuery = couchIndices.createIndex(`CREATE INDEX \`${_name}_index__type\` ON \`${_name}\`(\`_type\`) WITH {"defer_build":true}`, options, true)
    promises.push(typeQuery)
    for (let model in Models) {
      const modelName = Models[model].modelName
      if (skipModels.includes(modelName)) {continue}
      const query = couchIndices.createIndex(`CREATE INDEX \`${_name}_index__type_${modelName}\` ON \`${_name}\`(\`_type\`) WHERE _type = '${modelName}' WITH {"defer_build":true}`, { connection: bucket }, true)
      promises.push(query)
    }
    //endregion
    
    //region CUSTOM INDICES
    const typeFatherQuery = couchIndices.createIndex(`CREATE INDEX \`${_name}_index__type_USER_father\` ON \`${_name}\`(\`father\`) WHERE _type = 'USER' WITH {"defer_build":true}`, options, true)
    const reverseJoinByFatherPolicyQuery = couchIndices.createIndex(`CREATE INDEX \`${_name}_index__MBPOLICY_top_concat\` ON \`${_name}\`(("MB_POLICY|" || \`top\`)) WITH {"defer_build":true}`, options, true)
    promises.push(typeFatherQuery)
    promises.push(reverseJoinByFatherPolicyQuery)
    //endregion
    
    const results = await Q.allSettled(promises)
    results.forEach(result => {
      log.debug(result)
      if (result.state === 'fulfilled') {
        output.push(result.state)
      } else {
        ok = false
        const responseBody = get(result, 'reason.responseBody')
        const { errors } = JSON.parse(result.reason.responseBody)
        if (responseBody && errors['0']) {
          output.push(errors['0'])
        } else {
          output.push(result)
        }
      }
    })
    if (ok) {
      res.send({ ok, results: output })
    } else {
      res.send({ ok, message: 'Some errors occurred!', err: output })
    }
  })
  router.get('/utils/build_indices', async (req, res) => {
    const { ok, message, results } = await couchIndices.buildIndices({ connection: bucket })
    if (!ok) {return res.send({ ok, message })}
    res.send({ ok, results })
  })
  router.get('/utils/clear_cache', async (req, res) => {
    const keys = []
    try {
      for (let key in loaders) {
        loaders[key].clearAll()
        keys.push(key)
      }
      res.send({ ok: true, loaders: keys })
    } catch (err) {
      log.error(err.message)
      res.send({ ok: false, message: err.message, err, loaders: keys })
    }
  })
  router.get('/utils/import_registries', async function (req, res) {
    const stream = fs.createReadStream(__dirname + '/../../../csv/anagrafiche_clienti_.csv')
    const parseStream = parse({
      delimiter: ';',
      skip_empty_lines: true,
      skip_lines_with_empty_values: true,
      trim: true,
    })
    const credits = await getStream.array(stream.pipe(parseStream))
    // eslint-disable-next-line no-unused-vars
    const [first, ...rest] = credits
    const final = []
    for (let row of rest) {
      // eslint-disable-next-line no-unused-vars
      let [surname, name, vat, cf, longName, _, nationality, state, city, zip, address, _1, _2, _3, producer] = row
      const gender = surname ? undefined : 'PG'
      surname = surname || longName
      vat = vat ? padStart(vat, 11, '0') : undefined
      if (vat) {cf = undefined}
      const username = `${vat || cf}`
      if (!username) { continue }
      producer = producer ? padStart(producer, 11, '0') : undefined
      const password = `Pass${username}`
      const email = `${username}@empty.com`
      const query = 'mutation AddRegistryGuest($input: AddRegistryInput) {addRegistry_guest(input: $input) {id, username, vat, cf}}'
      const input_ = {
        address,
        cf,
        city,
        email,
        gender,
        name,
        nationality,
        password,
        producer,
        state,
        surname,
        username,
        vat,
        zip,
      }
      const input = validation.objectRemoveEmpty(input_)
      console.log('input:', JSON.stringify(input, null, 2))
      const { results, errors = [] } = await axiosGraphqlQuery(query, { input })
      final.push({ results, errors: errors.length ? errors[0].message : undefined })
    }
    res.send(final)
  })
  
}

export default {
  addRouters,
}
