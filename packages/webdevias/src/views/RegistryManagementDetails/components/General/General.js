import React, { memo } from 'react'
import clsx from 'clsx'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/styles'
import { Grid } from '@material-ui/core'
import compose from 'lodash/fp/compose'
import { GeneralSettings, ProfileDetails } from './components'

const useStyles = makeStyles(() => ({
  root: {},
}))

const General = props => {
  const { className, handleEdit, ...registry } = props
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
        <ProfileDetails {...registry}/>
      </Grid>
      <Grid
        item
        lg={8}
        md={6}
        xl={9}
        xs={12}
      >
        <GeneralSettings {...registry} handleEdit={handleEdit} key={registry.id}/>
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

