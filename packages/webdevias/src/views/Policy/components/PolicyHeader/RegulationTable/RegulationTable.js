import React, { memo, useCallback, useState } from 'react'
import { Grid, Table, TableHeaderRow } from '@devexpress/dx-react-grid-material-ui'
import { Cell, HeaderCell } from './cellFormatters'
import { DateTypeProvider, TextTypeProvider } from 'helpers/tableFormatters'
import { IconButton, Paper, Tooltip } from '@material-ui/core'
import { mdiFilePdf, mdiFilePdfBox, mdiTextBoxCheck } from '@mdi/js'
import Icon from '@mdi/react'
//import moment from 'moment'
import { useApolloClient } from '@apollo/react-hooks'
import { ME } from 'queries/users'
import moment from 'moment'

//const getRowId = row => row.startDate
const messages = { noData: 'Nessun risultato' }
const RegulationTable = props => {
  const client = useApolloClient()
  const { me: { priority } } = client.readQuery({ query: ME })
  const { isPolicy, handlePrint, consolidatePolicy, fractions: rows, isRecalculateFraction } = props
  const columns = [
    { name: 'startDate', title: 'Inizio' },
    { name: 'endDate', title: 'Fine' },
    { name: 'daysDiff', title: 'Giorni' },
    { name: 'hasRegulation', title: 'Ricalcola rate', getCellValue: row => row.hasRegulation },
  ]
  const tableColumnExtensions = [
    { columnName: 'startDate', align: 'center' },
    { columnName: 'endDate', align: 'center' },
    { columnName: 'daysDiff', align: 'center' },
    { columnName: 'hasRegulation', align: 'center' },
    { columnName: 'print', align: 'center' },
    { columnName: 'consolidation', align: 'center' },
  ]
  const [dateColumns] = useState(['startDate', 'endDate'])
  const [textColumns] = useState(['daysDiff'])
  if (isPolicy) {
    columns.splice(4, 0, { name: 'print', title: 'Stampe' })
    columns.splice(5, 0, { name: 'consolidation', title: 'Consolida' })
  }
  
  const CustomCell = useCallback(values => {
    const { column, row, tableRow } = values
    const regCounter = 1 + Number(tableRow.key.split('_')[1])
    //const diff = moment().diff(row.endDate)
    const toCon = moment(row.toCon).isSame(row.startDate) || (row.toCon === undefined && tableRow.rowId === 0)
    const toRec = (row.toCon && moment(row.toCon).isSameOrAfter(row.startDate)) || (row.toCon === undefined && tableRow.rowId === 0)
    if (column.name === 'print') {
      return (
        <Table.Cell
          {...values}
        >
          {
            (priority === 3) &&
            <Tooltip placement="top" title="Regolazione">
              <IconButton
                onClick={handlePrint('regulation', row.startDate, row.endDate, row.hasRegulation, regCounter)}
                style={{ padding: 3 }}
              >
                <Icon path={mdiFilePdfBox} size={1}/>
              </IconButton>
            </Tooltip>
          }
          {
            (priority === 3 && isRecalculateFraction === 'SI' && toRec) &&
            <Tooltip placement="top" title="Quietanza">
              <IconButton
                onClick={handlePrint('receipt', row.startDate, row.endDate, row.hasRegulation, regCounter)}
                style={{ padding: 3 }}
              >
                <Icon path={mdiFilePdf} size={1}/>
              </IconButton>
            </Tooltip>
          }
        </Table.Cell>
      )
    }
    if (column.name === 'consolidation') {
      return (
        <Table.Cell
          {...values}
        >
          {
            (priority === 3 && isRecalculateFraction === 'SI' && toCon) &&
            <IconButton
              onClick={consolidatePolicy('', row.startDate, row.endDate, row.hasRegulation, regCounter)}
              style={{ padding: 3 }}
            >
              <Icon path={mdiTextBoxCheck} size={1}/>
            </IconButton>
          }
        </Table.Cell>
      )
    }
    return <Cell {...values}/>
  }, [handlePrint, consolidatePolicy, isRecalculateFraction, priority])
  /* const commandComponent = useCallback(props => {
     const { id } = props
     const CommandButton = commandComponents[id]
     return <CommandButton {...props} />
   }, [])*/
  // eslint-disable-next-line react/display-name
  /*const commitChanges = useCallback(({ changed }) => {
    let changedRows
    let hasChanged = false
    if (changed) {
      changedRows = rows.map(row => {
        if (!changed[row.startDate]) {return row}
        hasChanged |= true
        let updateRow = {
          ...row,
          ...changed[row.startDate],
        }
        return updateRow
      })
    }
    hasChanged && dispatch({ type: 'setRegFractions', regFractions: changedRows })
  }, [dispatch, rows])*/
  return (
    <Paper style={{ width: 800, marginBottom: 10 }}>
      <Grid
        columns={columns}
        rows={rows}
      >
        <DateTypeProvider
          for={dateColumns}
        />
        <TextTypeProvider
          for={textColumns}
        />
        <Table
          cellComponent={CustomCell}
          columnExtensions={tableColumnExtensions}
          messages={messages}
        />
        <TableHeaderRow cellComponent={HeaderCell}/>
      </Grid>
    </Paper>
  )
}

export default memo(RegulationTable)
