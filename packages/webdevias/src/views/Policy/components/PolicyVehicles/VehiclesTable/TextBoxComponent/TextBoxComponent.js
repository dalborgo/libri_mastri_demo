import React, { memo, useRef } from 'react'

import {
  Box,
  TextField,
} from '@material-ui/core'

import compose from 'lodash/fp/compose'
import { withSnackbar } from 'notistack'

import find from 'lodash/find'

const TextBoxComponent = props => {
  let { dispatch, specialAgreements, licensePlate, state, vehicles } = props
  const textFieldRef = useRef(null)
  return (
    <Box display="flex" mb={0.5}>
      <Box ml={2} mt={1}>
        {/* <Typography style={{ marginBottom: 5, marginTop: 5, marginLeft: 10 }} variant="h6">
          Note
        </Typography>*/}
        <TextField
          defaultValue={specialAgreements}
          inputRef={textFieldRef}
          label="Accordi speciali"
          multiline
          name="notes"
          onBlur={
            () => {
              const currentValue = textFieldRef.current?.value
              if (currentValue !== specialAgreements) {
                const newVehicles = [...vehicles]
                const found = find(vehicles, { licensePlate, state })
                if (found) {
                  found.specialAgreements = currentValue // Usa il valore aggiornato
                  dispatch({ type: 'setVehicles', vehicles: newVehicles })
                }
              }
            }
          }
          rows={4}
          rowsMax={8}
          style={{ width: 500, backgroundColor: '#e5e5e5' }}
          variant="outlined"
        />
      </Box>
      {/* <Box ml={1.5} mt={0.8}>
        <IconButton
          className={classes.iconButton}
          color={values.notes ? 'primary' : 'default'}
          onClick={() => setFieldValue('notes', '')}
        >
          <Icon path={mdiDeleteCircle} size={1}/>
        </IconButton>
      </Box>*/}
    </Box>
  )
}

export default compose(
  memo,
  withSnackbar
)(TextBoxComponent)


