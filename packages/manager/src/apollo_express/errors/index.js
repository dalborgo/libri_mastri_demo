import { ApolloError, AuthenticationError, UserInputError, ValidationError } from 'apollo-server-express'

export class CustomValidationError extends ValidationError {
  constructor (message = 'Unauthorized', code) {
    super(message)
    this.code = code
  }
}

export class CustomAuthenticationError extends AuthenticationError {
  constructor (message = 'Invalid Authentication', code) {
    super(message)
    this.code = code
  }
}

export class CustomUserInputError extends UserInputError {
  constructor (message = 'User Input Error', invalidValues, code) {
    super(message, { invalidValues })
    this.code = code
  }
}

export const getApolloError = (message = 'Internal Apollo Error!', ext = 'GENERIC_APOLLO_ERROR') => new ApolloError(message, ext)
