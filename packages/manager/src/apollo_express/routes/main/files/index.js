import { writeToBuffer } from '@fast-csv/format'
import { bucket } from '../../../db'
import { CSV_ADDED_HEADER_MAP, CSV_HEADER_MAP } from '../../../resolvers/helpers'
import fs from 'fs'
import Q from 'q'
import path from 'path'
import filter from 'lodash/filter'
import { Gs, Policy } from '../../../models'
import moment from 'moment'

function addRouters (router) {
  router.post('/files/export_csv', async function (req, res) {
    const rows = [
      Object.keys(CSV_HEADER_MAP),
      ...req.body,
    ]
    const buffer = await writeToBuffer(rows, {
      delimiter: ';',
      headers: Object.values(CSV_HEADER_MAP),
      writeHeaders: false,
    })
    res.send(buffer)
  })
  
  router.post('/files/export_added_csv', async function (req, res) {
    const rows = [
      Object.keys(CSV_ADDED_HEADER_MAP),
      ...req.body,
    ]
    const buffer = await writeToBuffer(rows, {
      delimiter: ';',
      headers: Object.values(CSV_ADDED_HEADER_MAP),
      writeHeaders: false,
    })
    res.send(buffer)
  })
  
  router.post('/files/get_attachments', async function (req, res) {
    const { filePath } = req.body
    const buffer = await Q.ninvoke(fs, 'readFile', path.join(__dirname, `../../../crypt/${filePath}`))
    res.send(buffer)
  })
  router.post('/files/check_regulations', async function (req, res) {
    const { code, count } = req.body
    const filesToCheck = []
    for (let i = 1; i <= count; i++) {
      filesToCheck.push(`regolazione_${code}-${i}.pdf`)
    }
    const folderPath = path.join(__dirname, `../../../crypt/${code}`)
    const filesFound = {}
    let index = 1
    for (const fileName of filesToCheck) {
      if (fs.existsSync(path.join(folderPath, fileName))) {
        // Il file esiste
        filesFound[index] = true
      }
      index++
    }
    res.send(filesFound)
  })
  router.post('/files/get_bdx', async function (req, res) {
    const { _name } = bucket
    const { vehicleTypes } = await Gs.findById('general_settings')
    const { startDate, endDate } = req.body
    const query = 'SELECT lb.* FROM ' + _name + ' lb '
                  + 'WHERE _type = "MB_POLICY" AND initDate between "' + startDate + '" '
                  + 'AND "' + endDate + '" AND state.isPolicy = TRUE AND vehicles is not missing order by `number`'
    const policies = await Policy.getByQuery(query)
    res.send({ policies, vehicleTypes })
  })
  router.post('/files/get_regulations', async function (req, res) {
    const { _name } = bucket
    const { vehicleTypes } = await Gs.findById('general_settings')
    let { startDate, endDate } = req.body
    const query = 'SELECT lb.* FROM ' + _name + ' lb '
                  + 'WHERE _type = "MB_POLICY" '
                  + 'AND state.isPolicy = TRUE AND vehicles is not missing order by `number`'
    const policies = await Policy.getByQuery(query)
    const response = []
    for (let policy of policies) {
      const regFractions = filter(policy.regFractions, row => {
        return moment(row.endDate).isSameOrAfter(moment(startDate)) && moment(row.endDate).isSameOrBefore(moment(endDate))
      })
      if (regFractions.length) {
        response.push({
          ...policy,
          filteredRegFraction: regFractions,
        })
      }
    }
    res.send({ policies: response, vehicleTypes })
  })
}

export default {
  addRouters,
}
