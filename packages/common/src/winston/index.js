import { createLogger, format, transports } from 'winston'
import moment from 'moment'

const { combine, label, printf, ms, errors } = format
const IS_PROD = process.env.NODE_ENV === 'production'

const myCustomLevels = {
  all: true,
  colors: {
    debug: 'white bold greenBG',
    error: 'white bold redBG',
    info: 'white bold blueBG',
    verbose: 'white bold cyanBG',
    warn: 'white bold yellowBG',
  },
}

const iconFormatter = format(info => {
  if (typeof info.message === 'object') {info.message = JSON.stringify(info.message, null, 2)}
  switch (info.level) {
    case 'error':
      info.message = `⚡⚡ ${info.message}`
      break
    case 'warn':
      info.message = `${info.message}`
      break
    case 'info':
      info.message = `${info.message}`
      break
    case 'debug':
      info.message = `🐛 ${info.message}`
      break
    case 'verbose':
      info.message = `${info.label} - ${info.message}`
      break
    default:
      info.message = `${info.message}`
  }
  return info
})

const myFormat = printf(info => {
  let { message, ms, stack } = info
  let levelRaw = info[Symbol.for('level')]
  let firstRaw = info[Symbol.for('splat')] || ''
  let stackRaw = stack ? ` ${stack}` : ''
  if (firstRaw && (typeof firstRaw[0] === 'object' || firstRaw[0] instanceof Error)) {firstRaw = `${JSON.stringify(firstRaw[0], null, 2)}`}
  if (firstRaw) {firstRaw = ` => ${firstRaw}` }
  switch (levelRaw) {
    case 'error':
      return `${message}${firstRaw}${stackRaw}`
    case 'verbose':
      return `${message}${firstRaw} ${ms}`
    case 'warn':
      return `${message}${firstRaw}`
    default:
      return `${message}${firstRaw}`
  }
})

const ignoreSimpleError = format(info => {
  let { stack } = info
  if (!stack) { return false }
  return info
})

const stripColor = format(info => {
  if (!info.noColor) {return info}
  const splatFormat = format.uncolorize()
  return splatFormat.transform(info, { level: true, message: true })
})

const myFormatPROD = printf(info => {
  let { message, stack, label } = info
  let stackRaw = stack ? ` ${stack}` : ''
  if (stackRaw) {
    return `${label} - ${message}${stackRaw}`
  } else {
    return false
  }
})

const logger = createLogger({
  level: IS_PROD ? 'info' : 'silly',
  format: combine(
    label({ label: moment().format('lll') }),
    iconFormatter(),
    errors({ stack: !IS_PROD }),
    ms(),
    format.colorize(myCustomLevels),
    format.splat(),
    myFormat,
    stripColor()
  ),
  transports: [new transports.Console()],
})

logger.hint = (...messages) => {
  let message = messages.map(mess => {
    if (typeof mess === 'object') {
      return JSON.stringify(mess, null, 2)
    } else {
      return mess
    }
  })
  message = message.join(' => ')
  return logger.info({ level: 'info', message, noColor: true })
}

if (IS_PROD) {
  logger.add(new transports.File({
    filename: 'errors.log', level: 'error', format: combine(
      label({ label: moment().format('DD-MM-YYYY HH:mm:ss') }),
      ignoreSimpleError(),
      myFormatPROD
    ),
  }))
}

export default logger
