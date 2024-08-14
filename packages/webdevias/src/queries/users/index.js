import gql from 'graphql-tag'

export const CHILDREN_FROM_LIST = (gql`
          fragment childrenFromList on ChildUser {
            id
            email
            username
            role
            father
            __typename
          }`
)
export const RAW_CHILDREN_FROM_LIST = (gql`
          fragment rawChildrenFromList on ChildUser {
            id
            email
            username
            longName
            father
            __typename
          }`
)
export const SELECT_USERS_FRAGMENT = (gql`
          fragment selectUserList on MainUser {
            id
            username
            role
            __typename
          }`
)
export const MAIN_USERS_FRAGMENT = (gql`
          fragment mainUserList on MainUser {
            id
            username
            __typename
          }`
)
export const USERS_PRODUCERS_FRAGMENT = (gql`
          fragment producerUserList on User {
            id
            username
            ... on ChildUser {
              father
              children {
                ...childrenFromList
              }
            }
            ... on MainUser {
              children {
                ...childrenFromList
              }
            }
            longName
            priority
            __typename
          }
          ${CHILDREN_FROM_LIST}
  `
)
export const USER_COMPLETE_FRAGMENT = (gql`
          fragment userComplete on User {
            id
            _createdAt,
            _updatedAt,
            username
            role
            email
            longName
            address
            addressNumber
            city
            state
            vat
            zip
            ... on ChildUser {
              father
              children {
                ...childrenFromList
              }
            }
            ... on MainUser {
              children {
                ...childrenFromList
              }
            }
            __typename
          }
          ${CHILDREN_FROM_LIST}
  `
)
export const USER_EDIT_FRAGMENT = (gql`
          fragment editInput on User {
            email
            role
            username
            longName
            address
            addressNumber
            city
            state
            vat
            zip
            ... on ChildUser {
              father
            }
          }`
)
export const USER_OPTIONS_EDIT_FRAGMENT = (gql`
          fragment editOptionsInput on User {
            username
            options {
              neverShowMenu
              forceDownloadPdf
            }
          }`
)
export const USER_ADD_FRAGMENT = (gql`
          fragment addInput on User {
            email
            password
            role
            username
            longName
            address
            addressNumber
            city
            state
            vat
            zip
            ... on ChildUser {
              father
            }
          }`
)
export const USER_ACCESS_FRAGMENT = (gql`
          fragment userAccess on User {
            id
            username
            role
            vat
            ... on ChildUser {
              father
            }
            ... on MainUser {
              children {
                ...rawChildrenFromList
              }
            }
            options {
              neverShowMenu
              forceDownloadPdf
            }
            __typename
          }
          ${RAW_CHILDREN_FROM_LIST}
  `
)
export const SIGNIN = gql`
  mutation SignIn($username: String!, $password: String!) {
    signIn (username: $username, password: $password) {
      ...userAccess
    }
  }
  ${USER_ACCESS_FRAGMENT}
`
export const ME = gql`
  {
    me {
      ...userAccess
      priority @client
      pathRef @client
    }
  }
  ${USER_ACCESS_FRAGMENT}
`
export const USERS = gql`
  {
    users {
      ...userComplete
      priority @client
    }
  }
  ${USER_COMPLETE_FRAGMENT}
`

export const MAIN_USERS = gql`
  query MainUsers($skip: ID){
    mainUsers(skip: $skip) {
      ...mainUserList
    }
  }
  ${MAIN_USERS_FRAGMENT}
`
export const TO_SELECT_USERS = gql`
  query ToSelectUsers($skip: ID){
    toSelectUsers(skip: $skip) {
      ...selectUserList
    }
  }
  ${SELECT_USERS_FRAGMENT}
`
export const USER = gql`
  query getUser($id: ID!){
    user(id: $id) {
      ...userComplete
      priority @client
    }
  }
  ${USER_COMPLETE_FRAGMENT}
`
export const EDIT_USER = gql`
  mutation editUser($input: EditUserInput!){
    edit(input: $input) {
      ...userComplete
      priority @client
    }
  }
  ${USER_COMPLETE_FRAGMENT}
`
export const EDIT_USER_OPTIONS = gql`
  mutation EditOptions($input: EditOptionsInput!){
    editOptions(input: $input) {
      ...userAccess
      priority @client
    }
  }
  ${USER_ACCESS_FRAGMENT}
`
export const UPDATE_USER_PASSWORD = gql`
  mutation UpdatePassword($password: String, $username: String!){
    updatePassword(password: $password, username: $username)
  }
`
export const ADD_USER = gql`
  mutation addUser($input: AddUserInput!){
    add(input: $input) {
      ...userComplete
      priority @client
    }
  }
  ${USER_COMPLETE_FRAGMENT}
`
export const DELETE_USER = gql`
  mutation delUser($id: ID!){
    del(id: $id) {
      ...userComplete
      priority @client
    }
  }
  ${USER_COMPLETE_FRAGMENT}
`
export const ROLES = gql`
  {
    __type(name: "Roles") @connection(key: "roles"){
      enumValues{
        name
      }
    }
  }
`

export const LOGOUT = gql`
  mutation SignOut{
    signOut {
      ...userAccess
    }
  }
  ${USER_ACCESS_FRAGMENT}
`
