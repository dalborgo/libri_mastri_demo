import Q from 'q'
import uuid from 'short-uuid'
import * as paginator from './paginator'
import camelCase from 'lodash/camelCase'
import snakeCase from 'lodash/snakeCase'
import deburr from 'lodash/deburr'
import { chain, find, isEqual, isObject, transform } from 'lodash'
import { numeric } from '../index'
import log from '../log'

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

export default {
  camelDeburr,
  checkDuplicate,
  createChain,
  cursorPaginator: paginator.cursorPaginator,
  cursorPaginatorBoost: paginator.cursorPaginatorBoost,
  difference,
  fromBase64,
  generateString,
  getAuth,
  getFractName,
  getPrizeLine,
  getUUID,
  getVehicleCode,
  isError,
  isFunc,
  isObj,
  isProd,
  isString,
  normPayFractions,
  removeAtIndex,
  sequencePromises,
  sleep,
  snakeDeburr,
  toBase64,
}
