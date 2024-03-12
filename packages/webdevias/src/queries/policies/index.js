import gql from 'graphql-tag'

export const ATTACHMENTS_FRAGMENT = (gql`
    fragment attachmentsFragment on PolicyAttachments {
      dir
      name
      size
      type
      __typename
    }`
)
export const HOLDER_FRAGMENT = (gql`
    fragment holderFragment on Holder {
      id
      activity
      name
      surname
      address
      address_number
      city
      state
      zip
      __typename
    }`
)
export const META_FRAGMENT = (gql`
    fragment metaFragment on PolicyMeta {
      fromDoc
      modified
      offset
      sequence
      serie
      toDoc
      version
      year
      __typename
    }`
)
export const STATE_FRAGMENT = (gql`
    fragment stateFragment on PolicyState {
      code
      acceptedBy
      isPolicy
      __typename
    }`
)
export const PRODUCER_FRAGMENT = (gql`
    fragment producerFragment on User {
      id
      username
      __typename
    }`
)
export const SUB_AGENT_FRAGMENT = (gql`
    fragment subAgentFragment on User {
      id
      username
      ... on ChildUser {
        father
      }
      __typename
    }`
)
export const CREATED_BY_FRAGMENT = (gql`
    fragment createdByFragment on User {
      id
      username
      role
      __typename
    }`
)
export const META_SAVE_FRAGMENT = (gql`
    fragment metaSaveFragment on PolicyMeta {
      fromDoc
      modified
      offset
      sequence
      serie
      toDoc
      version
      year
    }`
)
export const STATE_SAVE_FRAGMENT = (gql`
    fragment stateSaveFragment on PolicyState {
      code
      acceptedBy
      isPolicy
    }`
)
export const HOLDER_SAVE_FRAGMENT = (gql`
    fragment holderSaveFragment on Holder {
      id
      activity
      name
      surname
      address
      address_number
      city
      state
      zip
    }`
)
export const POLICY_FRAGMENT = (gql`
    fragment policyFragment on Policy {
      id
      _cas
      attachments {
        ...attachmentsFragment
      }
      company
      cosigners {
        ...holderFragment
      }
      createdBy{
        ...createdByFragment
      }
      paidFractions
      paymentFract
      payFractions
      isRecalculateFraction
      regulationFract
      regFractions
      number
      initDate
      midDate
      meta {
        ...metaFragment
      }
      notes
      producer{
        ...producerFragment
      }
      productDefinitions
      signer {
        ...holderFragment
      }
      specialArrangements
      state {
        ...stateFragment
      }
      subAgent{
        ...subAgentFragment
      }
      top
      vehicles
      _createdAt
      __typename
    }
    ${ATTACHMENTS_FRAGMENT}
    ${HOLDER_FRAGMENT}
    ${STATE_FRAGMENT}
    ${CREATED_BY_FRAGMENT}
    ${PRODUCER_FRAGMENT}
    ${SUB_AGENT_FRAGMENT}
    ${META_FRAGMENT}
  `
)

export const POLICIES_FRAGMENT = (gql`
    fragment policiesFragment on Policy {
      # È una query ottimizzata l'aggiunta di campi comporta la modifica della query nel resolver: getPoliciesQuery
      id
      number
      children{
        id
        __typename
      }
      createdBy{
        id
        username
        role
        __typename
      }
      meta{
        modified
        toDoc
        __typename
      }
      producer{
        id
        username
        __typename
      }
      subAgent{
        id
        username
        __typename
      }
      signer {
        id
        surname
        __typename
      }
      state{
        code
        acceptedBy
        isPolicy
        __typename
      }
      top
      initDate
      midDate
      _createdAt
      __typename
    }
  `
)

export const POLICY_SAVE_FRAGMENT = (gql`
    fragment policySaveFragment on Policy {
      _code
      _createdAt
      attachments
      _cas
      createdBy
      company
      cosigners {
        ...holderSaveFragment
      }
      meta{
        ...metaSaveFragment
      }
      paidFractions
      paymentFract
      isRecalculateFraction
      regulationFract
      regFractions
      number
      initDate
      midDate
      notes
      producer
      productDefinitions
      signer {
        ...holderSaveFragment
      }
      specialArrangements
      state {
        ...stateSaveFragment
      }
      subAgent
      vehicles
    }
    ${HOLDER_SAVE_FRAGMENT}
    ${META_SAVE_FRAGMENT}
    ${STATE_SAVE_FRAGMENT}
  `
)

export const UPLOAD_POLICY_MUTATION = gql`
  mutation UploadFile($input: PolicyUploadInput!) {
    uploadFile(input: $input){
      errors {
        reason
        line
        column
      }
      policy {
        ...policyFragment
      }
    }
  }
  ${POLICY_FRAGMENT}
`
export const DELETE_POLICY = gql`
  mutation DelPolicy($id: ID!){
    delPolicy(id: $id) {
      id
      meta {
        version
      }
      __typename
    }
  }
`
export const CLONE_POLICY = gql`
  mutation ClonePolicy($id: ID!){
    clonePolicy(id: $id) {
      id
      meta {
        version
      }
      __typename
    }
  }
`
export const UPDATE_POLICY = gql`
  mutation UpdatePolicy($id: ID!){
    updatePolicy(id: $id) {
      id
      meta {
        version
      }
      __typename
    }
  }
`
export const POLICY = gql`
  query Policy($id: ID!){
    policy(id: $id) {
      ...policyFragment
    }
  }
  ${POLICY_FRAGMENT}
`
export const POLICY_DIFF = gql`
  query Differences($id: ID!){
    differences(id: $id) {
      log
      after
      before
    }
  }
`
export const POLICIES = gql`
  query Policies($origin: String){
    policies(origin: $origin) {
      ...policiesFragment
    }
  }
  ${POLICIES_FRAGMENT}
`
export const SAVE_POLICY = gql`
  mutation EditPolicy($input: SavePolicyInput!){
    editPolicy(input: $input) {
      ...policyFragment
    }
  }
  ${POLICY_FRAGMENT}
`
export const NEW_POLICY = gql`
  mutation NewPolicy($input: SavePolicyInput!){
    newPolicy(input: $input) {
      ...policyFragment
    }
  }
  ${POLICY_FRAGMENT}
`
