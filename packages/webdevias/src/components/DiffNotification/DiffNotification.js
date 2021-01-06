import React from 'react'
import { makeStyles } from '@material-ui/styles'
import { Button, ListItem, ListItemText, Paper, Typography } from '@material-ui/core'

const useStyles = makeStyles(theme => ({
  root: {
    minWidth: '40%',
    position: 'fixed',
    bottom: 0,
    right: 0,
    margin: theme.spacing(3, 4),
    backgroundColor: theme.palette.grey[300],
    outline: 'none',
    zIndex: 2000,
  },
  media: {
    padding: theme.spacing(2, 2),
    height: 80,
    textAlign: 'center',
    '& > img': {
      height: '120%',
      width: 'auto',
    },
  },
  content: {
    padding: theme.spacing(1, 2),
    overflow: 'auto',
    maxHeight: 500,
  },
  divider: {
    borderColor: theme.palette.grey[400],
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    padding: theme.spacing(1, 2, 2, 1),
  },
  title: {
    color: theme.palette.primary.dark,
  },
  agreeButton: {
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
  },
}))

const DiffNotification = ({ open, setOpenDiff, differences = [] }) => {
  console.log('differences:', differences)
  const classes = useStyles()
  if (!open) {
    return null
  }
  return (
    <Paper
      className={classes.root}
      elevation={3}
    >
      <div className={classes.media}>
        <img
          alt="Differences"
          src="/images/compare.svg"
        />
      </div>
      <Typography align="center" className={classes.title} gutterBottom variant="h6">
        MODIFICHE
      </Typography>
      <div className={classes.content}>
        {
          differences.map(({ log = '', before, after }, index) =>
            (
              <ListItem
                classes={
                  {
                    divider: classes.divider,
                  }
                }
                dense
                divider={index < differences.length - 1}
                key={index}
              >
                <ListItemText primary={log}/>
                <Typography variant="caption">
                  {
                    (() => {
                      if (log) {
                        if (before || after) {
                          return `${before || 'Vuoto'} -> ${after || '--'}`
                        } else {
                          return ''
                        }
                      } else {
                        return ''
                      }
                    })()
                  }
                </Typography>
              </ListItem>
            )
          )
        }
      </div>
      <div className={classes.actions}>
        <Button
          className={classes.agreeButton}
          color="primary"
          onClick={() => setOpenDiff(false)}
          size="small"
          variant="contained"
        >
          OK
        </Button>
      </div>
    </Paper>
  )
}

export default DiffNotification
