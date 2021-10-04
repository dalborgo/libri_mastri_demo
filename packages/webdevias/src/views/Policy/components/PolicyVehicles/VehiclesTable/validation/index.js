import findIndex from 'lodash/findIndex'
import uuid from 'uuid/v1'
import find from 'lodash/find'
import { cFunctions, numeric } from '@adapter/common'
import moment from 'moment'

export function controlRow (row, rows, rowKey, pdsObj, enqueueSnackbar, policy) {
  let abortError = false
  const endDate = cFunctions.calcPolicyEndDate(policy.initDate, policy.midDate)
  if (!(row.licensePlate && row.state)) {
    row.licensePlate = `XXXXXX_${uuid()}`
    enqueueSnackbar('Targa obbligatoria!', { variant: 'error' })
  }
  if (!row.productCode) {
    enqueueSnackbar('Codice Prodotto non compatibile!', { variant: 'error' })
  }
  let foundDef
  if (row.hasTowing === 'SI' || row.hasGlass === 'SI') {
    foundDef = find(pdsObj, { productCode: row.productCode, vehicleType: row.vehicleType })
  }
  if (row.hasTowing === 'SI') {
    if (foundDef && numeric.toFloat(foundDef.towing) === 0) {
      enqueueSnackbar('Premio traino a zero!', { variant: 'error' })
    }
  }
  if (row.leasingCompany && row.leasingCompany.length !== 11) {
    enqueueSnackbar('Società di Leasing non valida!', { variant: 'error' })
  }
  if (row.owner && row.owner.length !== 11) {
    enqueueSnackbar('Proprietario/Locatario di lunghezza errata!', { variant: 'error' })
  }
  if (row.hasGlass === 'SI') {
    if (foundDef && numeric.toFloat(foundDef.glass) === 0) {
      enqueueSnackbar('Premio cristalli a zero!', { variant: 'error' })
    }
  }
  if (row.startDate && !cFunctions.isString(row.startDate) && !row.startDate.isValid()) {
    const malformed = row.startDate._i
    row.startDate = null
    enqueueSnackbar(`Data da "${malformed}" non valida!`, { variant: 'error' })
  }
  if (policy.initDate && (row.startDate || row.finishDate)) {
    if (moment(row.startDate).isBefore(moment(policy.initDate)) || moment(row.finishDate).isAfter(moment(endDate))) {
      abortError = true
      enqueueSnackbar('Data non compresa nel periodo di polizza!', { variant: 'error' })
    }
  }
  if (row.leasingExpiry && !cFunctions.isString(row.leasingExpiry) && !row.leasingExpiry.isValid()) {
    const malformed = row.leasingExpiry._i
    row.leasingExpiry = null
    enqueueSnackbar(`Data scadenza leasing "${malformed}" non valida!`, { variant: 'error' })
  }
  if (row.registrationDate && !cFunctions.isString(row.registrationDate) && !row.registrationDate.isValid()) {
    const malformed = row.registrationDate._i
    row.registrationDate = null
    enqueueSnackbar(`Data immatricolazione "${malformed}" non valida!`, { variant: 'error' })
  }
  if (!row.weight && row.vehicleType === 'AUTOCARRO') {
    enqueueSnackbar('Q.li/Kw/Posti obbligatorio', { variant: 'error' })
  }
  if (!rowKey || (['licensePlate'].includes(rowKey))) {
    const isFound = findIndex(rows, { licensePlate: row.licensePlate, state: row.state })
    if (isFound > -1) {
      enqueueSnackbar(`Targa "${row.licensePlate}" già inserita alla riga ${rowKey ? isFound + 1 : isFound + 2}!`, { variant: 'error' })
      row.licensePlate = `XXXXXX_${uuid()}`
    }
  }
  return abortError
}
