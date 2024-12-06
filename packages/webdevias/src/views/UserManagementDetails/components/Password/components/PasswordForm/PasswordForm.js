import React, { useCallback, useState } from 'react'
import { UPDATE_USER_PASSWORD } from 'queries/users'
import { Field, Form, Formik } from 'formik'
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
import { makeStyles } from '@material-ui/styles'
import useAsyncError from 'helpers/useAsyncError'
import { useMutation } from '@apollo/react-hooks'
import { gestError } from 'helpers'
import compose from 'lodash/fp/compose'
import { object, string } from 'yup'
import { withSnackbar } from 'notistack'
import Visibility from '@material-ui/icons/Visibility'
import VisibilityOff from '@material-ui/icons/VisibilityOff'

const useStyles = makeStyles(theme => ({
  root: {
    maxWidth: 500,
  },
  saveButton: {
    color: theme.palette.white,
    backgroundColor: colors.green[600],
    '&:hover': {
      backgroundColor: colors.green[900],
    },
  },
}))

const PasswordSchema = object().shape({
  password: string()
    .required('Obbligatorio!')
    .min(4, 'La password deve contenere almeno 4 caratteri!'),
})

const focus = event => event.target.select()
const PasswordForm = props => {
  const { enqueueSnackbar, username, me } = props
  const throwError = useAsyncError()
  const classes = useStyles()
  const [updatePassword, { client }] = useMutation(UPDATE_USER_PASSWORD, {
    onError: gestError(throwError, enqueueSnackbar),
  })
  const [visibility, setVisibility] = useState(false)
  const handleClickShowPassword = () => {
    setVisibility(!visibility)
  }
  const handleUpdatePassword = useCallback(async (input, { resetForm }) => {
    const { password } = input
    client.writeData({ data: { loading: true } })
    const response = await updatePassword({
      variables: {
        password,
        username,
      },
    })
    client.writeData({ data: { loading: false } })
    if (response?.data?.updatePassword) {
      enqueueSnackbar('Password aggiornata', { variant: 'success' })
      resetForm()
    /*  if(username === me?.username) {
        const button = document.getElementById('hidden_exit')
        button && button.click()
      }*/
    }
  }, [client, enqueueSnackbar, updatePassword, username])
  return (
    <Card
      className={classes.root}
    >
      <Formik
        initialValues={
          {
            password: '',
          }
        }
        onSubmit={handleUpdatePassword}
        validationSchema={PasswordSchema}
      >
        {
          ({ isSubmitting, isValid, dirty, errors, touched }) => (
            <Form autoComplete="off">
              <CardHeader title="Inserisci la nuova password"/>
              <Divider/>
              <>
                <CardContent>
                  <Grid
                    container
                  >
                    <Grid
                      item
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
                    Aggiorna la Password
                  </Button>
                </CardActions>
              </>
            </Form>
          )
        }
      </Formik>
    </Card>
  )
}

export default compose(
  withSnackbar
)(PasswordForm)

