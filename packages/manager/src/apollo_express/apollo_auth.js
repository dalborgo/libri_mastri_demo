import { CustomAuthenticationError } from './errors'
import { User } from './models'
import config from 'config'

const { NAMESPACE } = config.get('apollo_express')
export const attemptSignIn = async (username, password) => {
  const message = 'Nome utente o password errata!'
  const user = await User.findById(username)
  if (!user || !await user.matchPassword(password)) {
    throw new CustomAuthenticationError(message, 'INVALID_USER_OR_PASSWORD')
  }
  return user
}

const signedIn = req => req.session.userId

export const ensureSignedIn = req => {
  if (!signedIn(req)) {
    throw new CustomAuthenticationError('Devi essere autenticato per eseguire questa operazione!', 'NOT_SIGNIN_ERROR')
  }
}

export const ensureSignedOut = req => {
  if (signedIn(req)) {
    throw new CustomAuthenticationError('Sei già autenticato in un\'altra sessione! Ricarica la pagina.', 'ALREADY_SIGNIN')
  }
}

export const signOut = (req, res) => new Promise(
  (resolve, reject) => {
    req.session.destroy(err => {
      if (err) {reject(err)}
      
      res.clearCookie(`${NAMESPACE}_session`, { sameSite: true })
      
      resolve(true)
    })
  }
)
