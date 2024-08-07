import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import CircularProgress from '@material-ui/core/CircularProgress'

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(3),
    textAlign: 'center',
    width: '100%',
  },
}))

export default function CircularIndeterminate () {
  const classes = useStyles()
  
  return (
    <div className={classes.root}>
      <CircularProgress/>
    </div>
  )
}
