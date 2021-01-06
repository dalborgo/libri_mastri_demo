import {
  registryOttoman,
} from '../db'
import { getFunctions } from './helpers'
import { export_model as exportModel } from 'registry_service'

const Registry = exportModel(registryOttoman, getFunctions)
export default Registry
