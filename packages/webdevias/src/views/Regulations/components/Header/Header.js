import React from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'
import { makeStyles } from '@material-ui/styles'
import { Grid, Link, Typography } from '@material-ui/core'
import { Link as RouterLink } from 'react-router-dom'

const useStyles = makeStyles(theme => ({
  root: {},
  divLink: {
    paddingBottom: theme.spacing(1),
  },
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
          <div className={classes.divLink}>
            <Link
              component={RouterLink}
              to="/policies/list"
              variant="overline"
            >
              ↩&nbsp;&nbsp;Lista Polizze
            </Link>
          </div>
          <Typography
            component="h1"
            variant="h3"
          >
            Regolazioni
          </Typography>
        </Grid>
      </Grid>
    </div>
  )
}

Header.propTypes = {
  className: PropTypes.string,
}

export default Header
