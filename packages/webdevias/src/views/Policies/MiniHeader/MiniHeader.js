import React, { memo } from 'react'
import { Grid, Paper, Toolbar } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import Typography from '@material-ui/core/Typography'

const useStyles = makeStyles(theme => ({
  typoTitle: {
    marginRight: theme.spacing(2),
    color: theme.palette.grey[700],
  },
  toolbar: {
    minHeight: 36,
    backgroundColor: theme.palette.grey[50],
    paddingRight: theme.spacing(2),
    marginBottom: 10,
    marginTop: theme.spacing(4),
  },
}))
const MiniHeader = props => {
  const { selection } = props
  const [first] = selection
  const classes = useStyles()
  return (
    <Toolbar
      className={classes.toolbar}
      component={Paper}
      variant="dense"
    >
      <Grid
        alignItems="center"
        container
        justify="space-between"
        spacing={3}
      >
        <Grid item>
          <Typography className={classes.typoTitle} display="inline" variant="h5">
            {first}
          </Typography>
        </Grid>
      </Grid>
    </Toolbar>
  )
}

export default memo(MiniHeader)
