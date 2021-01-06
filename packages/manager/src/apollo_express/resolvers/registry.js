import { Registry } from '../models'
import { export_resolver as exportResolver } from 'registry_service'

const resolver = exportResolver(Registry)
export default resolver

