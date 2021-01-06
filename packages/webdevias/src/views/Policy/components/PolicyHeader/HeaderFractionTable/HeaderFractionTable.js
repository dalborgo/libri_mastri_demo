import React, { memo } from 'react'
import { makeStyles } from '@material-ui/styles'
import { Grid, Paper, TextField as TF, Toolbar } from '@material-ui/core'
import Icon from '@mdi/react'
import { mdiCalendarMonth } from '@mdi/js'
import Typography from '@material-ui/core/Typography'
import { connect, Field } from 'formik'
import compose from 'lodash/fp/compose'

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
    marginTop: theme.spacing(2),
  },
}))

const HeaderFractionTable = props => {
  const { formik: { handleChange, values }, dispatch, globalClass, generateRegDates, isPolicy } = props
  const classes = useStyles()
  return (
    <Toolbar
      className={classes.toolbar}
      component={Paper}
      id="headerFractForm"
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
            <Icon className={classes.icon} path={mdiCalendarMonth} size={1}/>&nbsp;Date di Pagamento
          </Typography>
        </Grid>
        <Grid item>
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
            name="paymentFract"
            onChange={
              async event => {
                await handleChange(event)
                if (values?.isRecalculateFraction === 'SI') {
                  await generateRegDates()
                }
                dispatch({ type: 'setFractions', paymentFract: event.target.value })
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
          </Field>
        </Grid>
      </Grid>
    </Toolbar>
  )
}

export default compose(
  connect,
  memo
)(HeaderFractionTable)

