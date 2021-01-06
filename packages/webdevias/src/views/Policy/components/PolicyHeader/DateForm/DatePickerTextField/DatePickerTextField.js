import React from 'react'
import { KeyboardDatePicker } from '@material-ui/pickers'
import { fieldToTextField } from 'formik-material-ui'

export default function DatePickerTextField (props) {
  const { generateDates, generateRegDates, ...rest } = props
  const {
    form: { setFieldValue },
    field: { name },
  } = props
  const onChange = React.useCallback(
    async value => {
      await setFieldValue(name, value)
      const date = String(value)
      if (date !== 'Invalid date') {
        generateDates()
        generateRegDates()
      }
    },
    [setFieldValue, name, generateDates, generateRegDates]
  )
  
  return <KeyboardDatePicker {...fieldToTextField(rest)} onChange={onChange}/>
}
