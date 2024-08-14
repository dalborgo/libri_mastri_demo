import gs from './gs'
import policy from './policy'
import registry from './registry'
import user from './user'

export default [
  {
    Edge: {
      __resolveType () { //first parameter to identify the type of edge
        return 'policyEdge'
      },
    },
    User: {
      __resolveType (obj) {
        if (['SUB_AGENT','COLLABORATOR'].includes(obj.role)) {
          return 'ChildUser'
        }
        return 'MainUser'
      },
    },
  },
  gs,
  policy,
  registry,
  user,
]
