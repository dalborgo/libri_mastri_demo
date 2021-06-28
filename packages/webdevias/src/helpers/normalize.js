import React from 'react'
import { GS, ROLES } from '../queries'
import client from 'client'
import { colors } from '@material-ui/core'
import { deepOrange, green } from '@material-ui/core/colors'
import { cDate, cFunctions, numeric } from '@adapter/common'
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles'
import find from 'lodash/find'
import { chain } from 'lodash'
import days360 from 'days360'
import Chip from '@material-ui/core/Chip'
import Notification from '@material-ui/icons/InfoOutlined'
import Mail from '@material-ui/icons/MailOutline'
import Check from '@material-ui/icons/CheckCircleOutline'
import { mdiCertificateOutline, mdiFileImageOutline, mdiFileOutline, mdiFilePdfOutline, mdiTimerSand } from '@mdi/js'
import Icon from '@mdi/react'
import moment from 'moment'

export function getPolicyEndDate (init, mid) {
  if (mid) {
    return cDate.mom(mid, null, 'DD/MM/YYYY', [1, 'y'])
  } else if (init) {
    return cDate.mom(init, null, 'DD/MM/YYYY', [1, 'y'])
  } else {
    return null
  }
}

export function calcPolicyEndDate (init, mid) {
  if (mid) {
    return cDate.mom(mid, null, 'YYYY-MM-DD', [1, 'y'])
  } else if (init) {
    return cDate.mom(init, null, 'YYYY-MM-DD', [1, 'y'])
  } else {
    return null
  }
}

const theme = createMuiTheme({
  palette: {
    secondary: {
      main: green[600],
      contrastText: '#fff',
    },
  },
})

const ChipRevision = ({ version }) => {
  return <Chip color="primary" label={`Revisione #${version}`} style={{ marginLeft: 10 }}/>
}

export const checkNullish = (valueToCheck, initialValues) => {
  let isNullish = false
  for (let key in initialValues) {
    isNullish |= !!valueToCheck[key]
  }
  return isNullish
}

export function getPolicyState (state = {}, meta = {}, top, priority) {
  const { version = 0 } = meta || {}
  const Rev = top ? <ChipRevision version={version}/> : null
  switch (state?.code) {
    case 'TO_QUBO':
      if (priority === 3) {
        return <><Chip icon={<Notification fontSize={'small'}/>} label="Nuova Proposta"/>{Rev}</>
      } else {
        return <><Chip icon={<Mail fontSize={'small'}/>} label="Proposta Inviata"/>{Rev}</>
      }
    case 'TO_AGENT':
      if (priority === 3) {
        return <><Chip icon={<Mail fontSize={'small'}/>} label="Offerta inviata"/>{Rev}</>
      } else {
        return <><Chip icon={<Notification fontSize={'small'}/>} label="Nuova Offerta"/>{Rev}</>
      }
    case 'ACCEPTED':
      if (state.isPolicy) {
        return (
          <Chip
            color="primary"
            icon={<Icon path={mdiCertificateOutline} size={1} style={{ marginTop: 4 }}/>}
            label="Polizza"
          />
        )
      } else {
        return (
          <ThemeProvider
            theme={theme}
          >
            <Chip
              color="secondary"
              icon={<Check fontSize={'small'}/>}
              label={state?.acceptedBy === 'SUPER' ? 'Proposta confermata' : 'Offerta confermata'}
            />
          </ThemeProvider>
        )
      }
    case 'REST_QUBO':
      if (meta.modified === true) {
        return <Chip icon={<Icon path={mdiTimerSand} size={1}/>} label="In lavorazione"/>
      } else {
        if (priority === 3) {
          return <><Chip icon={<Notification fontSize={'small'}/>} label="Nuova Proposta"/>{Rev}</>
        } else {
          return <><Chip icon={<Mail fontSize={'small'}/>} label="Proposta inviata"/>{Rev}</>
        }
      }
    case 'REST_AGENT':
      if (meta.modified === true) {
        return <Chip icon={<Icon path={mdiTimerSand} size={1}/>} label="In lavorazione"/>
      } else {
        if (priority === 3) {
          return <><Chip icon={<Mail fontSize={'small'}/>} label="Offerta inviata"/>{Rev}</>
        } else {
          return <><Chip icon={<Notification fontSize={'small'}/>} label="Nuova Offerta"/>{Rev}</>
        }
      }
    default:
      return <Chip icon={<Icon path={mdiTimerSand} size={1}/>} label="In lavorazione"/>
  }
}

export function getPolicyPermissions (state = {}, priority) {
  const { code } = state
  let editAccess = false
  if (priority === 3 && !['TO_AGENT', 'REST_AGENT'].includes(code)) {
    editAccess = true
  }
  if (priority < 3 && !['TO_QUBO', 'REST_QUBO', 'ACCEPTED'].includes(code)) {
    editAccess = true
  }
  return {
    editAccess,
    agentView: priority < 3 && code !== 'TO_QUBO',
    quboView: priority === 3 && code === 'TO_QUBO',
  }
}

export function getPolicyCode (statePolicy, header = {}, isNew, default_) {
  if (isNew) {
    return header.number || default_ || ''
  } else {
    return statePolicy.id || statePolicy.number || header.number || ''
  }
}

export function pdsToArray (pds) {
  return chain(pds).keys().sortBy(key => pds[key].index).value().map(val => pds[val])
}

function getFractMonths (fract) {
  switch (fract) {
    case 'UNIQUE':
      return 0
    case 'ANNUAL':
      return 12
    case 'SIX_MONTHLY':
      return 6
    case 'FOUR_MONTHLY':
      return 4
    case 'THREE_MONTHLY':
      return 3
    case 'MONTHLY':
      return 1
    default:
      return 0
  }
}

const taxRate = 13.5

function isLastFebruary (data) {
  const endDay = moment(data).endOf('month').format('D')
  const day = moment(data).format('D')
  if (day === endDay) {
    return ['29', '28'].includes(day) ? parseInt(day, 10) : 0
  } else {
    return 0
  }
}

function myDays360 (startCalc, endCalc, midDate) {
  let daysDiff = days360(new Date(startCalc), new Date(endCalc), 2)
  if (!midDate && (isLastFebruary(startCalc) || isLastFebruary(endCalc))) {
    daysDiff = Math.round(daysDiff / 30) * 30
  }
  return daysDiff
}

function myDays360_2 (startCalc, endCalc) {
  let daysDiff = days360(new Date(startCalc), new Date(endCalc), 2)
  /*if (isLastFebruary(startCalc) || isLastFebruary(endCalc)) {
    daysDiff = Math.round(daysDiff / 30) * 30
  }*/
  return daysDiff
}

function calcInst (date, dateSucc, dayPrize, midDate = false) {
  const startCalc = cDate.mom(date, null, 'YYYY-MM-DD')
  const endCalc = cDate.mom(dateSucc, null, 'YYYY-MM-DD')
  const daysDiff = myDays360(startCalc, endCalc, midDate)
  const instalment = Math.round(((dayPrize * 1000) * daysDiff)) / 1000
  const taxable = Math.round((instalment * 1000 / ((100 + taxRate) / 100))) / 1000
  const tax = Number(instalment.toFixed(2)) - Number(taxable.toFixed(2))
  return {
    date: cDate.mom(date, null, 'YYYY-MM-DD'),
    daysDiff,
    instalment: instalment,
    taxable: taxable,
    tax: tax,
  }
}


export function getPayFractionsNorm (payFractions, inMillis = true, round = false, divThousand = false) {
  const norm = {
    totInstalment: 0,
    totTax: 0,
    totTaxable: 0,
    payFractionsNorm: [],
  }
  for (let fraction of payFractions) {
    let fractionTax = fraction.tax
    let fractionTaxable = fraction.taxable
    if (divThousand) {
      fractionTax /= 1000
      fractionTaxable /= 1000
    }
    const tax = round ? Math.round(numeric.normNumb(fractionTax, inMillis)) : numeric.normNumb(fractionTax, inMillis)
    const taxable = round ? Math.round(numeric.normNumb(fractionTaxable, inMillis)) : numeric.normNumb(fractionTaxable, inMillis)
    const sumObj = {
      instalment: tax + taxable,
      tax,
      taxable,
      date: fraction.date,
      daysDiff: fraction.daysDiff,
    }
    norm.payFractionsNorm.push(sumObj)
  }
  return norm
}

export function calculateRegulationPayment (vehicles, tablePd, statePolicy, header, regFractions) {
  const [vehicle] = vehicles
  //const {isRecalculateFraction} = header
  const priceObj = {
    datePrize: {},
    fromStartPrize: {},
    toEndPrize: {},
  }
  const paymentPrize = calculatePaymentTable(tablePd, statePolicy, {
    ...vehicle,
    value: numeric.toFloat(vehicle.value / 1000),
  }, false, false)
  const datePrize = calculatePrizeTable(tablePd, statePolicy, {
    ...vehicle,
    value: numeric.toFloat(vehicle.value / 1000),
  })
  const taxableDatePrize = (datePrize / ((100 + taxRate) / 100))
  const taxableToEndPrizePrize = (paymentPrize / ((100 + taxRate) / 100))
  priceObj.datePrize = {
    instalment: datePrize,
    tax: datePrize - taxableDatePrize,
    taxable: taxableDatePrize,
    finishDate: vehicle.finishDate,
  }
  priceObj.paymentPrize = {
    instalment: paymentPrize,
    tax: paymentPrize - taxableToEndPrizePrize,
    taxable: taxableToEndPrizePrize,
  }
  return priceObj
}

export function calculatePaymentDates (vehicles, tablePd, statePolicy, header) {
  let sumPrize = 0
  for (let vehicle of vehicles) {
    sumPrize += calculatePrizeTable(tablePd, statePolicy, vehicle)
  }
  const dayPrize = sumPrize / 360
  const { initDate, midDate, paymentFract } = header
  const fractions = []
  const period = getFractMonths(paymentFract)
  if (initDate) {
    const start = midDate || initDate
    if (period === 0) {
      const endDate = cDate.mom(start, null, 'YYYY-MM-DD HH:mm', [1, 'y'])
      fractions.push(calcInst(cDate.mom(initDate, null, 'YYYY-MM-DD HH:mm'), endDate, dayPrize))
    } else {
      midDate && fractions.push(calcInst(cDate.mom(initDate, null, 'YYYY-MM-DD HH:mm'), cDate.mom(midDate, null, 'YYYY-MM-DD HH:mm'), dayPrize, midDate))
      for (let i = 0; i < 12; i += period) {
        const date = cDate.mom(start, null, 'YYYY-MM-DD HH:mm', [i, 'M'])
        const dateSucc = cDate.mom(start, null, 'YYYY-MM-DD HH:mm', [i + period, 'M'])
        fractions.push(
          calcInst(
            date,
            dateSucc,
            dayPrize
          ))
      }
    }
  }
  return fractions
}

function calcDateReg (startDate, endDate, regFractions, hasRegulation, midDate = false) {
  const startCalc = cDate.mom(startDate, null, 'YYYY-MM-DD')
  const endCalc = cDate.mom(endDate, null, 'YYYY-MM-DD')
  const daysDiff = myDays360(startCalc, endCalc, midDate)
  //const found = find(regFractions, { endCalc })
  return {
    startDate: startCalc,
    endDate: endCalc,
    daysDiff,
    hasRegulation,
  }
}

export function calculateRegulationDates (regFractions, header, isRecalculateFraction = 'NO') {
  const { initDate, midDate, regulationFract } = header
  const fractions = []
  const period = getFractMonths(regulationFract)
  if (initDate) {
    const start = midDate || initDate
    if (period === 0) {
      const endDate = cDate.mom(start, null, 'YYYY-MM-DD HH:mm', [1, 'y'])
      fractions.push(calcDateReg(cDate.mom(initDate, null, 'YYYY-MM-DD HH:mm'), endDate, regFractions, isRecalculateFraction))
    } else {
      midDate && fractions.push(calcDateReg(cDate.mom(initDate, null, 'YYYY-MM-DD HH:mm'), cDate.mom(midDate, null, 'YYYY-MM-DD HH:mm'), regFractions, isRecalculateFraction, midDate))
      for (let i = 0; i < 12; i += period) {
        const startDate = cDate.mom(start, null, 'YYYY-MM-DD HH:mm', [i, 'M'])
        const endDate = cDate.mom(start, null, 'YYYY-MM-DD HH:mm', [i + period, 'M'])
        fractions.push(
          calcDateReg(
            startDate,
            endDate,
            regFractions,
            isRecalculateFraction
          ))
      }
    }
  }
  return fractions
}

export function calculatePrizeTable (tablePd, policy, vehicle, printTaxable = false) {
  const { values: valuesTPd } = tablePd || {}
  const productDefinitions = valuesTPd ? valuesTPd.productDefinitions : policy.productDefinitions
  const { gs: { vehicleTypes = [] } } = client.readQuery({ query: GS })
  if (!productDefinitions.length) {return 0}
  const vehicleCode = cFunctions.getVehicleCode(vehicle.vehicleType, vehicle.weight, vehicleTypes)
  const defProdCode = find(productDefinitions, { vehicleType: vehicleCode })
  const prodFound = find(productDefinitions, {
    productCode: vehicle.productCode,
    vehicleType: vehicleCode,
  }) || defProdCode
  let prize = 0, taxable = 0
  if (prodFound) {
    const glass = vehicle.hasGlass === 'SI' ? prodFound.glass || 0 : 0
    const towing = vehicle.hasTowing === 'SI' ? prodFound.towing || 0 : 0
    const rate = prodFound.rate || 0
    const minimum = numeric.toFloat(prodFound.minimum) || 0
    const accessories = numeric.toFloat(glass) + numeric.toFloat(towing)
    const totalAmount = (numeric.toFloat(vehicle.value) * numeric.toFloat(rate) / 100)
    prize = (totalAmount < minimum ? minimum : totalAmount) || 0
    prize = (prize + accessories) || 0
    taxable = (prize / ((100 + taxRate) / 100))
    return printTaxable ? taxable : prize
  }
  return 0
}

export function calculatePaymentTable (tablePd, policy, vehicle, printTaxable = false, returnExtra = false) {
  const { values: valuesTPd } = tablePd || {}
  const productDefinitions = valuesTPd ? valuesTPd.productDefinitions : policy.productDefinitions
  const { gs: { vehicleTypes = [] } } = client.readQuery({ query: GS })
  if (!productDefinitions.length) {return 0}
  const vehicleCode = cFunctions.getVehicleCode(vehicle.vehicleType, vehicle.weight, vehicleTypes)
  const defProdCode = find(productDefinitions, { vehicleType: vehicleCode })
  const prodFound = find(productDefinitions, {
    productCode: vehicle.productCode,
    vehicleType: vehicleCode,
  }) || defProdCode
  let prize = 0, taxable = 0
  const regFractions = policy.regFractions
  if (prodFound) {
    const glass = vehicle.hasGlass === 'SI' ? prodFound.glass || 0 : 0
    const towing = vehicle.hasTowing === 'SI' ? prodFound.towing || 0 : 0
    const rate = prodFound.rate || 0
    const minimum = numeric.toFloat(prodFound.minimum) || 0
    const accessories = numeric.toFloat(glass) + numeric.toFloat(towing)
    let totalAmount = (numeric.toFloat(vehicle.value) * numeric.toFloat(rate) / 100)
    totalAmount = (totalAmount < minimum ? minimum : totalAmount) || 0
    totalAmount = (totalAmount + accessories) || 0
    const dayAmount = totalAmount / 360
    let normStartDate, normFinishDate
    if (vehicle.startDate) {
      normStartDate = cDate.mom(vehicle.startDate, null, 'YYYY-MM-DD')
    }
    if (vehicle.finishDate) {
      normFinishDate = cDate.mom(vehicle.finishDate, null, 'YYYY-MM-DD')
    }
    const startDate = normStartDate || policy.initDate
    const endDate = calcPolicyEndDate(policy.initDate, policy.midDate)
    const finishDate = normFinishDate || endDate
    let rangePrice, days360_
    if (startDate === policy.initDate && finishDate === endDate) {
      rangePrice = totalAmount
    } else {
      days360_ = myDays360_2(normStartDate, normFinishDate)
      if (['DELETED', 'DELETED_CONFIRMED', 'DELETED_FROM_INCLUDED'].includes(vehicle.state)) {
        if (cDate.someInRangeDate(normStartDate, normFinishDate, regFractions) && finishDate !== policy.initDate && startDate !== policy.initDate) {
          rangePrice = dayAmount * days360_
        } else {
          const days360ToEnd = myDays360_2(normStartDate, endDate)
          rangePrice = dayAmount * days360_ - (dayAmount * days360ToEnd)
        }
      } else {
        rangePrice = dayAmount * days360_
      }
    }
    prize = rangePrice || 0
    taxable = (prize / ((100 + taxRate) / 100))
    if (returnExtra) {
      return {
        payment: printTaxable ? taxable : prize,
        days: days360_ === undefined ? myDays360_2(policy.initDate, endDate) : days360_,
      }
    } else {
      return printTaxable ? taxable : prize
    }
  }
  return 0
}

export function calculatePaymentTable2 (tablePd, policy, vehicle, printTaxable = false, returnExtra = false) {
  const { values: valuesTPd } = tablePd || {}
  const productDefinitions = valuesTPd ? valuesTPd.productDefinitions : policy.productDefinitions
  const { gs: { vehicleTypes = [] } } = client.readQuery({ query: GS })
  if (!productDefinitions.length) {return 0}
  const vehicleCode = cFunctions.getVehicleCode(vehicle.vehicleType, vehicle.weight, vehicleTypes)
  const defProdCode = find(productDefinitions, { vehicleType: vehicleCode })
  const prodFound = find(productDefinitions, {
    productCode: vehicle.productCode,
    vehicleType: vehicleCode,
  }) || defProdCode
  let prize = 0, taxable = 0
  const regFractions = policy.regFractions
  if (prodFound) {
    const glass = vehicle.hasGlass === 'SI' ? prodFound.glass || 0 : 0
    const towing = vehicle.hasTowing === 'SI' ? prodFound.towing || 0 : 0
    const rate = prodFound.rate || 0
    const minimum = numeric.toFloat(prodFound.minimum) || 0
    const accessories = numeric.toFloat(glass) + numeric.toFloat(towing)
    let totalAmount = (numeric.toFloat(vehicle.value) * numeric.toFloat(rate) / 100)
    totalAmount = (totalAmount < minimum ? minimum : totalAmount) || 0
    totalAmount = (totalAmount + accessories) || 0
    const dayAmount = totalAmount / 360
    let normStartDate, normFinishDate
    if (vehicle.startDate) {
      normStartDate = cDate.mom(vehicle.startDate, null, 'YYYY-MM-DD')
    }
    if (vehicle.finishDate) {
      normFinishDate = cDate.mom(vehicle.finishDate, null, 'YYYY-MM-DD')
    }
    const startDate = normStartDate || policy.initDate
    const endDate = calcPolicyEndDate(policy.initDate, policy.midDate)
    const finishDate = normFinishDate || endDate
    let rangePrice, days360_
    if (startDate === policy.initDate && finishDate === endDate) {
      rangePrice = totalAmount
    } else {
      days360_ = myDays360_2(normStartDate, normFinishDate)
      if (['DELETED', 'DELETED_CONFIRMED', 'DELETED_FROM_INCLUDED'].includes(vehicle.state)) {
        if (cDate.someInRangeDate(normStartDate, normFinishDate, regFractions) && finishDate !== policy.initDate && startDate !== policy.initDate) {
          rangePrice = dayAmount * days360_
        } else {
          const days360ToEnd = myDays360_2(normStartDate, endDate)
          rangePrice = dayAmount * days360_ - (dayAmount * days360ToEnd)
        }
      } else {
        rangePrice = dayAmount * days360_
      }
    }
    prize = rangePrice || 0
    taxable = (prize / ((100 + taxRate) / 100))
    if (returnExtra) {
      return {
        payment: printTaxable ? taxable : prize,
        days: days360_ === undefined ? myDays360_2(policy.initDate, endDate) : days360_,
      }
    } else {
      return printTaxable ? taxable : prize
    }
  }
  return 0
}

export const getRolesArray = (skip = []) => {
  skip = Array.isArray(skip) ? skip : [skip]
  const roles = client.readQuery({ query: ROLES }).__type.enumValues
  return roles.filter(role => {
    return !skip.includes(role.name)
  })
}

const ROLES_ = {
  SUB_AGENT: 'Filiale',
  AGENT: 'Intermediario',
  SUPER: 'Amministratore',
}

export function getFileIcon (mimetype) {
  switch (mimetype) {
    case 'application/pdf':
      return <Icon path={mdiFilePdfOutline} size={1}/>
    case 'image/png':
    case 'image/jpeg':
      return <Icon path={mdiFileImageOutline} size={1}/>
    default:
      return <Icon path={mdiFileOutline} size={1}/>
  }
}

const COLORS_ = {
  SUPER: colors.orange[600],
  AGENT: colors.blue[600],
  SUB_AGENT: colors.green[600],
}
const CLASS_ = {
  SUPER: {
    backgroundColor: deepOrange[500],
  },
  AGENT: {
    backgroundColor: deepOrange[500],
  },
  SUB_AGENT: {
    backgroundColor: deepOrange[500],
  },
}

export const useRoleStyleBase = () => ({
  SUPER: {
    backgroundColor: colors.orange[600],
  },
  AGENT: {
    backgroundColor: colors.blue[600],
  },
  SUB_AGENT: {
    backgroundColor: colors.green[600],
  },
})

export const useRoleColorBase = () => ({
  SUPER: '#FB8C00',
  AGENT: '#1E88E5',
  SUB_AGENT: '#43A047',
})

export const roleName = role => {
  return ROLES_[role] || role
}
export const statusColors = role => {
  return COLORS_[role] || colors.grey[600]
}
export const classColors = role => {
  return CLASS_[role] || {
    backgroundColor: deepOrange[500],
  }
}
