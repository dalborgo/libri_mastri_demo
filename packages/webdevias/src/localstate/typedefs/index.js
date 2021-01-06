import gql from 'graphql-tag'

const typeDefs = gql`
  directive @client on FIELD_DEFINITION
  extend type Query {
    loading: Boolean!
  }
  interface User {
    priority: Int
    pathRef: String
  }
`
export default typeDefs
