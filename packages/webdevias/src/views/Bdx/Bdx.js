import React, { useCallback } from 'react'
import { makeStyles } from '@material-ui/styles'
import PropTypes from 'prop-types'
import { Page } from 'components'
import { Header } from './components'
import { withSnackbar } from 'notistack'
import compose from 'lodash/fp/compose'
import { bdxQuery } from 'utils/axios'
import { Button } from '@material-ui/core'

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(3),
  },
  results: {
    marginTop: theme.spacing(3),
  },
}))

const Bsx = ({ enqueueSnackbar }) => {
  const classes = useStyles()
  const onClick = useCallback(async () => {
    const data = {}
    const { ok, message, results } = await bdxQuery(
      'files/get_bdx',
      data
    )
    !ok && enqueueSnackbar(message, { variant: 'error' })
    console.log('results:', results)
  }, [enqueueSnackbar])
  
  return (
    <Page
      className={classes.root}
      title="Bdx"
    >
      <Header/>
      <div className={classes.results}>
        <Button color="primary" onClick={onClick} variant="contained">Genera</Button>
      </div>
    </Page>
  )
}

Bsx.propTypes = {
  enqueueSnackbar: PropTypes.any,
}

export default compose(
  withSnackbar
)(Bsx)
