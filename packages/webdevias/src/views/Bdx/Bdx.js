import React, { useCallback } from 'react'
import { makeStyles } from '@material-ui/styles'
import PropTypes from 'prop-types'
import { Page } from 'components'
import { Header } from './components'
import { withSnackbar } from 'notistack'
import compose from 'lodash/fp/compose'
import { bdxQuery } from 'utils/axios'
import { Button } from '@material-ui/core'
import ExcelJS from 'exceljs'
import saveAs from 'file-saver'
import { cDate, cFunctions, numeric } from '@adapter/common'
import { calculatePrizeTable, getPolicyEndDate } from '../../helpers'
import { initPolicy } from '../Policy/helpers'
import numberToLetter from 'number-to-letter'

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

function createExcel (policies, vehicleTypes) {
  const workbook = new ExcelJS.Workbook()
  const ws = workbook.addWorksheet('Dati')
  const columns = [
    { key: 'pol', width: 25 },
    { key: 'sign', width: 35 },
    { key: 'st', width: 25 },
    { key: 'lic', width: 20 },
    { key: 'model', width: 35 },
    { key: 'init', width: 20 },
    { key: 'end', width: 20 },
    { key: 'cov', width: 30 },
    { key: 'val', width: 20, style: { numFmt: '#,##0.00' } },
    { key: 'gla', width: 15, style: { numFmt: '#,##0.00' } },
    { key: 'tow', width: 15, style: { numFmt: '#,##0.00' } },
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
  ws.getColumn(1).values = ['', '', 'Nome dell\'Agenzia', 'QUBO INSURANCE SOLUTIONS', '', '', 'Incassi dal', '01/10/2020']
  ws.getColumn(2).values = ['', '', 'Ramo', 'POL MASTER CVT TUA ASSICURAZIONI 40313690000001 - 40313690000001', '', 'Periodo di incasso', 'Incassi al', '01/10/2020']
  
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
    sign: 'Assicurato',
    st: 'Ubicazione Assicurato',
    lic: 'Targa',
    model: 'Tipo Veicolo',
    init: 'Decorrenza Copertura',
    end: 'Scadenza Copertura',
    cov: 'Garanzia',
    val: 'Valore Assicurato',
    gla: 'Cristalli',
    tow: 'Traino',
    over: '% Scoperto',
    exc: 'Franchigia',
    prize: 'Premio Annuo Lordo',
    prizeT: 'Premio Annuo Netto',
  })
  for (let colIndex = 1; colIndex <= columns.length; colIndex += 1) {
    Object.assign(ws.getRow(10).getCell(colIndex), lightGray, fontWhite)
  }
  let totalVehicles = 0, totalPrize = 0, totalPrizeT = 0
  for (let policy of policies) {
    const newPolicy = initPolicy(policy)
    totalVehicles += policy.vehicles.length
    for (let vehicle of policy.vehicles) {
      const prize = calculatePrizeTable(null, newPolicy, {
        ...vehicle,
        value: numeric.toFloat(vehicle.value / 1000),
      })
      const prizeT = (prize / ((100 + 13.5) / 100))
      totalPrize += prize
      totalPrizeT += prizeT
      const vehicleCode = cFunctions.getVehicleCode(vehicle.vehicleType, vehicle.weight, vehicleTypes)
      const prodKey = cFunctions.camelDeburr(vehicle.productCode + vehicleCode)
      const product = policy.productDefinitions[prodKey] || {}
      
      ws.addRow({
        pol: newPolicy.number,
        sign: newPolicy?.holders?.[0].surname + (newPolicy?.holders?.[0].name ? ` ${newPolicy?.holders?.[0].name}` : ''),
        st: newPolicy?.holders?.[0].state,
        lic: vehicle.licensePlate,
        model: vehicle.model + (vehicle.brand ? ` ${vehicle.brand}` : ''),
        init: newPolicy.initDate && cDate.mom(newPolicy.initDate, null, 'DD/MM/YYYY'),
        end: getPolicyEndDate(newPolicy.initDate, newPolicy.midDate),
        cov: product.coverageType,
        val: numeric.toFloat(vehicle.value / 1000),
        gla: vehicle.hasGlass === 'SI' ? numeric.toFloat(product.glass / 1000) : '',
        tow: vehicle.hasTowing === 'SI' ? numeric.toFloat(product.towing / 1000) : '',
        over: product.overdraft / 1000,
        exc: product.excess / 1000,
        prize,
        prizeT,
      })
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
  workbook.xlsx.writeBuffer().then(buffer => {
    saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'DataGrid.xlsx')
  })
}

const Bsx = ({ enqueueSnackbar }) => {
  const classes = useStyles()
  const onClick = useCallback(async () => {
    const data = {}
    const { ok, message, results } = await bdxQuery(
      'files/get_bdx',
      data
    )
    !ok && enqueueSnackbar(message, { variant: 'error' })
    createExcel(results.policies, results.vehicleTypes)
  }, [enqueueSnackbar])
  
  return (
    <Page
      className={classes.root}
      title="Bdx"
    >
      <Header/>
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
