import Moment from 'moment'
import { extendMoment } from 'moment-range'
import compose from 'lodash/fp/compose'
import { validation } from '../index'

const moment = extendMoment(Moment)

const inRange = (start, end, date, includeStart = true) => {
  const range = moment().range(includeStart ? moment(start) : moment(start).add(1, 'd'), moment(end))
  return range.contains(moment(date))
}
const inRange2Date = (start, end, startDate, endDate) => {
  const range = moment().range(moment(start).add(1, 'd'), moment(end))
  return range.contains(moment(startDate)) && range.contains(moment(endDate))
}

const someInRangeDate = (startDate, endDate, fractions, comparator = inRange2Date) => fractions.some(fract => comparator(fract.startDate, fract.endDate, startDate, endDate))

const add = tuple => tuple ? inp => inp.add(tuple[0], tuple[1]) : inp => inp
const format = format => format ? inp => inp.format(format) : inp => inp.format('llll')
const momInit = (val, type) => val && type ? moment(val, type) : val ? moment(val) : moment()

const mom = (val, type, formatType, addToDate) => compose(format(formatType), add(addToDate), momInit)(val, type, formatType, addToDate)

const now = (format = 'llll') => moment().format(format)
const fromNow = val => moment(val).fromNow()

const roundNearestMinutes = (val, minutes = 30, format = 'YYYY-MM-DD HH:mm') => {
  if (!val) {return null}
  const start = moment(val, format)
  const remainder = minutes - (start.minute() % minutes)
  const resultDate = moment(start).add(remainder === minutes ? 0 : remainder, 'minutes')
  return resultDate
}

const roundTextTime = value => {
  if (!validation.valTime(value)) {
    return '24:00'
  }
  const value_ = roundNearestMinutes(value, 30, 'HH:mm')
  return moment(value_).format('HH:mm') === '00:00' ? '24:00' : moment(value_).format('HH:mm')
}

export default {
  fromNow,
  inRange,
  inRange2Date,
  mom,
  now,
  roundNearestMinutes,
  roundTextTime,
  someInRangeDate,
}
