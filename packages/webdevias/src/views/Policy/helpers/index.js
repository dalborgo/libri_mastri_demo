import { cFunctions, numeric } from '@adapter/common'
import uuid from 'uuid/v1'
import log from '@adapter/common/src/log'
import { pdsToArray } from 'helpers'
import { chain, isEmpty, uniqBy } from 'lodash'

export function reducerPolicy (draft, action) {
  switch (action.type) {
    case 'setAttachments':
      draft.attachments = action.attachments
      return
    case 'setFractions':
      draft.paymentFract = action.paymentFract
      return
    case 'setRegFractions':
      draft.regFractions = action.regFractions
      return
    case 'confirmAllInclExcl':
      const partial_ = { maxIncluded: 0, maxExcluded: 0, maxConstraint: 0, index: -1 }
      for (let i = 0; i < draft.vehicles.length; i++) {
        if (draft.vehicles[i].state === 'ADDED_CONFIRMED') {
          partial_.maxIncluded = Math.max(partial_.maxIncluded, draft.vehicles[i].counter || 0)
        }
        if (draft.vehicles[i].state === 'DELETED_CONFIRMED') {
          partial_.maxExcluded = Math.max(partial_.maxExcluded, draft.vehicles[i].counter || 0)
        }
        if (draft.vehicles[i].leasingCompany && draft.vehicles[i].state === 'ADDED_CONFIRMED') {
          partial_.maxConstraint = Math.max(partial_.maxConstraint, draft.vehicles[i].constraintCounter || 0)
        }
      }
      draft.vehicles = draft.vehicles.map(vehicle => {
        if (['ADDED', 'DELETED'].includes(vehicle.state)) {
          const newState = vehicle.state === 'ADDED' ? 'ADDED_CONFIRMED' : 'DELETED_CONFIRMED'
          let counter, constraintCounter
          counter = newState === 'ADDED_CONFIRMED'
            ?
            vehicle.counter ? vehicle.counter : ++partial_.maxIncluded
            :
            vehicle.counter ? vehicle.counter : ++partial_.maxExcluded
          if (newState === 'ADDED_CONFIRMED' && vehicle.leasingCompany) {
            constraintCounter = vehicle.constraintCounter ? vehicle.constraintCounter : ++partial_.maxConstraint
          }
          return {
            ...vehicle,
            state: newState,
            counter,
            constraintCounter,
          }
        } else {
          return vehicle
        }
      })
      return
    case 'setVehicles':
      draft.vehicles = action.vehicles
      return
    case 'setCas':
      draft._cas = action._cas
      return
    case 'appendVehicles':
      draft.vehicles.push(...action.vehicles)
      return
    case 'setVehicleStateByIndex':
      const partial = { maxIncluded: 0, maxExcluded: 0, maxConstraint: 0, index: -1 }
      for (let i = 0; i < draft.vehicles.length; i++) {
        if (draft.vehicles[i].licensePlate === action.licensePlate && draft.vehicles[i].state === action.state) {
          partial.index = i
        }
        if (draft.vehicles[i].state === 'ADDED_CONFIRMED') {
          partial.maxIncluded = Math.max(partial.maxIncluded, draft.vehicles[i].counter || 0)
        }
        if (draft.vehicles[i].state === 'DELETED_CONFIRMED') {
          partial.maxExcluded = Math.max(partial.maxExcluded, draft.vehicles[i].counter || 0)
        }
        if (draft.vehicles[i].leasingCompany) {
          partial.maxConstraint = Math.max(partial.maxConstraint, draft.vehicles[i].constraintCounter || 0)
        }
      }
      if (partial.index > -1) {
        draft.vehicles[partial.index].state = action.newState
        if (draft.vehicles[partial.index].state === 'ADDED_CONFIRMED') {
          draft.vehicles[partial.index].counter = draft.vehicles[partial.index].counter ? draft.vehicles[partial.index].counter : ++partial.maxIncluded
        }
        if (draft.vehicles[partial.index].state === 'DELETED_CONFIRMED') {
          draft.vehicles[partial.index].counter = draft.vehicles[partial.index].counter ? draft.vehicles[partial.index].counter : ++partial.maxExcluded
        }
        if (draft.vehicles[partial.index].state === 'ADDED_CONFIRMED' && draft.vehicles[partial.index].leasingCompany) {
          draft.vehicles[partial.index].constraintCounter = draft.vehicles[partial.index].constraintCounter ? draft.vehicles[partial.index].constraintCounter : ++partial.maxConstraint
        }
      }
      return
    case 'setPolicy':
      return action.policy
    case 'refresh':
      draft.policy = { ...draft.policy }
      return
    default:
      throw new Error('Invalid action type!')
  }
}

export function reducerInsertModal (draft, action) {
  switch (action.type) {
    case 'setClose':
      draft.open = false
      return
    case 'setOpen':
      draft.index = action.index
      draft.open = true
      return
    default:
      throw new Error('Invalid action type!')
  }
}

export const comparator = (values, index) => inp => cFunctions.camelDeburr(inp.productCode + inp.vehicleType) === cFunctions.camelDeburr(values[index].productCode + values[index].vehicleType)

export function getProductDefinitions (pds) {
  let index = 0
  return pds.productDefinitions.reduce((prev, curr) => {
    const clone = { ...curr }
    clone.rate = numeric.normNumb(clone.rate)
    clone.excess = numeric.normNumb(clone.excess)
    clone.minimum = numeric.normNumb(clone.minimum)
    clone.overdraft = numeric.normNumb(clone.overdraft)
    clone.glassCap = numeric.normNumb(clone.glassCap)
    clone.glass = numeric.normNumb(clone.glass)
    clone.towing = numeric.normNumb(clone.towing)
    clone.conditions = clone.conditions || ''
    clone.statements = clone.statements || ''
    clone.index = index++
    prev[cFunctions.camelDeburr(clone.productCode + clone.vehicleType || uuid())] = clone
    return prev
  }, {})
}

export function comparePolicy (new_, old) {
  const excludedFields = ['id', '__typename', '_type', 'producer', '_createdAt', '_updatedAt', 'state', 'meta', 'number', '_code', 'signer', 'attachments', 'createdBy']
  const restNew = chain(new_).omit(excludedFields).omitBy(isEmpty).value()
  const restOld = chain(old).omit(excludedFields).omitBy(isEmpty).value()
  const d1 = cFunctions.difference(restNew, restOld)
  //const d2 = cFunctions.difference(restOld, restNew)
  console.log('differencesObj:', JSON.stringify(d1, null, 2))
  const differences = []
  for (let key in d1) {
    if (Array.isArray(d1[key])) {
      const resArr = uniqBy(d1[key], isEmpty)
      if (resArr.length > 1 || !isEmpty(resArr[0])) {
        differences.push(key)
      }
    } else {
      differences.push(key)
    }
  }
  console.log('differences:', differences)
  return !differences.length
}

export function initPolicy (policy) {
  const {
    productDefinitions: pds, signer = null, cosigners = [], vehicles = [], regFractions = [], attachments = [],
  } = policy
  const newPD = pdsToArray(pds).map(val => (
    {
      ...val,
      rate: numeric.toFloat(val.rate) / 1000 || 0,
      excess: numeric.toFloat(val.excess) / 1000 || 0,
      overdraft: numeric.toFloat(val.overdraft) / 1000 || 0,
      glassCap: numeric.toFloat(val.glassCap) / 1000 || 0,
      glass: numeric.toFloat(val.glass) / 1000 || 0,
      towing: numeric.toFloat(val.towing) / 1000 || 0,
      minimum: numeric.toFloat(val.minimum) / 1000 || 0,
    }
  ))
  const newVehicles = vehicles.reduce((prev, curr) => {
    if (curr.licensePlate && curr.state) {
      prev.push({
        ...curr,
        value: curr.value / 1000 || 0,
      })
    } else {
      log.warn('vehicle skipped from list', curr)
    }
    return prev
  }, [])
  const holders = signer ? [signer, ...cosigners] : cosigners
  return { ...policy, vehicles: newVehicles, productDefinitions: newPD || {}, holders, regFractions, attachments }
}
