import React, { useCallback, useRef, useState } from 'react'
import { makeStyles } from '@material-ui/styles'
import PropTypes from 'prop-types'
import { Page } from 'components'
import { Header } from './components'
import { withSnackbar } from 'notistack'
import compose from 'lodash/fp/compose'
import { bdxQuery } from 'utils/axios'
import { Button, FormControlLabel, FormGroup, Grid, Switch, Typography } from '@material-ui/core'
import ExcelJS from 'exceljs'
import saveAs from 'file-saver'
import { cDate, cFunctions, numeric } from '@adapter/common'
import { calculatePrizeTable, getPolicyEndDate } from '../../helpers'
import { initPolicy } from '../Policy/helpers'
import numberToLetter from 'number-to-letter'
import BdxForm from './components/BdxForm'
import find from 'lodash/find'
import moment from 'moment'

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(3),
  },
  results: {
    marginTop: theme.spacing(3),
  },
}))

const taxRate = 13.5
const size10 = { font: { size: '10' } }
const bold = { font: { bold: true, size: '10' } }
const noBold = { font: { bold: false, size: '10' } }
const right = { alignment: { horizontal: 'right' } }
const lightGray = { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '969696' } } }
const cyan = { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'CCFFFF' } } }
const fontWhite = { font: { color: { argb: 'FFFFFF' }, bold: true, size: '10' } }
const fontRed = { font: { color: { argb: 'FF0000' }, size: '10' } }
const fontGreen = { font: { color: { argb: '008000' }, size: '10' } }
const border = {
  top: { style: 'thin', color: { argb: '000000' } },
  left: { style: 'thin', color: { argb: '000000' } },
  bottom: { style: 'thin', color: { argb: '000000' } },
  right: { style: 'thin', color: { argb: '000000' } },
}
const borderWhite = {
  top: { style: 'thin', color: { argb: 'FFFFFF' } },
  left: { style: 'thin', color: { argb: 'FFFFFF' } },
  bottom: { style: 'thin', color: { argb: 'FFFFFF' } },
  right: { style: 'thin', color: { argb: 'FFFFFF' } },
}
const borderRight = {
  right: { style: 'thin', color: { argb: '000000' } },
}

export function ctol (columns) {
  const output = {}
  let cont = 0
  for (let column of columns) {
    const idCol = cont++
    output[column.key] = numberToLetter(idCol)
  }
  return output
}

function createExcel (policies, vehicleTypes, data, onlyRiskState) {
  const workbook = new ExcelJS.Workbook()
  const ws = workbook.addWorksheet('Dati')
  const columns = [
    { key: 'pol', width: 25 },
    { key: 'sign', width: 35 },
    { key: 'cos', width: 35 },
    { key: 'st', width: 25 },
    { key: 'zip', width: 20 },
    { key: 'lic', width: 20 },
    { key: 'model', width: 35 },
    { key: 'init', width: 20, style: { numFmt: 'dd/mm/yyyy' } },
    { key: 'end', width: 20 },
    { key: 'cov', width: 30 },
    { key: 'dateFrom', width: 20, style: { numFmt: 'dd/mm/yyyy' } },
    { key: 'dateTo', width: 20, style: { numFmt: 'dd/mm/yyyy' } },
    { key: 'val', width: 20, style: { numFmt: '#,##0.00' } },
    { key: 'gla', width: 15 },
    { key: 'tow', width: 15 },
    { key: 'cap', width: 15, style: { numFmt: '#,##0.00' } },
    { key: 'over', width: 15, style: { numFmt: '#,##0.00' } },
    { key: 'exc', width: 15, style: { numFmt: '#,##0.00' } },
    { key: 'prize', width: 20, style: { numFmt: '#,##0.00' } },
    { key: 'prizeT', width: 20, style: { numFmt: '#,##0.00' } },
  ]
  ws.columns = columns
  const letter = ctol(columns)
  ws.addRow({})
  ws.mergeCells(1, 1, 1, 3)
  ws.mergeCells(2, 1, 2, 3)
  for (let colIndex = 1; colIndex <= columns.length; colIndex += 1) {
    Object.assign(ws.getColumn(colIndex), right, size10)
    ws.getColumn(colIndex).border = border
  }
  for (let colIndex = columns.length + 1; colIndex <= 45; colIndex += 1) {
    ws.getColumn(colIndex).border = borderWhite
  }
  for (let rowIndex = 3; rowIndex < 9; rowIndex += 1) {
    if ([5, 6].includes(rowIndex)) {
      ws.mergeCells(rowIndex, 1, rowIndex, 3)
    } else {
      ws.mergeCells(rowIndex, 2, rowIndex, 3)
    }
    Object.assign(ws.getRow(rowIndex).getCell(1), bold)
    Object.assign(ws.getRow(rowIndex).getCell(2), bold)
  }
  ws.mergeCells(9, 1, 9, 3)
  ws.getColumn(1).values = ['', '', 'Nome dell\'Agenzia', 'QUBO INSURANCE SOLUTIONS', '', '', 'Estrazione dal', cDate.mom(data.startDate, null, 'DD/MM/YYYY')]
  ws.getColumn(2).values = ['', '', 'Ramo', 'POL MASTER CVT TUA ASSICURAZIONI 40313690000001 - 40313690000001', '', 'Periodo di estrazione', 'Estrazione al', cDate.mom(data.endDate, null, 'DD/MM/YYYY')]
  
  Object.assign(ws.getRow(2).getCell(1), { value: 'Codice Compagnia: 4 - Ragione Sociale Compagnia: TUA ASSICURAZIONI SPA' }, bold)
  Object.assign(ws.getRow(3).getCell(1), lightGray, fontWhite)
  for (let rowIndex = 1; rowIndex < 10; rowIndex += 1) {
    for (let colIndex = 4; colIndex < columns.length + 31; colIndex += 1) {
      ws.getRow(rowIndex).getCell(colIndex).border = borderWhite
    }
  }
  ws.getRow(1).getCell(1).border = borderWhite
  ws.getRow(5).getCell(1).border = borderRight
  ws.getRow(9).getCell(1).border = borderRight
  Object.assign(ws.getRow(3).getCell(2), cyan)
  Object.assign(ws.getRow(6).getCell(2), noBold)
  Object.assign(ws.getRow(7).getCell(1), noBold, cyan)
  Object.assign(ws.getRow(7).getCell(2), noBold, lightGray, fontWhite)
  ws.addRow({
    pol: 'NR Polizza',
    sign: 'Contraente',
    cos: 'Assicurato',
    st: 'Ubicazione Contraente',
    zip: 'Cap Contraente',
    lic: 'Targa',
    model: 'Tipo Veicolo',
    init: 'Decorrenza Copertura',
    end: 'Scadenza Copertura',
    cov: 'Garanzia',
    dateFrom: 'Data da',
    dateTo: 'Data a',
    val: 'Valore Assicurato',
    gla: 'Cristalli',
    tow: 'Traino',
    cap: 'Massimale Cristalli',
    over: '% Scoperto',
    exc: 'Franchigia',
    prize: 'Premio Lordo Annuo',
    prizeT: 'Premio Netto Annuo',
  })
  for (let colIndex = 1; colIndex <= columns.length; colIndex += 1) {
    Object.assign(ws.getRow(10).getCell(colIndex), lightGray, fontWhite)
  }
  let totalVehicles = 0, totalPrize = 0, totalPrizeT = 0, index = 11
  for (let policy of policies) {
    const newPolicy = initPolicy(policy)
    const defaultTaxes = newPolicy.productDefinitions[0].taxRate
    if (policy.company === 'ASSICURATRICE MILANESE SPA') {
      continue
    }
    if (policy.producer === 'qubo') {
      continue
    }
    if (defaultTaxes === 2.5) {
      console.log('skipped 2.5 %')
      continue
    }
    for (let vehicle of policy.vehicles) {
      if (!vehicle.inPolicy && onlyRiskState) {continue}
      if (vehicle.productCode === 'INFORTUNI CONDUCENTE') {continue}
      if (!['DELETED_CONFIRMED', 'ADDED_CONFIRMED', 'ACTIVE'].includes(vehicle.state)) {continue}
      const end = getPolicyEndDate(newPolicy.initDate, newPolicy.midDate)
      let dateTo = vehicle.finishDate ? new Date(vehicle.finishDate) : end
      const init = newPolicy.initDate && new Date(newPolicy.initDate)
      const dateFrom = vehicle.startDate ? new Date(vehicle.startDate) : init
      if (vehicle.state?.startsWith('DELETE')) {
        if (!moment(dateTo).isBetween(data.startDate, moment(data.endDate).add(1, 'd'))) {
          //if (onlyRiskState) {
          vehicle.state = 'ACTIVE'
          vehicle.startDate = undefined
          vehicle.finishDate = undefined
          dateTo = end
          if (!moment(init).isBetween(data.startDate, moment(data.endDate).add(1, 'd'))) {
            continue
          }
          /*   } else {
               continue
             }*/
        }
      } else {
        if (!moment(dateFrom).isBetween(data.startDate, moment(data.endDate).add(1, 'd'))) {
          continue
        }
      }
      const prize = calculatePrizeTable(null, newPolicy, {
        ...vehicle,
        value: numeric.toFloat(vehicle.value / 1000),
      })
      const signer = newPolicy?.holders?.[0] ?? {}
      const sign = signer.surname + (signer.name ? ` ${signer.name}` : '')
      let realSigner
      if (vehicle.owner && signer.id !== vehicle.owner) {
        realSigner = find(policy.cosigners, { id: vehicle.owner }) || {}
      }
      const prizeT = (prize / ((100 + taxRate) / 100))
      totalPrize += prize
      totalPrizeT += prizeT
      const vehicleCode = cFunctions.getVehicleCode(vehicle.vehicleType, vehicle.weight, vehicleTypes)
      const prodKey = cFunctions.camelDeburr(vehicle.productCode + vehicleCode)
      const product = policy.productDefinitions[prodKey] || {}
      totalVehicles++
      ws.addRow({
        pol: newPolicy.number,
        sign,
        cos: realSigner ? realSigner.surname + (realSigner.name ? ` ${realSigner.name}` : '') : sign,
        st: signer.state,
        zip: signer.zip,
        lic: vehicle.licensePlate,
        model: vehicle.vehicleType,
        init,
        end,
        cov: product.coverageType,
        dateFrom,
        dateTo,
        val: numeric.toFloat(vehicle.value / 1000),
        gla: vehicle.hasGlass === 'SI' ? 'SI' : 'NO',
        tow: vehicle.hasTowing === 'SI' ? 'SI' : 'NO',
        cap: numeric.toFloat(product.glassCap / 1000),
        over: product.overdraft / 1000,
        exc: product.excess / 1000,
        prize,
        prizeT,
      })
      if (vehicle.state?.startsWith('DELETE')) {
        for (let colIndex = 1; colIndex <= columns.length; colIndex += 1) {
          Object.assign(ws.getRow(index).getCell(colIndex), fontRed)
        }
      }
      if (vehicle.state?.startsWith('ADDED')) {
        for (let colIndex = 1; colIndex <= columns.length; colIndex += 1) {
          Object.assign(ws.getRow(index).getCell(colIndex), fontGreen)
        }
      }
      index++
    }
  }
  const headerCount = 11
  const rl = totalVehicles + headerCount - 1
  ws.addRow({
    exc: 'Importi Totali',
    prize: { formula: `SUM(${letter['prize']}${headerCount}:${letter['prize']}${rl})`, result: totalPrize || '' },
    prizeT: { formula: `SUM(${letter['prizeT']}${headerCount}:${letter['prizeT']}${rl})`, result: totalPrizeT || '' },
  })
  for (let colIndex = 1; colIndex <= columns.length; colIndex += 1) {
    Object.assign(ws.getRow(rl + 1).getCell(colIndex), bold)
  }
  const isOnlyRiskState = onlyRiskState ? '_stato_di_rischio' : ''
  const fileName = `Bdx_dal_${cDate.mom(data.startDate, null, 'DD-MM-YYYY')}_al_${cDate.mom(data.endDate, null, 'DD-MM-YYYY')}${isOnlyRiskState}.xlsx`
  workbook.xlsx.writeBuffer().then(buffer => {
    saveAs(new Blob([buffer], { type: 'application/octet-stream' }), fileName)
  })
}

const SwitchOption = props => {
  const { state, handleChange } = props
  return (
    <FormGroup row>
      <FormControlLabel
        control={<Switch checked={state.onlyRiskState} name="onlyRiskState" onChange={handleChange}/>}
        label="Stampa solo stato di rischio"
      />
    </FormGroup>
  )
}

const Bsx = ({ enqueueSnackbar }) => {
  const classes = useStyles()
  const formRefBdx = useRef()
  const [state, setState] = useState({
    onlyRiskState: false,
  })
  const handleChange = (event) => {
    setState({ ...state, [event.target.name]: event.target.checked })
  }
  const onClick = useCallback(async () => {
    const { values } = formRefBdx.current || {}
    const data = {
      startDate: state.onlyRiskState ? cDate.mom(values.startDate, null, 'YYYY-MM-DD') : '2021-01-01',
      endDate: cDate.mom(values.endDate, null, 'YYYY-MM-DD'),
    }
    const { ok, message, results } = await bdxQuery(
      'files/get_bdx',
      data
    )
    const range = {
      startDate: cDate.mom(values.startDate, null, 'YYYY-MM-DD'),
      endDate: cDate.mom(values.endDate, null, 'YYYY-MM-DD'),
    }
    !ok && enqueueSnackbar(message, { variant: 'error' })
    createExcel(results.policies, results.vehicleTypes, range, state.onlyRiskState)
  }, [enqueueSnackbar, state.onlyRiskState])
  
  return (
    <Page
      className={classes.root}
      title="Bdx"
    >
      <Header/>
      <Typography>Parametro di estrazione: data di movimentazione (=stato di rischio-decorrenza
        inclusione/esclusione)
      </Typography>
      <Grid alignItems="center" container spacing={3}>
        <Grid item><BdxForm formRefBdx={formRefBdx}/></Grid>
        <Grid item style={{ marginTop: 13 }}><SwitchOption handleChange={handleChange} state={state}/></Grid>
      </Grid>
      <div className={classes.results}>
        <Button color="primary" disableFocusRipple onClick={onClick} size="small" variant="contained">Genera</Button>
      </div>
    </Page>
  )
}

Bsx.propTypes = {
  enqueueSnackbar: PropTypes.any,
}

export default compose(
  withSnackbar
)(Bsx)
