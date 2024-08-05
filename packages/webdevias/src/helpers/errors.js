import log from '@adapter/common/src/log'
import isEmpty from 'lodash/isEmpty'

/**
 * funzione standard se non viene passato il gestore del boundary (l'errore viene ignorato in produzione)
 */
const standardThrowError = message => {
  log.error('Uncaught by boundary async error', message)
  throw new Error(message)
}
/**
 * @param throwToBoundaryError
 * funzione necessaria per intercettare con il boundary errori da funzioni asincrone.
 * @param notify notistack
 */
export const gestError = (throwToBoundaryError = standardThrowError, notify) => error => {
  
  try {
    log.debug('gestError', JSON.stringify(error, null, 2))
    const { graphQLErrors, networkError } = gestErrorObject(error)
    if (graphQLErrors === false && networkError === false) {
      if (notify) {
        notify(error.message, { variant: 'error' })
      } else {
        log.error(error.message)
      }
    } else {
      const oneError = graphQLErrors || networkError
      if (oneError) {
        if (notify) {
          notify(oneError.message, graphQLErrors ? { variant: 'error' } : undefined)
        } else {
          log.error(error.message)
        }
      } else {
        throwToBoundaryError(error.message)
      }
    }
  } catch (error) {
    throwToBoundaryError(error.message)
  }
}

export const gestErrorObject = error => {
  const { graphQLErrors = [], networkError = {} } = error
  if (!graphQLErrors.length && isEmpty(networkError)) {
    return {
      graphQLErrors: false,
      networkError: false,
    }
  }
  const response = {
    graphQLErrors: null,
    networkError: null,
  }
  if (networkError) {
    const [first] = networkError.result ? networkError.result.errors : networkError
    response.networkError = {
      message: first['message'],
      code: first['extensions'].code,
    }
  }
  if (graphQLErrors.length) {
    const [first] = graphQLErrors.result ? graphQLErrors.result.errors : graphQLErrors
    if (first) {
      response.graphQLErrors = {
        message: first['message'],
        code: first['extensions'].code,
      }
    }
  }
  return response
}
