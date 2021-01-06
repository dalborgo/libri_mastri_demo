import { makeStyles } from '@material-ui/styles'
import { Table, TableHeaderRow } from '@devexpress/dx-react-grid-material-ui'
import React from 'react'

const useStyles = makeStyles(theme => ({
  tableCell: {
    padding: theme.spacing(1, 2),
  },
  tableHeaderCell: {
    padding: theme.spacing(0.8, 2),
  },
}))
export const Cell = props => {
  //const { column } = props
  const classes = useStyles()
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
      className={classes.tableHeaderCell}
    />
  )
}
