import React from 'react'
import { makeStyles } from '@material-ui/styles'
import { Button, Typography, useMediaQuery, useTheme } from '@material-ui/core'
import PropTypes from 'prop-types'
import { Page } from 'components'

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

const Error503 = ({ message = '' }) => {
  const classes = useStyles()
  const theme = useTheme()
  const mobileDevice = useMediaQuery(theme.breakpoints.down('sm'))
  
  return (
    <Page
      className={classes.root}
      title="Error 503"
    >
      <Typography
        align="center"
        variant={mobileDevice ? 'h4' : 'h1'}
      >
        503: Service Unavailable!
      </Typography>
      <Typography
        align="center"
        variant="subtitle2"
      >
        Check the backend connection and the correct configuration of origins.
        {message && <pre>{message}</pre>}
      </Typography>
      <div className={classes.imageContainer}>
        <img
          alt="Connection Error"
          className={classes.image}
          src="/images/undraw_server_down_s4lk.svg"
        />
      </div>
      <div className={classes.buttonContainer}>
        <Button
          color="primary"
          onClick={() => window.location.reload()}
          variant="outlined"
        >
          RIPROVA
        </Button>
      </div>
    </Page>
  )
}

Error503.propTypes = {
  message: PropTypes.string,
}

export default Error503
