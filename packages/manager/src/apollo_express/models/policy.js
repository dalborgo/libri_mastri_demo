import { lounge } from '../db'
import { baseSchema, casSchema, timeSchema } from './base'
import User from './user'

const TYPE = 'MB_POLICY'
const policySchema = lounge.schema({
  _code: { type: String, key: true, generate: false },
  attachments: [{}],
  children: [{}],
  cosigners: [{}],
  createdBy: User,
  initDate: String,
  isRecalculateFraction: String,
  meta: {
    fromDoc: String,
    modified: Boolean,
    offset: String,
    sequence: Number,
    serie: Number,
    toDoc: String,
    version: Number,
    year: String,
  },
  midDate: String,
  number: String,
  payFractions: [{}],
  paymentFract: String,
  producer: User,
  productDefinitions: {},
  regFractions: [{}],
  regulationFract: String,
  signer: {},
  specialArrangements: String,
  state: {
    code: String,
    acceptedBy: String,
    isPolicy: Boolean,
  },
  subAgent: User,
  top: String,
  vehicles: [{}],
}, {
  keyPrefix: `${TYPE}|`,
})

const noCode = (doc, ret) => {
  // eslint-disable-next-line no-unused-vars
  const { password, ...rest } = ret
  return rest
}

policySchema.set('toJSON', { transform: noCode })

policySchema.extend(baseSchema).extend(timeSchema).extend(casSchema)
const Policy = lounge.model(TYPE, policySchema)

export default Policy
