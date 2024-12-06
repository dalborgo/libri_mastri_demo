import React, { useCallback, useEffect, useState } from 'react'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'
import CircularProgress from '@material-ui/core/CircularProgress'
import { Box, makeStyles, Typography } from '@material-ui/core'
import { getGenias } from '../../../../utils/axios'
import { COMPANY } from './constants'
import { isEmpty } from 'lodash'

const useStyles = makeStyles(theme => ({
  dialogActions: {
    padding: theme.spacing(0.8, 2),
  },
  dialogTitle: {
    padding: theme.spacing(1.3, 2),
  },
  dialogContent: {
    padding: theme.spacing(2, 2, 1),
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 150,
  },
}))

export default function ConfirmDialog ({ state, setState }) {
  const classes = useStyles()
  const [remoteValues, setRemoteValues] = useState({})
  const [loading, setLoading] = useState(false)
  const handleClose = useCallback(() => {
    setState({ ...state, open: false })
  }, [setState, state])
  const [signer = {}] = state['currentValues']?.holders ?? []
  useEffect(() => {
    async function fetchData () {
      setLoading(true)
      try {
        const { ok, message, results } = await getGenias(
          'genias/cliente/search',
          {
            partita_iva: signer['id'],
          }
        )
        if (!ok) {
          setRemoteValues({ ok, message })
        } else {
          const [remoteSigner] = results || []
          setRemoteValues(remoteSigner)
        }
      } catch (error) {
        setRemoteValues({ ok: false, message: error.message })
      } finally {
        setLoading(false)
      }
    }
    if (signer && !isEmpty(signer) && isEmpty(remoteValues)) {
      fetchData().then()
    }
  }, [remoteValues, signer])
  return (
    <Dialog
      aria-describedby="scroll-confirm-dialog-description"
      aria-labelledby="scroll-confirm-dialog-title"
      maxWidth="lg"
      onClose={handleClose}
      open={state.open}
      scroll="paper"
    >
      <div style={{ minWidth: 500 }}>
        <DialogTitle className={classes.dialogTitle} disableTypography id="scroll-confirm-dialog-title">
          <Typography variant="h5">
            Revisiona
          </Typography>
        </DialogTitle>
        <DialogContent className={classes.dialogContent} dividers>
          {
            loading ? (
              <CircularProgress/>
            ) : (
              <Box display="flex">
                <pre>
                  {JSON.stringify(signer, null, 2)}
                </pre>
                <pre>
                  {JSON.stringify(remoteValues, null, 2)}
                </pre>
                <pre>
                  {
                    JSON.stringify({
                      lista_compagnie: [COMPANY],
                      cod_cliente: remoteValues?.['cod_cliente'],
                    }, null, 2)
                  }
                </pre>
              </Box>
            )
          }
        </DialogContent>
        <DialogActions className={classes.dialogActions}>
          <Button color="default" onClick={handleClose} size="small">
            Annulla
          </Button>
          <Button color="secondary" disabled={loading} onClick={state.save} size="small">
            Emetti
          </Button>
        </DialogActions>
      </div>
    </Dialog>
  )
}
