import { gql } from 'apollo-server-express'

const interfaceUserFields = `
 id: ID!
 _createdAt: String,
 _updatedAt: String,
 email: String
 password: String!
 username: String!
 role: Roles!
 longName: String
 address: String
 addressNumber: String
 city: String
 state: String
 zip: String
 vat: String
 options: UserOptions
`

const usersDefinitionType =`
interface User {
  ${interfaceUserFields}
}

type MainUser implements User{
  ${interfaceUserFields}
  children: [ChildUser]
}

type ChildUser implements User{
  ${interfaceUserFields}
  father: String
}
`
export default gql`
  extend type Query {
    me: User
    user(id: ID!): User @auth
    users: [User] @auth
    mainUsers(skip: ID): [MainUser] @auth
  }

  extend type Mutation {
    add(input: AddUserInput!): User @auth
    edit(input: EditUserInput!): User @auth
    editOptions(input: EditOptionsInput!): User @auth
    updatePassword(password: String, username: String!): Boolean @auth
    del(id: ID!): User @auth
    newPass(id: ID!, password: String!): User @auth
    signUp(email: String!, username: String!, role: Roles!, password: String!): User @guest
    signIn(username: String!, password: String!): User @guest
    signOut: User @auth
  }

  input AddUserInput {
    email: String
    role: Roles!
    password: String!
    username: String!
    father: String
    longName: String
    address: String
    addressNumber: String
    city: String
    state: String
    vat: String
    zip: String
  }

  input EditUserInput {
    email: String
    role: Roles!
    username: String!
    father: String
    longName: String
    address: String
    addressNumber: String
    city: String
    state: String
    vat: String
    zip: String
  }
  input EditOptionsInput {
    username: String!
    options: OptionsInput
  }
  input OptionsInput {
    neverShowMenu: Boolean
    forceDownloadPdf: Boolean
  }
  """
  The order of roles is important, the index correspond to the priority weight.
  """
  enum Roles {
    GUEST
    SUB_AGENT
    AGENT
    SUPER
  }
  
  type UserOptions {
    neverShowMenu: Boolean
    forceDownloadPdf: Boolean
  }
  
  ${usersDefinitionType}
`

