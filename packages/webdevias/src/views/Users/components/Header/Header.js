import React from 'react'
import { Link as RouterLink } from 'react-router-dom'
import PropTypes from 'prop-types'
import clsx from 'clsx'
import { makeStyles } from '@material-ui/styles'
import { Fab, Grid, Typography } from '@material-ui/core'
import PersonAdd from '@material-ui/icons/PersonAdd'

const useStyles = makeStyles(() => ({
  root: {},
}))

const Header = props => {
  const { className, ...rest } = props

  const classes = useStyles()

  return (
    <div
      {...rest}
      className={clsx(classes.root, className)}
    >
      <Grid
        alignItems="flex-end"
        container
        justify="space-between"
        spacing={3}
      >
        <Grid item>
          {/*  <Typography
            component="h2"
            gutterBottom
            variant="overline"
          >
            Gestione
          </Typography>*/}
          <Typography
            component="h1"
            variant="h3"
          >
            Utenti
          </Typography>
        </Grid>
        <Grid item>
          <Fab
            color="primary"
            component={RouterLink}
            size={'small'}
            to="/management/user/create"
          >
            <PersonAdd/>
          </Fab>
        </Grid>
      </Grid>
    </div>
  )
}

Header.propTypes = {
  className: PropTypes.string,
}

export default Header
