import { lounge } from '../db'
import { baseSchema } from './base'

const TYPE = 'GS'
const gsSchema = lounge.schema({
  _code: { type: String, key: true, generate: false },
  activities: [{}],
  coverageTypes: [{}],
  offset: String,
  vehicleTypes: [{}],
}, {
  keyPrefix: `${TYPE}|`,
})

const noCode = (doc, ret) => {
  // eslint-disable-next-line no-unused-vars
  const { password, ...rest } = ret
  return rest
}

gsSchema.set('toJSON', { transform: noCode })

gsSchema.extend(baseSchema)
const Gs = lounge.model(TYPE, gsSchema)

export default Gs
