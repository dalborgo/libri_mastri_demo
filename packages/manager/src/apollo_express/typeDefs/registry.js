import { gql } from 'apollo-server-express'
import { export_typeDef as exportTypeDef } from 'registry_service'

const RegistryTypeDef = exportTypeDef(gql)
export default RegistryTypeDef
