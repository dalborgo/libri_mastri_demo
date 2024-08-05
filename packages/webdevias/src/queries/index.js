import gql from 'graphql-tag'

export * from './users'
export * from './policies'
export * from './registries'
export const GS = gql`
  {
    gs{
      offset
      activities
      vehicleTypes
      coverageTypes
    }
  }
`

export const INIT = gql`
  {
    __type(name: "Roles") @connection(key: "roles"){
      enumValues{
        name
      }
    }
    gs{
      offset
      activities
      vehicleTypes
      coverageTypes
    }
  }
`
export const LOADING = gql`
  {
    loading
  }
`
