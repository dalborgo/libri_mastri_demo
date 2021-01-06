import React, { memo } from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'
import { makeStyles } from '@material-ui/styles'
import { Button, Card, CardActions, CardContent, CardHeader, colors, Divider, Grid } from '@material-ui/core'
import { FastField, Field, Form, Formik } from 'formik'
import { REGISTRY_ADD_FRAGMENT } from 'queries/registries'
import { object, string } from 'yup'
import { TextField } from 'formik-material-ui'
import { cGraphQL } from '@adapter/common'
import UpperCasingTextField from 'views/Registry/components/InsertForm/UpperCasingTextField/UpperCasingTextField'

const useStyles = makeStyles(theme => ({
  root: {},
  saveButton: {
    color: theme.palette.white,
    backgroundColor: colors.green[600],
    '&:hover': {
      backgroundColor: colors.green[900],
    },
  },
}))

const CreateSchema = object().shape({
  email: string()
    .email('Email non valida!')
    .required('Obbligatorio!'),
  vat: string()
    .required('Obbligatorio!'),
  surname: string()
    .required('Obbligatorio!'),
})

const focus = event => event.target.select()
const CreationCard = props => {
  const { className, handleCreate } = props
  const classes = useStyles()
  return (
    <Card
      className={clsx(classes.root, className)}
    >
      <CardHeader title="Inserisci Profilo"/>
      <Divider/>
      <Formik
        initialValues={
          {
            ...cGraphQL.formInitialByFragment(REGISTRY_ADD_FRAGMENT),
          }
        }
        onSubmit={handleCreate}
        validationSchema={CreateSchema}
      >
        {
          ({ values, isSubmitting, isValid, dirty }) => (
            <Form autoComplete="off">
              <CardContent>
                <Grid
                  container
                  spacing={3}
                >
                  <Grid
                    item
                    md={6}
                    sm={6}
                    xs={12}
                  >
                    <Field
                      component={TextField}
                      fullWidth
                      label="Partita Iva"
                      name="vat"
                      onFocus={focus}
                      required
                      variant="outlined"
                    />
                  </Grid>
                  <Grid
                    item
                    md={6}
                    sm={6}
                    xs={12}
                  />
                  <Grid
                    item
                    md={6}
                    xs={12}
                  >
                    <FastField
                      component={TextField}
                      fullWidth
                      label="Ragione Sociale"
                      name="surname"
                      onFocus={focus}
                      required
                      variant="outlined"
                    />
                  </Grid>
                  <Grid
                    item
                    md={6}
                    xs={12}
                  >
                    <FastField
                      component={TextField}
                      fullWidth
                      label="Pec"
                      name="email"
                      onFocus={focus}
                      required
                      variant="outlined"
                    />
                  </Grid>
                  <Grid
                    item
                    md={3}
                    xs={12}
                  >
                    <FastField
                      component={TextField}
                      fullWidth
                      label="Indirizzo"
                      name="address"
                      onFocus={focus}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid
                    item
                    md={2}
                    xs={6}
                  >
                    <FastField
                      component={TextField}
                      fullWidth
                      label="Numero"
                      name="address_number"
                      onFocus={focus}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid
                    item
                    md={2}
                    xs={6}
                  >
                    <FastField
                      component={TextField}
                      fullWidth
                      label="Cap"
                      name="zip"
                      onFocus={focus}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid
                    item
                    md={3}
                    xs={6}
                  >
                    <FastField
                      component={TextField}
                      fullWidth
                      label="Città"
                      name="city"
                      onFocus={focus}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid
                    item
                    md={2}
                    xs={6}
                  >
                    <FastField
                      component={UpperCasingTextField}
                      fullWidth
                      label="Provincia"
                      name="state"
                      onFocus={focus}
                      variant="outlined"
                    />
                  </Grid>
                </Grid>
              </CardContent>
              <Divider/>
              <CardActions>
                <Button
                  className={classes.saveButton}
                  disabled={isSubmitting || !isValid || !dirty}
                  type="submit"
                  variant="contained"
                >
                  Crea Società di Leasing
                </Button>
              </CardActions>
            </Form>
          )
        }
      </Formik>
    </Card>
  )
}

CreationCard.propTypes = {
  className: PropTypes.string,
  handleCreate: PropTypes.any,
}

export default memo(CreationCard)
