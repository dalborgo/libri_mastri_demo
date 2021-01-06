import React from 'react'
import { makeStyles } from '@material-ui/styles'
import { Button, Typography, useMediaQuery, useTheme } from '@material-ui/core'
import PropTypes from 'prop-types'
import { Page } from 'components'
import { envConfig } from 'init'

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(3),
    paddingTop: '10vh',
    display: 'flex',
    flexDirection: 'column',
    alignContent: 'center',
  },
  imageContainer: {
    marginTop: theme.spacing(6),
    display: 'flex',
    justifyContent: 'center',
  },
  image: {
    maxWidth: '100%',
    width: 560,
    maxHeight: 300,
    height: 'auto',
  },
  buttonContainer: {
    marginTop: theme.spacing(6),
    display: 'flex',
    justifyContent: 'center',
  },
}))

const Error500 = ({ componentStack, error }) => {
  const classes = useStyles()
  const theme = useTheme()
  const mobileDevice = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <Page
      className={classes.root}
      title="Error 500"
    >
      <Typography
        align="center"
        variant={mobileDevice ? 'h4' : 'h1'}
      >
        500: Ooops, qualcosa è andato storto!
      </Typography>
      <Typography
        align="center"
        variant="subtitle2"
      >
        Contatta i fornitori del programma.
        {error && <pre>{error.toString()}</pre>}
      </Typography>
      <div className={classes.imageContainer}>
        <img
          alt="Error 500"
          className={classes.image}
          src="/images/undraw_something_wrong.svg"
          title = {componentStack.toString()}
        />
      </div>
      <div className={classes.buttonContainer}>
        <Button
          color="primary"
          onClick={() => window.location.replace(envConfig.ORIGIN)}
          variant="outlined"
        >
          VAI ALL'HOME PAGE
        </Button>
      </div>
    </Page>
  )
}
Error500.propTypes = {
  componentStack: PropTypes.any,
  error: PropTypes.any,
}

export default Error500
