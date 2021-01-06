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
      height: '100%',
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
    color: '#E04F5F',
  },
  agreeButton: {
    backgroundColor: '#E04F5F',
    '&:hover': {
      backgroundColor: theme.palette.error.dark,
    },
  },
}))

const ErrorsNotification = ({ open, handleClose, errors }) => {
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
          alt="Errors"
          src="/images/cancel.svg"
        />
      </div>
      <Typography align="center" className={classes.title} gutterBottom variant="h6">
        ERRORI D'IMPORTAZIONE
      </Typography>
      <div className={classes.content}>
        {
          errors.map(({ reason = '', column = '', line = '' }, index) =>
            (
              <ListItem
                classes={
                  {
                    divider: classes.divider,
                  }
                }
                dense
                divider={index < errors.length - 1}
                key={index}
              >
                <ListItemText primary={reason}/>
                <Typography variant="caption">
                  {
                    (() => {
                      if (line && column) {
                        return `riga csv: ${line}, col: ${column}`
                      } else if (line && !column) {
                        return `riga csv: ${line}`
                      } else if (column && !line) {
                        return `col: ${column}`
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
          onClick={handleClose}
          size="small"
          variant="contained"
        >
          OK
        </Button>
      </div>
    </Paper>
  )
}

export default ErrorsNotification
