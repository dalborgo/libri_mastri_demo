import { getGeniasFractMonths } from '../../../../../helpers'
import { numeric } from '@adapter/common'
import VEHICLE_LIST from '../../../components/PolicyVehicles/VehiclesTable/vehicleUseList.json'

const INSURANCE_TYPES = {
  Kasko: 1,
  Minikasko: 2,
  Collisione: 3,
  'PLATINUM A PRIMO RISCHIO': 66,
  GOLD: 67,
  SILVER: 68,
  PLATINUM: 69, //PLATINUM VALORE A NUOVO
  'PLATINUM A PRIMO RISCHIO SOLO KASKO': 70,
  'PLATINUM SOLO KASKO': 71, //PLATINUM SOLO KASKO VALORE A NUOVO
  'PLATINUM SOLO KASKO CON EVENTI': 73,
  'PLATINUM SOLO KASKO CON IF': 87,
  'PLATINUM SOLO COLLISIONE': 88,
  'PLATINUM A PRIMO RISCHIO SOLO COLLISIONE': 90,
  'PLATINUM A PRIMO RISCHIO SOLO KASKO CON IF': 91,
  'PLATINUM A PRIMO RISCHIO SOLO KASKO CON EVENTI': 92,
  'PLATINUM A PRIMO RISCHIO COLLISIONE': 93,
  'PLATINUM COLLISIONE': 94,
  'PLATINUM A PRIMO RISCHIO SOLO COLLISIONE CON EVENTI': 95,
  'PLATINUM SOLO COLLISIONE CON EVENTI': 96,
  'PLATINUM A PRIMO RISCHIO SOLO COLLISIONE CON IF': 97,
  'PLATINUM SOLO COLLISIONE CON IF': 98,
  'DANNI ACCIDENTALI DURANTE ATTIVITA': 100,
  'INFORTUNI CONDUCENTE': 99,
}

export const getFract = (paymentFract = [], fract) => {
  const months = getGeniasFractMonths(fract)
  const found = paymentFract.find(row => row.mesi === months)
  return found?.cod_frazionamento
}

export function getCodVehicleByKey (array, key) {
  const found = array.find(item => item.key === key)
  return found ? found['geniasCode'] : undefined
}

export const getVehicleUseCode = vehicle => {
  const toCompare = vehicle['vehicleUse'] || 'CONTO PROPRIO'
  return VEHICLE_LIST.find(value => value['Descrizione'] === vehicle?.vehicleType && value['Uso'] === toCompare)
}
export const getTotal = (payFractions, midDate) => {
  let totTax = 0, totTaxable = 0, index = 0
  for (const fraction of payFractions) {
    const isMid = index === 0 && midDate
    if (!isMid) {
      totTax += numeric.round(fraction.tax)
      totTaxable += numeric.round(fraction.taxable)
    }
    index++
  }
  return { totTax, totTaxable }
}

const mesiNomi = [
  'gennaio', 'febbraio', 'marzo', 'aprile',
  'maggio', 'giugno', 'luglio', 'agosto',
  'settembre', 'ottobre', 'novembre', 'dicembre',
]

export function extractYearAndNumber (input) {
  if (!input) { return null }
  
  const match = input.match(/\b(\d{4})\/(\d+)\b/)
  
  if (!match) { return null }
  
  const year = parseInt(match[1])
  const number = match[2]
  
  return {
    match: match[0],
    year: year.toString(),
    number,
    previous: `${year - 1}/${number}`,
  }
}

export const getInsuranceTypeCode = type => INSURANCE_TYPES[type]
export const getWeight = (type, weight_) => {
  const weight = numeric.normNumb(weight_, false)
  switch (type) {
    case 'AUTO':
      return { potenza_fiscleKW: Math.trunc(weight) }
    case 'PULLMAN':
      return { num_posti: Math.trunc(weight) }
    default:
      return { peso: Math.trunc(weight) }
  }
}

export const getRegulationFlags = regFractions => {
  return regFractions.reduce((acc, item) => {
    if (!item.endDate) {return acc}
    const meseIndex = new Date(item.endDate).getMonth() // 0-based
    const meseNome = mesiNomi[meseIndex]
    acc[`flag_reg_${meseNome}`] = true
    return acc
  }, {})
}

