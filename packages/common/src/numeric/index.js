import numeral from 'numeral'
import cFunctions from '../functions'
import compose from 'lodash/fp/compose'
numeral.register('locale', 'it', {
  delimiters: {
    thousands: '.',
    decimal: ',',
  },
  currency: {
    symbol: '€',
  },
})
numeral.locale('it')

const printMoney = (value, fd = 2) => printDecimal(value, fd, true)
const printByte = value => numeral(value).format('0b')
const round = (num, decimal = 2) => Number(num.toFixed(decimal))
function printDecimal (value, fd = 2, money = false) {
  if(typeof value !== 'number'){
    value = toFloat(value)
  }
  let str = ''
  if (fd > 0) {
    str = '.'
    for (let i = 0; i < fd; i++) {
      str += '0'
    }
  }
  return numeral(value).format(money ? `$ 0,0${str}` : `0,0${str}`)
}

function toFloat (str, commaDecimal = true) {
  if (!cFunctions.isString(str)) {return str}
  if (commaDecimal) {
    return parseFloat(str.replace(/\./g, '').replace(',', '.'))
  } else {
    return parseFloat(str.replace(/,/g, ''))
  }
}

const toFloat_ = inMillis => inMillis ? inp => inp : inp => inp
const perMillis = (inMillis, commaDecimal) => inMillis ? inp => toFloat(inp, commaDecimal) * 1000 || 0 : inp => toFloat(inp, commaDecimal) || 0
const normNumb = (val, inMillis = true, commaDecimal = true) => compose(toFloat_(inMillis), perMillis(inMillis, commaDecimal))(val, inMillis, commaDecimal)

export default {
  normNumb,
  printByte,
  printDecimal,
  printMoney,
  round,
  toFloat,
}
