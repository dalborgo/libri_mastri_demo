import { compare, hash } from 'bcryptjs'
import { lounge } from '../db'
import { baseSchema, timeSchema } from './base'
import { getApolloError } from '../errors'

const TYPE = 'USER'
const userSchema = lounge.schema({
  active: Boolean,
  address: String,
  addressNumber: String,
  city: String,
  email: String,
  father: String,
  lastPasswordChangeDate: String,
  longName: String,
  options: {
    neverShowMenu: Boolean,
    forceDownloadPdf: Boolean,
  },
  password: String,
  role: String,
  state: String,
  username: { type: String, key: true, generate: false },
  vat: String,
  zip: String,
}, {
  keyPrefix: `${TYPE}|`,
})

userSchema.pre('save', async function (next) {
  try {
    if (await this.isModified('password')) {
      this.password = await hash(this.password, 10)
    }
  } catch (err) {return next(getApolloError(err.message))}
  next()
})

const noPassword = (doc, ret) => {
  // eslint-disable-next-line no-unused-vars
  const { password, ...rest } = ret
  return rest
}

userSchema.set('toJSON', { transform: noPassword })

userSchema.method('matchPassword', async function (password) {return compare(password, this.password)})
userSchema.extend(baseSchema).extend(timeSchema)
const User = lounge.model(TYPE, userSchema)

export default User
