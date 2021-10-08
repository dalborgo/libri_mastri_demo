import { makeStyles } from '@material-ui/styles'
import { Table, TableHeaderRow } from '@devexpress/dx-react-grid-material-ui'
import React from 'react'
import { Switch } from '@material-ui/core'
import moment from 'moment'

const useStyles = makeStyles(theme => ({
  tableCell: {
    padding: theme.spacing(1, 2),
  },
  tableHeaderFooterCell: {
    padding: theme.spacing(0.8, 2),
  },
  switchDisabled: {
    color: 'red',
    '&:disabled': {
      color: 'red',
    },
  },
}))

export const Cell = props => {
  const { column: { name }, row: { date, daysDiff }, tableRow: {rowId} } = props
  const classes = useStyles()
  const today = moment()
  const plusDay = moment(date).add(daysDiff, 'd')
  const [state, setState] = React.useState({
    checkedA: today.isAfter(plusDay),
  })
  
  const handleChange = (event) => {
    setState({ ...state, [event.target.name]: event.target.checked })
  }
  if (name === 'paid' && today.isAfter(date)) {
    return (
      <Table.Cell
        {...props}
        className={classes.tableCell}
        style={{ padding: 0 }}
      >
        <Switch
          checked={state.checkedA}
          classes={
            {
              disabled: classes.switchDisabled,
            }
          }
          color="secondary"
          disabled={today.isAfter(plusDay)}
          inputProps={{ 'aria-label': 'secondary checkbox' }}
          name="checkedA"
          onChange={handleChange}
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
