import { cDate, cFunctions, numeric } from '@adapter/common'
import uuid from 'uuid/v1'
import log from '@adapter/common/src/log'
import { pdsToArray } from 'helpers'
import { chain, isEmpty, uniqBy } from 'lodash'
import ExcelJS from 'exceljs'
import { ctol } from '../../Bdx/Bdx'
import saveAs from 'file-saver'
import { axiosGraphqlQuery } from 'utils/axios'
import moment from 'moment'

export function checkVehicleStateTransitions (vehicles) {
  if (!Array.isArray(vehicles)) { return [] }
  const counters = new Map()
  for (const vehicle of vehicles) {
    if (!vehicle) { continue }
    const plate = vehicle.licensePlate || vehicle.licenzePlate
    const st = vehicle.state
    if (!plate || !st) { continue }
    if (!counters.has(plate)) { counters.set(plate, { active: 0, added: 0 }) }
    if (st === 'ACTIVE') { counters.get(plate).active++ }
    if (st === 'ADDED_CONFIRMED' || st === 'ADDED') { counters.get(plate).added++ }
  }
  const invalid = []
  for (const [plate, c] of counters) {
    if (c.added >= 2 || (c.added >= 1 && c.active >= 1)) {
      invalid.push(plate)
    }
  }
  return invalid
}

export function reducerPolicy (draft, action) {
  switch (action.type) {
    case 'setNumber':
      draft.number = action.value.number
      return
    case 'setAttachments':
      draft.attachments = action.attachments
      return
    case 'setFractions':
      draft.paymentFract = action.paymentFract
      return
    case 'setRegFractions':
      draft.regFractions = action.regFractions
      return
    case 'setPaidFractions':
      draft.paidFractions[action.paidFraction.index] = action.paidFraction.val
      return
    case 'confirmAllInclExcl': {
      const invalidPlates = checkVehicleStateTransitions(draft.vehicles)
      if (invalidPlates.length) {return}
      const partial_ = { maxIncluded: 0, maxExcluded: 0, maxConstraint: 0, maxAllianz: 0, index: -1 }
      for (let i = 0; i < draft.vehicles.length; i++) {
        const vehicle = draft.vehicles[i]
        if (['ADDED_CONFIRMED'].includes(vehicle.state) || (['DELETED_CONFIRMED', 'DELETED_FROM_INCLUDED'].includes(vehicle.state) && vehicle.includedCounter)) {
          partial_.maxIncluded = Math.max(partial_.maxIncluded, vehicle.includedCounter || vehicle.counter || 0)
        }
        if (['DELETED_CONFIRMED'].includes(vehicle.state)) {
          partial_.maxExcluded = Math.max(partial_.maxExcluded, vehicle.excludedCounter || vehicle.counter || 0)
        }
        if (vehicle.leasingCompany) {
          partial_.maxConstraint = Math.max(partial_.maxConstraint, vehicle.constraintCounter || 0)
        }
        partial_.maxAllianz = Math.max(partial_.maxAllianz, vehicle.allianzCounter || 0)
      }
      draft.vehicles = draft.vehicles.map(vehicle => {
        if (['ADDED', 'DELETED', 'DELETED_FROM_INCLUDED'].includes(vehicle.state)) {
          const newState = vehicle.state === 'ADDED' ? 'ADDED_CONFIRMED' : 'DELETED_CONFIRMED'
          let counter, constraintCounter, includedCounter, excludedCounter
          const allianzCounter = newState === 'ADDED_CONFIRMED' ? ++partial_.maxAllianz : vehicle.allianzCounter
          if (newState === 'ADDED_CONFIRMED') {
            ++partial_.maxIncluded
            counter = vehicle.counter ? vehicle.counter : partial_.maxIncluded
            includedCounter = vehicle.includedCounter ? vehicle.includedCounter : partial_.maxIncluded
          } else {
            ++partial_.maxExcluded
            counter = vehicle.counter ? vehicle.counter : partial_.maxExcluded
            excludedCounter = vehicle.excludedCounter ? vehicle.excludedCounter : partial_.maxExcluded
            includedCounter = vehicle.includedCounter
          }
          if (newState === 'ADDED_CONFIRMED' && vehicle.leasingCompany) {
            constraintCounter = vehicle.constraintCounter ? vehicle.constraintCounter : ++partial_.maxConstraint
          }
          const isMatrix = Boolean(draft['numPolizzaCompagnia'])
          return {
            ...vehicle,
            state: newState,
            counter,
            constraintCounter,
            includedCounter,
            excludedCounter,
            allianzCounter: isMatrix ? allianzCounter : undefined,
          }
        } else {
          return vehicle
        }
      })
      return
    }
    case 'setVehicles':
      draft.vehicles = action.vehicles
      return
    case 'setCas':
      draft._cas = action._cas
      return
    case 'appendVehicles':
      draft.vehicles.push(...action.vehicles)
      return
    case 'setConsolidate':
      draft.payFractions = action.payFractions
      draft.regFractions = action.regFractions
      draft.vehicles = action.vehicles
      return
    case 'setVehicleStateByIndex': {
      const isMatrix = Boolean(draft['numPolizzaCompagnia'])
      const invalidPlates = checkVehicleStateTransitions(draft.vehicles)
      if (invalidPlates.length) { return }
      const partial = { maxIncluded: 0, maxExcluded: 0, maxConstraint: 0, maxAllianz: 0, index: -1 }
      for (let i = 0; i < draft.vehicles.length; i++) {
        const vehicle = draft.vehicles[i]
        if (vehicle.licensePlate === action.licensePlate && vehicle.state === action.state) {
          partial.index = i
        }
        if (vehicle.state === 'ADDED_CONFIRMED' || (vehicle.state === 'DELETED_CONFIRMED' && vehicle.includedCounter)) {
          partial.maxIncluded = Math.max(partial.maxIncluded, vehicle.includedCounter || vehicle.counter || 0)
        }
        if (vehicle.state === 'DELETED_CONFIRMED') {
          partial.maxExcluded = Math.max(partial.maxExcluded, vehicle.excludedCounter || vehicle.counter || 0)
        }
        if (vehicle.leasingCompany) {
          partial.maxConstraint = Math.max(partial.maxConstraint, vehicle.constraintCounter || 0)
        }
        partial.maxAllianz = Math.max(partial.maxAllianz, vehicle.allianzCounter || 0)
      }
      if (partial.index > -1) {
        draft.vehicles[partial.index].state = action.newState
        if (draft.vehicles[partial.index].state === 'ADDED_CONFIRMED') {
          ++partial.maxIncluded
          draft.vehicles[partial.index].counter = draft.vehicles[partial.index].counter ? draft.vehicles[partial.index].counter : partial.maxIncluded
          draft.vehicles[partial.index].includedCounter = draft.vehicles[partial.index].includedCounter ? draft.vehicles[partial.index].includedCounter : partial.maxIncluded
        }
        if (draft.vehicles[partial.index].state === 'DELETED_CONFIRMED') {
          ++partial.maxExcluded
          draft.vehicles[partial.index].counter = draft.vehicles[partial.index].counter ? draft.vehicles[partial.index].counter : partial.maxExcluded
          draft.vehicles[partial.index].excludedCounter = draft.vehicles[partial.index].excludedCounter ? draft.vehicles[partial.index].excludedCounter : partial.maxExcluded
        }
        if (draft.vehicles[partial.index].state === 'ADDED_CONFIRMED' && draft.vehicles[partial.index].leasingCompany) {
          draft.vehicles[partial.index].constraintCounter = draft.vehicles[partial.index].constraintCounter ? draft.vehicles[partial.index].constraintCounter : ++partial.maxConstraint
        }
        if(isMatrix) {
        draft.vehicles[partial.index].allianzCounter = draft.vehicles[partial.index].state === 'DELETED_CONFIRMED' ? draft.vehicles[partial.index].allianzCounter : partial.maxAllianz + 1
      }
      }
      return
    }
    case 'setPolicy':
      return action.policy
    case 'refresh':
      draft.policy = { ...draft.policy }
      return
    default:
      throw new Error('Invalid action type!')
  }
}

export function reducerInsertModal (draft, action) {
  switch (action.type) {
    case 'setClose':
      draft.open = false
      return
    case 'setOpen':
      draft.index = action.index
      draft.open = true
      return
    default:
      throw new Error('Invalid action type!')
  }
}

export function getLastFraction (payFractions) {
  const today = moment().add(-15, 'd')// 15 giorni di tempo
  let count = 1
  for (let { date, daysDiff } of payFractions) {
    const plusDay = moment(date).add(daysDiff, 'd')
    if (!today.isAfter(plusDay)) {
      break
    }
    count++
  }
  return Math.min(count, payFractions.length)
}

export const comparator = (values, index) => inp => cFunctions.camelDeburr(inp.productCode + inp.vehicleType) === cFunctions.camelDeburr(values[index].productCode + values[index].vehicleType)

export function getProductDefinitions (pds) {
  let index = 0
  return pds.productDefinitions.reduce((prev, curr) => {
    const clone = { ...curr }
    clone.rate = numeric.normNumb(clone.rate)
    clone.excess = numeric.normNumb(clone.excess)
    clone.minimum = numeric.normNumb(clone.minimum)
    clone.taxRate = numeric.normNumb(clone.taxRate)
    clone.overdraft = numeric.normNumb(clone.overdraft)
    clone.glassCap = numeric.normNumb(clone.glassCap)
    clone.glass = numeric.normNumb(clone.glass)
    clone.towing = numeric.normNumb(clone.towing)
    clone.conditions = clone.conditions || ''
    clone.statements = clone.statements || ''
    clone.statementsTowing = clone.statementsTowing || ''
    clone.index = index++
    prev[cFunctions.camelDeburr(clone.productCode + clone.vehicleType || uuid())] = clone
    return prev
  }, {})
}

export function comparePolicy (new_, old) {
  const excludedFields = ['id', '__typename', '_type', 'producer', 'collaborators', 'company', '_createdAt', '_updatedAt', 'state', 'meta', 'number', '_code', 'signer', 'attachments', 'createdBy']
  const restNew = chain(new_).omit(excludedFields).omitBy(isEmpty).value()
  const restOld = chain(old).omit(excludedFields).omitBy(isEmpty).value()
  const d1 = cFunctions.difference(restNew, restOld)
  //const d2 = cFunctions.difference(restOld, restNew)
  console.log('differencesObj:', JSON.stringify(d1, null, 2))
  const differences = []
  for (let key in d1) {
    if (Array.isArray(d1[key])) {
      const resArr = uniqBy(d1[key], isEmpty)
      if (resArr.length > 1 || !isEmpty(resArr[0])) {
        differences.push(key)
      }
    } else {
      differences.push(key)
    }
  }
  console.log('differences:', differences)
  return !differences.length
}

export function initPolicy (policy) {
  const {
    attachments = [],
    collaborators = [],
    cosigners = [],
    paidFractions = {},
    productDefinitions: pds,
    regFractions = [],
    signer = null,
    vehicles = [],
  } = policy
  const newPD = pdsToArray(pds).map(val => (
    {
      ...val,
      rate: numeric.toFloat(val.rate) / 1000 || 0,
      excess: numeric.toFloat(val.excess) / 1000 || 0,
      overdraft: numeric.toFloat(val.overdraft) / 1000 || 0,
      glassCap: numeric.toFloat(val.glassCap) / 1000 || 0,
      glass: numeric.toFloat(val.glass) / 1000 || 0,
      towing: numeric.toFloat(val.towing) / 1000 || 0,
      minimum: numeric.toFloat(val.minimum) / 1000 || 0,
      taxRate: numeric.toFloat(val.taxRate) / 1000 || 0,
    }
  ))
  const newVehicles = vehicles.reduce((prev, curr) => {
    if (curr.licensePlate && curr.state) {
      prev.push({
        ...curr,
        value: curr.value / 1000 || 0,
      })
    } else {
      log.warn('vehicle skipped from list', curr)
    }
    return prev
  }, [])
  const holders = signer ? [signer, ...cosigners] : cosigners
  return {
    ...policy,
    collaborators,
    vehicles: newVehicles,
    productDefinitions: newPD || {},
    holders,
    regFractions,
    attachments,
    paidFractions: paidFractions || {},
  }
}

const bold = { font: { bold: true } }
const right = { alignment: { horizontal: 'right' } }
const center = { alignment: { horizontal: 'center' } }
const lightGray = { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '969696' } } }
const fontWhite = { font: { color: { argb: 'FFFFFF' }, bold: true } }
const fontRed = { font: { color: { argb: 'FF0000' } } }
const fontGreen = { font: { color: { argb: '008000' } } }

export async function createExportTotal (vehicles, fileName) {
  const workbook = new ExcelJS.Workbook()
  const ws = workbook.addWorksheet('Dati')
  const columns = [
    { key: 'lic', width: 15 },
    { key: 'dateFrom', width: 15, style: { numFmt: 'dd/mm/yyyy' } },
    { key: 'hourFrom', width: 10 },
    { key: 'dateTo', width: 15, style: { numFmt: 'dd/mm/yyyy' } },
    { key: 'vehicleType', width: 20 },
    { key: 'qli', width: 15, style: { numFmt: '#,##0.00' } },
    { key: 'vehicleUse', width: 20 },
    { key: 'regDate', width: 15, style: { numFmt: 'dd/mm/yyyy' } },
    { key: 'brand', width: 20 },
    { key: 'model', width: 20 },
    { key: 'cov', width: 20 },
    { key: 'val', width: 15, style: { numFmt: '#,##0.00' } },
    { key: 'vatIncluded', width: 15 },
    { key: 'gla', width: 15 },
    { key: 'tow', width: 15 },
    { key: 'leasingCompany', width: 20 },
    { key: 'leasingExpiry', width: 15 },
    { key: 'owner', width: 20 },
    { key: 'custom', width: 20 },
    { key: 'prize', width: 15, style: { numFmt: '#,##0.00' } },
    { key: 'prizeT', width: 15, style: { numFmt: '#,##0.00' } },
    { key: 'payment', width: 15, style: { numFmt: '#,##0.00' } },
    { key: 'paymentT', width: 15, style: { numFmt: '#,##0.00' } },
  ]
  ws.columns = columns
  const letter = ctol(columns)
  ws.addRow({
    lic: 'Targa',
    dateFrom: 'Data da',
    hourFrom: 'Ora da',
    dateTo: 'Data a',
    vehicleType: 'Tipo veicolo',
    qli: 'Q.li/Kw/Posti',
    vehicleUse: 'Uso Veicolo',
    regDate: 'Data imm.',
    brand: 'Marca',
    model: 'Modello',
    cov: 'Tipo copertura',
    val: 'Valore',
    vatIncluded: 'Compresa Iva',
    gla: 'Cristalli',
    tow: 'Traino',
    leasingCompany: 'Società di leasing',
    leasingExpiry: 'Scad. leasing',
    owner: 'Proprietario/Locatario',
    custom: 'Condizioni',
    prize: 'Premio Lordo',
    prizeT: 'Premio Netto',
    payment: 'Rateo Lordo',
    paymentT: 'Rateo Netto',
  })
  const alignRightCols = ['qli', 'val', 'prize', 'prizeT', 'payment', 'paymentT']
  const alignCenterCols = ['gla', 'tow', 'regDate', 'dateTo', 'hourFrom', 'dateFrom', 'leasingExpiry', 'vatIncluded']
  for (let colIndex = 1; colIndex <= columns.length; colIndex += 1) {
    if (alignRightCols.includes(columns[colIndex - 1].key)) {
      Object.assign(ws.getColumn(colIndex), right)
    }
    if (alignCenterCols.includes(columns[colIndex - 1].key)) {
      Object.assign(ws.getColumn(colIndex), center)
    }
    Object.assign(ws.getRow(1).getCell(colIndex), lightGray, fontWhite)
  }
  let totalVehicles = 0, totalPrize = 0, totalPrizeT = 0, totalVal = 0
  const query = 'query Registry_guest($id: ID!) {registry_guest(id: $id) {id, surname, address, address_number, zip, city, state}}'
  for (let vehicle of vehicles) {
    totalVehicles++
    totalPrize += vehicle.prize
    totalPrizeT += vehicle.prizeT
    totalVal += vehicle.value
    let targetLeasing
    if (vehicle.leasingCompany) {
      const { results } = await axiosGraphqlQuery(query, { id: vehicle.leasingCompany })
      if (results && results.registry_guest) {
        targetLeasing = results.registry_guest
        targetLeasing = targetLeasing.surname + (targetLeasing.name ? ` ${targetLeasing.name}` : '')
      }
    }
    ws.addRow({
      lic: vehicle.licensePlate,
      dateFrom: vehicle.startDate && new Date(vehicle.startDate),
      hourFrom: vehicle.startHour,
      dateTo: vehicle.finishDate && new Date(vehicle.finishDate),
      regDate: vehicle.registrationDate && new Date(vehicle.registrationDate),
      vehicleType: vehicle.vehicleType,
      brand: vehicle.brand,
      model: vehicle.model,
      cov: vehicle.productCode,
      qli: numeric.toFloat(vehicle.weight),
      vehicleUse: vehicle.vehicleUse,
      val: numeric.toFloat(vehicle.value),
      vatIncluded: vehicle.vatIncluded === 'SI' ? 'SI' : 'NO',
      gla: vehicle.hasGlass === 'SI' ? 'SI' : 'NO',
      tow: vehicle.hasTowing === 'SI' ? 'SI' : 'NO',
      leasingCompany: targetLeasing,
      leasingExpiry: vehicle.leasingExpiry && cDate.mom(vehicle.leasingExpiry, null, 'DD/MM/YYYY'),
      owner: vehicle.realSigner,
      custom: vehicle.custom,
      prize: vehicle.prize,
      prizeT: vehicle.prizeT,
      payment: vehicle.payment,
      paymentT: vehicle.paymentT,
    })
  }
  for (let rowIndex = 2; rowIndex <= totalVehicles + 1; rowIndex += 1) {
    if (vehicles[rowIndex - 2]?.state?.startsWith('DELETED')) {
      Object.assign(ws.getRow(rowIndex), fontRed)
    }
    if (vehicles[rowIndex - 2]?.state?.startsWith('ADDED')) {
      Object.assign(ws.getRow(rowIndex), fontGreen)
    }
  }
  ws.addRow({
    val: { formula: `SUM(${letter['val']}${2}:${letter['val']}${totalVehicles + 1})`, result: totalVal || '' },
    prize: { formula: `SUM(${letter['prize']}${2}:${letter['prize']}${totalVehicles + 1})`, result: totalPrize || '' },
    prizeT: {
      formula: `SUM(${letter['prizeT']}${2}:${letter['prizeT']}${totalVehicles + 1})`,
      result: totalPrizeT || '',
    },
  })
  for (let colIndex = 1; colIndex <= columns.length; colIndex += 1) {
    Object.assign(ws.getRow(totalVehicles + 2).getCell(colIndex), bold)
  }
  workbook.xlsx.writeBuffer().then(buffer => {
    saveAs(new Blob([buffer], { type: 'application/octet-stream' }), `${fileName}.xlsx`)
  })
}
