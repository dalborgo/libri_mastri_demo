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

const natura = [
  {
    id: '1',
    display: 'S.P.A.',
  },
  {
    id: '2',
    display: 'S.R.L.',
  },
  {
    id: '3',
    display: 'S.N.C.',
  },
  {
    id: '4',
    display: 'S.A.S.',
  },
  {
    id: '5',
    display: 'COOPERATIVA',
  },
  {
    id: '6',
    display: 'IMPRESA INDIVIDUALE',
  },
  {
    id: '7',
    display: 'S.S.',
  },
  {
    id: '8',
    display: 'ASSOCIAZ.',
  },
  {
    id: '9',
    display: 'CONSORZIO',
  },
  {
    id: '10',
    display: 'SOC.CONSORT.',
  },
  {
    id: '11',
    display: 'AZ. PROV.',
  },
  {
    id: '12',
    display: 'S.A.P.A.',
  },
  {
    id: '13',
    display: 'S.C.A.R.L.',
  },
  {
    id: '14',
    display: 'ENTE MORALE',
  },
  {
    id: '15',
    display: 'S.C.R.L.',
  },
  {
    id: '16',
    display: 'S.C.R.I.',
  },
  {
    id: '17',
    display: 'AZ. REG.',
  },
  {
    id: '18',
    display: 'AZ. SPEC.',
  },
  {
    id: '19',
    display: 'AZ. STAT.',
  },
  {
    id: '20',
    display: 'IMP. FAMIL.',
  },
  {
    id: '21',
    display: 'S.A.R.L.',
  },
  {
    id: '22',
    display: 'S.C.P.A.',
  },
  {
    id: '23',
    display: 'S.C.R.A.L.',
  },
  {
    id: '24',
    display: 'S.R.L.S.',
  },
  {
    id: '25',
    display: 'S.R.L.U.',
  },
  {
    id: '26',
    display: 'ENTE GIUR. DI DIR. PRIV.',
  },
  {
    id: '27',
    display: 'S.T.A.',
  },
  {
    id: '28',
    display: 'S.T.P.',
  },
  {
    id: '29',
    display: 'A.T.P.',
  },
  {
    id: '30',
    display: 'S.E.',
  },
  {
    id: '31',
    display: 'S.D.F.',
  },
]

const focus = event => event.target.select()
const InsertForm = ({ formik, activities = [] }) => {
  const id = formik.values.id
  const { setFieldValue, setFieldTouched, touched, errors } = formik
  const isPG = !!validation.valGlobalVAT(id)
  const classes = useStyles()
  const activitiesObj = useMemo(() => keyBy(activities, 'id'), [activities])
  const naturaObj = useMemo(() => keyBy(natura, 'id'), [])
  return (
    <form autoComplete="off">
      <Grid container spacing={3}>
        <Grid
          className={classes.gridHeight}
          item
        >
          <div style={{ display: 'inline-block', width: 150 }}>
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
          </div>
          <div style={{ display: 'inline-block', width: 180 }}>
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
          </div>
          <div style={{ display: 'inline-block', width: 140 }}>
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
                  return naturaObj[option]?.display ?? option.display
                }
              }
              getOptionSelected={(option, value) => option.id === value}
              name="natura"
              noOptionsText="Nessuna opzione"
              onBlur={
                () => {
                  setFieldTouched('natura', true)
                }
              }
              onChange={
                (_, value) => {
                  setFieldValue('natura', value?.id ?? null)
                }
              }
              options={natura}
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
                  label: 'Natura',
                  variant: 'outlined',
                  className: classes.fieldBack,
                  required: true,
                  style: { marginTop: 0 },
                  error: !!touched['natura'] && !!errors['natura'],
                }
              }
            />
            {
              touched['natura'] &&
              errors['natura'] &&
              <FormHelperText className={classes.formHelperText} error>
                {errors['natura']}
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
