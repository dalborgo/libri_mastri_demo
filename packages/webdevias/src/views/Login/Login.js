import React from 'react'
import { makeStyles } from '@material-ui/styles'
import { Card, CardContent, Typography } from '@material-ui/core'
import LockIcon from '@material-ui/icons/Lock'

import { Page } from 'components'
import gradients from 'utils/gradients'
import { LoginForm } from './components'

const useStyles = makeStyles(theme => ({
  root: {
    height: '100%',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    padding: theme.spacing(6, 2),
    background: 'url(/images/libri_matricola.jpg) no-repeat center center fixed',
  },
  card: {
    width: theme.breakpoints.values.md,
    maxWidth: 500,
    marginRight: theme.spacing(3),
    overflow: 'unset',
    display: 'flex',
    position: 'relative',
    '& > *': {
      flexGrow: 1,
      flexBasis: '50%',
      width: '50%',
    },
  },
  content: {
    padding: theme.spacing(8, 4, 3, 4),
  },
  media: {
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    padding: theme.spacing(3),
    color: theme.palette.white,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    [theme.breakpoints.down('md')]: {
      display: 'none',
    },
  },
  icon: {
    backgroundImage: gradients.green,
    color: theme.palette.white,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1),
    position: 'absolute',
    top: -32,
    left: theme.spacing(3),
    height: 64,
    width: 64,
    fontSize: 32,
  },
  loginForm: {
    marginTop: theme.spacing(3),
  },
  divider: {
    margin: theme.spacing(2, 0),
  },
  person: {
    marginTop: theme.spacing(2),
    display: 'flex',
  },
  avatar: {
    marginRight: theme.spacing(2),
  },
}))

const Login = () => {
  const classes = useStyles()
  
  return (
    <Page
      className={classes.root}
      id="loginPage"
      title="Login"
    >
      <Card className={classes.card}>
        <CardContent className={classes.content}>
          <LockIcon className={classes.icon}/>
          <Typography
            gutterBottom
            variant="h3"
          >
            Entra
          </Typography>
          <Typography variant="subtitle2">
            Collegati al portale libri matricola
          </Typography>
          <LoginForm className={classes.loginForm}/>
        </CardContent>
      </Card>
    </Page>
  )
}

export default Login
