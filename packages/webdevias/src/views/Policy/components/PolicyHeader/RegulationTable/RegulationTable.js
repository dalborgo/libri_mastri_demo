import React, { memo, useCallback, useState } from 'react'
import { Grid, Table, TableHeaderRow } from '@devexpress/dx-react-grid-material-ui'
import { Cell, HeaderCell } from './cellFormatters'
import { DateTypeProvider, TextTypeProvider } from 'helpers/tableFormatters'
import { IconButton, Paper } from '@material-ui/core'
import { mdiFilePdfBox } from '@mdi/js'
import Icon from '@mdi/react'
//import moment from 'moment'
import { useApolloClient } from '@apollo/react-hooks'
import { ME } from 'queries/users'

//const getRowId = row => row.startDate
const messages = { noData: 'Nessun risultato' }
const RegulationTable = props => {
  const client = useApolloClient()
  const { me: { priority } } = client.readQuery({ query: ME })
  const { isPolicy, handlePrint, fractions: rows } = props
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
  ]
  const [dateColumns] = useState(['startDate', 'endDate'])
  const [textColumns] = useState(['daysDiff'])
  if (isPolicy) {
    columns.splice(4, 0, { name: 'print', title: 'Stampe' })
  }
  
  const CustomCell = useCallback(props => {
    const { column, row, tableRow } = props
    const regCounter = 1 + Number(tableRow.key.split('_')[1])
    //const diff = moment().diff(row.endDate)
    if (column.name === 'print') {
      return (
        <Table.Cell
          {...props}
        >
          {
            (priority === 3) && //diff > 0 ||
            <IconButton
              onClick={handlePrint('regulation', row.startDate, row.endDate, row.hasRegulation, regCounter)}
              style={{ padding: 3 }}
            >
              <Icon path={mdiFilePdfBox} size={1}/>
            </IconButton>
          }
        </Table.Cell>
      )
    }
    return <Cell {...props}/>
  }, [handlePrint, priority])
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
