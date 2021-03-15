import React, { useMemo } from 'react'
import { connect, FastField, Field } from 'formik'
import { TextField } from 'formik-material-ui'
import { makeStyles } from '@material-ui/styles'
import { Grid } from '@material-ui/core'
import UpperCasingTextField from './UpperCasingTextField'
import { validation } from '@adapter/common'
import { Autocomplete } from 'material-ui-formik-components/Autocomplete'
import keyBy from 'lodash/keyBy'
import FormHelperText from '@material-ui/core/FormHelperText'
import parse from 'autosuggest-highlight/parse'
import { match } from 'helpers'

const useStyles = makeStyles(theme => ({
  fieldBack: {
    backgroundColor: theme.palette.grey[100],
  },
  field: {
    marginLeft: theme.spacing(2),
  },
  listBox: { overflowX: 'hidden' },
  gridHeight: {
    height: 60,
  },
  formHelperText: {
    marginLeft: 30,
    marginTop: -4,
  },
}))

const focus = event => event.target.select()
const InsertForm = ({ formik, activities = [] }) => {
  const id = formik.values.id
  const { setFieldValue, setFieldTouched, touched, errors } = formik
  const isPG = !!validation.valGlobalVAT(id)
  const classes = useStyles()
  const activitiesObj = useMemo(() => keyBy(activities, 'id'), [activities])
  return (
    <form autoComplete="off">
      <Grid container spacing={3}>
        <Grid
          className={classes.gridHeight}
          item
        >
          <FastField
            className={classes.field}
            component={UpperCasingTextField}
            InputProps={{ className: classes.fieldBack }}
            label="P.IVA / C.F."
            name="id"
            onFocus={focus}
            required
            size="small"
            variant="outlined"
          />
          <div style={{ display: 'inline-block', width: 250 }}>
            <FastField
              classes={
                {
                  listbox: classes.listBox,
                }
              }
              className={classes.field}
              component={Autocomplete}
              getOptionLabel={
                option => {
                  if (!option) {return ''}
                  return activitiesObj[option]?.display ?? option.display
                }
              }
              getOptionSelected={(option, value) => option.id === value}
              name="activity"
              noOptionsText="Nessuna opzione"
              onBlur={
                () => {
                  setFieldTouched('activity', true)
                }
              }
              onChange={
                (_, value) => {
                  setFieldValue('activity', value?.id ?? null)
                }
              }
              options={activities}
              renderOption={
                (option, { inputValue }) => {
                  const matches = match(option.display, inputValue)
                  const parts = parse(option.display, matches)
                  return (
                    <div>
                      {
                        parts.map((part, index) => (
                          <span
                            key={index}
                            style={
                              {
                                fontWeight: part.highlight ? 700 : 400,
                              }
                            }
                          >
                            {part.text}
                          </span>
                        ))
                      }
                    </div>
                  )
                }
              }
              required
              size={'small'}
              textFieldProps={
                {
                  label: 'Attività',
                  variant: 'outlined',
                  className: classes.fieldBack,
                  required: true,
                  style: { marginTop: 0 },
                  error: !!touched['activity'] && !!errors['activity'],
                }
              }
            />
            {
              touched['activity'] &&
              errors['activity'] &&
              <FormHelperText className={classes.formHelperText} error>
                {errors['activity']}
              </FormHelperText>
            }
          </div>
          <Field
            className={classes.field}
            component={TextField}
            InputProps={{ className: classes.fieldBack }}
            label="Ragione Sociale / Cognome"
            name="surname"
            onFocus={focus}
            required
            size="small"
            variant="outlined"
          />
          <FastField
            className={classes.field}
            component={TextField}
            disabled={isPG}
            InputProps={{ className: classes.fieldBack }}
            label="Nome"
            name="name"
            onFocus={focus}
            required
            size="small"
            style={
              {
                width: 120,
              }
            }
            variant="outlined"
          />
        </Grid>
        <Grid
          className={classes.gridHeight}
          item
        >
          <FastField
            className={classes.field}
            component={TextField}
            InputProps={{ className: classes.fieldBack }}
            label="indirizzo"
            name="address"
            onFocus={focus}
            size="small"
            variant="outlined"
          />
          <FastField
            className={classes.field}
            component={TextField}
            InputProps={{ className: classes.fieldBack }}
            label="Numero"
            name="address_number"
            onFocus={focus}
            size="small"
            style={
              {
                width: 100,
              }
            }
            variant="outlined"
          />
          <FastField
            className={classes.field}
            component={TextField}
            InputProps={
              {
                className: classes.fieldBack,
              }
            }
            label="Cap"
            name="zip"
            onFocus={focus}
            size="small"
            style={
              {
                width: 100,
              }
            }
            variant="outlined"
          />
          <FastField
            className={classes.field}
            component={TextField}
            InputProps={{ className: classes.fieldBack }}
            label="Città"
            name="city"
            onFocus={focus}
            size="small"
            variant="outlined"
          />
          <FastField
            className={classes.field}
            component={UpperCasingTextField}
            InputProps={{ className: classes.fieldBack }}
            label="Provincia"
            name="state"
            onFocus={focus}
            size="small"
            style={
              {
                width: 100,
              }
            }
            variant="outlined"
          />
        </Grid>
      </Grid>
    </form>
  )
}

export default connect(InsertForm)
