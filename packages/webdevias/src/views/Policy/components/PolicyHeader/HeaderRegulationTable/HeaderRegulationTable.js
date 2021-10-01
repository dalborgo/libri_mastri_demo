import React, { memo } from 'react'
import { makeStyles } from '@material-ui/styles'
import { Grid, Paper, TextField as TF, Toolbar } from '@material-ui/core'
import Icon from '@mdi/react'
import { mdiCalendarMultiselect } from '@mdi/js'
import Typography from '@material-ui/core/Typography'
import { connect, Field } from 'formik'
import compose from 'lodash/fp/compose'
import { cFunctions } from '@adapter/common'
import range from 'lodash/range'

const useStyles = makeStyles(theme => ({
  root: {},
  typoTitle: {
    marginRight: theme.spacing(2),
    color: theme.palette.grey[700],
  },
  icon: {
    position: 'relative',
    top: theme.spacing(1) - 2,
  },
  toolbar: {
    width: 800,
    padding: 13,
    paddingRight: theme.spacing(2),
    marginBottom: 10,
    marginTop: theme.spacing(4),
  },
}))

const HeaderRegulationTable = props => {
  const { formik: { handleChange, values }, generateRegDates, globalClass, isPolicy } = props
  console.log('values:', values)
  const classes = useStyles()
  const disabledRecFract = (values.regulationFract !== values.paymentFract) || (['ANNUAL', 'UNIQUE'].includes(values.regulationFract))
  const numberFract = values.regulationFract === 'UNIQUE' ? 1 : 12 / cFunctions.getFractMonths(values.regulationFract)
  return (
    <Toolbar
      className={classes.toolbar}
      component={Paper}
      id="headerRegForm"
      variant={'dense'}
    >
      <Grid
        alignItems="center"
        container
        justify="space-between"
        spacing={3}
      >
        <Grid item>
          <Typography className={classes.typoTitle} display="inline" variant="h6">
            <Icon className={classes.icon} path={mdiCalendarMultiselect} size={1}/>&nbsp;Date di Regolazione
          </Typography>
        </Grid>
        <Grid item>
          <Field
            as={TF}
            disabled={disabledRecFract}
            InputLabelProps={
              {
                shrink: true,
              }
            }
            InputProps={
              {
                classes: {
                  disabled: globalClass.fieldDisabled,
                },
                className: globalClass.fieldBack,
              }
            }
            label="Ricalcola Rate"
            name="isRecalculateFraction"
            onChange={
              async event => {
                await handleChange(event)
                generateRegDates()
              }
            }
            select
            SelectProps={{ native: true }}
            size="small"
            style={{ width: 100 }}
            variant="outlined"
          >
            <option
              value="NO"
            >
              NO
            </option>
            <option
              value="SI"
            >
              SI
            </option>
          </Field>&nbsp;&nbsp;&nbsp;
          <Field
            as={TF}
            disabled={isPolicy}
            InputLabelProps={
              {
                shrink: true,
              }
            }
            InputProps={
              {
                classes: {
                  disabled: globalClass.fieldDisabled,
                },
                className: globalClass.fieldBack,
              }
            }
            label="Frazionamento"
            name="regulationFract"
            onChange={
              async event => {
                await handleChange(event)
                generateRegDates()
              }
            }
            select
            SelectProps={{ native: true }}
            size="small"
            variant="outlined"
          >
            <option
              value="UNIQUE"
            >
              Unico
            </option>
            <option
              value="ANNUAL"
            >
              Annuale
            </option>
            <option
              value="SIX_MONTHLY"
            >
              Semestrale
            </option>
            <option
              value="FOUR_MONTHLY"
            >
              Quadrimestrale
            </option>
            <option
              value="THREE_MONTHLY"
            >
              Trimestrale
            </option>
            <option
              value="MONTHLY"
            >
              Mensile
            </option>
          </Field>&nbsp;&nbsp;&nbsp;
          <Field
            as={TF}
            disabled={!isPolicy}
            InputLabelProps={
              {
                shrink: true,
              }
            }
            style={{ width: 130 }}
            InputProps={
              {
                classes: {
                  disabled: globalClass.fieldDisabled,
                },
                className: globalClass.fieldBack,
              }
            }
            label="Ultima Rata Pagata"
            name="paidFract"
            onChange={
              async event => {
                await handleChange(event)
                generateRegDates()
              }
            }
            select
            SelectProps={{ native: true }}
            size="small"
            variant="outlined"
          >
            <option
              value={0}
            />
            {
              range(1, numberFract + 1).map(line => {
                return (
                  <option
                    value={line}
                    key={line}
                  >
                    {line}° Rata
                  </option>
                )
              })
            }
          </Field>
        </Grid>
      </Grid>
    </Toolbar>
  )
}

export default compose(
  connect,
  memo
)(HeaderRegulationTable)

