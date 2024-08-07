import { TableFixedColumns, TableHeaderRow, Toolbar, VirtualTable } from '@devexpress/dx-react-grid-material-ui'
import { useTheme, withStyles } from '@material-ui/styles'
import React from 'react'
import { Input, MenuItem, Select, TableCell, Tooltip } from '@material-ui/core'
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
  values, value, onValueChange, classes, hide, className, style, theme,
}) => (
  <TableCell
    className={className}
    style={{ ...style, textAlign: 'center', padding: theme.spacing(1) }}
  >
    {
      values.length ?
        <div style={{ marginTop: 2, visibility: hide ? 'hidden' : 'visible' }}>
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
        <div style={{ visibility: hide ? 'hidden' : 'visible' }}>
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
        </div>
    }
  </TableCell>
)
export const LookupEditCell = withStyles(styles, { withTheme: true })(LookupEditCellBase)

const BaseCell = ({
  value,
  classes,
  style,
  editingEnabled,
  onValueChange,
  defaultValue,
  empty = false,
  ...restProps
}) => (
  <VirtualTable.Cell
    className={classes.lookupEditCell}
    style={{ ...style }}
    {...restProps}
  >
    {empty ? '' : defaultValue || value}
  </VirtualTable.Cell>
)
export const FastBaseCell = withStyles(styles)(BaseCell)

const HighlightedCell = ({ style, children, value, theme, stateStyle, ...restProps }) => {
  let isError = value === 'XXXXXX'
  if (restProps.column.name === 'weight' && ['AUTOCARRO'].includes(restProps.row.vehicleType)) {
    isError |= !value
  }
  if (restProps.column.name === 'vehicleType') {
    isError |= !['AUTOCARRO', 'AUTO', 'PULLMAN', 'AUTOARTICOLATO', 'RIMORCHIO', 'MOTOCICLO', 'MACCHINA OPERATRICE', 'VEICOLO SPECIALE', 'AUTOCARRO USO NOLEGGIO', 'AUTO USO NOLEGGIO', 'AUTO USO SCUOLA GUIDA', 'CICLOMOTORE', 'MACCHINA AGRICOLA', 'TRATTRICE AGRICOLA', 'AUTOCARAVAN', 'QUADRICICLO'].includes(value)
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
      <Tooltip
        placement="bottom"
        title={['productCode', 'coverageType', 'vehicleType'].includes(restProps.column.name) ? value : ''}
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
      </Tooltip>
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
  if (['prize', 'licensePlate', 'productCode', 'weight', 'coverageType', 'hasTowing', 'hasGlass', 'vehicleType'].includes(column.name)) {
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
