import React, { useCallback, useRef } from 'react'
import { makeStyles } from '@material-ui/styles'
import PropTypes from 'prop-types'
import { Page } from 'components'
import { Header } from './components'
import { withSnackbar } from 'notistack'
import compose from 'lodash/fp/compose'
import { regulationsQuery } from 'utils/axios'
import { Button } from '@material-ui/core'
import ExcelJS from 'exceljs'
import saveAs from 'file-saver'
import { cDate, cFunctions } from '@adapter/common'
import { calculateIsRecalculatePaymentTable, calculatePaymentTable, getPolicyEndDate } from '../../helpers'
import { initPolicy } from '../Policy/helpers'
import numberToLetter from 'number-to-letter'
import RegulationsForm from './components/RegulationsForm'
import moment from 'moment'

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(3),
  },
  results: {
    marginTop: theme.spacing(3),
  },
}))

const size10 = { font: { size: '10' } }
const bold = { font: { bold: true, size: '10' } }
const noBold = { font: { bold: false, size: '10' } }
const right = { alignment: { horizontal: 'right' } }
const lightGray = { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '969696' } } }
const cyan = { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'CCFFFF' } } }
const fontWhite = { font: { color: { argb: 'FFFFFF' }, bold: true, size: '10' } }
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

function createExcel (policies, vehicleTypes, data) {
  const workbook = new ExcelJS.Workbook()
  const ws = workbook.addWorksheet('Dati')
  const columns = [
    { key: 'pol', width: 25 },
    { key: 'sign', width: 35 },
    { key: 'st', width: 45 },
    { key: 'id', width: 20 },
    { key: 'init', width: 20, style: { numFmt: 'dd/mm/yyyy' } },
    { key: 'end', width: 20 },
    { key: 'broker', width: 30 },
    { key: 'dec', width: 20, style: { numFmt: 'dd/mm/yyyy' } },
    { key: 'sca', width: 20, style: { numFmt: 'dd/mm/yyyy' } },
    { key: 'totTaxable', width: 20, style: { numFmt: '#,##0.00' } },
    { key: 'tax', width: 20, style: { numFmt: '#,##0.00' } },
    { key: 'totInstalment', width: 20, style: { numFmt: '#,##0.00' } },
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
    st: 'Indirizzo',
    id: 'Iva/CF',
    init: 'Decorrenza Copertura',
    end: 'Scadenza Copertura',
    broker: 'Broker',
    dec: 'Decorrenza Regolazione',
    sca: 'Scadenza Regolazione',
    totTaxable: 'Premio Netto',
    tax: 'Tasse',
    totInstalment: 'Premio Lordo',
  })
  for (let colIndex = 1; colIndex <= columns.length; colIndex += 1) {
    Object.assign(ws.getRow(10).getCell(colIndex), lightGray, fontWhite)
  }
  let totalVehicles = 0, totalTaxable = 0, totalInstalment = 0, totalTaxes = 0
  for (let policy of policies) {
    const newPolicy = initPolicy(policy)
    const data = {
      ...newPolicy,
    }
    let totTaxable = 0
    const endRegDate = '2021-12-31'
    const startRegDate = '2020-12-31'
    const hasRegulation = newPolicy.isRecalculateFraction
    const tablePd = { values: { productDefinitions: newPolicy.productDefinitions } }
    for (let vehicle of policy.vehicles) {
      if (hasRegulation === 'SI') {
        const isStartDate = vehicle.startDate === data.initDate
        if ((!vehicle.startDate || !vehicle.finishDate)/* || (['DELETED', 'DELETED_CONFIRMED'].includes(vehicle.state) && isStartDate)*/) {
          continue
        }
        if (cDate.inRange(startRegDate, endRegDate, vehicle.startDate, isStartDate) || (cDate.inRange(startRegDate, endRegDate, vehicle.finishDate) && ['DELETED', 'DELETED_CONFIRMED', 'DELETED_FROM_INCLUDED'].includes(vehicle.state))) {
          if (moment(vehicle.finishDate).isAfter(endRegDate)) {
            vehicle.finishDate = cFunctions.calcPolicyEndDate(data.initDate, data.midDate)
            vehicle.state = 'ADDED_CONFIRMED'
          }
          const {
            payment,
          } = calculateIsRecalculatePaymentTable(tablePd, data, vehicle, true, true, endRegDate)
          totTaxable += payment
        }
      } else {
        const isStartDate = vehicle.startDate === data.initDate
        vehicle.value = vehicle.value / 1000
        if ((!vehicle.startDate || !vehicle.finishDate)/* || (['DELETED', 'DELETED_CONFIRMED'].includes(vehicle.state) && isStartDate)*/) {
          continue
        }
        if (cDate.inRange(startRegDate, endRegDate, vehicle.startDate, isStartDate) || (cDate.inRange(startRegDate, endRegDate, vehicle.finishDate) && ['DELETED', 'DELETED_CONFIRMED', 'DELETED_FROM_INCLUDED'].includes(vehicle.state))) {
          if (moment(vehicle.finishDate).isAfter(endRegDate)) {
            vehicle.finishDate = cFunctions.calcPolicyEndDate(data.initDate, data.midDate)
            vehicle.state = 'ADDED_CONFIRMED'
          }
          const { payment } = calculatePaymentTable(tablePd, data, vehicle, true, true)
          totTaxable += payment
        }
      }
    }
    totalVehicles++
    data.totTaxable = Number(totTaxable.toFixed(2))
    data.totInstalment = (totTaxable * ((100 + 13.5) / 100))
    const signer = newPolicy?.holders?.[0] ?? {}
    const sign = signer.surname + (signer.name ? ` ${signer.name}` : '')
    totalTaxable += data.totTaxable
    totalInstalment += data.totInstalment
    const tax = data.totInstalment - data.totTaxable
    totalTaxes += tax
    ws.addRow({
      pol: newPolicy.number,
      sign,
      st: `${signer.address}, ${signer.address_number} - ${signer.city} (${signer.zip}) - ${signer.state}`,
      id: signer.id,
      init: newPolicy.initDate && new Date(newPolicy.initDate),
      end: getPolicyEndDate(newPolicy.initDate, newPolicy.midDate),
      broker: newPolicy.producer,
      dec: startRegDate && new Date(startRegDate),
      sca: endRegDate && new Date(endRegDate),
      totTaxable: data.totTaxable,
      tax,
      totInstalment: data.totInstalment,
    })
  }
  const headerCount = 11
  const rl = totalVehicles + headerCount - 1
  ws.addRow({
    sca: 'Importi Totali',
    totTaxable: {
      formula: `SUM(${letter['totTaxable']}${headerCount}:${letter['totTaxable']}${rl})`,
      result: totalTaxable || '',
    },
    tax: {
      formula: `SUM(${letter['tax']}${headerCount}:${letter['tax']}${rl})`,
      result: totalTaxes || '',
    },
    totInstalment: {
      formula: `SUM(${letter['totInstalment']}${headerCount}:${letter['totInstalment']}${rl})`,
      result: totalInstalment || '',
    },
  })
  for (let colIndex = 1; colIndex <= columns.length; colIndex += 1) {
    Object.assign(ws.getRow(rl + 1).getCell(colIndex), bold)
  }
  workbook.xlsx.writeBuffer().then(buffer => {
    saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'RegulationsGrid.xlsx')
  })
}

const Regulations = ({ enqueueSnackbar }) => {
  const classes = useStyles()
  const formRefRegulations = useRef()
  const onClick = useCallback(async () => {
    const { values } = formRefRegulations.current || {}
    const data = {
      startDate: cDate.mom(values.startDate, null, 'YYYY-MM-DD'),
      endDate: cDate.mom(values.endDate, null, 'YYYY-MM-DD'),
    }
    const { ok, message, results } = await regulationsQuery(
      'files/get_regulations',
      data
    )
    !ok && enqueueSnackbar(message, { variant: 'error' })
    createExcel(results.policies, results.vehicleTypes, data)
  }, [enqueueSnackbar])
  
  return (
    <Page
      className={classes.root}
      title="Regolazioni"
    >
      <Header/>
      <div>
        <RegulationsForm formRefRegulations={formRefRegulations}/>
      </div>
      <div className={classes.results}>
        <Button color="primary" disableFocusRipple onClick={onClick} size="small" variant="contained">Genera</Button>
      </div>
    </Page>
  )
}

Regulations.propTypes = {
  enqueueSnackbar: PropTypes.any,
}

export default compose(
  withSnackbar
)(Regulations)
