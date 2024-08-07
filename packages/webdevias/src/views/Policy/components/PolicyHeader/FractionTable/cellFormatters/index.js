import { makeStyles } from '@material-ui/styles'
import { Table, TableHeaderRow } from '@devexpress/dx-react-grid-material-ui'
import React from 'react'
import { Switch } from '@material-ui/core'

const useStyles = makeStyles(theme => ({
  tableCell: {
    padding: theme.spacing(1, 2),
  },
  tableHeaderFooterCell: {
    padding: theme.spacing(0.8, 2),
  },
}))

export const cell = (paidFractions, setPaidFractions) => props => {
  const { column: { name }, tableRow: { rowId } } = props
  const classes = useStyles()
  if (name === 'paid' && (paidFractions?.[rowId] || rowId === 0)) {
    return (
      <Table.Cell
        {...props}
        className={classes.tableCell}
        style={{ padding: 0 }}
      >
        <Switch
          checked={paidFractions?.[rowId + 1]}
          color="secondary"
          disabled={paidFractions?.[rowId + 2]}
          inputProps={{ 'aria-label': 'secondary checkbox' }}
          name="checkedA"
          onChange={
            event => {
              alert(`Vuoi veramente ${event.target.checked ? 'confermare' : 'annullare'} il pagamento della rata?`)
              setPaidFractions(rowId + 1, event.target.checked)
            }
          }
          size="small"
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
