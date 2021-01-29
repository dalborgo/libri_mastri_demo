import React, { memo, useState } from 'react'
import Paper from '@material-ui/core/Paper'
import { Grid, Table, TableHeaderRow, TableSummaryRow } from '@devexpress/dx-react-grid-material-ui'
import { Cell, FooterCell, HeaderCell } from './cellFormatters'
import { DateTypeProvider, NumberTypeProvider } from 'helpers/tableFormatters'
import { IntegratedSummary, SummaryState } from '@devexpress/dx-react-grid'

const messages = { noData: 'Nessun risultato' }
const messagesSummary = { sum: 'T', euro_sum_tax: '€', euro_sum_taxable: '€', euro_sum_instalment: '€', tot_value: '€' }

const summaryCalculator = (type, rows, getValue) => {
  switch (type) {
    case 'euro_sum_instalment':
      return rows.reduce((acc, curr) => {
        return acc + Math.round(curr.instalment * 100) / 100
      }, 0)
    case 'euro_sum_taxable':
      return rows.reduce((acc, curr) => {
        return acc + Math.round(curr.taxable * 100) / 100
      }, 0)
    case 'euro_sum_tax':
      return rows.reduce((acc, curr) => {
        return acc + Math.round(curr.tax * 100) / 100
      }, 0)
    default:
      return IntegratedSummary.defaultCalculator(type, rows, getValue)
  }
}
const FractionTable = props => {
  const columns = [
    { name: 'date', title: 'Data Pagamento' },
    { name: 'daysDiff', title: 'Giorni' },
    { name: 'instalment', title: '€ Rata Lorda' },
    { name: 'taxable', title: '€ Imponibile' },
    { name: 'tax', title: '€ Tasse' },
  ]
  const tableColumnExtensions = [
    { columnName: 'date', align: 'center' },
    { columnName: 'daysDiff', align: 'center' },
    { columnName: 'instalment', align: 'right' },
    { columnName: 'taxable', align: 'right' },
    { columnName: 'tax', align: 'right' },
  ]
  const [totalSummaryItems] = useState([
    { columnName: 'instalment', type: 'euro_sum_instalment' },
    { columnName: 'taxable', type: 'euro_sum_taxable' },
    { columnName: 'tax', type: 'euro_sum_tax' },
  ])
  const [dateColumns] = useState(['date'])
  const [numberColumns] = useState(['instalment', 'taxable', 'tax'])
  const { fractions: rows } = props
  return (
    <Paper
      style={
        {
          width: 800,
        }
      }
    >
      <Grid
        columns={columns}
        rows={rows}
      >
        <DateTypeProvider
          for={dateColumns}
        />
        <NumberTypeProvider
          for={numberColumns}
        />
        <SummaryState
          totalItems={totalSummaryItems}
        />
        <IntegratedSummary
          calculator={summaryCalculator}
        />
        <Table
          cellComponent={Cell}
          columnExtensions={tableColumnExtensions}
          messages={messages}
        />
        <TableHeaderRow cellComponent={HeaderCell}/>
        <TableSummaryRow
          messages={messagesSummary}
          totalCellComponent={FooterCell}
        />
      </Grid>
    </Paper>
  )
}

export default memo(FractionTable)
