import gql from 'graphql-tag'

export const RegistriesFragment = (gql`
    fragment registriesFragment on Registry {
      id
      address
      address_number
      city
      name
      state
      surname
      zip
      __typename
    }`
)
export const RegistryFragment = (gql`
    fragment registryFragment on Registry {
      id
      __typename
    }`
)
export const REGISTRY_EDIT_FRAGMENT = (gql`
    fragment registryEditFragment on Registry {
      id
      username
      email
      address
      address_number
      city
      zip
      state
      surname
    }`
)
export const REGISTRY_ADD_FRAGMENT = (gql`
    fragment registryAddFragment on Registry {
      vat
      username
      password
      email
      address
      address_number
      city
      zip
      state
      surname
    }`
)
export const REGISTRY_COMPLETE_FRAGMENT = (gql`
    fragment registryCompleteFragment on Registry {
      id
      username
      email
      address
      address_number
      city
      zip
      state
      surname
      __typename
    }`
)

export const REGISTRIES = gql`
  query Registries($filter: String, $limit: Int, $skip: Int){
    registries(filter: $filter, limit: $limit, skip: $skip) {
      ...registriesFragment
    }
  }
  ${RegistriesFragment}
`
export const REGISTRY = gql`
  query Registry($id: ID!){
    registry(id: $id) {
      ...registryFragment
    }
  }
  ${RegistryFragment}
`
export const REGISTRY_COMPLETE = gql`
  query RegistryComplete($id: ID!){
    registry(id: $id) {
      ...registryCompleteFragment
    }
  }
  ${REGISTRY_COMPLETE_FRAGMENT}
`
export const ADD_REGISTRY = gql`
  mutation AddRegistry($input: AddRegistryInput) {
    addRegistry(input: $input){
      ...registryCompleteFragment
    }
  }
  ${REGISTRY_COMPLETE_FRAGMENT}
`
export const EDIT_REGISTRY = gql`
  mutation EditRegistry($input: EditRegistryInput) {
    editRegistry(input: $input){
      ...registryCompleteFragment
    }
  }
  ${REGISTRY_COMPLETE_FRAGMENT}
`
