import { TableFixedColumns, TableHeaderRow, Toolbar, VirtualTable } from '@devexpress/dx-react-grid-material-ui'
import { useTheme, withStyles } from '@material-ui/styles'
import React, { useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Input,
  MenuItem,
  Select,
  TableCell,
  TextField,
  Tooltip,
} from '@material-ui/core'
import MuiTableHead from 'theme/overrides/MuiTableHead'
import Icon from '@mdi/react'
import { mdiPencilCircle } from '@mdi/js'
import VEHICLE_LIST from '../vehicleUseList.json'

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
  values, value, onValueChange, classes, hide, className, style, theme, name = '', extra,
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
            onChange={
              event => {
                if (name === 'vehicleType') {
                  const list = VEHICLE_LIST.filter(value => value['Descrizione'] === event.target.value)
                  extra([...new Set(list.map(value => value['Uso']))])
                }
                onValueChange(event.target.value)
              }
            }
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
const DialogEditCellBase = ({ value, onValueChange, className, style }) => {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState(value || '')
  const handleClose = () => {
    setOpen(false)
  }
  
  const handleSave = () => {
    onValueChange(text)
    setOpen(false)
  }
  
  return (
    <TableCell className={className} style={{ ...style, textAlign: 'right' }}>
      <IconButton
        onClick={() => setOpen(true)}
        style={{ color: value ? 'red' : undefined }}
      >
        <Icon path={mdiPencilCircle} size={1}/>
      </IconButton>
      <Dialog fullWidth onClose={handleClose} open={open}>
        <DialogTitle>Condizioni personalizzate</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            onChange={event => setText(event.target.value)}
            onFocus={event => event.target.select()}
            rows={4}
            value={text}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Annulla</Button>
          <Button color="primary" onClick={handleSave}>OK</Button>
        </DialogActions>
      </Dialog>
    </TableCell>
  )
}

export const DialogEditCell = withStyles(styles, { withTheme: true })(DialogEditCellBase)

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
    isError |= ![
      'AUTOCARRO',
      'AUTO',
      'PULLMAN',
      'AUTOARTICOLATO',
      'RIMORCHIO',
      'MOTOCICLO',
      'MACCHINA OPERATRICE',
      'VEICOLO SPECIALE',
      'AUTOCARRO USO NOLEGGIO',
      'AUTO USO NOLEGGIO',
      'AUTO USO SCUOLA GUIDA',
      'CICLOMOTORE',
      'MACCHINA AGRICOLA',
      'TRATTRICE AGRICOLA',
      'AUTOCARAVAN',
      'QUADRICICLO',
      'QUADRICICLO TRASPORTO COSE',
      'QUADRICICLO TRASPORTO PERSONE',
    ].includes(value)
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
  const { column, row, value } = props
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
  if ('custom' === column.name) {
    return (
      <VirtualTable.Cell
        style={
          {
            ...style,
            ...stateStyle,
          }
        }
        {...restProps}
      >
        <Tooltip disableHoverListener={!value} placement="top" title={value || ''}>
          <span style={{ cursor: value ? 'help' : undefined }}>
            <IconButton
              disabled
              onClick={() => null}
              style={{ color: value ? '#E17E7E' : undefined }}
            >
              <Icon path={mdiPencilCircle} size={1}/>
            </IconButton>
          </span>
        </Tooltip>
      </VirtualTable.Cell>
    )
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
