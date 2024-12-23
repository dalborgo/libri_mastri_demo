import React, { memo } from 'react'
import clsx from 'clsx'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/styles'
import { Grid } from '@material-ui/core'
import compose from 'lodash/fp/compose'
import { ProfileDetails } from '../General/components'
import { PasswordForm } from './components'

const useStyles = makeStyles(() => ({
  root: {},
}))

const General = props => {
  const { className, handleEdit, me, ...user } = props
  const classes = useStyles()
  return (
    <Grid
      className={clsx(classes.root, className)}
      container
      spacing={3}
    >
      <Grid
        item
        lg={4}
        md={6}
        xl={3}
        xs={12}
      >
        <ProfileDetails {...user}/>
      </Grid>
      <Grid
        item
        lg={8}
        md={6}
        xl={9}
        xs={12}
      >
        <PasswordForm me={me} username={user.username}/>
      </Grid>
    </Grid>
  )
}

General.propTypes = {
  className: PropTypes.string,
}

export default compose(
  memo
)(General)

