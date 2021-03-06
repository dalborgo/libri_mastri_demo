import { writeToBuffer } from '@fast-csv/format'
import { bucket } from '../../../db'
import { CSV_ADDED_HEADER_MAP, CSV_HEADER_MAP } from '../../../resolvers/helpers'
import fs from 'fs'
import Q from 'q'
import path from 'path'
import { Gs, Policy } from '../../../models'

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
}

export default {
  addRouters,
}
