import { Gs, Policy, User } from '../models'
import getStream from 'get-stream'
import parse from 'csv-parse'
import {
  calculateSequenceNumber,
  checkRecord,
  columnNameMap,
  createAttachments,
  getDiffPolicy,
  manageMail,
  manageMailEmitted,
} from './helpers'
import { getPoliciesQuery, getPolicyQuery } from './queries'
import keyBy from 'lodash/keyBy'
import log from '@adapter/common/src/winston'
import { axiosLocalhostInstance } from './helpers/axios'
import { cDate, cFunctions } from '@adapter/common'
import { CustomValidationError } from '../errors'
import config from 'config'

const { BUCKET_DEFAULT } = config.get('couchbase')
const decodeCAS = obj => obj.getCAS(true).toString()

export default {
  Query: {
    policy: async (root, { id }, { req }) => {
      /*const prova = await Policy.findById(id, { populate: ['producer', 'createdBy'] })*/
      const { userRole, userId } = req.session || {}
      const [first] = await Policy.getByQuery(getPolicyQuery(id, userRole, userId))
      if (!first) {return null}
      return new Policy(first, {}, first._cas)
    },
    policies: async (_, { origin }, { req }) => {
      const { userRole, userId } = req.session || {}
      const onlyDoc = origin === '/policies/doclist'
      /*
      const ids = await Policy.getAll(['_createdAt', 'desc'], true)
      return Policy.findById(ids, { populate: 'producer' }) //keepSortOrder
      */
      return Policy.getByQuery(getPoliciesQuery(userRole, userId, onlyDoc), [], true) //req_plus
    },
    differences: async (_, { id }) => {
      const new_ = await Policy.findById(id)
      const { version, year, serie } = new_.meta
      const oldKey = (version - 1) ? `${year}_${serie}_${version - 1}` : `${year}_${serie}`
      const old = await Policy.findById(oldKey)
      let result = []
      if (new_ && old) {
        result = getDiffPolicy(new_.toObject(), old.toObject())
      }
      return result
    },
    /* policiesResultCursor: async (_, { after, dir, first }) => {
       if (first < 0) {
         throw new CustomUserInputError('"first" field must be positive!', { first })
       }
       const allPolicies = await Policy.getAll()
       return cFunctions.cursorPaginatorBoost(allPolicies, after, dir, first, item => item._createdAt)
     },*/
  },
  Mutation: {
    clonePolicy: async (root, { id }) => {
      const policy = await Policy.findById(id)
      const name = `CLONED_${policy._code}`
      const number = `Bozza (CL. ${policy.number})`
      const cloned = {
        ...policy,
        _code: `${cDate.mom(null, null, 'YYYYMMDDHHmmssSSS')}_${name}`,
        _createdAt: undefined,
        _updatedAt: undefined,
        meta: undefined,
        number,
        payFractions: undefined,
        state: {
          code: 'DRAFT',
        },
      }
      const newPolicy = new Policy(cloned)
      return newPolicy.save()
    },
    delPolicy: async (root, { id }) => {
      const removedPolicy = await Policy.remove(id)
      const { version, serie, year } = removedPolicy.meta || {}
      if (version > 0) {
        const key = (version - 1) ? `${year}_${serie}_${version - 1}` : `${year}_${serie}`
        let unsetQuery
        unsetQuery = `UPDATE ${BUCKET_DEFAULT} USE KEYS ${JSON.stringify([`MB_POLICY|${key}`])} UNSET top, meta.toDoc`
        const toUpdate = []
        for (let i = version - 2; i >= 0; i--) {
          toUpdate.push(i ? `MB_POLICY|${year}_${serie}_${i}` : `MB_POLICY|${year}_${serie}`)
        }
        const keys = JSON.stringify(toUpdate)
        const setQuery = `UPDATE ${BUCKET_DEFAULT} USE KEYS ${keys} SET top = "${key}"`
        await Policy.getByQuery(setQuery)
        await Policy.getByQuery(unsetQuery)
      }
      return removedPolicy
    },
    editPolicy: async (root, { input }, { req }) => {
      const { attachments: { files }, state, meta, vehicles } = input
      const { newEvent, endDate, payObj, ...restInput } = input
      const { userRole } = req.session || {}
      const policy = await Policy.findById(restInput._code, { populate: ['producer', 'createdBy', 'subAgent'] })
      const attachments = await createAttachments(files, restInput._code)
      let producer, subAgent, toSend = []
      if (!policy.producer || policy.producer.username !== restInput.producer) {
        producer = await User.findById(restInput.producer)
      } else {
        producer = policy.producer
      }
      if (!policy.subAgent || policy.subAgent.username !== restInput.subAgent) {
        subAgent = await User.findById(restInput.subAgent)
      } else {
        subAgent = policy.subAgent
      }
      const { code: stateCode, isPolicy } = state || {}
      if (isPolicy && !newEvent) {
        //region CHECK IF MODIFIED
        const casServer = decodeCAS(policy)
        if (casServer !== input._cas) {
          throw new CustomValidationError('La polizza è stata modificata da un altro utente! Esportare il lavoro effettuato!', 'CHANGED_BY_OTHER_USER')
        }
        //endregion
        let vehicleMap, promises = []
        const oldVehicles = keyBy(policy.vehicles, input => input.licensePlate + '_' + input.state)
        for (let vehicle of vehicles) {
          const { attachments, licensePlate, state } = vehicle || {}
          if (!oldVehicles[licensePlate + '_' + state]) {
            toSend.push(vehicle)
          }
          const dir = `${restInput._code}/${licensePlate}_${state}`
          if (attachments) {
            vehicle.attachments = await createAttachments(attachments.files, dir)
          }
          //region PRESAVE INCLUSION AND EXCLUSION
          /*
          if (policy.vehicles && ['DELETED_CONFIRMED', 'ADDED_CONFIRMED'].includes(vehicle.state)) {
            if (!vehicleMap) {
              vehicleMap = policy.vehicles.reduce((prev, curr) => {
                prev[`${curr.licensePlate}${curr.state}`] = true
                return prev
              }, {})
            }
            if (!vehicleMap[`${vehicle.licensePlate}${vehicle.state}`]) {
              const where = vehicle.state === 'DELETED_CONFIRMED' ? 'print_exclusion' : 'print_inclusion'
              promises.push(() => axiosLocalhostInstance(`prints/${where}`, { //in parallelo
                data: {
                  ...restInput,
                  endDate,
                  priceObj: payObj[`${vehicle.licensePlate}${vehicle.state}`],
                  targetLicensePlate: vehicle.licensePlate,
                  toSave: true,
                  vehicles: [vehicle],
                },
                method: 'POST',
                responseType: 'blob',
              }))
            }
          }*/
          //endregion
        }
        //cFunctions.sequencePromises(promises).then() //in parallelo
      }
      const newPolicy = Object.assign(policy, restInput, {
        producer,
        subAgent,
        createdBy: policy.createdBy,
        attachments,
      })
      if (!producer) {delete newPolicy.producer}
      if (!subAgent) {delete newPolicy.subAgent}
      if (stateCode === 'ACCEPTED' && newEvent) {
        newPolicy.state.acceptedBy = userRole
        if (isPolicy) {
          const payFractions = cFunctions.normPayFractions(restInput.payFractions)
          axiosLocalhostInstance('prints/print_policy', { //in parallelo
            data: { ...restInput, payFractions, endDate, toSave: true },
            method: 'POST',
            responseType: 'blob',
          })
        }
      }
      const savedPolicy = await newPolicy.save()
      savedPolicy._cas = decodeCAS(savedPolicy) //to return
      if (state && ['TO_AGENT', 'TO_QUBO'].includes(state.code)) {
        const toUpdate = []
        let updateQuery, keys
        for (let i = meta.version - 1; i >= 0; i--) {
          toUpdate.push(i ? `MB_POLICY|${meta.year}_${meta.serie}_${i}` : `MB_POLICY|${meta.year}_${meta.serie}`)
        }
        keys = JSON.stringify(toUpdate)
        updateQuery = `UPDATE ${BUCKET_DEFAULT} USE KEYS ${keys} SET top = "${restInput._code}" UNSET meta.toDoc`
        await Policy.getByQuery(updateQuery)
      }
      if (newEvent) {
        const { ok, message } = await manageMail(state, savedPolicy.producer, restInput._code, userRole, policy.signer)
        if (!ok) { log.warn(message) }
      } else {
        if (toSend.length) {
          const { ok, message } = await manageMailEmitted(state, savedPolicy.producer, restInput._code, userRole, toSend, policy.signer)
          if (!ok) { log.warn(message) }
        }
      }
      return savedPolicy
    },
    newPolicy: async (root, { input }, { req }) => {
      const { userRole } = req.session || {}
      const { state, attachments: { files } } = input
      const { isPolicy } = state || {}
      const { number, meta = {}, _code } = await calculateSequenceNumber(input.meta, state, input.number)
      const exist = Boolean(await Policy.findById(_code))
      if (exist) {
        throw new CustomValidationError(`Numero documento "${number}" già presente!`, 'NUMBER_DOCUMENT_ALREADY_PRESENT')
      }
      const attachments = await createAttachments(files, _code)
      const { fromDoc, version, year, serie } = meta
      if (fromDoc && version === 0) {
        await Policy.remove(fromDoc)
      }
      input._code = _code
      input.number = number
      const toPrintPolicy = { ...input }
      if (isPolicy) {
        const payFractions = cFunctions.normPayFractions(toPrintPolicy.payFractions)
        axiosLocalhostInstance('prints/print_policy', { //in parallelo
          data: { ...toPrintPolicy, payFractions, toSave: true },
          method: 'POST',
          responseType: 'blob',
        })
      }
      input.attachments = attachments
      input.meta = meta
      input.producer = await User.findById(input.producer)
      input.subAgent = await User.findById(input.subAgent)
      input.createdBy = await User.findById(input.createdBy)
      // eslint-disable-next-line no-unused-vars
      const { endDate, ...restInput } = input
      const policy = new Policy(restInput)
      const savedPolicy = await policy.save()
      if (version > 0) {
        const toUpdate = []
        let updateQuery, keys
        const isRest = ['REST_AGENT', 'REST_QUBO'].includes(state.code)
        for (let i = version - 1; i >= 0; i--) {
          toUpdate.push(i ? `MB_POLICY|${year}_${serie}_${i}` : `MB_POLICY|${year}_${serie}`)
          if (isRest) {break}
        }
        if (isRest) {
          keys = JSON.stringify([toUpdate[0]])
          updateQuery = `UPDATE ${BUCKET_DEFAULT} USE KEYS ${keys} SET meta.toDoc = "${_code}"`
        } else {
          keys = JSON.stringify(toUpdate)
          updateQuery = `UPDATE ${BUCKET_DEFAULT} USE KEYS ${keys} SET top = "${_code}"`
        }
        await Policy.getByQuery(updateQuery)
      }
      const { ok, message } = await manageMail(state, savedPolicy.producer, _code, userRole, policy.signer)
      if (!ok) { log.warn(message) }
      return savedPolicy
    },
    uploadFile: async (_, { input }) => {
      const errors = []
      const gs = await Gs.findById('general_settings')
      const { policy: inputPolicy, endDate } = input
      const isPolicy = inputPolicy.state || {}
      const onRecord = (record, { lines: line }) => {
        const { checkedRecord, errors: rowsErrors } = checkRecord(record, line, inputPolicy, gs.vehicleTypes, endDate)
        if (rowsErrors.length) {
          errors.push(...rowsErrors)
        }
        return checkedRecord
      }
      const { createReadStream } = await input.file
      const parseStream = parse({
        columns: columnNameMap(isPolicy),
        delimiter: ';',
        on_record: onRecord,
        skip_empty_lines: true,
        skip_lines_with_empty_values: true,
        trim: true,
      })
      const vehicles = await getStream.array(createReadStream().pipe(parseStream))
      const producer = await User.findById(input.policy.producer)
      let subAgent
      if (input.policy.subAgent) {
        subAgent = await User.findById(input.policy.subAgent)
      }
      const createdBy = await User.findById(input.policy.createdBy)
      const policy = new Policy({
        ...input.policy,
        createdBy,
        producer,
        subAgent,
        vehicles,
      })
      return {
        errors,
        policy,
      }
    },
  },
}
