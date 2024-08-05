import React from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { makeStyles } from '@material-ui/styles'
import { Button, Typography, useMediaQuery, useTheme } from '@material-ui/core'

import { Page } from 'components'
import palette from '../../theme/palette'

const useStyles = makeStyles(theme => ({
  root: {
    margin: 'auto',
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
  grayText: {
    color: palette.text.secondary,
    fontWeight: 400,
  },
}))

const Error404 = () => {
  const classes = useStyles()
  const theme = useTheme()
  const mobileDevice = useMediaQuery(theme.breakpoints.down('sm'))
  
  return (
    <Page
      className={classes.root}
      title="Error 404"
    >
      <Typography
        align="center"
        gutterBottom
        variant={mobileDevice ? 'h4' : 'h1'}
      >
        404: La pagina che stai cercando non è qui!
      </Typography>
      <Typography
        align="center"
        className={classes.grayText}
        gutterBottom
        variant={mobileDevice ? 'h5' : 'h3'}
      >
        Potresti non avere i privilegi per visualizzarla.
      </Typography>
      <Typography
        align="center"
        variant="subtitle2"
      >
        Se hai digitato un collegamento nella barra degli indirizzi, prova ad utilizzare il menu di navigazione a
        sinistra.
      </Typography>
      <div className={classes.imageContainer}>
        <img
          alt="Error 404"
          className={classes.image}
          src="/images/undraw_page_not_found_su7k.svg"
        />
      </div>
      <div className={classes.buttonContainer}>
        <Button
          color="primary"
          component={RouterLink}
          to="/"
          variant="outlined"
        >
          Torna alla pagina principale
        </Button>
      </div>
    </Page>
  )
}

export default Error404
