import { attemptSignIn, signOut } from '../apollo_auth'
import { User } from '../models'
import { CustomUserInputError, CustomValidationError } from '../errors'
import { cErrors } from '@adapter/common'
import log from '@adapter/common/src/winston'

const USER_GUEST = {
  id: 'guest',
  pathRef: '',
  priority: 0,
  role: 'GUEST',
  username: 'guest',
}

export default {
  Query: {
    mainUsers: async (_, { skip }) => {
      const knex = User.getKnex()
      knex.whereNot({ role: 'SUB_AGENT' }).orderBy('username')
      skip && knex.whereNot({ username: skip })
      return User.getByQuery(knex)
    },
    me: (root, args, { req }) => {
      const { userId } = req.session
      if (userId) {
        return User.findById(userId)
      } else {
        return USER_GUEST
      }
    },
    user: async (root, { id }, { req }) => {
      const { userRole, userId } = req.session || {}
      if (userRole !== 'SUPER' && userId !== id) {
        return null
      }
      return User.findById(id)
    },
    users: async () => {
      return User.getAll(['_createdAt', 'desc'])
    },
  },
  MainUser: {
    /* children: (parent) => {
      const { username } = parent
      const knex = User.getKnex()
      knex.where({father: username})
      return User.getByQuery(knex)
    },*/
    children: async (parent, _, ctx) => {
      //ctx.childLoader.clear(parent.username) 
      return ctx.childLoader.load(parent.username)
    },
  },
  Mutation: {
    add: async (root, { input }, ctx) => {
      const existUser = await User.findById(input.username)
      existUser && cErrors.throwError(new CustomValidationError(`L'utente "${existUser.username}" è già esistente!`, 'DUP_USERNAME'))
      input.father && ctx.childLoader.clear(input.father)
      const user = new User(input)
      return user.save()
    },
    del: async (root, { id }, ctx) => {
      const children = await ctx.childLoader.load(id)
      if (children && children.length) {
        for (let { id } of children) {
          const child = await User.findById(id)
          child.father = ''
          ctx.childLoader.clear(id)
          await child.save()
        }
      }
      ctx.childLoader.clear(id)
      return User.remove(id)
    },
    edit: async (root, { input }, ctx) => {
      const user = await User.findById(input.username)
      log.debug('input', input)
      if (user.username === input.father) {
        throw new CustomUserInputError('L\'utente non può essere padre di sé stesso!', { input })
      }
      user.father && ctx.childLoader.clear(user.father)
      input.father && ctx.childLoader.clear(input.father)
      const newUser = Object.assign(user, input)
      return newUser.save()
    },
    editOptions: async (root, { input }) => {
      const user = await User.findById(input.username)
      log.debug('input', input)
      const newUser = Object.assign(user, input)
      return newUser.save()
    },
    signIn: async (root, args, { req }) => {
      const user = await attemptSignIn(args.username, args.password)
      req.session.userId = user.id
      req.session.userRole = user.role
      return user
    },
    signOut: async (root, args, { req, res }) => {
      await signOut(req, res)
      return USER_GUEST
    },
    updatePassword: async (root, { password, username }) => {
      const user = await User.findById(username)
      const updatedUser = Object.assign(user, { password })
      await updatedUser.save()
      return true
    },
  },
}
