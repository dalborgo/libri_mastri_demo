import React, { memo } from 'react'
import { makeStyles } from '@material-ui/styles'
import compose from 'lodash/fp/compose'
import { REGISTRY_EDIT_FRAGMENT } from 'queries/registries'
import { Button, Card, CardActions, CardContent, CardHeader, colors, Divider, Grid } from '@material-ui/core'
import clsx from 'clsx'
import { object, string } from 'yup'
import { FastField, Form, Formik } from 'formik'
import { TextField } from 'formik-material-ui'
import { cGraphQL } from '@adapter/common'
import UpperCasingTextField from 'views/Registry/components/InsertForm/UpperCasingTextField'

const EditSchema = object().shape({
  email: string()
    .email('Email non valida!')
    .required('Obbligatorio!'),
  surname: string()
    .required('Obbligatorio!'),
})

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
const focus = event => event.target.select()
const GeneralSettings = props => {
  const { className, handleEdit, ...registry } = props
  const classes = useStyles()
  return (
    <Card
      className={clsx(classes.root, className)}
    >
      <Formik
        initialValues={
          {
            ...cGraphQL.formInitialByFragment(REGISTRY_EDIT_FRAGMENT, registry),
          }
        }
        onSubmit={handleEdit}
        validationSchema={EditSchema}
      >
        {
          ({ isSubmitting, isValid, dirty }) => (
            <Form autoComplete="off">
              <CardHeader title="Profilo"/>
              <Divider/>
              <CardContent>
                <Grid
                  container
                  spacing={4}
                >
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
                      InputProps={
                        {
                          inputProps: {
                            textAlign: 'left',
                          },
                        }
                      }
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
                  Salva le Modifiche
                </Button>
              </CardActions>
            </Form>
          )
        }
      </Formik>
    </Card>
  )
}

export default compose(
  memo
)(GeneralSettings)

