import React, { useEffect, useState } from 'react'
import clsx from 'clsx'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/styles'
import {
  Button,
  FormControl,
  FormHelperText,
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  TextField,
} from '@material-ui/core'
import { ME, SIGNIN } from 'queries'
import { gestError, useAsyncError } from 'helpers'
import log from '@adapter/common/src/log'
import { useMutation } from '@apollo/react-hooks'
import { withSnackbar } from 'notistack'
import compose from 'lodash/fp/compose'
import { getPriority } from 'localstate/helpers'
import Visibility from '@material-ui/icons/Visibility'
import VisibilityOff from '@material-ui/icons/VisibilityOff'

const validate = require('validate.js')

const schema = {
  username: {
    presence: { allowEmpty: false, message: 'è obbligatorio!' },
    length: {
      maximum: 64,
      tooLong: 'troppo lungo: massimo %{count} caratteri!',
    },
  },
  password: {
    presence: { allowEmpty: false, message: 'è obbligatoria!' },
    length: {
      minimum: 4,
      maximum: 64,
      tooShort: 'troppo corta: minimo %{count} caratteri!',
    },
  },
}

const useStyles = makeStyles(theme => ({
  root: {},
  fields: {
    margin: theme.spacing(-1),
    display: 'flex',
    flexWrap: 'wrap',
    '& > *': {
      flexGrow: 1,
      margin: theme.spacing(1),
    },
  },
  submitButton: {
    marginTop: theme.spacing(2),
    width: '100%',
  },
}))

const focus = event => event.target.select()

const LoginForm = props => {
  const { className, enqueueSnackbar } = props
  const classes = useStyles()
  const throwError = useAsyncError()
  const [signIn, { data, called, loading, error, client }] = useMutation(SIGNIN, {
    onError: gestError(throwError, enqueueSnackbar),
    update (cache, { data: { signIn } }) {
      const { me: { pathRef } } = client.readQuery({ query: ME })
      cache.writeQuery({
        query: ME,
        data: { me: { ...signIn, priority: getPriority(cache, signIn.role), pathRef } },
      })
    },
  })
  
  log.debug('data', {
    data, called, loading, error,
  })
  
  const [formState, setFormState] = useState({
    isValid: false,
    showPassword: false,
    values: {
      username: '',
      password: '',
    },
    touched: {},
    errors: {},
  })
  
  const handleClickShowPassword = () => {
    setFormState({ ...formState, showPassword: !formState.showPassword })
  }
  
  const handleMouseDownPassword = event => {
    event.preventDefault()
  }
  
  useEffect(() => {
    const errors = validate(formState.values, schema)
    
    setFormState(formState => ({
      ...formState,
      isValid: !errors,
      errors: errors || {},
    }))
  }, [formState.values])
  
  const handleChange = event => {
    event.persist()
    //this set state can occurred in async manner, so it's correct to prevent the "pooled" synthetic events with event.persist()
    setFormState(formState => ({
      ...formState,
      values: {
        ...formState.values,
        [event.target.name]:
          event.target.type === 'checkbox'
            ? event.target.checked
            : event.target.value,
      },
      touched: {
        ...formState.touched,
        [event.target.name]: true,
      },
    }))
  }
  
  const handleSignIn = async event => {
    try {
      event.preventDefault()
      const { username, password } = formState.values
      client.writeData({ data: { loading: true } })
      await signIn({ variables: { username, password } })
      client.writeData({ data: { loading: false } })
    } catch (err) {
      throwError(err.message)
    }
  }
  
  const hasError = field => !!(formState.touched[field] && formState.errors[field])
  
  return (
    <form
      className={clsx(classes.root, className)}
      onSubmit={handleSignIn}
    >
      <div className={classes.fields}>
        <TextField
          error={hasError('username')}
          fullWidth
          helperText={hasError('username') ? formState.errors.username[0] : null}
          label="Nome Utente"
          name="username"
          onChange={handleChange}
          onFocus={focus}
          value={formState.values.username || ''}
          variant="outlined"
        />
        <FormControl variant="outlined">
          <InputLabel htmlFor="outlined-adornment-password">Password</InputLabel>
          <OutlinedInput
            endAdornment={
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  edge="end"
                  onClick={handleClickShowPassword}
                  onMouseDown={handleMouseDownPassword}
                  tabIndex="-1"
                >
                  {formState.showPassword ? <Visibility/> : <VisibilityOff/>}
                </IconButton>
              </InputAdornment>
            }
            labelWidth={64}
            name="password"
            onChange={handleChange}
            onFocus={focus}
            type={formState.showPassword ? 'text' : 'password'}
            value={formState.values.password || ''}
          />
          {
            hasError('password') &&
            <FormHelperText error id="username-helper-text">{formState.errors.password[0] || null}</FormHelperText>
          }
        </FormControl>
      </div>
      <Button
        className={classes.submitButton}
        color="secondary"
        disabled={!formState.isValid}
        size="large"
        type="submit"
        variant="contained"
      >
        Collegati adesso
      </Button>
    </form>
  )
}

LoginForm.propTypes = {
  className: PropTypes.string,
  enqueueSnackbar: PropTypes.any,
}

export default compose(
  withSnackbar
)(LoginForm)
