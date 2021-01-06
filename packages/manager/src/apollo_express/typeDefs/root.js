import { gql } from 'apollo-server-express'

export default gql`
  directive @auth on FIELD_DEFINITION
  directive @guest on FIELD_DEFINITION
  directive @connection (key: String) on FIELD_DEFINITION
  scalar JSONObject
  scalar JSON
  scalar Long
  interface Edge {
    cursor: String!
  }
  enum CursorDir {
    PREV
    NEXT
  }
  type PageInfo {
    endCursor: String
    hasNextPage: Boolean!
    hasPrevPage: Boolean!
  }
  type ResultCursor {
    edges: [Edge]
    pageInfo: PageInfo!
    totalCount: Int!
  }
  type Query {
    _: String
  }

  type Mutation {
    _: String
  }

  type Subscription {
    _: String
  }
`
