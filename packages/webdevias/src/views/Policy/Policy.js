import React, { useCallback, useEffect, useRef, useState } from 'react'
import { makeStyles } from '@material-ui/styles'
import PropTypes from 'prop-types'
import { DiffNotification, ErrorsNotification, Page } from 'components'
import moment from 'moment'
import {
  Header,
  PolicyAttachments,
  PolicyHeader,
  PolicyHolderInsertModal,
  PolicyHolders,
  PolicyProductDefinition,
  PolicyVehicles,
} from './components'
import { useLazyQuery, useMutation } from '@apollo/react-hooks'
import {
  calculateIsRecalculatePaymentTable,
  calculatePaymentDates,
  calculatePaymentTable,
  calculatePrizeTable,
  calculateRegulationPayment,
  gestError,
  getGlobalTaxation,
  getPayFractionsNorm,
  getPolicyCode,
  getPolicyEndDate,
  useAsyncError,
} from 'helpers'
import { withSnackbar } from 'notistack'
import compose from 'lodash/fp/compose'
import {
  GS,
  ME,
  NEW_POLICY,
  POLICIES,
  POLICIES_FRAGMENT,
  POLICY,
  POLICY_DIFF,
  POLICY_SAVE_FRAGMENT,
  SAVE_POLICY,
  UPLOAD_POLICY_MUTATION,
} from 'queries'
import CircularIndeterminate from 'components/Progress/CircularIndeterminate'
import { cDate, cFunctions, numeric } from '@adapter/common'
import log from '@adapter/common/src/log'
import { filter } from 'graphql-anywhere'
import { Query } from 'react-apollo'
import { matchPath, useHistory, useLocation, useParams } from 'react-router-dom'
import Error404 from '../Error404'
import { colors, Divider, Tab, Tabs } from '@material-ui/core'
import find from 'lodash/find'
import get from 'lodash/get'
import clsx from 'clsx'
import useRouter from 'utils/useRouter'
import { useImmerReducer } from 'use-immer'
import cloneDeep from 'lodash/cloneDeep'
import {
  comparePolicy,
  createExportTotal,
  getLastFraction,
  getProductDefinitions,
  initPolicy,
  reducerInsertModal,
  reducerPolicy,
} from './helpers'
import { manageFile } from 'utils/axios'
import { calculateRows } from './components/PolicyProductDefinition/helpers'
//region STYLE
const useStyles = makeStyles(theme => {
  const style = {
    root: {
      height: '100%',
      display: 'flex',
      overflow: 'auto',
      '& $policyDetails': {
        flexBasis: '100%',
        width: '100%',
        maxWidth: 'none',
        flexShrink: '0',
        transform: 'translateX(0)',
      },
    },
    divRoot: {
      display: 'flex',
      flexDirection: 'column',
    },
    policyDetails: {
      flexGrow: 1,
    },
    inner: {
      padding: theme.spacing(0, 3),
    },
    results: {
      flexGrow: 1,
      overflow: 'auto',
      maxHeight: '100%',
      marginTop: theme.spacing(0),
    },
    contentSection: {
      padding: theme.spacing(2, 0),
    },
    divider: {
      backgroundColor: colors.grey[300],
    },
    content: {
      margin: theme.spacing(2, 0),
    },
    contentSectionHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      cursor: 'pointer',
    },
    iconCollapse: {
      color: theme.palette.common.black,
    },
    formGroup: {
      padding: theme.spacing(1, 0),
    },
    fieldDisabled: {
      '&:disabled': {
        color: theme.palette.text.secondary,
      },
    },
    fieldGroup: {
      display: 'flex',
    },
    field: {
      margin: theme.spacing(1, 1),
      //minWidth: 100,
    },
    fieldNum: {
      width: 100,
    },
    fieldMid: {
      width: 160,
    },
    fieldBack: {
      backgroundColor: theme.palette.grey[100],
    },
    divCard: {
      display: 'inline-flex',
      minHeight: 70,
    },
    cardRow: {
      height: 70,
    },
    cardRowDouble: {
      height: 80,
    },
    cardRowFree: {
      display: 'inline-flex',
      padding: theme.spacing(1),
    },
    cardRowContent: {
      padding: theme.spacing(1),
    },
    rowDiv: {
      //height: 80,
      whiteSpace: 'nowrap',
    },
    whiteButton: {
      backgroundColor: theme.palette.white,
      color: theme.palette.grey[700],
    },
    fieldset: {
      border: 0,
    },
  }
  return style
})
//endregion

//region MAIN
const Main = ({ enqueueSnackbar }) => {
  const { id: policyId, tab } = useParams()
  const history = useHistory()
  const { pathname } = useLocation()
  const classes = useStyles()
  const throwError = useAsyncError()
  useEffect(() => {
    if (!tab) {
      if (pathname.endsWith('/')) {
        history.push('all')
      } else {
        history.push(`${policyId}/all`)
      }
    }
  }, [history, pathname, policyId, tab])
  
  if (policyId) {
    return (
      <Query
        fetchPolicy="cache-and-network" //to remove in case of ws implementation
        onError={gestError(throwError, enqueueSnackbar)}
        query={POLICY}
        variables={{ id: policyId }}
      >
        {
          ({ loading, called, data }) => {
            const { policy } = data || {}
            if (called && !loading) {
              return (
                <Page
                  className={classes.root}
                  title="Modifica Documento"
                >
                  {
                    policy
                      ? <Policy policy={policy}/>
                      : <Error404/>
                  }
                </Page>
              )
            } else {
              return <CircularIndeterminate/>
            }
          }
        }
      </Query>
    )
  } else {
    const policy = {
      productDefinitions: {},
      vehicles: [],
      regFractions: [],
    }
    return (
      <Page
        className={classes.root}
        title="Creazione Documento"
      >
        <Policy policy={policy}/>
      </Page>
    )
  }
  
}

//endregion

let Policy = ({ policy, enqueueSnackbar }) => {
  const classes = useStyles()
  const throwError = useAsyncError()
  const router = useRouter()
  const history = useHistory()
  const [uploadErrors, setUploadErrors] = useState([])
  const [openDiff, setOpenDiff] = useState(false)
  const [uploadMode, setUploadMode] = useState('list')
  const { tab } = useParams()
  const isNew = matchPath(router.location.pathname, {
    path: '/policies/new/:tab',
    exact: true,
  })
  const [loadDiff, { called: calledDiff, loading: loadingDiff, data: dataDiff }] = useLazyQuery(
    POLICY_DIFF,
    {
      onError: gestError(throwError, enqueueSnackbar),
      /*onCompleted: () => {
        console.log('DIFF')
        setOpenDiff(true)
      },*/
      variables: { id: policy.id },
    }
  )
  const [editPolicy, { client }] = useMutation(SAVE_POLICY, {
    onError: gestError(throwError, enqueueSnackbar),
  })
  const [newPolicy] = useMutation(NEW_POLICY, {
    onError: gestError(throwError, enqueueSnackbar),
  })
  const handleUploadClose = useCallback(() => {
    setUploadErrors([])
  }, [])
  const { gs } = client.readQuery({ query: GS })
  
  const formRefHeader = useRef(null)
  const formRefPDS = useRef(null)
  const formRefHolders = useRef(null)
  const formRefProd = useRef(null)
  const formRefComp = useRef(null)
  const formRefSub = useRef(null)
  const [statePolicy, dispatch] = useImmerReducer(reducerPolicy, policy, initPolicy)
  const [producer, setProducer] = useState(statePolicy.producer)
  const [subAgent, setSubAgent] = useState(statePolicy.subAgent)
  const [stateInsertModal, dispatchInsertModal] = useImmerReducer(reducerInsertModal, { index: -1, open: false })
  const [uploadFile] = useMutation(UPLOAD_POLICY_MUTATION)
  const { me } = client.readQuery({ query: ME })
  //region HANDLE MODE CHANGE
  const handleModeChange = useCallback((event, value) => {
    if (!value) {return}
    const { values: header } = formRefHeader.current || {}
    const { values: pds } = formRefPDS.current || {}
    const { values: holders } = formRefHolders.current || {}
    const productDefinitions = pds ? pds.productDefinitions : statePolicy.productDefinitions
    const newPolicy = {
      ...statePolicy,
      ...header,
      productDefinitions,
      specialArrangements: (pds?.specialArrangements || pds?.specialArrangements === '') ? pds?.specialArrangements : statePolicy.specialArrangements || '',
      notes: (header?.notes || header?.notes === '') ? header?.notes : statePolicy.notes || '',
      holders: holders?.holders ?? statePolicy.holders,
      collaborators: holders?.collaborators ?? statePolicy.collaborators,
    }
    if (statePolicy.number) {
      newPolicy.number = statePolicy.number
    }
    dispatch({ type: 'setPolicy', policy: newPolicy })
    if (value === 'tab') {
      history.push('holders')
    } else if (value === 'list') {
      history.push('all')
    } else {
      history.push(value)
    }
  }, [dispatch, history, statePolicy])
  //endregion
  
  //region HANDLE UPLOAD MODE CHANGE
  const handleVehiclesModeChange = useCallback((event, value) => {
    value && setUploadMode(value)
  }, [])
  
  //endregion
  
  function checkVehicleErrors (clone, product = {}) {
    if (!clone.startHour && ['ADDED_CONFIRMED', 'ADDED'].includes(clone.state)) {
      throw Error(`Ora obbligatoria per confermare un'inclusione [${clone.licensePlate}]`)
    }
    if (clone.registrationDate && moment(clone.registrationDate).isAfter(moment())) {
      throw Error(`Data immatricolazione errata [${clone.licensePlate}]`)
    }
    if (clone.vehicleType === 'RIMORCHIO' && clone.hasGlass === 'SI') {
      throw Error(`Cristalli a "SI" per tipo veicolo "Rimorchio" non ammesso [${clone.licensePlate}]`)
    }
    if (clone.hasGlass === 'SI' && product.glass === 0) {
      throw Error(`Cristalli a "SI" ma prodotto non quotato [${clone.licensePlate}]`)
    }
    if (clone.hasTowing === 'SI' && product.towing === 0) {
      throw Error(`Traino a "SI" ma prodotto non quotato [${clone.licensePlate}]`)
    }
    if (!clone.productCode) {
      throw Error(`Codice prodotto mancante per ${clone.vehicleType} non definito [${clone.licensePlate}]`)
    }
  }
  
  const calculatePolicy = useCallback((header, pds, holders, targetLicensePlate, targetState, targetCounter, typeLabel) => {
    const productDefinitions = pds ? getProductDefinitions(pds) : getProductDefinitions({ productDefinitions: statePolicy.productDefinitions })
    /*const duplicatedPDS = cFunctions.checkDuplicate(productDefinitions, comparator)
    console.log('duplicatedPDS:', duplicatedPDS)*/
    const vehicles = statePolicy.vehicles.reduce((prev, curr) => {
      const clone = { ...curr }
      const vehicleCode = `${cFunctions.getVehicleCode(clone.vehicleType, clone.weight, gs.vehicleTypes)}`
      const vehicleKey = cFunctions.camelDeburr(`${clone.productCode}${vehicleCode}`)
      clone.value = numeric.normNumb(clone.value)
      clone.weight = numeric.toFloat(clone.weight) //not in millis
      clone.registrationDate = clone.registrationDate ? cDate.mom(clone.registrationDate, null, 'YYYY-MM-DD') : null
      clone.leasingExpiry = clone.leasingExpiry ? cDate.mom(clone.leasingExpiry, null, 'YYYY-MM-DD') : null
      const defProdCode = get(find(productDefinitions, { vehicleType: vehicleCode }), 'productCode')
      clone.productCode = productDefinitions[vehicleKey] ? clone.productCode : defProdCode
      checkVehicleErrors(clone, productDefinitions[vehicleKey])
      if (targetLicensePlate) {
        // ok (clone.counter == targetCounter) non sapendo il tipo
        if (typeLabel === 'vincolo') {
          //eslint-disable-next-line
          (clone.licensePlate === targetLicensePlate && clone.state === targetState && (!clone.constraintCounter || clone.constraintCounter == targetCounter)) && prev.push(clone)
        } else if (typeLabel === 'inclusione') {
          //eslint-disable-next-line
          const counter = clone.includedCounter || clone.counter
          clone.counter = counter
          if (clone.licensePlate === targetLicensePlate && clone.state === targetState && (!counter || counter == targetCounter)) {
            prev.push(clone)
          }
        } else if (typeLabel === 'application') {
          //eslint-disable-next-line
          const counter = clone.inPolicy
          if (clone.licensePlate === targetLicensePlate && clone.state === targetState && (!counter || counter == targetCounter)) {
            prev.push(clone)
          }
        } else {
          const counter = clone.excludedCounter || clone.counter
          clone.counter = counter
          if (clone.state === 'DELETED_FROM_INCLUDED') {
            clone.counter = ''
          }
          if (clone.licensePlate === targetLicensePlate && clone.state === targetState && (!counter || counter == targetCounter)) {
            prev.push(clone)
          }
        }
      } else {
        prev.push(clone)
      }
      return prev
    }, [])
    //signer passando oggetto vuoto viene pulito nel salvataggio perché è di tipo oggetto in lounge
    let [signer = {}, ...cosigners] = holders?.holders ?? statePolicy.holders
    let collaborators = holders?.collaborators ?? statePolicy.collaborators
    let producer = statePolicy?.producer
    const createdBy = statePolicy?.createdBy?.username ?? me.username
    const out = {
      ...statePolicy,
      ...header,
      _code: statePolicy.id,
      attachments: { files: statePolicy.attachments },
      cosigners,
      collaborators,
      createdBy,
      producer,
      productDefinitions,
      signer: signer.id === '' ? {} : signer,
      specialArrangements: (pds?.specialArrangements || pds?.specialArrangements === '') ? pds?.specialArrangements : statePolicy.specialArrangements || '',
      notes: (header?.notes || header?.notes === '') ? header?.notes : statePolicy.notes || '',
      vehicles,
    }
    out.number = out.number ? out.number : getPolicyCode(statePolicy, header, isNew)
    out.initDate = out.initDate ? cDate.mom(out.initDate, null, 'YYYY-MM-DD') : null
    out.midDate = out.midDate ? cDate.mom(out.midDate, null, 'YYYY-MM-DD') : null
    const input = {
      ...filter(POLICY_SAVE_FRAGMENT, out),
    }
    return input
  }, [gs.vehicleTypes, isNew, me.username, statePolicy])
  
  const calculateEmittedPolicy = useCallback((pds, header, tablePd, header_, holders) => {
    const productDefinitions = pds ? getProductDefinitions(pds) : getProductDefinitions({ productDefinitions: statePolicy.productDefinitions })
    const payObj = {}
    const vehicles = statePolicy.vehicles.reduce((prev, curr) => {
      const clone = { ...curr }
      const vehicleCode = `${cFunctions.getVehicleCode(clone.vehicleType, clone.weight, gs.vehicleTypes)}`
      const vehicleKey = cFunctions.camelDeburr(`${clone.productCode}${vehicleCode}`)
      clone.value = numeric.normNumb(clone.value)
      clone.weight = numeric.toFloat(clone.weight) //not in millis
      clone.registrationDate = clone.registrationDate ? cDate.mom(clone.registrationDate, null, 'YYYY-MM-DD') : null
      clone.startDate = clone.startDate ? cDate.mom(clone.startDate, null, 'YYYY-MM-DD') : undefined //non metto il campo se vuoto
      clone.finishDate = clone.finishDate ? cDate.mom(clone.finishDate, null, 'YYYY-MM-DD') : undefined //non metto il campo se vuoto
      clone.leasingExpiry = clone.leasingExpiry ? cDate.mom(clone.leasingExpiry, null, 'YYYY-MM-DD') : null
      const defProdCode = get(find(productDefinitions, { vehicleType: vehicleCode }), 'productCode')
      clone.productCode = productDefinitions[vehicleKey] ? clone.productCode : defProdCode
      checkVehicleErrors(clone, productDefinitions[vehicleKey])
      if (['DELETED_CONFIRMED', 'ADDED_CONFIRMED'].includes(clone.state)) {
        payObj[`${clone.licensePlate}${clone.state}`] = calculateRegulationPayment([clone], tablePd, statePolicy, header_, statePolicy.regFractions)
      }
      if (Array.isArray(clone.attachments)) {
        clone.attachments = { files: clone.attachments }
      }
      prev.push(clone)
      return prev
    }, [])
    let [signer = {}, ...cosigners] = holders?.holders ?? statePolicy.holders
    let collaborators = holders?.collaborators ?? statePolicy?.collaborators
    //signer passando oggetto vuoto viene pulito nel salvataggio perché è di tipo oggetto in lounge
    const out = {
      ...statePolicy,
      _code: statePolicy.id,
      attachments: { files: statePolicy.attachments },
      cosigners,
      collaborators,
      createdBy: statePolicy?.createdBy?.username,
      isRecalculateFraction: header?.isRecalculateFraction || statePolicy.isRecalculateFraction,
      notes: (header?.notes || header?.notes === '') ? header?.notes : statePolicy.notes || '',
      paidFractions: statePolicy?.paidFractions,
      producer: statePolicy?.producer?.username,
      productDefinitions,
      signer: signer.id === '' ? {} : signer,
      subAgent: statePolicy?.subAgent?.username,
      vehicles,
    }
    const input = {
      ...filter(POLICY_SAVE_FRAGMENT, out),
    }
    return { ...input, payObj }
  }, [gs.vehicleTypes, statePolicy])
  
  //region HANDLE PRINT
  const handlePrint = useCallback((type, startRegDate, endRegDate, hasRegulation, regCounter, toSave = false) => async () => {
    try {
      const header = formRefHeader?.current?.values || statePolicy
      const { values: pds } = formRefPDS.current || {}
      const tablePd = formRefPDS.current
      const { values: holders } = formRefHolders.current || {}
      const { values: prodSelected = {} } = formRefProd.current || {}
      const { values: compSelected = {} } = formRefComp.current || {}
      const data = calculatePolicy(header, pds, holders)
      const dataProducer = prodSelected?.producer || data?.producer
      if (dataProducer) {
        if (dataProducer.father) {
          data.producer = prodSelected?.producer?.father ?? data.producer.father
        } else {
          data.producer = prodSelected?.producer?.username ?? data.producer.username
        }
      }
      data.company = compSelected?.company || data?.company
      const isPolicy = data?.state?.isPolicy
      if (type === 'policy') {
        const payFractions = calculatePaymentDates(statePolicy.vehicles, tablePd, statePolicy, header)
        const { payFractionsNorm } = statePolicy?.payFractions?.length ? getPayFractionsNorm(statePolicy.payFractions, false, false, true) : getPayFractionsNorm(payFractions, false)
        data.payFractions = payFractionsNorm
        data.endDate = getPolicyEndDate(data.initDate, data.midDate)
        if (isPolicy) {
          data.toSave = true
        }
        if (statePolicy.number) {
          data.number = statePolicy.number
        }
      }
      if (type === 'proposal') {
        const payFractions = calculatePaymentDates(statePolicy.vehicles, tablePd, statePolicy, header)
        const { payFractionsNorm } = statePolicy?.payFractions?.length ? getPayFractionsNorm(statePolicy.payFractions, false, false, true) : getPayFractionsNorm(payFractions, false)
        data.payFractions = payFractionsNorm
        if (statePolicy.number) {
          data.number = statePolicy.number
        }
        data.endDate = getPolicyEndDate(data.initDate, data.midDate)
      }
      if (type === 'receipt') {
        const { payFractions: originalPayFractions } = statePolicy
        data.endDate = getPolicyEndDate(data.initDate, data.midDate)
        const resultVehicles = []
        let count_ = 1
        const _vehicles = statePolicy.vehicles.filter(row => {
          //includere solo veicoli confermati
          const condition = (!row.startDate || moment(row.startDate).isSameOrBefore(moment(endRegDate))) && (!row.finishDate || moment(row.finishDate).isAfter(endRegDate))
          if (condition) {
            resultVehicles.push({ ...row, [`inPolicy_${endRegDate}`]: count_++ })
          }
          return condition
        })
        const calculatedPayFractions = calculatePaymentDates(_vehicles, tablePd, statePolicy, header)
        const resultVehiclesToPrint = resultVehicles.map(row => {
          const prize = calculatePrizeTable(tablePd, statePolicy, row, true) / calculatedPayFractions.length
          return {
            ...row,
            days: calculatedPayFractions[regCounter].daysDiff,
            prize,
            startDate: endRegDate,
            finishDate: data.regFractions?.[regCounter]?.endDate,
          }
        })
        const { payFractionsNorm: calculatedPayFractionNorm } = getPayFractionsNorm(calculatedPayFractions, true, true)
        data.startRecDate = endRegDate
        data.resultPayFractions = []
        let count = 0, index
        for (let opf of originalPayFractions) {
          if (moment(opf.date).isBefore(endRegDate)) {
            data.resultPayFractions.push(opf)
          }
          count++
        }
        for (let npf of calculatedPayFractionNorm) {
          if (moment(npf.date).isSameOrAfter(endRegDate)) {
            data.resultPayFractions.push(npf)
            count++
          }
          if (moment(npf.date).isSame(endRegDate)) {//'2023-12-31' da mettere se non matchano i dati
            data.toPrintPayFraction = npf
            index = count - 1
          }
        }
        data.resultVehicles = resultVehicles
        data.resultVehiclesToPrint = resultVehiclesToPrint
        data.resultRegFractions = data.regFractions.map((row, i) => {
          return { ...row, toCon: data.regFractions.length - 1 === i ? undefined : data.toPrintPayFraction.date }
        })
        //data.endRecDate = data.resultPayFractions?.[index]?.date ?? cFunctions.calcPolicyEndDate(data.initDate, data.midDate)
        data.endRecDate = data.regFractions?.[regCounter]?.endDate
        data.totTaxable = data.toPrintPayFraction.taxable / 1000
        data.totInstalment = data.toPrintPayFraction.instalment / 1000
      }
      if (type === 'regulation') {
        data.endDate = getPolicyEndDate(data.initDate, data.midDate)
        data.startRegDate = startRegDate
        data.endRegDate = endRegDate
        data.counter = regCounter
        data.toSave = toSave
        let totTaxable = 0
        const newVehicles = []
        const cloneVehicles = cloneDeep(statePolicy.vehicles)
        const [firstVehicle] = cloneVehicles
        const taxRate = getGlobalTaxation(tablePd, statePolicy, firstVehicle)
        for (let vehicle of cloneVehicles) { // non in millesimi qua
          /*const isStartDate = vehicle.startDate === data.initDate
          if ((!vehicle.startDate || !vehicle.finishDate)) {
            continue
          }
          if (cDate.inRange(startRegDate, endRegDate, vehicle.startDate, isStartDate) || (cDate.inRange(startRegDate, endRegDate, vehicle.finishDate) && ['DELETED', 'DELETED_CONFIRMED', 'DELETED_FROM_INCLUDED'].includes(vehicle.state))) {
            if (moment(vehicle.finishDate).isAfter(endRegDate)) {
              vehicle.finishDate = cFunctions.calcPolicyEndDate(data.initDate, data.midDate)
              vehicle.state = 'ADDED_CONFIRMED'
            }
            const {
              payment,
              days,
            } = hasRegulation === 'SI' ? calculateIsRecalculatePaymentTable(tablePd, statePolicy, vehicle, true, true, endRegDate) : calculatePaymentTable(tablePd, statePolicy, vehicle, true, true)
            const prize = calculatePrizeTable(tablePd, statePolicy, vehicle, true)
            totTaxable += payment
            newVehicles.push({ ...vehicle, payment, prize, days })
          }*/
          if (!vehicle.finishDate || moment(vehicle.finishDate).isBefore(startRegDate)) {// se non è stata toccata continua
            console.log(vehicle.licensePlate, 'excluded because removed before this period')
            continue
          }
          const isInPolicy = Boolean(vehicle.inPolicy)
          const isAlive = moment(vehicle.finishDate).isAfter(endRegDate)
          const hasBeenAdded = !isInPolicy && cDate.inRange(startRegDate, endRegDate, vehicle.startDate)
          console.log(vehicle.licensePlate, isAlive, hasBeenAdded, vehicle.state)
          
          if (isAlive) {
            if (hasBeenAdded) {// è viva ed è stata aggiunta nel periodo: devo pagare da quando è stata aggiunta fino alla fine della polizza
              vehicle.finishDate = cFunctions.calcPolicyEndDate(data.initDate, data.midDate)
              vehicle.state = 'ADDED_CONFIRMED'
            } else {
              continue// è viva ma non è stata aggiunta in questo periodo: quindi non faccio niente
            }
          } else {
            if (hasBeenAdded) {// è stata esclusa ed era stata aggiunta in questo periodo: quindi pago la diff da quando è entrata a quando è uscita
              //vehicle.finishDate = cFunctions.calcPolicyEndDate(data.initDate, data.midDate)
              if (cFunctions.exclusionTypeFactor(vehicle.exclusionType) !== 0) {// in caso di furto viene gestita dopo
                vehicle.state = 'ADDED_CONFIRMED'
              }
            } else {// è stata aggiunta in un periodo precedente, è stata esclusa, quindi storno la differenza solo se le motivazioni sono quelle
              if (['DELETED', 'DELETED_CONFIRMED', 'DELETED_FROM_INCLUDED'].includes(vehicle.state)) {
                //
              } else {
                continue
              }
            }
          }
          const {
            payment,
            days,
          } = hasRegulation === 'SI' ? calculateIsRecalculatePaymentTable(tablePd, statePolicy, vehicle, true, true, endRegDate) : calculatePaymentTable(tablePd, statePolicy, vehicle, true, true)
          const prize = calculatePrizeTable(tablePd, statePolicy, vehicle, true)
          totTaxable += payment
          if (hasRegulation === 'SI') {
            newVehicles.push({
              ...vehicle,
              finishDate: moment(vehicle.finishDate).isBefore(endRegDate) ? vehicle.finishDate : endRegDate,// esclusioni
              payment, prize, days,
            })
          } else {
            newVehicles.push({ ...vehicle, payment, prize, days })
          }
        }
        data.vehicles = newVehicles
        data.totTaxable = Number(totTaxable.toFixed(2))
        data.totInstalment = (totTaxable * ((100 + taxRate) / 100))
      }
      const forceDownloadPdf = me?.options?.forceDownloadPdf ?? false
      tab === 'all' && dispatch({ type: 'refresh' })
      client.writeData({ data: { loading: true } })
      let fileName = `${getPolicyCode(statePolicy, header, isNew) || 'bozza'}.pdf`
      if (type === 'regulation') {
        fileName = `regolazione_${getPolicyCode(statePolicy, header, isNew)}-${regCounter}.pdf`
      }
      if (type === 'receipt') {
        fileName = `quietanza_${getPolicyCode(statePolicy, header, isNew)}-${data.startRecDate}.pdf`
      }
      data.toSave = cFunctions.isProd() ? data.toSave : false
      const { ok, message } = await manageFile(
        `prints/print_${type}`,
        isPolicy ? fileName : data.number.replace('/', '_').replace('.', '_'),
        'application/pdf',
        data,
        { toDownload: forceDownloadPdf }
      )
      client.writeData({ data: { loading: false } })
      !ok && enqueueSnackbar(message, { variant: 'error' })
      return data
    } catch ({ message }) {
      enqueueSnackbar(message, { variant: 'error' })
    }
  }, [calculatePolicy, client, dispatch, enqueueSnackbar, isNew, me, statePolicy, tab])
  //endregion
  
  //region CONSOLIDATION
  const consolidatePolicy = useCallback((type, startRegDate, endRegDate, hasRegulation, regCounter) => async () => {
    
    await handlePrint('regulation', startRegDate, endRegDate, hasRegulation, regCounter)()
    const {
      resultPayFractions,
      resultVehicles,
      resultRegFractions,
    } = await handlePrint('receipt', startRegDate, endRegDate, hasRegulation, regCounter)()
    await dispatch({
      payFractions: resultPayFractions,
      regFractions: resultRegFractions,
      vehicles: resultVehicles,
      type: 'setConsolidate',
    })
    // document.getElementById('headerButton').click()
  }, [dispatch, handlePrint])
  //endregion
  
  //region HANDLE PRINT EmittedPolicy
  const handlePrintEmittedPolicy = useCallback(async event => {
    try {
      const [type, targetLicensePlate, targetState, counter, noPrize] = event.currentTarget.name.split('|')
      const header = formRefHeader?.current?.values || statePolicy
      const { values: pds } = formRefPDS.current || {}
      const tablePd = formRefPDS.current
      const { values: holders } = formRefHolders.current || {}
      let typeLabel
      switch (type) {
        case 'constraint':
          typeLabel = 'vincolo'
          break
        case 'application':
          typeLabel = 'applicazione'
          break
        case 'inclusion':
          typeLabel = 'inclusione'
          break
        default:
          typeLabel = 'esclusione'
      }
      const data = calculatePolicy(header, pds, holders, targetLicensePlate, targetState, counter, typeLabel)
      const dataProducer = data?.producer
      if (dataProducer) {
        if (dataProducer.father) {
          data.producer = data.producer.father
        } else {
          data.producer = data.producer.username
        }
      }
      if (!targetLicensePlate) {
        const payFractions = calculatePaymentDates(statePolicy.vehicles, tablePd, statePolicy, header)
        const { payFractionsNorm } = getPayFractionsNorm(payFractions, false)
        data.payFractions = payFractionsNorm
      } else {
        data.priceObj = calculateRegulationPayment(data.vehicles, tablePd, statePolicy, header, data.regFractions)// typeLabel === 'esclusione'
      }
      data.endDate = getPolicyEndDate(data.initDate, data.midDate)
      data.noPrize = Boolean(noPrize)
      if (targetState.includes('CONFIRMED') || targetState === 'ACTIVE') {
        data.toSave = true
      }
      const forceDownloadPdf = me?.options?.forceDownloadPdf ?? false
      //tab === 'all' && dispatch({ type: 'refresh' })
      client.writeData({ data: { loading: true } })
      const { ok, message } = await manageFile(
        `prints/print_${type}`,
        `${typeLabel}_${data.noPrize ? 'senza_premi_' : ''}${getPolicyCode(statePolicy, header, isNew)}-${targetLicensePlate}-${counter}.pdf`,
        'application/pdf',
        data,
        { toDownload: forceDownloadPdf }
      )
      client.writeData({ data: { loading: false } })
      !ok && enqueueSnackbar(message, { variant: 'error' })
    } catch ({ message }) {
      enqueueSnackbar(message, { variant: 'error' })
    }
  }, [calculatePolicy, client, enqueueSnackbar, isNew, me, statePolicy])
  //endregion
  
  //region HANDLE APPLICATION ZIP
  const handleApplicationZip = useCallback(async type => {
    try {
      const header = formRefHeader?.current?.values || statePolicy
      const { values: pds } = formRefPDS.current || {}
      const tablePd = formRefPDS.current
      const noPrize = type === 'senza_premi'
      let typeLabel = 'application'
      const { values: holders } = formRefHolders.current || {}
      const output = statePolicy.vehicles.reduce((prev, curr) => {
        if (!curr.inPolicy) {return prev}
        if (!curr.leasingCompany && type === 'di_vincolo') {return prev}
        const data = calculatePolicy(header, pds, holders, curr.licensePlate, curr.state, curr.inPolicy, typeLabel)
        const dataProducer = data?.producer
        if (dataProducer) {
          if (dataProducer.father) {
            data.producer = data.producer.father
          } else {
            data.producer = data.producer.username
          }
        }
        data.priceObj = calculateRegulationPayment(data.vehicles, tablePd, statePolicy, header, data.regFractions)// typeLabel === 'esclusione'
        data.endDate = getPolicyEndDate(data.initDate, data.midDate)
        data.noPrize = Boolean(noPrize)
        data.toSave = false
        prev.push(data)
        return prev
      }, [])
      const forceDownloadPdf = me?.options?.forceDownloadPdf ?? false
      client.writeData({ data: { loading: true } })
      const { ok, message } = await manageFile(
        `prints/application_zip_${type}`,
        `applicazioni_${type}_${getPolicyCode(statePolicy, header, isNew)}.zip`,
        'application/zip',
        output,
        { toDownload: forceDownloadPdf }
      )
      client.writeData({ data: { loading: false } })
      !ok && enqueueSnackbar(message, { variant: 'error' })
    } catch ({ message }) {
      enqueueSnackbar(message, { variant: 'error' })
    }
  }, [calculatePolicy, client, enqueueSnackbar, isNew, me, statePolicy])
  
  const handleApplicationZipInclusion = useCallback(async () => {
    const header = formRefHeader?.current?.values || statePolicy
    const { values: pds } = formRefPDS.current || {}
    const tablePd = formRefPDS.current
    let typeLabel = 'inclusione'
    const { values: holders } = formRefHolders.current || {}
    const output = statePolicy.vehicles.reduce((prev, curr) => {
      if (curr.state !== 'ADDED_CONFIRMED' || curr.startDate !== '2024-02-18') {return prev}
      const counter = curr.includedCounter || curr.counter
      const data = calculatePolicy(header, pds, holders, curr.licensePlate, curr.state, counter, typeLabel)
      const dataProducer = data?.producer
      if (dataProducer) {
        if (dataProducer.father) {
          data.producer = data.producer.father
        } else {
          data.producer = data.producer.username
        }
      }
      data.priceObj = calculateRegulationPayment(data.vehicles, tablePd, statePolicy, header, data.regFractions)// typeLabel === 'esclusione'
      data.endDate = getPolicyEndDate(data.initDate, data.midDate)
      data.toSave = false
      prev.push(data)
      return prev
    }, [])
    const forceDownloadPdf = me?.options?.forceDownloadPdf ?? false
    client.writeData({ data: { loading: true } })
    const { ok, message } = await manageFile(
      'prints/application_zip_inclusioni',
      `inclusioni_${getPolicyCode(statePolicy, header, isNew)}.zip`,
      'application/zip',
      output,
      { toDownload: forceDownloadPdf }
    )
    client.writeData({ data: { loading: false } })
    !ok && enqueueSnackbar(message, { variant: 'error' })
  }, [calculatePolicy, client, enqueueSnackbar, isNew, me, statePolicy])
  
  const handleApplicationZipConstraints = useCallback(async () => {
    const header = formRefHeader?.current?.values || statePolicy
    const { values: pds } = formRefPDS.current || {}
    const tablePd = formRefPDS.current
    let typeLabel = 'vincolo'
    const { values: holders } = formRefHolders.current || {}
    const output = statePolicy.vehicles.reduce((prev, curr) => {
      if (curr.state !== 'ADDED_CONFIRMED' || curr.startDate !== '2023-09-30' || !curr.leasingCompany) {return prev}
      const data = calculatePolicy(header, pds, holders, curr.licensePlate, curr.state, curr.constraintCounter, typeLabel)
      const dataProducer = data?.producer
      if (dataProducer) {
        if (dataProducer.father) {
          data.producer = data.producer.father
        } else {
          data.producer = data.producer.username
        }
      }
      data.priceObj = calculateRegulationPayment(data.vehicles, tablePd, statePolicy, header, data.regFractions)// typeLabel === 'esclusione'
      data.endDate = getPolicyEndDate(data.initDate, data.midDate)
      data.toSave = false
      prev.push(data)
      return prev
    }, [])
    const forceDownloadPdf = me?.options?.forceDownloadPdf ?? false
    client.writeData({ data: { loading: true } })
    const { ok, message } = await manageFile(
      'prints/application_zip_vincoli',
      `vincoli_${getPolicyCode(statePolicy, header, isNew)}.zip`,
      'application/zip',
      output,
      { toDownload: forceDownloadPdf }
    )
    client.writeData({ data: { loading: false } })
    !ok && enqueueSnackbar(message, { variant: 'error' })
  }, [calculatePolicy, client, enqueueSnackbar, isNew, me, statePolicy])
  
  //region HANDLE EXPORT
  const handleExport = useCallback(async () => {
    const { values: header } = formRefHeader.current || {}
    const { values: pds } = formRefPDS.current || {}
    const productDefinitions = pds ? getProductDefinitions(pds) : getProductDefinitions({ productDefinitions: statePolicy.productDefinitions })
    const isPolicy = statePolicy?.state?.isPolicy
    const vehicles = statePolicy.vehicles.reduce((prev, curr) => {
      const clone = { ...curr }
      const vehicleCode = `${cFunctions.getVehicleCode(clone.vehicleType, clone.weight, gs.vehicleTypes)}`
      const vehicleKey = cFunctions.camelDeburr(`${clone.productCode}${vehicleCode}`)
      clone.value = numeric.printDecimal(clone.value).replace('.', '')
      clone.weight = clone.weight ? numeric.printDecimal(clone.weight).replace('.', '') : ''
      clone.licensePlate = clone.licensePlate.startsWith('XXXXXX') ? '' : clone.licensePlate
      clone.startDate = clone.startDate ? cDate.mom(clone.startDate, null, 'YYYY-MM-DD') : null
      clone.registrationDate = clone.registrationDate ? cDate.mom(clone.registrationDate, null, 'YYYY-MM-DD') : null
      clone.leasingExpiry = clone.leasingExpiry ? cDate.mom(clone.leasingExpiry, null, 'YYYY-MM-DD') : null
      const defProdCode = get(find(productDefinitions, { vehicleType: vehicleCode }), 'productCode')
      clone.productCode = productDefinitions[vehicleKey] ? clone.productCode : defProdCode
      if (isPolicy) {
        clone.state === 'ADDED' && prev.push(clone)
      } else {
        prev.push(clone)
      }
      return prev
    }, [])
    client.writeData({ data: { loading: true } })
    const { ok, message } = await manageFile(
      isPolicy ? 'files/export_added_csv' : 'files/export_csv',
      isPolicy ? `veicoli_inclusi_${getPolicyCode(statePolicy, header, isNew, 'template_polizza')}.csv` : `veicoli_inclusi_${statePolicy.number.replace('/', '_').replace('.', '_')}`,
      'text/csv',
      vehicles,
      { toDownload: true }
    )
    client.writeData({ data: { loading: false } })
    !ok && enqueueSnackbar(message, { variant: 'error' })
  }, [client, enqueueSnackbar, gs.vehicleTypes, isNew, statePolicy])
  //endregion
  //region HANDLE EXPORT TOTAL
  const handleExportTotal = useCallback(async () => {
    const { values: header } = formRefHeader.current || {}
    const { values: pds } = formRefPDS.current || {}
    const tablePd = formRefPDS.current
    const { values: holders } = formRefHolders.current || {}
    const productDefinitions = pds ? getProductDefinitions(pds) : getProductDefinitions({ productDefinitions: statePolicy.productDefinitions })
    const vehicles = statePolicy.vehicles.reduce((prev, curr) => {
      const taxRate = getGlobalTaxation(tablePd, statePolicy, curr)
      const clone = { ...curr }
      const prize = calculatePrizeTable(tablePd, statePolicy, curr)
      const payment = calculatePaymentTable(tablePd, statePolicy, curr)
      let [signer = {}, ...cosigners] = holders?.holders ?? statePolicy.holders
      let realSigner = signer.surname + (signer.name ? ` ${signer.name}` : '')
      if (clone.owner && signer.id !== clone.owner) {
        const found = find(cosigners, { id: clone.owner }) || {}
        realSigner = found.surname + (found.name ? ` ${found.name}` : '')
      }
      const vehicleCode = `${cFunctions.getVehicleCode(clone.vehicleType, clone.weight, gs.vehicleTypes)}`
      const vehicleKey = cFunctions.camelDeburr(`${clone.productCode}${vehicleCode}`)
      clone.licensePlate = clone.licensePlate.startsWith('XXXXXX') ? '' : clone.licensePlate
      clone.startDate = clone.startDate ? cDate.mom(clone.startDate, null, 'YYYY-MM-DD') : null
      clone.finishDate = clone.finishDate ? cDate.mom(clone.finishDate, null, 'YYYY-MM-DD') : null
      clone.registrationDate = clone.registrationDate ? cDate.mom(clone.registrationDate, null, 'YYYY-MM-DD') : null
      clone.leasingExpiry = clone.leasingExpiry ? cDate.mom(clone.leasingExpiry, null, 'YYYY-MM-DD') : null
      const defProdCode = get(find(productDefinitions, { vehicleType: vehicleCode }), 'productCode')
      clone.productCode = productDefinitions[vehicleKey] ? clone.productCode : defProdCode
      clone.realSigner = realSigner
      clone.prize = prize
      clone.prizeT = (prize / ((100 + taxRate) / 100))
      clone.payment = calculatePaymentTable(tablePd, statePolicy, curr)
      clone.paymentT = (payment / ((100 + taxRate) / 100))
      prev.push(clone)
      return prev
    }, [])
    const isPolicy = statePolicy?.state?.isPolicy
    await createExportTotal(
      vehicles,
      isPolicy ? `stato_veicoli_${getPolicyCode(statePolicy, header)}` : statePolicy.number.replace('/', '_').replace('.', '_')
    )
  }, [gs.vehicleTypes, statePolicy])
  //endregion
  
  //region HANDLE SAVE
  const handleSave = useCallback(async event => {
    try {
      const stateCode = event.currentTarget.name || 'DRAFT'
      /* eslint-disable no-unused-vars */
      const { values: header, resetForm: resetFormHeader } = formRefHeader.current || {}
      const { values: pds, resetForm: resetFormPDS, setFieldValue } = formRefPDS.current || {}
      const { values: holders, resetForm: resetFormHolders } = formRefHolders.current || {}
      const { values: prodSelected = {}, resetForm: resetFormProducers } = formRefProd.current || {}
      const { values: subSelected = {}, resetForm: resetFormSub } = formRefSub.current || {}
      const { values: compSelected = {}, resetForm: resetFormCompanies } = formRefComp.current || {}
      /* eslint-enable no-unused-vars */
      if (pds?.productDefinitions?.length) {
        await calculateRows(pds?.productDefinitions, setFieldValue)
      }
      if (tab === 'all') {dispatch({ type: 'refresh' })}
      const { values: newPds } = formRefPDS.current || {}
      const input = calculatePolicy(header, newPds, holders)
      log.debug('input', input)
      let result
      client.writeData({ data: { loading: true } })
      if (stateCode !== 'CHANGED') {
        input.state = {
          code: stateCode === 'TO_POLICY' ? 'ACCEPTED' : stateCode,
          acceptedBy: input?.state?.acceptedBy,
          isPolicy: stateCode === 'TO_POLICY' ? true : undefined,
        }
      }
      let isSame = true
      isSame = comparePolicy(input, policy)
      let toNew = false
      const tablePd = formRefPDS.current
      if (input?.state?.isPolicy) {
        const payFractions = calculatePaymentDates(statePolicy.vehicles, tablePd, statePolicy, header || statePolicy)
        const { payFractionsNorm } = getPayFractionsNorm(payFractions, true, true)
        input.payFractions = payFractionsNorm
        input.endDate = getPolicyEndDate(input.initDate, input.midDate)
      }
      if (statePolicy.number) {
        input.number = statePolicy.number
      }
      if (!['DRAFT', 'ACCEPTED', 'CHANGED'].includes(stateCode)) {
        if (stateCode === 'TO_POLICY') {
          toNew = !input.meta
        } else {
          toNew = (!isSame && !input.meta?.modified) || !Number.isInteger(input.meta?.version)
        }
      }
      if (isNew || toNew) {
        input.meta = {
          offset: gs.offset,
          fromDoc: input._code,
          ...input.meta,
        }
        let dataProducer
        if (me.priority === 4) {
          dataProducer = prodSelected?.producer || input?.producer
        } else {
          dataProducer = subSelected?.subAgent || input?.subAgent || prodSelected?.producer || input?.producer
        }
        if (dataProducer?.father) {
          input.producer = dataProducer?.father
          input.subAgent = dataProducer?.username
          //input.subAgent = subSelected?.subAgent?.username ?? input.subAgent?.username
        } else {
          if (me.priority === 3) {
            input.producer = me.username
            input.subAgent = null
          } else {
            input.producer = dataProducer?.username
            if (input?.subAgent?.father === input.producer && prodSelected?.producer?.username !== input.producer) {
              input.subAgent = input?.subAgent?.username
            } else {
              input.subAgent = null
            }
          }
          //input.subAgent = subSelected?.subAgent?.username ?? input.subAgent?.username
          input.company = compSelected?.company || input?.company
        }
        result = await newPolicy({
          variables: { input },
          update: (cache, { data }) => {
            const isPolicy = data.newPolicy?.state?.isPolicy
            let dataPolicies
            try {
              dataPolicies = cache.readQuery({
                query: POLICIES,
                variables: { origin: isPolicy ? '/policies/list' : '/policies/doclist' },
              })
            } catch (err) {
              log.warn('dataPoliciesCache not present!')
            }
            if (dataPolicies) {
              const fromDoc = data.newPolicy?.meta?.fromDoc
              const version = data.newPolicy?.meta?.version
              const year = data.newPolicy?.meta?.year
              const serie = data.newPolicy?.meta?.serie
              const state = data.newPolicy?.state
              const isRest = ['REST_AGENT', 'REST_QUBO'].includes(state.code)
              let newDataPolicies = dataPolicies.policies
              if (fromDoc && version === 0) {
                newDataPolicies = dataPolicies.policies.filter(pol => pol.id !== fromDoc)
              }
              if (version > 0) {
                const idToFind = (version - 1) ? `${year}_${serie}_${version - 1}` : `${year}_${serie}`
                const found = find(dataPolicies.policies, { id: idToFind })
                if (isRest) {
                  found.meta.toDoc = data.newPolicy.id
                } else {
                  data.newPolicy.children = [{ id: found.id, __typename: 'Policy' }, ...found.children || []]
                  newDataPolicies = newDataPolicies.filter(pol => pol.id !== found.id)
                }
              }
              if (!data?.newPolicy.children) {data.newPolicy.children = null}
              cache.writeQuery({
                query: POLICIES, variables: { origin: isPolicy ? '/policies/list' : '/policies/doclist' }, data: {
                  policies: [filter(POLICIES_FRAGMENT, data?.newPolicy), ...newDataPolicies],
                },
              })
              if (isPolicy) {
                let passingPolicy
                try {
                  passingPolicy = cache.readQuery({
                    query: POLICIES,
                    variables: { origin: '/policies/doclist' },
                  })
                } catch (err) {
                  log.warn('passingPolicy not present!')
                }
                if (fromDoc && version === 0) {
                  cache.writeQuery({
                    query: POLICIES, variables: { origin: '/policies/doclist' }, data: {
                      policies: passingPolicy.policies.filter(pol => pol.id !== fromDoc),
                    },
                  })
                }
              }
            }
          },
        })
      } else {
        if (stateCode === 'DRAFT') {
          let dataProducer
          if (me.priority === 4) {
            dataProducer = prodSelected?.producer
          } else {
            dataProducer = subSelected?.subAgent || prodSelected?.producer || input?.producer
          }
          if (dataProducer?.father) {
            input.producer = dataProducer?.father
            input.subAgent = dataProducer?.username
          } else {
            if (me.priority === 3) {
              input.producer = me.username
              input.subAgent = null
            } else {
              input.producer = dataProducer?.username
              if (input?.subAgent?.father === input.producer && prodSelected?.producer?.username !== input.producer) {
                input.subAgent = input?.subAgent?.username
              } else {
                input.subAgent = null
              }
            }
            //input.subAgent = 'subAgent' in subSelected ? subSelected.subAgent?.username : input.subAgent?.username
            input.company = compSelected?.company || input?.company
          }
        } else {
          input.producer = input?.producer?.username
        }
        const sending = ['TO_QUBO', 'TO_AGENT'].includes(stateCode)
        input.newEvent = (stateCode === 'TO_POLICY' && !input?.state?.isPolicy) || !['ACCEPTED', 'CHANGED'].includes(stateCode)
        if (sending && input.meta) {
          if (input.meta.modified === false) {
            input.state.code = 'ACCEPTED'
          }
          input.meta.modified = false
        }
        result = await editPolicy({
          variables: { input },
          update: (cache, { data }) => {
            const isPolicy = data.editPolicy?.state?.isPolicy
            if (sending) {
              let dataPolicies
              try {
                dataPolicies = cache.readQuery({
                  query: POLICIES,
                  variables: { origin: isPolicy ? '/policies/list' : '/policies/doclist' },
                })
              } catch (err) {
                log.warn('dataPoliciesCache not present!')
              }
              if (dataPolicies) {
                let newDataPolicies = dataPolicies.policies
                const version = data.editPolicy?.meta?.version
                const year = data.editPolicy?.meta?.year
                const serie = data.editPolicy?.meta?.serie
                const idToFind = (version - 1) ? `${year}_${serie}_${version - 1}` : `${year}_${serie}`
                const found = find(dataPolicies.policies, { id: idToFind })
                data.editPolicy.children = [{ id: found.id, __typename: 'Policy' }, ...found.children || []]
                newDataPolicies = newDataPolicies.filter(pol => pol.id !== found.id && pol.id !== data.editPolicy.id)
                cache.writeQuery({
                  query: POLICIES, variables: { origin: isPolicy ? '/policies/list' : '/policies/doclist' }, data: {
                    policies: [filter(POLICIES_FRAGMENT, data?.editPolicy), ...newDataPolicies],
                  },
                })
              }
            } else {
              if (isPolicy) {
                let passingPolicy
                try {
                  passingPolicy = cache.readQuery({
                    query: POLICIES,
                    variables: { origin: '/policies/doclist' },
                  })
                } catch (err) {
                  log.warn('passingPolicy not present!')
                }
                if (passingPolicy) {
                  cache.writeQuery({
                    query: POLICIES, variables: { origin: '/policies/doclist' }, data: {
                      policies: passingPolicy.policies.filter(({ id }) => id !== data.editPolicy?.id),
                    },
                  })
                }
              }
            }
          },
        })
        if (sending || stateCode === 'TO_POLICY') {
          history.push(stateCode === 'TO_POLICY' ? '/policies/list' : '/policies/doclist')
        } else {
          result && enqueueSnackbar('Documento salvato con successo!', { variant: 'success' })
        }
      }
      client.writeData({ data: { loading: false } })
      if ((isNew || toNew) && result) {
        /*  const { data: { newPolicy } } = result
            history.push(`/policies/edit/${newPolicy.id}/all`)*/
        const { data: { newPolicy } } = result
        history.push(newPolicy?.state?.isPolicy ? '/policies/list' : '/policies/doclist')
        /*if (isNew) {
            resetFormHeader && resetFormHeader()
            resetFormPDS && resetFormPDS()
            resetFormHolders && resetFormHolders()
            resetFormProducers && resetFormProducers()
            dispatch({
              type: 'setPolicy', policy: {
                productDefinitions: [],
                regFractions: [],
                vehicles: [],
              },
            })
          }*/
      }
    } catch ({ message }) {
      enqueueSnackbar(message, { variant: 'error' })
    }
  }, [tab, calculatePolicy, client, policy, isNew, dispatch, statePolicy, gs.offset, me.priority, me.username, newPolicy, editPolicy, history, enqueueSnackbar])
  //endregion
  
  const checkPolicy = useCallback(async () => {
    try {
      const { values: header } = formRefHeader.current || {}
      const header_ = formRefHeader?.current?.values || statePolicy
      const { payFractions } = statePolicy
      const lastFract = getLastFraction(payFractions)
      const { values: pds, setFieldValue } = formRefPDS.current || {}
      const { values: holders } = formRefHolders.current || {}
      /* eslint-enable no-unused-vars */
      if (pds?.productDefinitions?.length) {
        await calculateRows(pds?.productDefinitions, setFieldValue)
      }
      //if (tab === 'all') {dispatch({ type: 'refresh' })}
      const { values: newPds } = formRefPDS.current || {}
      const tablePd = formRefPDS.current
      const input = calculateEmittedPolicy(newPds, header, tablePd, header_, holders)
      if (lastFract > 0 && !input?.paidFractions?.[lastFract] && me.priority === 4) {
        enqueueSnackbar('L\'ultima rata non è stata pagata!', { variant: 'error' })
        return 'BLOCKED'
      }
    } catch ({ message }) {
      enqueueSnackbar(message, { variant: 'error' })
      return 'BLOCKED'
    }
  }, [calculateEmittedPolicy, enqueueSnackbar, me.priority, statePolicy])
  
  //region HANDLE POLICY SAVE
  const handlePolicySave = useCallback(async () => {
    try { //const stateCode = event.currentTarget.name || 'CHANGED'
      /* eslint-disable no-unused-vars */
      const { values: header } = formRefHeader.current || {}
      const header_ = formRefHeader?.current?.values || statePolicy
      const { payFractions } = statePolicy
      const lastFract = getLastFraction(payFractions)
      const { values: pds, setFieldValue } = formRefPDS.current || {}
      const { values: holders } = formRefHolders.current || {}
      /* eslint-enable no-unused-vars */
      if (pds?.productDefinitions?.length) {
        await calculateRows(pds?.productDefinitions, setFieldValue)
      }
      //if (tab === 'all') {dispatch({ type: 'refresh' })}
      const { values: newPds } = formRefPDS.current || {}
      const tablePd = formRefPDS.current
      const input = calculateEmittedPolicy(newPds, header, tablePd, header_, holders)
      if (lastFract > 0 && !input?.paidFractions?.[lastFract] && me.priority === 4) {
        return enqueueSnackbar('L\'ultima rata non è stata pagata, salvataggio non effettuato!', { variant: 'error' })
      }
      input.endDate = getPolicyEndDate(input.initDate, input.midDate)
      log.debug('input', input)
      let result
      client.writeData({ data: { loading: true } })
      result = await editPolicy({
        variables: { input },
      })
      result && enqueueSnackbar('Documento salvato con successo!', { variant: 'success' })
      result && dispatch({ type: 'setCas', _cas: result.data.editPolicy._cas })
      client.writeData({ data: { loading: false } })
    } catch ({ message }) {
      enqueueSnackbar(message, { variant: 'error' })
    }
  }, [calculateEmittedPolicy, client, dispatch, editPolicy, enqueueSnackbar, me.priority, statePolicy])
  //endregion
  
  //region POLICY UPLOAD
  const handlePolicyUpload = useCallback(
    async files => {
      if (!files.length) {return}
      const { values: header } = formRefHeader.current || {}
      const { values: pds } = formRefPDS.current || {}
      const { values: holders } = formRefHolders.current || {}
      const productDefinitions = pds ? getProductDefinitions(pds) : getProductDefinitions({ productDefinitions: statePolicy.productDefinitions })
      /*   const duplicatedPDS = cFunctions.checkDuplicate(productDefinitions, comparator)
                    console.log('duplicatedPDS:', duplicatedPDS)*/
      const _code = getPolicyCode(statePolicy, header, isNew)
      const [signer = {}, ...cosigners] = holders?.holders ?? statePolicy.holders
      const collaborators = holders?.collaborators ?? statePolicy.collaborators
      const createdBy = statePolicy?.createdBy?.username ?? me.username
      const producer = statePolicy?.producer?.username
      const subAgent = statePolicy?.subAgent?.username
      const endDate = cFunctions.calcPolicyEndDate(statePolicy?.initDate, statePolicy?.midDate)
      const isPolicy = statePolicy?.state?.isPolicy
      const out = {
        ...statePolicy,
        ...header,
        _code,
        attachments: { files: statePolicy.attachments },
        producer,
        productDefinitions,
        createdBy,
        collaborators,
        cosigners,
        holders: undefined,
        regFractions: [],
        signer,
        subAgent,
        vehicles: isPolicy ? statePolicy.vehicles : [], //se non policy sovrascrivo sempre tutto
      }
      out.number = out.number ? out.number : out._code
      const [file] = files
      log.info(file)
      client.writeData({ data: { loading: true } })
      const { data } = await uploadFile({
        variables: {
          input: {
            file,
            policy: filter(POLICY_SAVE_FRAGMENT, out),
            endDate,
          },
        },
      })
      client.writeData({ data: { loading: false } })
      const { policy, errors } = data.uploadFile
      log.debug('policyUP:', policy)
      if (isPolicy) {
        dispatch({ type: 'appendVehicles', vehicles: policy.vehicles }) //append vehicles
      } else {
        dispatch({ type: 'setVehicles', vehicles: policy.vehicles })
      }
      setUploadErrors(errors)
      setUploadMode('list')
    },
    [client, dispatch, isNew, me.username, statePolicy, uploadFile]
  )
  
  //endregion
  
  const generateDates = useCallback(() => {
    const header = formRefHeader?.current?.values || statePolicy
    const tablePd = formRefPDS.current
    const vehicles = statePolicy.vehicles
    const payFractions = calculatePaymentDates(vehicles, tablePd, statePolicy, header)
    return payFractions
  }, [statePolicy])
  
  const generateRegDates = useCallback(() => {
    const { values: header, setFieldValue } = formRefHeader.current || {}
    const fractions = statePolicy.regFractions
    const paymentFract = header?.paymentFract || statePolicy.paymentFract
    const regulationFract = header?.regulationFract || statePolicy.regulationFract
    const isRecalculateFraction = header?.isRecalculateFraction || statePolicy.isRecalculateFraction
    let regFractions
    if (regulationFract !== paymentFract && isRecalculateFraction !== 'NO') {
      setFieldValue('isRecalculateFraction', 'NO')
      regFractions = cFunctions.calculateRegulationDates(fractions, header, 'NO')
    } else {
      regFractions = cFunctions.calculateRegulationDates(fractions, header, isRecalculateFraction)
    }
    dispatch({ type: 'setRegFractions', regFractions })
  }, [dispatch, statePolicy.isRecalculateFraction, statePolicy.paymentFract, statePolicy.regFractions, statePolicy.regulationFract])
  
  const setPaidFractions = useCallback((index, val) => {
    const paidFraction = { index, val }
    dispatch({ type: 'setPaidFractions', paidFraction })
  }, [dispatch])
  
  const tabs = [
    { value: 'holders', label: 'Anagrafica Intestatari' },
    { value: 'header', label: 'Intestazione' },
    { value: 'attachments', label: 'Allegati' },
    { value: 'products', label: 'Prodotti' },
    { value: 'vehicles', label: 'Veicoli' },
  ]
  if (tab && !find([...tabs, { value: 'all' }], { value: tab })) {
    return <Error404/>
  }
  return (
    <div className={clsx(classes.divRoot, classes.policyDetails)}>
      <Header
        _code={statePolicy.id}
        calledDiff={calledDiff}
        company={statePolicy.company}
        dispatch={dispatch}
        formRefComp={formRefComp}
        formRefProd={formRefProd}
        formRefSub={formRefSub}
        handleModeChange={handleModeChange}
        handlePolicySave={handlePolicySave}
        handlePrint={handlePrint}
        handleSave={handleSave}
        loadDiff={loadDiff}
        loadingDiff={loadingDiff}
        meta={statePolicy.meta}
        number={statePolicy.number}
        producer={producer}
        setOpenDiff={setOpenDiff}
        setProducer={setProducer}
        setSubAgent={setSubAgent}
        state={statePolicy.state}
        subAgent={subAgent}
        formRefHolders={formRefHolders}
        top={statePolicy.top}
      />
      <PolicyHolderInsertModal
        activities={gs.activities}
        dispatch={dispatchInsertModal}
        formRefHolders={formRefHolders}
        index={stateInsertModal.index}
        key={`insertModalForm${stateInsertModal.index}`}
        open={stateInsertModal.open}
      />
      <Divider/>
      <ErrorsNotification errors={uploadErrors} handleClose={handleUploadClose} open={!!uploadErrors.length}/>
      {
        !loadingDiff && calledDiff &&
        <DiffNotification differences={dataDiff?.differences} open={openDiff} setOpenDiff={setOpenDiff}/>
      }
      <div className={classes.results}>
        <div className={classes.inner}>
          {
            tab !== 'all' &&
            <>
              <Tabs
                className={classes.tabs}
                onChange={handleModeChange}
                scrollButtons="auto"
                value={tab}
                variant="scrollable"
              >
                {
                  tabs.map(tab => (
                    <Tab
                      disableFocusRipple
                      key={tab.value}
                      label={tab.label}
                      value={tab.value}
                    />
                  ))
                }
              </Tabs>
              <Divider className={classes.divider}/>
            </>
          }
          {
            (tab === 'all' || tab === 'holders') &&
            <PolicyHolders
              collaborators={statePolicy.collaborators}
              dispatch={dispatchInsertModal}
              globalClass={classes}
              holders={statePolicy.holders}
              innerRef={formRefHolders}
              isPolicy={statePolicy?.state?.isPolicy}
              parent={subAgent || producer}
            />
          }
          {
            (tab === 'all' || tab === 'attachments') &&
            <PolicyAttachments
              attachments={statePolicy.attachments}
              dispatch={dispatch}
              globalClass={classes}
            />
          }
          {
            (tab === 'all' || tab === 'header') &&
            <PolicyHeader
              _code={statePolicy.id}
              checkPolicy={checkPolicy}
              consolidatePolicy={consolidatePolicy}
              dispatch={dispatch}
              generateDates={generateDates}
              generateRegDates={generateRegDates}
              globalClass={classes}
              handlePrint={handlePrint}
              initDate={statePolicy.initDate}
              innerRef={formRefHeader}
              isNew={!!isNew}
              isPolicy={statePolicy?.state?.isPolicy}
              isRecalculateFraction={statePolicy.isRecalculateFraction}
              midDate={statePolicy.midDate}
              notes={statePolicy.notes}
              number={statePolicy.number}
              paidFractions={statePolicy.paidFractions}
              payFractionsDef={statePolicy.payFractions}
              paymentFract={statePolicy.paymentFract}
              priority={me.priority}
              regFractions={statePolicy.regFractions}
              regulationFract={statePolicy.regulationFract}
              setPaidFractions={setPaidFractions}
            />
          }
          {
            (tab === 'all' || tab === 'products') &&
            <PolicyProductDefinition
              coverageTypes={gs.coverageTypes}
              dispatch={dispatch}
              globalClass={classes}
              innerRef={formRefPDS}
              isPolicy={statePolicy?.state?.isPolicy}
              productDefinitions={statePolicy.productDefinitions}
              specialArrangements={statePolicy.specialArrangements}
              vehicleTypes={gs.vehicleTypes}
            />
          }
          {
            (tab === 'all' || tab === 'vehicles') &&
            <PolicyVehicles
              checkPolicy={checkPolicy}
              dispatch={dispatch}
              formRefHeader={formRefHeader}
              globalClass={classes}
              handleApplicationZip={handleApplicationZip}
              handleExport={handleExport}
              handleExportTotal={handleExportTotal}
              handleModeChange={handleVehiclesModeChange}
              handlePrint={handlePrintEmittedPolicy}
              handleUpload={handlePolicyUpload}
              mode={uploadMode}
              policy={statePolicy}
              priority={me.priority}
              tablePd={formRefPDS.current}
              vehicleTypes={gs.vehicleTypes}
            />
          }
        </div>
      </div>
    </div>
  )
}

Policy.propTypes = {
  enqueueSnackbar: PropTypes.any,
}

Policy = compose(
  withSnackbar
)(Policy)

export default compose(
  withSnackbar
)(Main)
