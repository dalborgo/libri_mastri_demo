import { gql } from 'apollo-server-express'

export default gql`
  extend type Query {
    gs: Gs
  }
  type Gs {
    id: ID
    offset: String,
    activities: JSON,
    coverageTypes: JSON
    vehicleTypes: JSON
  }
`
