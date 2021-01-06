import { string } from 'yup'
import moment from 'moment'
import isString from 'lodash/isString'
import mapValues from 'lodash/mapValues'
import isNil from 'lodash/isNil'

export function yupUniqueProperty (propertyName, message) {
  return this.test('unique', message, function (value) {
    if (!value || !value[propertyName]) {
      return true
    }
    if (
      this.parent
        .filter(val => val !== value)
        .some(val => val[propertyName] === value[propertyName])
    ) {
      throw this.createError({
        path: `${this.path}.${propertyName}`,
      })
    }
    return true
  })
}

const valVAT = (input) => {
  const schema = string().matches(/^[0-9]{11}$/)
  if(!input) {return schema}
  return schema.isValidSync(input)
}
const valGlobalVAT = input => {
  const schema = string().matches(/^((AT)?U[0-9]{8}|(BE)?0[0-9]{9}|(BG)?[0-9]{9,10}|(CY)?[0-9]{8}L|(CZ)?[0-9]{8,10}|(DE)?[0-9]{9}|(DK)?[0-9]{8}|(EE)?[0-9]{9}|(EL|GR)?[0-9]{9}|(ES)?[0-9A-Z][0-9]{7}[0-9A-Z]|(FI)?[0-9]{8}|(FR)?[0-9A-Z]{2}[0-9]{9}|(GB)?([0-9]{9}([0-9]{3})?|[A-Z]{2}[0-9]{3})|(HU)?[0-9]{8}|(IE)?[0-9]S[0-9]{5}L|(IT)?[0-9]{11}|(LT)?([0-9]{9}|[0-9]{12})|(LU)?[0-9]{8}|(LV)?[0-9]{11}|(MT)?[0-9]{8}|(NL)?[0-9]{9}B[0-9]{2}|(PL)?[0-9]{10}|(PT)?[0-9]{9}|(RO)?[0-9]{2,10}|(SE)?[0-9]{12}|(SI)?[0-9]{8}|(SK)?[0-9]{10})$/)
  if(!input) {return schema}
  return schema.isValidSync(input)
}
const valCF = input => {
  const schema = string().matches(/^[A-Za-z]{6}[0-9]{2}[A-Za-z]{1}[0-9]{2}[A-Za-z]{1}[0-9]{3}[A-Za-z]{1}$/)
  if(!input) {return schema}
  return schema.isValidSync(input)
}

const valIP = input => {
  const schema = string().matches(/^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/)
  if (!input) {return schema}
  return schema.isValidSync(input)
}

const valEmail = input => {
  const schema = string().email()
  if (!input) {return schema}
  return schema.isValidSync(input)
}

const valDate = (input, format = 'YYYY-MM-DD') => {
  return moment(input, format, true).isValid()
}
const valDateTime = (input, format = 'YYYY-MM-DD HH:mm') => {
  return moment(input, format, true).isValid()
}
const valTime = (input, format = 'HH:mm') => {
  return moment(input, format, true).isValid()
}
const escapeUnknownChar = (str, replacer = '?') => str.replace(/\uFFFD/g, replacer)

const trimAll = obj => {
  return mapValues(obj, val => {
    if (isString(val)) {
      return val.trim()
    } else {
      return val
    }
  })
}

const objectUpperCase = obj => mapValues(obj, inp => !isNil(inp) ? String(inp).toUpperCase() : undefined)
const objectRemoveEmpty = obj => mapValues(obj, inp => inp !== '' && inp !== null ? inp : undefined)

export default {
  escapeUnknownChar,
  objectRemoveEmpty,
  objectUpperCase,
  trimAll,
  valCF,
  valDate,
  valDateTime,
  valEmail,
  valGlobalVAT,
  valIP,
  valTime,
  valVAT,
  yupUniqueProperty,
}
