import Q from 'q'
import uuid from 'short-uuid'
import * as paginator from './paginator'
import camelCase from 'lodash/camelCase'
import snakeCase from 'lodash/snakeCase'
import deburr from 'lodash/deburr'
import { chain, find, isEqual, isObject, transform } from 'lodash'
import { cDate, numeric } from '../index'
import log from '../log'
import moment from 'moment'
import days360 from 'days360'

const isProd = () => process.env.NODE_ENV === 'production'
const generator = require('generate-password')

const getUUID = (short = false) => short ? uuid.generate() : uuid.uuid()
const getAuth = (user, password) => `Basic ${new Buffer(`${user}:${password}`).toString('base64')}`
const toBase64 = str => Buffer.from(str).toString('base64')
const fromBase64 = b64Encoded => Buffer.from(b64Encoded, 'base64').toString()
const camelDeburr = val => camelCase(deburr(val))
const snakeDeburr = val => snakeCase(deburr(val))

async function createChain (arr, extraParams = [], callback, initValue = []) {
  const promises = []
  arr.forEach(params => {
    if (!Array.isArray(params)) {
      params = [params]
    }
    if (!Array.isArray(extraParams)) {
      extraParams = [extraParams]
    }
    promises.push(callback.apply(null, [...params, ...extraParams]))
  })
  return promises.reduce(Q.when, Q(initValue))
}

async function sequencePromises (promises) {
  for (let promise of promises) {
    await promise()
  }
}

const generateString = (length = 8, numbers = true, uppercase = true, excludeSimilarCharacters = true, strict = true) => {
  return generator.generate({
    excludeSimilarCharacters,
    length,
    numbers,
    strict,
    uppercase,
  })
}

const isObj = obj => typeof obj === 'object'
const isFunc = obj => typeof obj === 'function'
const isError = obj => obj instanceof Error
const isString = obj => typeof obj === 'string' || obj instanceof String

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const removeAtIndex = (array, index) => array.slice(0, index).concat(array.slice(index + 1, array.length))

function checkDuplicate (values, comparator) {
  const res = []
  if (!isFunc(comparator)) {
    log.warn('Invalid comparator!')
    return res
  }
  for (let index = 0; index < values.length; index++) {
    const isDup = chain(values).filter((_, i) => i !== index).some(comparator(values, index)).value()
    isDup && res.push(index)
  }
  return res
}

function difference (object, base) {
  function changes (object, base) {
    return transform(object, function (result, value, key) {
      if (!isEqual(value, base[key])) {
        result[key] = (isObject(value) && isObject(base[key])) ? changes(value, base[key]) : value
      }
    })
  }
  
  return changes(object, base)
}

function getVehicleCode (vehicleType, weight = -1, vehicleTypes) {
  vehicleType = vehicleType ? vehicleType : vehicleTypes[0].key
  weight = numeric.toFloat(weight)
  const findFunc = val => {
    const limitWeight = val.limitWeight || 100000
    return weight <= limitWeight
  }
  const list = vehicleTypes.filter(vehicle => {
    return vehicle.key === vehicleType
  })
  if (list.length === 1) {
    return list[0].id
  } else {
    const found = find(list, findFunc)
    //!found && log.error(`No vehicleTypes match "${vehicleType}"!`)
    return found ? found.id : ''
  }
}

function getPrizeLine (product, vehicle) {
  let prize = 0, taxable = 0
  const taxRate = 13.5
  if (product) {
    const glass = vehicle.hasGlass === 'SI' ? product.glass || 0 : 0
    const towing = vehicle.hasTowing === 'SI' ? product.towing || 0 : 0
    const rate = product.rate || 0
    const minimum = numeric.toFloat(product.minimum) || 0
    const accessories = numeric.toFloat(glass) + numeric.toFloat(towing)
    const totalAmount = (numeric.toFloat(vehicle.value) * numeric.toFloat(rate) / 100000)
    prize = (totalAmount < minimum ? minimum : totalAmount) || 0
    prize = (prize + accessories) || 0
    taxable = (prize / ((100 + taxRate) / 100))
  }
  return { prize, taxable }
}

function normPayFractions (payFractionsDef) {
  return payFractionsDef.map(payment => {
    const tax = payment.tax / 1000
    const taxable = payment.taxable / 1000
    return {
      ...payment,
      instalment: tax + taxable,
      tax: payment.tax / 1000,
      taxable: payment.taxable / 1000,
    }
  })
}

function getFractName (fract) {
  switch (fract) {
    case 'UNIQUE':
      return 'unico'
    case 'ANNUAL':
      return 'annuale'
    case 'SIX_MONTHLY':
      return 'semestrale'
    case 'FOUR_MONTHLY':
      return 'quadrimestrale'
    case 'THREE_MONTHLY':
      return 'trimestrale'
    case 'MONTHLY':
      return 'mensile'
    default:
      return 'unico'
  }
}

function isLastFebruary (data) {
  const endDay = moment(data).endOf('month').format('D')
  const day = moment(data).format('D')
  if (day === endDay) {
    return ['29', '28'].includes(day) ? parseInt(day, 10) : 0
  } else {
    return 0
  }
}

function getFractMonths (fract) {
  switch (fract) {
    case 'UNIQUE':
      return 0
    case 'ANNUAL':
      return 12
    case 'SIX_MONTHLY':
      return 6
    case 'FOUR_MONTHLY':
      return 4
    case 'THREE_MONTHLY':
      return 3
    case 'MONTHLY':
      return 1
    default:
      return 0
  }
}

function calculateRegulationDates (regFractions, header, isRecalculateFraction = 'NO') {
  const { initDate, midDate, regulationFract } = header
  const fractions = []
  const period = getFractMonths(regulationFract)
  if (initDate) {
    const start = midDate || initDate
    if (period === 0) {
      const endDate = cDate.mom(start, null, 'YYYY-MM-DD HH:mm', [1, 'y'])
      fractions.push(calcDateReg(cDate.mom(initDate, null, 'YYYY-MM-DD HH:mm'), endDate, regFractions, isRecalculateFraction))
    } else {
      midDate && fractions.push(calcDateReg(cDate.mom(initDate, null, 'YYYY-MM-DD HH:mm'), cDate.mom(midDate, null, 'YYYY-MM-DD HH:mm'), regFractions, isRecalculateFraction, midDate))
      for (let i = 0; i < 12; i += period) {
        const startDate = cDate.mom(start, null, 'YYYY-MM-DD HH:mm', [i, 'M'])
        const endDate = cDate.mom(start, null, 'YYYY-MM-DD HH:mm', [i + period, 'M'])
        fractions.push(
          calcDateReg(
            startDate,
            endDate,
            regFractions,
            isRecalculateFraction
          ))
      }
    }
  }
  return fractions
}

function calcDateReg (startDate, endDate, regFractions, hasRegulation, midDate = false) {
  const startCalc = cDate.mom(startDate, null, 'YYYY-MM-DD')
  const endCalc = cDate.mom(endDate, null, 'YYYY-MM-DD')
  const daysDiff = myDays360(startCalc, endCalc, midDate)
  //const found = find(regFractions, { endCalc })
  return {
    startDate: startCalc,
    endDate: endCalc,
    daysDiff,
    hasRegulation,
  }
}

function calcPolicyEndDate (init, mid) {
  if (mid) {
    return cDate.mom(mid, null, 'YYYY-MM-DD', [1, 'y'])
  } else if (init) {
    return cDate.mom(init, null, 'YYYY-MM-DD', [1, 'y'])
  } else {
    return null
  }
}

function myDays360_old (startCalc, endCalc, midDate) {
  let daysDiff = days360(new Date(startCalc), new Date(endCalc), 2)
  if (!midDate && (isLastFebruary(startCalc) || isLastFebruary(endCalc))) {
    daysDiff = Math.round(daysDiff / 30) * 30
  }
  return daysDiff
}

function myDays360 (startCalc, endCalc) {
  let daysDiff = days360(new Date(startCalc), new Date(endCalc), 2)
  const diff = isLastFebruary(startCalc)
  if (diff && (endCalc !== startCalc)) {
    daysDiff -= 30 - diff
  }
  return daysDiff
}

const EXCLUSION_TYPES = {
  'VENDITA/DEMOLIZIONE': 1,
  REIMMATRICOLAZIONE: 1,
  'FURTO TOTALE': 0,
  ALTRO: 1,
}

const getExclusionTypeList = () => Object.keys(EXCLUSION_TYPES)

const exclusionTypeFactor = key => EXCLUSION_TYPES[key]

export default {
  calcPolicyEndDate,
  calculateRegulationDates,
  camelDeburr,
  checkDuplicate,
  createChain,
  cursorPaginator: paginator.cursorPaginator,
  cursorPaginatorBoost: paginator.cursorPaginatorBoost,
  difference,
  exclusionTypeFactor,
  fromBase64,
  generateString,
  getAuth,
  getExclusionTypeList,
  getFractMonths,
  getFractName,
  getPrizeLine,
  getUUID,
  getVehicleCode,
  isError,
  isFunc,
  isObj,
  isProd,
  isString,
  myDays360,
  normPayFractions,
  removeAtIndex,
  sequencePromises,
  sleep,
  snakeDeburr,
  toBase64,
}
