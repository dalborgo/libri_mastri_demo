import React, { memo, useMemo } from 'react'
import { makeStyles } from '@material-ui/styles'
import compose from 'lodash/fp/compose'
import { getRolesArray, roleName } from 'helpers/normalize'
import { useQuery } from '@apollo/react-hooks'
import { ME, TO_SELECT_USERS, USER_EDIT_FRAGMENT } from 'queries/users'
import { gestError, useAsyncError } from 'helpers'
import { Button, Card, CardActions, CardContent, CardHeader, colors, Divider, Grid } from '@material-ui/core'
import clsx from 'clsx'
import { CircularIndeterminate } from 'components/Progress'
import { object, string } from 'yup'
import { FastField, Field, Form, Formik } from 'formik'
import { TextField } from 'formik-material-ui'
import { cGraphQL } from '@adapter/common'
import UpperCasingTextField from 'views/Registry/components/InsertForm/UpperCasingTextField'

const EditSchema = object().shape({
  email: string()
    .email('Email non valida!'),
  vat: string()
    .required('Obbligatorio!'),
  longName: string()
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
  const { className, handleEdit, ...user } = props
  const throwError = useAsyncError()
  const { data, loading, called, client } = useQuery(TO_SELECT_USERS, {
    variables: {
      skip: user.id,
    },
    onError: gestError(throwError),
  })
  const { me: { priority } } = client.readQuery({ query: ME })
  const { toSelectUsers } = data || {}
  const classes = useStyles()
  const roles = useMemo(() => getRolesArray(['GUEST']), [])
  return (
    <Card
      className={clsx(classes.root, className)}
    >
      <Formik
        initialValues={
          {
            ...cGraphQL.formInitialByFragment(USER_EDIT_FRAGMENT, user),
          }
        }
        onSubmit={handleEdit}
        validationSchema={EditSchema}
      >
        {
          ({ values, isSubmitting, isValid, dirty }) => (
            <Form autoComplete="off">
              <CardHeader title="Profilo"/>
              <Divider/>
              {
                called && !loading ?
                  <>
                    <CardContent>
                      <Grid
                        container
                        spacing={4}
                      >
                        <Grid
                          item
                          md={4}
                          xs={12}
                        >
                          <FastField
                            component={TextField}
                            fullWidth
                            label="Nome Lungo"
                            name="longName"
                            onFocus={focus}
                            required
                            variant="outlined"
                          />
                        </Grid>
                        <Grid
                          item
                          md={4}
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
                          md={4}
                          xs={12}
                        >
                          <FastField
                            component={TextField}
                            fullWidth
                            label="Email"
                            name="email"
                            onFocus={focus}
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
                            name="addressNumber"
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
                        <Grid
                          item
                          md={6}
                          xs={12}
                        >
                          <Field
                            component={TextField}
                            disabled={priority < 4}
                            fullWidth
                            InputLabelProps={
                              {
                                shrink: true,
                              }
                            }
                            label="Ruolo"
                            name="role"
                            select
                            SelectProps={{ native: true }}
                            variant="outlined"
                          >
                            {
                              roles.map(role => (
                                <option
                                  key={role.name}
                                  value={role.name}
                                >
                                  {roleName(role.name)}
                                </option>
                              ))
                            }
                          </Field>
                        </Grid>
                        <Grid
                          item
                          md={6}
                          xs={12}
                        >
                          {
                            ['SUB_AGENT', 'COLLABORATOR'].includes(values.role)
                              ?
                              <Field
                                component={TextField}
                                disabled={priority < 4}
                                fullWidth
                                InputLabelProps={
                                  {
                                    shrink: true,
                                  }
                                }
                                label={values.role === 'SUB_AGENT' ? 'Intermediario' : 'Intermediario / Filiale'}
                                name="father"
                                select
                                SelectProps={{ native: true }}
                                variant="outlined"
                              >
                                {
                                  
                                  toSelectUsers.reduce((prev, curr) => {
                                    if (values.role === 'SUB_AGENT' && curr.role === 'SUB_AGENT') {return prev}
                                    prev.push(
                                      <option
                                        key={curr.id}
                                        value={curr.id}
                                      >
                                        {roleName(curr.username)}
                                      </option>
                                    )
                                    return prev
                                  }, [])
                                }
                              </Field>
                              :
                              <div/>
                          }
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
                  </>
                  :
                  <CircularIndeterminate/>
              }
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

