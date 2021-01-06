import { getPriority } from '../helpers'

const priority = (user, _, { cache }) => {
  return getPriority(cache, user.role)
}
const pathRef = (user) => user.role === 'GUEST' ? window.location.pathname : ''

const resolvers = {
  ChildUser: {
    priority,
    pathRef,
  },
  MainUser: {
    priority,
    pathRef,
  },
}

export default resolvers
