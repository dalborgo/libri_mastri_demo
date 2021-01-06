import React from 'react'
import { DataTypeProvider } from '@devexpress/dx-react-grid'
import { cDate, numeric } from '@adapter/common'
import { IconButton, Input, InputAdornment, MenuItem, Select, TextField } from '@material-ui/core'
import NumberFormatComp from 'components/NumberFormatComp'
import { KeyboardDatePicker, KeyboardDateTimePicker, MuiPickersUtilsProvider } from '@material-ui/pickers'
import moment from 'moment'
import MomentUtils from '@date-io/moment'
import Event from '@material-ui/icons/Event'
import { SearchPanel } from '@devexpress/dx-react-grid-material-ui'
import Icon from '@mdi/react'
import { mdiClose } from '@mdi/js'

const newLocale = 'it'
require(`moment/locale/${newLocale}`)
moment.locale(newLocale)

const focus = event => event.target.select()
const NumberFormatter = ({ column, row, value }) => {
  return value || value === 0 ? numeric.printDecimal(value) : ''
}
const BooleanEditor = ({ value, onValueChange }) => (
  <Select
    fullWidth
    input={<Input/>}
    onChange={
      event => {
        onValueChange(event.target.value)
      }
    }
    style={{ textAlign: 'center' }}
    value={value || 'NO'}
  >
    <MenuItem value="SI">
      SI
    </MenuItem>
    <MenuItem value="NO">
      NO
    </MenuItem>
  </Select>
)

const NumberEditor = (props) => {
  const { value, onValueChange, disabled } = props
  if (disabled) {
    return (
      <div style={{ textAlign: 'right' }}>
        {numeric.printDecimal(value)}
      </div>
    )
  } else {
    return (
      <div style={{ textAlign: 'right' }}>
        <TextField
          defaultValue={value}
          disabled={disabled}
          InputProps={
            {
              inputComponent: NumberFormatComp,
              inputProps: {
                thousandSeparator: '.',
                decimalScale: 2,
                fixedDecimalScale: 2,
              },
            }
          }
          onChange={
            event => {
              onValueChange(event.target.value)
            }
          }
          onFocus={focus}
        />
      </div>
    )
  }
}

// eslint-disable-next-line no-unused-vars
const DateEditorText = ({ value, onValueChange, column }) => {
  return (
    <div style={{ textAlign: column.editAlign || 'center' }}>
      <Input
        defaultValue={value}
        inputProps={{ style: { textAlign: 'center' } }}
        onChange={
          event => {
            onValueChange(event.target.value)
          }
        }
        onFocus={focus}
        placeholder="aaaa-mm-gg"
      />
    </div>
  )
}

const TimeEditorText = (props) => {
  const { value, onValueChange, disabled } = props
  if (disabled) {
    return (
      <div style={{ textAlign: 'center' }}>
        {numeric.printDecimal(value)}
      </div>
    )
  } else {
    return (
      <div style={{ textAlign: 'center' }}>
        <TextField
          defaultValue={value}
          disabled={disabled}
          InputProps={
            {
              inputComponent: NumberFormatComp,
              inputProps: {
                format: '##:##',
                textAlign: 'left',
              },
            }
          }
          onChange={
            event => {
              const roundHour = cDate.roundTextTime(event.target.value)
              onValueChange(roundHour)
            }
          }
          onFocus={focus}
          style={{ width: 35 }}
        />
      </div>
    )
  }
}

const DateEditor = ({ value, onValueChange, column, disabled }) => {
  if (disabled) {
    return (
      <div>
        {cDate.mom(value, null, 'DD/MM/YYYY')}
      </div>
    )
  } else {
    return (
      <div style={{ textAlign: column.editAlign || 'center', marginTop: 3 }}>
        <MuiPickersUtilsProvider
          locale={newLocale}
          moment={moment}
          utils={MomentUtils}
        >
          <KeyboardDatePicker
            animateYearScrolling={false}
            autoOk
            cancelLabel="Annulla"
            clearable
            clearLabel="Pulisci"
            emptyLabel="gg/mm/aaaa"
            format="DD/MM/YYYY"
            inputProps={{ style: { textAlign: 'center' } }}
            invalidDateMessage={null}
            KeyboardButtonProps={{ tabIndex: '-1' }}
            keyboardIcon={<Event style={{ fontSize: 20 }}/>}
            onChange={
              date => {
                onValueChange(date)
              }
            }
            onFocus={focus}
            size="small"
            value={value || null}
          />
        </MuiPickersUtilsProvider>
      </div>
    )
  }
}

const DateTimeEditor = ({ value, onValueChange, column, disabled }) => {
  if (disabled) {
    return (
      <div>
        {cDate.mom(value, null, 'DD/MM/YYYY HH:mm')}
      </div>
    )
  } else {
    return (
      <div style={{ textAlign: column.editAlign || 'center', marginTop: 3 }}>
        <MuiPickersUtilsProvider
          locale={newLocale}
          moment={moment}
          utils={MomentUtils}
        >
          <KeyboardDateTimePicker
            ampm={false}
            animateYearScrolling={false}
            autoOk
            cancelLabel="Annulla"
            clearable
            clearLabel="Pulisci"
            emptyLabel="gg/mm/aaaa oo:mm"
            format="DD/MM/YYYY HH:mm"
            hideTabs
            inputProps={{ style: { textAlign: 'center' } }}
            invalidDateMessage={null}
            KeyboardButtonProps={{ tabIndex: '-1' }}
            keyboardIcon={<Event style={{ fontSize: 20 }}/>}
            minutesStep={30}
            onChange={
              date => {
                const roundDate = cDate.roundNearestMinutes(date)
                onValueChange(roundDate)
              }
            }
            onFocus={focus}
            size="small"
            value={value || null}
          />
        </MuiPickersUtilsProvider>
      </div>
    )
  }
}

const TextEditor = ({ value, onValueChange, disabled, column }) => (
  !disabled ?
    <Input
      defaultValue={value}
      inputProps={{ style: { textAlign: column.editAlign || 'center' } }}
      onChange={
        event => {
          onValueChange(event.target.value)
        }
      }
      onFocus={focus}
    />
    :
    <div style={{ textAlign: column.editAlign || 'center' }}>
      {value}
    </div>
)

// eslint-disable-next-line no-unused-vars
const BooleanEditorNative = ({ value, onValueChange }) => (
  <Select
    fullWidth
    native
    onChange={
      event => {
        onValueChange(event.target.value)
      }
    }
    value={value || 'NO'}
  >
    <option value="SI">SI</option>
    <option value="NO">NO</option>
  </Select>
)

const DateFormatter = ({ value }) => {
  if (!value) {
    return null
  }
  const date = cDate.mom(value, 'YYYY-MM-DD', 'DD/MM/YYYY')
  return date === 'Invalid date' ? 'Non valida' : date
}

const DateTimeFormatter = ({ value }) => {
  if (!value) {
    return null
  }
  const date = cDate.mom(value, 'YYYY-MM-DD HH:mm', 'DD/MM/YYYY HH:mm')
  return date === 'Invalid date' ? 'Non valida' : date
}
const TimeFormatter = ({ value }) => {
  if (!value) {
    return null
  }
  return value
}

export const NumberTypeProvider = props => (
  <DataTypeProvider
    editorComponent={NumberEditor}
    formatterComponent={NumberFormatter}
    {...props}
  />
)

export const DateTypeProvider = props => (
  <DataTypeProvider
    editorComponent={DateEditor}
    formatterComponent={DateFormatter}
    {...props}
  />
)

export const DateTimeTypeProvider = props => (
  <DataTypeProvider
    editorComponent={DateTimeEditor}
    formatterComponent={DateTimeFormatter}
    {...props}
  />
)

export const TimeTextTypeProvider = props => (
  <DataTypeProvider
    editorComponent={TimeEditorText}
    formatterComponent={TimeFormatter}
    {...props}
  />
)

export const TextTypeProvider = props => (
  <DataTypeProvider
    editorComponent={TextEditor}
    {...props}
  />
)

export const BooleanTypeProvider = props => (
  <DataTypeProvider
    editorComponent={BooleanEditor}
    {...props}
  />
)

export const SearchInput = props => (
  <SearchPanel.Input
    {...props}
    endAdornment={
      <InputAdornment position="end">
        <IconButton
          onClick={() => props.onValueChange('')}
          style={
            {
              color: 'gray',
              padding: 5,
            }
          }
        >
          <Icon path={mdiClose} size={0.8}/>
        </IconButton>
      </InputAdornment>
    }
    onFocus={focus}
  />
)

