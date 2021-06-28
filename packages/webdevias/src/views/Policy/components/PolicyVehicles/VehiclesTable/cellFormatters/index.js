import { TableFixedColumns, TableHeaderRow, Toolbar, VirtualTable } from '@devexpress/dx-react-grid-material-ui'
import { useTheme, withStyles } from '@material-ui/styles'
import React from 'react'
import { Input, MenuItem, Select, TableCell } from '@material-ui/core'
import MuiTableHead from 'theme/overrides/MuiTableHead'

const styles = theme => ({
  lookupEditCell: {
    padding: theme.spacing(1),
    textAlign: 'center',
  },
  inputRoot: {
    width: '100%',
  },
  selectMenu: {
    position: 'absolute !important',
  },
})

const LookupEditCellBase = ({
  values, value, onValueChange, classes, hide,
}) => (
  <TableCell
    className={classes.lookupEditCell}
    style={
      {
        visibility: hide ? 'hidden' : 'visible',
      }
    }
  >
    {
      values.length ?
        <div style={{ marginTop: 2 }}>
          <Select
            input={
              (
                <Input
                  classes={{ root: classes.inputRoot }}
                />
              )
            }
            MenuProps={
              {
                className: classes.selectMenu,
              }
            }
            onChange={event => onValueChange(event.target.value)}
            value={value || values[0]}
          >
            {
              values.map(item => (
                <MenuItem key={item} value={item}>
                  {item}
                </MenuItem>
              ))
            }
          </Select>
        </div>
        :
        <Select
          disabled
          input={
            (
              <Input
                classes={{ root: classes.inputRoot }}
              />
            )
          }
          value=""
        />
    }
  </TableCell>
)
export const LookupEditCell = withStyles(styles)(LookupEditCellBase)

const BaseCell = ({ value, classes, style, editingEnabled, onValueChange, defaultValue, ...restProps }) => (
  <VirtualTable.Cell
    className={classes.lookupEditCell}
    style={{ ...style }}
    {...restProps}
  >
    {defaultValue || value}
  </VirtualTable.Cell>
)
export const FastBaseCell = withStyles(styles)(BaseCell)

const HighlightedCell = ({ style, children, value, theme, stateStyle, ...restProps }) => {
  let isError = value === 'XXXXXX'
  if (restProps.column.name === 'weight' && ['AUTOCARRO'].includes(restProps.row.vehicleType)) {
    isError |= !value
  }
  if (restProps.column.name === 'vehicleType') {
    isError |= !['AUTOCARRO', 'AUTO', 'PULLMAN', 'AUTOARTICOLATO', 'RIMORCHIO', 'MOTOCICLO', 'MACCHINA OPERATRICE', 'VEICOLO SPECIALE', 'AUTO USO NOLEGGIO', 'AUTO USO SCUOLA GUIDA'].includes(value)
  }
  if (restProps.column.name === 'prize') {
    isError |= !value || value === '0,00'
  }
  if (restProps.column.name === 'hasTowing' || restProps.column.name === 'hasGlass') {
    isError |= value.startsWith(' ')
  }
  if (restProps.column.name === 'productCode') {
    isError |= !value
  }
  return (
    <VirtualTable.Cell
      style={
        {
          ...style,
          ...stateStyle,
          backgroundColor: isError ? theme.palette.error.main : undefined,
        }
      }
      {...restProps}
    >
      <span
        style={
          {
            ...stateStyle,
            color: isError ? theme.palette.error.contrastText : undefined,
          }
        }
      >
        {
          ['weight', 'prize'].includes(restProps.column.name) ?
            children //to inherit the data formatter
            :
            value
        }
      </span>
    </VirtualTable.Cell>
  )
}

export const Cell = props => {
  const { column, row } = props
  const { style, ...restProps } = props
  let stateStyle
  switch (row.state) {
    case 'ADDED_CONFIRMED':
    case 'ADDED':
      stateStyle = {
        color: 'green',
      }
      break
    case 'DELETED_FROM_INCLUDED':
    case 'DELETED_CONFIRMED':
    case 'DELETED':
      stateStyle = {
        color: 'red',
      }
      break
    default:
      stateStyle = {}
  }
  const theme = useTheme()
  if (['prize', 'licensePlate', 'productCode', 'weight', 'hasTowing', 'hasGlass', 'vehicleType'].includes(column.name)) {
    return <HighlightedCell {...props} stateStyle={stateStyle} theme={theme}/>
  }
  return (
    <VirtualTable.Cell
      style={
        {
          ...style,
          ...stateStyle,
        }
      }
      {...restProps}
    />
  )
}
export const HeaderCell = props => {
  return (
    <TableHeaderRow.Cell
      {...props}
    />
  )
}
export const FixedCell = props => {
  const { tableRow } = props
  return (
    <TableFixedColumns.Cell
      {...props}
      style={
        {
          backgroundColor: tableRow.key === 'Symbol(heading)' ? MuiTableHead.root.backgroundColor : 'none',
        }
      }
    />
  )
}

export const RootToolbar = props => {
  return (
    <Toolbar.Root
      {...props}
      style={{ minHeight: 50 }}
    />
  )
}
