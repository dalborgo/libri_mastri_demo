import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'
import CircularProgress from '@material-ui/core/CircularProgress'
import { Box, makeStyles, Typography } from '@material-ui/core'
import { getGenias } from '../../../../utils/axios'
import { COMPANY } from './constants'
import { isEmpty } from 'lodash'
import log from '@adapter/common/src/log'
import {
  extractYearAndNumber,
  getCodVehicleByKey,
  getFract,
  getInsuranceTypeCode,
  getRegulationFlags,
  getVehicleUseCode,
  getWeight,
} from './helpers'
import { cDate, cFunctions, numeric } from '@adapter/common'
import { useApolloClient } from '@apollo/react-hooks'
import {
  calculateIsRecalculatePaymentTable,
  calculatePaymentTable,
  calculatePrizeTable,
  getProdDefinition,
} from '../../../../helpers'

const useStyles = makeStyles(theme => ({
  dialogActions: {
    padding: theme.spacing(0.8, 2),
  },
  dialogTitle: {
    padding: theme.spacing(1.3, 2),
  },
  dialogContent: {
    padding: theme.spacing(2, 2, 1),
    minHeight: 150,
    minWidth: 300,
  },
}))

function roundUpToTwoDecimals (value) {
  return Math.round(value * 100) / 100
}

const EXIT_MODE = {
  VENDITA: 1,
  REIMMATRICOLAZIONE: 2,
  'FURTO TOTALE': 3,
  ALTRO: 4,
  'SCADENZA POLIZZA': 5,
  'DEMOLIZIONE/ESPORTAZIONE': 6,
  'MODIFICA PROPRIETARIO': 7,
}

function getDotazione (state) {
  if (state === 'ACTIVE') {
    return 'STATO DI RISCHIO'
  }
  if (['ADDED', 'ADDED_CONFIRMED'].includes(state)) {
    return 'INCLUSIONE'
  }
  return 'ESCLUSIONE'
}

/* eslint-disable multiline-ternary */
function formatCoverages (vehicle, prodDef) {
  let parts = []
  // Sempre presente
  if (prodDef.conditions) {
    parts.push(`Scoperti e Franchigie\n${prodDef.conditions}`)
  } else {
    parts.push(`Scoperti e Franchigie\nScoperto ${numeric.printDecimal(prodDef.overdraft)} % min. € ${numeric.printDecimal(prodDef.excess)}`)
  }
  
  // Solo se SI
  if (vehicle.hasGlass === 'SI') {
    if (prodDef.statements) {
      parts.push(`Garanzia Cristalli\n${prodDef.statements}`)
    } else {
      parts.push(`Garanzia Cristalli\nArt. II.1. Cristalli con Massimale di € ${numeric.printDecimal(prodDef.glassCap)} per sinistro e per periodo assicurativo - Franchigia € 150,00 (Nessuna franchigia per riparazione in rete convenzionata)`)
    }
  }
  
  // Solo se SI
  if (vehicle.hasTowing === 'SI') {
    if (prodDef.statementsTowing) {
      parts.push(`Garanzia Traino\n${prodDef.statementsTowing}`)
    } else {
      parts.push('Garanzia Traino\nArt.II.2. Traino fino alla sede dell’Assicurato con Massimale di EUR 5.000')
    }
  }
  
  return parts.join('\n\n')
}

/* eslint-enable multiline-ternary */
export function createApplicationList (vehicle, tablePd, policy, header, list, numInterno, initDate, endDate, vehicleTypes, codClient, codCosigner, counter, maxAllianz) {
  const leasingExpiry = cDate.mom(vehicle['leasingExpiry'], null, 'YYYY-MM-DD')
  const finishDate = cDate.mom(vehicle['finishDate'], null, 'YYYY-MM-DD')
  const startDate = cDate.mom(vehicle['startDate'], null, 'YYYY-MM-DD')
  const dtPrimaimmatricolazione = vehicle['registrationDate'] ? cDate.mom(vehicle['registrationDate'], null, 'YYYY-MM-DD') + 'T00:00:00' : ''
  const prodDef = getProdDefinition(tablePd, policy, vehicle)
  const useVehicle = getVehicleUseCode(vehicle)
  const priceNet = calculatePrizeTable(tablePd, policy, vehicle, true)
  const rateo = calculatePaymentTable(tablePd, policy, vehicle, true, true)
  const payment = rateo['payment']
  const rateoNet = rateo['rateoNet']
  const glassNet = rateo['glassNet']
  const towingNet = rateo['towingNet']
  const days = rateo['days']
  const dotazione = getDotazione(vehicle['state'])
  let paymentNet
  {
    const isRecalculateFraction = header?.isRecalculateFraction || policy.isRecalculateFraction
    if (isRecalculateFraction === 'SI') {
      paymentNet = calculateIsRecalculatePaymentTable(tablePd, policy, vehicle, true)
    } else {
      paymentNet = calculatePaymentTable(tablePd, policy, vehicle, true)
    }
  }
  const taxRate = numeric.normNumb(prodDef['taxRate']) / 1000
  //const glass = numeric.normNumb(prodDef['glass']) / 1000
  //const towing = numeric.normNumb(prodDef['towing']) / 1000
  const glassCap = numeric.normNumb(prodDef['glassCap']) / 1000
  //const glassNet = vehicle['hasGlass'] === 'SI' ? glass / (1 + taxRate / 100) : 0
  //const towingNet = vehicle['hasTowing'] === 'SI' ? towing / (1 + taxRate / 100) : 0
  //const priceFull = dotazione === 'ESCLUSIONE' ? payment : payment * (1 + taxRate / 100)
  const priceFull = payment * (1 + taxRate / 100)
  const listaAccessoriApplicazioneLM = []
  if (vehicle['hasGlass'] === 'SI') {
    listaAccessoriApplicazioneLM.push({
      accessorio_premio: roundUpToTwoDecimals(glassNet),
      accessorio_valore: roundUpToTwoDecimals(glassCap),
      accessorio_tasso: 0.0,
      accessorio_franchigia: '0',
      cod_accessorio: 28,
      ord_accessorio: 1,
      accessorio_descrizione: 'GARANZIA CRISTALLI',
    })
  }
  if (vehicle['hasTowing'] === 'SI') {
    listaAccessoriApplicazioneLM.push({
      accessorio_premio: roundUpToTwoDecimals(towingNet),
      accessorio_franchigia: '0',
      accessorio_valore: 0,
      accessorio_tasso: 0.0,
      cod_accessorio: 65,
      ord_accessorio: 2,
      accessorio_descrizione: 'TRAINO FINO A SEDE',
    })
  }
  const allianzCode = vehicle.allianzCounter ? dotazione === 'ESCLUSIONE' ? vehicle.allianzCounter : Math.max(maxAllianz, vehicle.allianzCounter || 0) : undefined
  const endDate_ = endDate ? endDate + 'T00:00:00' : ''
  const finishDate_ = vehicle['finishDate'] ? finishDate + 'T00:00:00' : endDate_
  const startDate_ = vehicle['startDate'] ? startDate + 'T00:00:00' : header['initDate'] ? initDate + 'T00:00:00' : ''
  const dtIngresso = dotazione === 'ESCLUSIONE' ? finishDate_ : startDate_
  const dtUscita = dotazione === 'ESCLUSIONE' ? endDate_ : finishDate_
  const days_ = dotazione === 'ESCLUSIONE' ? cFunctions.myDays360New(vehicle['finishDate'], endDate) : days
  list.push({
    //cod_lm: 8,
    annotazioni: formatCoverages(vehicle, prodDef) + (vehicle['custom'] ? '\n' + vehicle['custom'] : ''),
    classe_merito: String(days_),
    state: vehicle['state'],
    cod_applicazione: allianzCode || vehicle['inPolicy'] || counter,
    codiceApplicazione: allianzCode || vehicle['inPolicy'] || counter,
    tipo_operazione: 2,
    num_compagnia: policy['numPolizzaCompagnia'] || undefined,
    num_interno: allianzCode || vehicle['inPolicy'], //numInterno,
    cod_motivouscita: EXIT_MODE[vehicle['exclusionType']] || 5, // da implementare per esclusione
    dt_ingresso: dtIngresso,
    dt_uscita: dtUscita,
    dotazione,
    cod_tipoveicolo: getCodVehicleByKey(vehicleTypes, vehicle['vehicleType']),
    modello: `${vehicle['brand']};${vehicle['model']}`,
    targa: vehicle['licensePlate'].replace(/\./g, ''),
    dt_primaimmatricolazione: dtPrimaimmatricolazione,
    massimale: `${numeric.normNumb(vehicle['value']) / 1000};${vehicle['vatIncluded'] === 'SI' ? 'COMPRESO IVA' : 'NETTO IVA'}`,
    cod_assicurato: codCosigner?.find(cl => cl.partita_iva === vehicle['owner'] || cl.codice_fiscale === vehicle['owner'])?.['cod_cliente'] || codClient,
    flag_pejus: true,
    flag_rimorchio: false,
    perc_pejus: prodDef['overdraft'],
    franchigia: prodDef['excess'],
    ente_vincolante: vehicle['leasingCompany'],
    dt_scadenzavincolo: vehicle['leasingExpiry'] ? leasingExpiry + 'T00:00:00' : '',
    cod_utilizzoveicolo: useVehicle['cod_utilizzoveicolo'],
    ...getWeight(vehicle['vehicleType'], vehicle['weight']),
    cod_tipokasko: getInsuranceTypeCode(prodDef['coverageType']), //da implementare
    netto: roundUpToTwoDecimals(rateoNet),
    tasse_ARD_tasso: 13.5,
    tasse_ARD_premio: roundUpToTwoDecimals(roundUpToTwoDecimals(priceFull) - roundUpToTwoDecimals(payment)),
    totale_premio_senzatasse: roundUpToTwoDecimals(payment),
    totale_premio_lordo: roundUpToTwoDecimals(priceFull),
    rateo_netto: roundUpToTwoDecimals(paymentNet),
    lista_accessoriApplicazioneLM: listaAccessoriApplicazioneLM,
  })
}

function getPolizzaEndpoint (typeId) {
  switch (typeId) {
    case 'APPLICATION': {
      return {
        display: 'Applicazione',
        url: 'genias/polizza/create_application',
      }
    }
    case 'REGISTRY': {
      return {
        display: 'Anagrafica',
        url: 'genias/polizza/create_registry',
      }
    }
    default: {
      return {
        display: 'Polizza',
        url: 'genias/polizza/create',
      }
    }
  }
}

export default function ConfirmDialog ({ state, setState }) {
  console.log('state:', state)
  const classes = useStyles()
  const [remoteValues, setRemoteValues] = useState({})
  const client = useApolloClient()
  const [errors, setErrors] = useState([])
  const [loading, setLoading] = useState(false)
  const handleClose = useCallback(() => {
    setState({ open: false })
    setErrors([])
  }, [setState])
  const policy = state['currentValues']?.statePolicy
  const tablePd = state['currentValues']?.tablePd
  const { values: valuesTPd } = tablePd || {}
  console.log('valuesTPd:', valuesTPd)
  const productDefinitions = valuesTPd ? valuesTPd?.productDefinitions : policy?.productDefinitions
  console.log('productDefinitions:', productDefinitions)
  const [signer = {}, ...cosigners] = state['currentValues']?.holders?.holders ?? []
  const header = state['currentValues']?.header ?? {}
  const ID = state['currentValues']?.ID ?? ''
  const currentLicensePlate = state['currentValues']?.licensePlate ?? ''
  const currentState = state['currentValues']?.vehicleState ?? ''
  const isApplication = ID === 'APPLICATION'
  const vehicleTypes = state['currentValues']?.vehicleTypes ?? []
  const prodSelected = state['currentValues']?.prodSelected ?? {}
  const currentHolder = state['currentValues']?.currentHolder ?? {}
  console.log('prodSelected:', prodSelected)
  console.log('state[currentValues]:', state['currentValues'])
  const regFractions = policy?.regFractions ?? []
  const provvPassive = numeric.normNumb(prodSelected?.['provvigioni']?.passive) / 1000
  const provvAttive = numeric.normNumb(prodSelected?.['provvigioni']?.attive) / 1000
  const codiceTipoProvv = prodSelected?.['provvigioni']?.codice ?? 0
  //const statePolicy = policy ?? {}
  const payFractions = state['currentValues']?.payFractions || []
  const vehicles = policy?.vehicles || []
  const producer = remoteValues?.['producer']
  console.log('prodSelected:', prodSelected)
  const producerVat = prodSelected.producer?.vat || ''
  const signerVat = signer?.id || ''
  const cosignerVat = cosigners.map(row => row.id)
  const initDate = cDate.mom(header['initDate'], null, 'YYYY-MM-DD')
  const codClient = remoteValues?.['signer']?.['cod_cliente']
  const codCosigner = remoteValues?.['cosigners']
  const numInterno = extractYearAndNumber(policy?.['number'])?.['match']
  const endDate = cFunctions.calcPolicyEndDate(header['initDate'], header['midDate'])
  const [numVehicles, massimale, applicazioni] = useMemo(() => {
    const list = []
    let massimale = 0, counter = 1
    let maxAllianz = 0
    for (let vehicle of vehicles) {
      maxAllianz = Math.max(maxAllianz, vehicle.allianzCounter || 0)
    }
    for (let vehicle of vehicles) {
      if (['DELETED_CONFIRMED', 'ADDED_CONFIRMED', 'ACTIVE'].includes(vehicle['state']) && isApplication) {
        continue
      }
      if (currentLicensePlate && (currentLicensePlate !== vehicle['licensePlate'] || currentState !== vehicle['state'])) {
        continue
      }
      //sumPrize += calculatePrizeTable(state['currentValues']?.tablePd, statePolicy, vehicle, true)
      massimale += vehicle.value
      createApplicationList(vehicle, tablePd, policy, header, list, numInterno, initDate, endDate, vehicleTypes, codClient, codCosigner, counter, maxAllianz)
      counter++
    }
    return [vehicles.length, massimale, list]
  }, [codClient, codCosigner, currentLicensePlate, currentState, endDate, header, initDate, isApplication, numInterno, policy, tablePd, vehicleTypes, vehicles])
  const specialArrangements = valuesTPd?.specialArrangements || ''
  //const total = getTotal(payFractions, header['midDate'])
  
  let nettoPremioRatefuture = 0.0000, tassePremioRatefuture = 0.0000, dtPrimoquietanzamento = '', nettoPremioFirma = 0,
    tassePremioFirma = 0, daysFirma = 0, daysFuture = 0
  if (payFractions.length) {
    console.log('payFractions:', payFractions)
    nettoPremioRatefuture = payFractions[payFractions.length - 1].taxable
    tassePremioRatefuture = payFractions[payFractions.length - 1].tax
    daysFuture = payFractions[payFractions.length - 1].daysDiff
    dtPrimoquietanzamento = payFractions[1] ? payFractions[1].date + 'T00:00:00' : endDate + 'T00:00:00'
    if (header['midDate']) {
      nettoPremioFirma += payFractions[0].taxable
      tassePremioFirma += payFractions[0].tax
      daysFirma += payFractions[0].daysDiff
    } else {
      nettoPremioFirma = payFractions[1] ? payFractions[1].taxable : payFractions[0].taxable
      tassePremioFirma = payFractions[1] ? payFractions[1].tax : payFractions[0].tax
      daysFirma = payFractions[1] ? payFractions[1].daysDiff : payFractions[0].daysDiff
    }
  }
  console.log('remoteValues:', remoteValues)
  const numStatusPolizzaSostituita = remoteValues?.previousPolicy?.['num_status']
  console.log('numStatusPolizzaSostituita:', numStatusPolizzaSostituita)
  const body = useMemo(() => {
    return {
      producer,
      currentHolder,
      statusCode: policy?.statusCode,
      applicazioni,
      lista_compagnie: [
        {
          ...COMPANY,
          provvigione_attiva: {
            netto_percentprovvincric: provvAttive,
            netto_percentprovvincric_ratefuture: provvAttive,
            totale_provvigione_firma: roundUpToTwoDecimals((nettoPremioFirma * provvAttive / 100)),
            totale_provvigione_ratefuture: roundUpToTwoDecimals((nettoPremioFirma * provvAttive / 100)),
          },
        },
      ],
      lista_simpli_polizza: [{
        dt_giacenza: header['initDate'] ? initDate + 'T00:00:00' : '',
        cod_giacenza: 9,
      }],
      cod_cliente: codClient,
      tipo_operazione: numStatusPolizzaSostituita ? 11 : 2, //2 creazione 11 rinnovo
      numPolizzaIterno: numInterno,
      flag_polizzaincarico: true,
      flag_polizzasoggettaregolazione: true,
      flag_polizzaindicizzata: false,
      flag_norichiestapremio: false,
      flag_pagatodiretto: false,
      cod_pacchetto: 26,
      cod_tiposcadenza: 4,
      cod_frazionamento: getFract(remoteValues?.paymentFract, header['paymentFract']),
      dt_emissione: header['initDate'] ? initDate + 'T00:00:00' : '', //solo se è un rinnovo
      dt_effetto: header['initDate'] ? initDate + 'T00:00:00' : '',
      dt_scadenza: endDate ? endDate + 'T00:00:00' : '',
      dtScadenzaOra: '24:00',
      dtEffettoOra: '24:00',
      cod_valuta: 1,
      accordi_speciali: specialArrangements,
      targa: 'LIBRO MATRICOLA',
      flag_in_lavorazione: false,
      cod_modalitarinnovo: header?.['renewMode'] && header?.['renewMode'] !== '0' ? parseInt(header?.['renewMode']) : undefined,
      massimale: roundUpToTwoDecimals(massimale), //4550500.000
      numero_veicoli: numVehicles,
      //num_polizza_precedente: 296820000,
      num_status_polizzaSostituita: numStatusPolizzaSostituita, //in caso di rinnovo
      competenzaQ: Number(initDate?.slice(0, 4)), // in caso di ratino
      dt_primoquietanzamento: dtPrimoquietanzamento, //'2025-01-31T00:00:00',
      giorni_moraquietanze: 15,
      giorni_morasostituzione: 15,
      premio: {
        altro_premio_firma: 0.0000,
        altro_premio_ratefuture: 0.0000,
        ssn_premio_firma: 0.0000,
        ssn_premio_ratefuture: 0.0000,
        netto_premio_ratefuture: roundUpToTwoDecimals(nettoPremioRatefuture),
        tasse_premio_ratefuture: roundUpToTwoDecimals(tassePremioRatefuture),
        totale_premio_ratefuture: roundUpToTwoDecimals(roundUpToTwoDecimals(nettoPremioRatefuture) + roundUpToTwoDecimals(tassePremioRatefuture)),
        netto_premio_firma: roundUpToTwoDecimals(nettoPremioFirma), //11695.656,//total['totTaxable'],
        tasse_premio_firma: roundUpToTwoDecimals(tassePremioFirma),//1578.91, //total['totTax'],
        totale_premio_firma: roundUpToTwoDecimals(roundUpToTwoDecimals(nettoPremioFirma) + roundUpToTwoDecimals(tassePremioFirma)),
        totale_descrizione: daysFirma + ';' + daysFuture,
      },
      spese_commissione: {
        cod_spesacommissione: 0,
        importo: 0,
      },
      lista_provvigioni_passive: [{
        cod_produttore: producer?.['cod_produttore'],
        cod_tipoprovvigione: codiceTipoProvv,
        flag_forzatura_firma: true,
        flag_forzatura_ratefuture: true,
        totale_percentprovvincric: provvPassive,
        totale_percentprovvincric_ratefuture: provvPassive,
        totale_provvigione_firma: roundUpToTwoDecimals((nettoPremioFirma * provvPassive / 100)),
        totale_provvigione_ratefuture: roundUpToTwoDecimals((nettoPremioFirma * provvPassive / 100)),
      }],
      ...getRegulationFlags(regFractions),
    }
  }, [applicazioni, codClient, codiceTipoProvv, currentHolder, daysFirma, daysFuture, dtPrimoquietanzamento, endDate, header, initDate, massimale, nettoPremioFirma, nettoPremioRatefuture, numInterno, numStatusPolizzaSostituita, numVehicles, policy, producer, provvAttive, provvPassive, regFractions, remoteValues, specialArrangements, tassePremioFirma, tassePremioRatefuture])
  const onEmit = useCallback(async () => {
    client.writeData({ data: { loading: true } })
    try {
      const { ok, message, results, errors } = await getGenias(
        getPolizzaEndpoint(ID)?.url,
        body
      )
      if (ok) {
        await state.save(results, handleClose)
      } else {
        log.error('genias errors:', message)
        const errors_ = []
        for (let key in errors) {
          const val = errors[key]
          key && errors_.push(val[0])
        }
        setErrors(errors_)
        //await state.save(errors)
      }
    } catch (error) {
      setRemoteValues({ ok: false, message: error.message })
    } finally {
      client.writeData({ data: { loading: false } })
    }
  }, [ID, body, client, handleClose, state])
  useEffect(() => {
    async function fetchData () {
      setLoading(true)
      try {
        const { ok, message, results } = await getGenias(
          'genias/get_all',
          {
            partita_iva_producer: producerVat,
            partita_iva_signer: signerVat,
            partita_iva_cosigners: cosignerVat,
            num_prev_polizza: extractYearAndNumber(header['number'])?.['previous'],
            numPolizzaCompagnia: policy['numPolizzaCompagnia'],
          }
        )
        if (!ok) {
          setRemoteValues({ ok, message })
        } else {
          const [signer] = results['signer'] || []
          const cosigners = results['cosigners'] || []
          const paymentFract = results['paymentFract'] || []
          const [producer] = results['producer'] || []
          const [previousPolicy] = results['previous'] || []
          const errors_ = []
          console.log('cosigners:', cosigners)
          console.log('cosigners:', cosigners)
          if (ID !== 'REGISTRY') {
            if (!signer) {
              errors_.push(`Partita IVA contraente non trovata [${signerVat}]`)
              setErrors(errors_)
            }
            if (cosignerVat.length > cosigners.length) {
              const missing = cosignerVat.filter(vat => {
                return !cosigners.some(cosigner => {
                  return cosigner.partita_iva === vat || cosigner.codice_fiscale === vat
                })
              })
              if (missing.length > 0) {
                errors_.push(`Partita IVA assicurato non trovata [${missing.join(', ')}]`)
                setErrors(errors_)
              }
            }
          }
          if (ID === 'REGISTRY') {
            if (signer && currentHolder.isMain) {
              errors_.push(`Partita IVA contraente già presente [${currentHolder.id}]`)
              setErrors(errors_)
            }
            if (!currentHolder.isMain &&
                (cosigners.map(row => row.codice_fiscale).includes(currentHolder.id) || cosigners.map(row => row.partita_iva).includes(currentHolder.id))
            ) {
              errors_.push(`Partita IVA assicurato già presente [${currentHolder.id}]`)
              setErrors(errors_)
            }
          }
          setRemoteValues({ ...remoteValues, signer, cosigners, paymentFract, producer, previousPolicy })
        }
      } catch (error) {
        setRemoteValues({ ok: false, message: error.message })
      } finally {
        setLoading(false)
      }
    }
    
    if (signer && !isEmpty(signer)) {
      fetchData().then()
    }
    // eslint-disable-next-line
  }, [signer, producerVat, signerVat]) // no remoteValues
  return (
    <Dialog
      aria-describedby="scroll-confirm-dialog-description"
      aria-labelledby="scroll-confirm-dialog-title"
      maxWidth="lg"
      onClose={handleClose}
      open={state.open}
      scroll="paper"
      transitionDuration={
        {
          exit: 0,
        }
      }
    >
      <DialogTitle className={classes.dialogTitle} disableTypography id="scroll-confirm-dialog-title">
        <Typography variant="h5">
          Revisiona {getPolizzaEndpoint(ID)?.display}
        </Typography>
      </DialogTitle>
      <DialogContent className={classes.dialogContent} dividers>
        {
          loading ? (
            <Box alignItems="center" display="flex" justifyContent="center">
              <CircularProgress/>
            </Box>
          ) : (
            <Box display="flex">
              {
                Boolean(errors.length) ?
                  <Box>
                    {
                      errors.map((error, index) => (
                        <Typography color="error" key={index} variant="body2">
                          {error}
                        </Typography>
                      ))
                    }
                  </Box>
                  :
                  <>
                    <pre>
                      {JSON.stringify(signer, null, 2)}
                      {JSON.stringify(cosigners, null, 2)}
                    </pre>
                    <pre>
                      {JSON.stringify(remoteValues, null, 2)}
                    </pre>
                    <pre>
                      {
                        JSON.stringify(body, null, 2)
                      }
                    </pre>
                  </>
                
              }
            </Box>
          )
        }
      </DialogContent>
      <DialogActions className={classes.dialogActions}>
        <Button color="default" onClick={handleClose} size="small">
          Annulla
        </Button>
        {
          !errors.length &&
          <Button color="secondary" disabled={loading} onClick={onEmit} size="small">
            Invia a Genias
          </Button>
        }
      </DialogActions>
    </Dialog>
  )
}
