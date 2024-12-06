import React, { useCallback, useState } from 'react'
import Dialog from '@material-ui/core/Dialog'
import DialogTitle from '@material-ui/core/DialogTitle'
import { DialogContent, makeStyles, Typography } from '@material-ui/core'
import moment from 'moment'
import { PasswordForm } from '../../UserManagementDetails/components/Password/components'
import { cFunctions } from '@adapter/common'

const useStyles = makeStyles(theme => ({
  dialogTitle: {
    display: 'flex',
    padding: theme.spacing(1.3),
    justifyContent: 'center',
  },
  dialogContent: {
    padding: theme.spacing(3),
  },
  dialogAction: {
    padding: theme.spacing(1, 2),
  },
  button: {
    padding: theme.spacing(0, 1),
  },
}))

export default function ChangePasswordDialog ({ lastPasswordChangeDate, username }) {
  const classes = useStyles()
  const [open, setOpen] = useState(() => {
    if (!lastPasswordChangeDate) {return true}
    const sixMonthsAgo = moment().subtract(6, 'months')
    return moment(lastPasswordChangeDate).isBefore(sixMonthsAgo)
  })
  const handleClose = useCallback(() => {
    setOpen(false)
  }, [])
  return (
    <Dialog
      aria-describedby="scroll-view-dialog-description"
      aria-labelledby="scroll-view-dialog-title"
      disableBackdropClick={cFunctions.isProd()}
      maxWidth="md"
      onClose={handleClose}
      open={open}
      scroll="paper"
    >
      <div style={{ minWidth: 500 }}>
        <DialogTitle className={classes.dialogTitle} disableTypography id="scroll-view-dialog-title">
          <Typography style={{ fontVariant: 'small-caps' }} variant="h5">
            Password scaduta
          </Typography>
        </DialogTitle>
        <DialogContent className={classes.dialogContent} dividers>
          <PasswordForm me={{ username }} username={username}/>
        </DialogContent>
      </div>
    </Dialog>
  )
}
