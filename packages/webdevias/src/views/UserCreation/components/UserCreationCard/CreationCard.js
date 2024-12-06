import React, { memo, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'
import { makeStyles } from '@material-ui/styles'
import Visibility from '@material-ui/icons/Visibility'
import VisibilityOff from '@material-ui/icons/VisibilityOff'
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  colors,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput,
} from '@material-ui/core'
import { FastField, Field, Form, Formik } from 'formik'
import { TO_SELECT_USERS, USER_ADD_FRAGMENT } from 'queries/users'
import { object, string } from 'yup'
import { gestError, getRolesArray, roleName, useAsyncError } from 'helpers'
import { useQuery } from '@apollo/react-hooks'
import { TextField } from 'formik-material-ui'
import log from '@adapter/common/src/log'
import { CircularIndeterminate } from 'components/Progress'
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
    .email('Email non valida!'),
  longName: string()
    .required('Obbligatorio!'),
  password: string()
    .required('Obbligatorio!'),
  vat: string()
    .required('Obbligatorio!'),
  username: string().max(20, 'Lunghezza massima 20 caratteri!').matches(/[a-zA-Z0-9_&. -]+$/, 'Caratteri speciali non consentiti!', true)
    .required('Obbligatorio!'),
})

const focus = event => event.target.select()
const CreationCard = props => {
  const { className, handleCreate } = props
  const throwError = useAsyncError()
  const { data, loading, called } = useQuery(TO_SELECT_USERS, {
    onError: gestError(throwError),
  })
  const [visibility, setVisibility] = useState(false)
  const handleClickShowPassword = () => {
    setVisibility(!visibility)
  }
  log.debug('called', called)
  log.debug('loading', loading)
  const { toSelectUsers } = data || {}
  const classes = useStyles()
  const roles = useMemo(() => getRolesArray(['GUEST']), [])
  log.debug('roles', roles)
  log.debug('toSelectUsers', toSelectUsers)
  return (
    <Card
      className={clsx(classes.root, className)}
    >
      <CardHeader title="Inserisci Profilo"/>
      <Divider/>
      {
        called && !loading ?
          <>
            <Formik
              initialValues={
                {
                  ...cGraphQL.formInitialByFragment(USER_ADD_FRAGMENT),
                  father: toSelectUsers[0].id,
                  role: 'AGENT',
                }
              }
              onSubmit={handleCreate}
              validationSchema={CreateSchema}
            >
              {
                ({ values, isSubmitting, isValid, dirty, errors, touched }) => (
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
                            label="Username"
                            name="username"
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
                        >
                          <FormControl fullWidth variant="outlined">
                            <InputLabel
                              error={errors.password && touched.password}
                              htmlFor="outlined-adornment-password"
                              required
                            >Password
                            </InputLabel>
                            <Field
                              as={OutlinedInput}
                              endAdornment={
                                <InputAdornment position="end">
                                  <IconButton
                                    aria-label="Toggle password visibility"
                                    onClick={handleClickShowPassword}
                                    tabIndex="-1"
                                  >
                                    {visibility ? <VisibilityOff/> : <Visibility/>}
                                  </IconButton>
                                </InputAdornment>
                              }
                              error={errors.password && touched.password}
                              label="Password"
                              name="password"
                              onFocus={focus}
                              required
                              type={visibility ? 'text' : 'password'}
                            />
                            {
                              errors.password && touched.password
                                ? <FormHelperText error id="username-helper-text">{errors.password}</FormHelperText>
                                : null
                            }
                          </FormControl>
                        </Grid>
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
                          sm={6}
                          xs={12}
                        >
                          <Field
                            component={TextField}
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
                          sm={6}
                          xs={12}
                        >
                          {
                            ['SUB_AGENT', 'COLLABORATOR'].includes(values.role)
                              ?
                              <Field
                                component={TextField}
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
                        Crea Utente
                      </Button>
                    </CardActions>
                  </Form>
                )
              }
            </Formik>
          </>
          :
          <CircularIndeterminate/>
      }
    </Card>
  )
}

CreationCard.propTypes = {
  className: PropTypes.string,
  handleCreate: PropTypes.any,
}

export default memo(CreationCard)
