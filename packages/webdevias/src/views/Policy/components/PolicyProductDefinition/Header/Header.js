import React, { memo } from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'
import { makeStyles } from '@material-ui/styles'
import { Button, Grid, Toolbar } from '@material-ui/core'
import { calculateRows } from '../helpers'
import { useParams } from 'react-router-dom'
import { mdiCheckAll } from '@mdi/js'
import Icon from '@mdi/react'

const useStyles = makeStyles(theme => ({
  root: {
    paddingLeft: 0,
  },
  whiteButton: {
    backgroundColor: theme.palette.white,
    color: theme.palette.grey[700],
    marginBottom: 3,
  },
}))

const Header = props => {
  const { dispatch, values, setFieldValue, priority } = props
  const classes = useStyles()
  const { tab } = useParams()
  return (
    <Toolbar
      className={clsx(classes.root)}
    >
      <Grid
        alignItems="center"
        container
        spacing={3}
      >
        <Grid item xs={8}>
          {
            tab === 'all' &&
            <Button
              className={classes.whiteButton}
              disabled={priority < 4}
              disableFocusRipple
              onClick={
                async () => {
                  await calculateRows(values.productDefinitions, setFieldValue)
                  dispatch({ type: 'refresh' })
                }
              }
              size="small"
              variant="outlined"
            >
              <Icon path={mdiCheckAll} size={1} style={{ marginTop: -3 }}/>&nbsp; Applica alle altre tabelle
            </Button>
          }
        </Grid>
        <Grid item xs={2}>
          <Grid container justify="center"/>
        </Grid>
        <Grid item xs={2}>
          <Grid container justify="flex-end"/>
        </Grid>
      </Grid>
    </Toolbar>
  )
}

Header.propTypes = {
  className: PropTypes.string,
  number: PropTypes.string,
}

export default memo(Header)
