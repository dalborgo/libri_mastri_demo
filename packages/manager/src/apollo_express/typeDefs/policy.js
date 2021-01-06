import { gql } from 'apollo-server-express'

export default gql`
  
  extend type Query {
    differences(id: ID!): [DiffResponse] @auth
    policy(id: ID!): Policy @auth
    policies(origin: String): [Policy] @auth
    policiesResultCursor(after: String, dir: CursorDir, first: Int): ResultCursor @auth
  }
  
  extend type Mutation {
    editPolicy(input: SavePolicyInput!): Policy @auth
    newPolicy(input: SavePolicyInput!): Policy @auth
    delPolicy(id: ID!): Policy @auth
    clonePolicy(id: ID!): Policy @auth
    uploadFile(input: PolicyUploadInput!): UploadResponse @auth
  }
  
  type policyEdge implements Edge {
    cursor: String!
    node: Policy
  }

  type UploadResponse {
    errors: [UploadError]!
    policy: Policy!
  }
  type DiffResponse {
    log: String
    after: String
    before: String
  }
  type UploadError {
    reason: String
    line: Int
    column: String
  }
  type PolicyMeta {
    fromDoc: String
    sequence: Long
    serie: Long
    offset: String
    modified: Boolean
    toDoc: String
    version: Int
    year: String
  }
  type PolicyState {
    code: StateCodes
    acceptedBy: String
    isPolicy: Boolean
  }
  type PolicyAttachments {
    name: String
    dir: String
    size: Int
    type: String
  }
  enum StateCodes {
    DRAFT
    REST_QUBO
    TO_QUBO
    TO_AGENT
    REST_AGENT
    ACCEPTED
    CHANGED
  }
  input PolicyStateInput {
    code: StateCodes
    acceptedBy: String
    isPolicy: Boolean
  }
  input PolicyMetaInput {
    fromDoc: String
    offset: String
    modified: Boolean,
    sequence: Long
    serie: Long
    toDoc: String
    version: Int
    year: String
  }
  input SavePolicyInput {
    _code: String
    _createdAt: String
    _cas: String
    attachments: PolicyAttachmentsInput
    cosigners: JSON
    createdBy: String
    endDate: String
    paymentFract: String
    payFractions: JSON
    isRecalculateFraction: String
    regulationFract: String
    regFractions: JSON
    meta: PolicyMetaInput
    number: String
    initDate: String
    midDate: String
    producer: String
    productDefinitions: JSON
    signer: JSON
    specialArrangements: String
    state: PolicyStateInput
    subAgent: String
    vehicles: JSON
    payObj: JSON
    newEvent: Boolean
  }
  input PolicyUploadInput {
    file: Upload!
    policy: SavePolicyInput
    endDate: String
  }
  input PolicyAttachmentsInput {
    files: Upload
  }
  type Holder {
    id: ID
    activity: String
    name: String
    surname: String
    address: String
    address_number: String
    city: String
    state: String
    zip: String
  }
  type Policy {
    id: ID!
    _cas: String
    _code: String!
    _createdAt: String
    attachments: [PolicyAttachments]
    top: String
    children: [Policy]
    cosigners: [Holder]
    createdBy: User
    paymentFract: String
    payFractions: JSON
    isRecalculateFraction: String
    regulationFract: String
    regFractions: JSON
    meta: PolicyMeta
    number: String!
    initDate: String
    midDate: String
    producer: User
    productDefinitions: JSON
    signer: Holder
    specialArrangements: String
    state: PolicyState
    subAgent: User
    vehicles: JSON
  }
`
