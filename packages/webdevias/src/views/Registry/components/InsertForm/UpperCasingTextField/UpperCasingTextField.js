import React from 'react'
import MuiTextField from '@material-ui/core/TextField'
import { fieldToTextField } from 'formik-material-ui'

export default function UpperCasingTextField (props) {
  const {
    form: { setFieldValue },
    field: { name },
  } = props
  const onChange = React.useCallback(
    event => {
      const { value } = event.target
      setFieldValue(name, value ? value.toUpperCase() : '')
    },
    [setFieldValue, name]
  )
  return <MuiTextField {...fieldToTextField(props)} onChange={onChange}/>
}
