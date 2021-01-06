import { Gs } from '../models'

export default {
  Query: {
    gs: async () => {
      return Gs.findById('general_settings')
    },
  },
  Mutation: {},
}
