import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import { Table, TableHeaderRow } from '@devexpress/dx-react-grid-material-ui'

const styles = theme => ({
  tableCell: {
    padding: theme.spacing(1.3),
  },
  tableHeaderCell: {
    padding: theme.spacing(1),
  },
  tableHeaderDetailCell: {
    padding: theme.spacing(0.5),
  },
})

export const Cell = withStyles(styles)(props => {
  const { classes, ...rest } = props
  return (
    <Table.Cell
      {...rest}
      className={classes.tableCell}
    />
  )
  
})
export const HeaderCell = withStyles(styles)(({ classes, ...rest }) => {
  return (
    <TableHeaderRow.Cell
      {...rest}
      className={classes.tableHeaderCell}
    />
  )
})
export const HeaderDetailCell = withStyles(styles)(({ classes, ...rest }) => {
  return (
    <TableHeaderRow.Cell
      {...rest}
      className={classes.tableHeaderDetailCell}
    />
  )
})
