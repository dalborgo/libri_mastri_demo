import log from 'loglevel'
import cFunctions from '../functions'

const originalFactory = log.methodFactory

function getColor (methodName) {
  switch (methodName) {
    case 'debug':
      return 'lightgreen'
    case 'info':
      return 'cyan'
    default:
      return ''
  }
}

log.methodFactory = function (methodName, logLevel, loggerName) {
  const rawMethod = originalFactory(methodName, logLevel, loggerName)
  return function () {
    const messages = []
    for (let index = 0; index < arguments.length; index++) {
      const isEr = cFunctions.isError(arguments[index])
      const isOb = cFunctions.isObj(arguments[index])
      const message = isOb && !isEr ? JSON.stringify(arguments[index], null, 2) : arguments[index]
      const color = getColor(methodName)
      if (color && !index) {
        messages.push(`%c${message}`, `color: ${color}`)
      } else {
        messages.push(message)
      }
    }
    return rawMethod.apply(undefined, messages)
  }
}

export default log
