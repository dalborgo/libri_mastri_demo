import React from 'react'
import { Link as RouterLink } from 'react-router-dom'
import clsx from 'clsx'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import { AppBar, Toolbar } from '@material-ui/core'
import { useQuery } from '@apollo/react-hooks'
import { LOADING } from 'queries'
import ColorLinearProgress from 'components/Progress/ColorLinearProgress'

const useStyles = makeStyles(() => ({
  root: {
    boxShadow: 'none',
  },
}))

const TopBar = props => {
  const { className, ...rest } = props
  const { data = {} } = useQuery(LOADING)
  const classes = useStyles()
  return (
    <>
      <AppBar
        {...rest}
        className={clsx(classes.root, className)}
        color="primary"
      >
        <Toolbar>
          <RouterLink to="/">
            <img
              alt="Logo"
              src="/images/logos/logo--white.svg"
            />
          </RouterLink>
        </Toolbar>
        <ColorLinearProgress
          style={{ visibility: data.loading ? 'visible' : 'hidden' }}
        />
      </AppBar>
    </>
  )
}

TopBar.propTypes = {
  className: PropTypes.string,
}

export default TopBar
