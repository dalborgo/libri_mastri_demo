import { makeStyles } from '@material-ui/styles'
import { Table, TableHeaderRow } from '@devexpress/dx-react-grid-material-ui'
import React from 'react'
import { Switch } from '@material-ui/core'
import moment from 'moment'
import { ME } from 'queries'
import { useApolloClient } from '@apollo/react-hooks'

const useStyles = makeStyles(theme => ({
  tableCell: {
    padding: theme.spacing(1, 2),
  },
  tableHeaderFooterCell: {
    padding: theme.spacing(0.8, 2),
  },
}))

export const cell = (paidFractions, setPaidFractions) => props => {
  const { column: { name }, row: { date, daysDiff }, tableRow: { rowId } } = props
  const client = useApolloClient()
  const { me: { priority } } = client.readQuery({ query: ME })
  const classes = useStyles()
  const today = moment()
  const plusDay = moment(date).add(daysDiff, 'd')
  const isDisabled = today.isAfter(plusDay) || priority < 3
  if (name === 'paid' && today.isAfter(date)) {
    return (
      <Table.Cell
        {...props}
        className={classes.tableCell}
        style={{ padding: 0 }}
      >
        <Switch
          checked={paidFractions?.[rowId + 1]}
          color="secondary"
          disabled={isDisabled}
          inputProps={{ 'aria-label': 'secondary checkbox' }}
          name="checkedA"
          onChange={event => setPaidFractions(rowId + 1, event.target.checked)}
        />
      </Table.Cell>
    )
  }
  return (
    <Table.Cell
      {...props}
      className={classes.tableCell}
    />
  )
}
export const HeaderCell = props => {
  const classes = useStyles()
  return (
    <TableHeaderRow.Cell
      {...props}
      className={classes.tableHeaderFooterCell}
    />
  )
}

export const FooterCell = props => {
  const classes = useStyles()
  return (
    <Table.Cell
      {...props}
      className={classes.tableHeaderFooterCell}
    />
  )
}
