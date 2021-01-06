import IconButton from '@material-ui/core/IconButton'
import ChevronRight from '@material-ui/icons/ChevronRight'
import React, { useRef } from 'react'
import { SnackbarProvider, useSnackbar } from 'notistack'
import PropTypes from 'prop-types'
import SignalWifiOff from '@material-ui/icons/SignalWifiOff'
import ErrorOutline from '@material-ui/icons/ErrorOutline'
import Warning from '@material-ui/icons/Warning'
import Info from '@material-ui/icons/Info'
import Done from '@material-ui/icons/Done'

const DismissSnackAction = ({ id }) => {
  const { closeSnackbar } = useSnackbar()
  return (
    <IconButton
      color="inherit"
      onClick={() => { closeSnackbar(id) }}
      style={{ padding: 5 }}
    >
      <ChevronRight/>
    </IconButton>
  )
}

const iconStyle = {
  fontSize: 20, marginRight: 8,
}

const SnackMyProvider = ({ children }) => {
  const refSnack = useRef(null)
  return (
    <SnackbarProvider
      action={key => <DismissSnackAction id={key}/>}
      anchorOrigin={
        {
          vertical: 'bottom',
          horizontal: 'right',
        }
      }
      autoHideDuration={8000}
      iconVariant={
        {
          default: <SignalWifiOff style={iconStyle}/>,
          error: <ErrorOutline style={iconStyle}/>,
          warning: <Warning style={iconStyle}/>,
          info: <Info style={iconStyle}/>,
          success: <Done style={iconStyle}/>,
        }
      }
      maxSnack={10}
      onClose={
        (event, reason, key) => {
          if (reason === 'clickaway' && !String(key).startsWith('persistent_')) {
            const { closeSnackbar } = refSnack.current
            closeSnackbar(key)
          }
        }
      }
      ref={refSnack}
    >
      {children}
    </SnackbarProvider>
  )
}

SnackMyProvider.propTypes = {
  children: PropTypes.any,
}

DismissSnackAction.propTypes = {
  id: PropTypes.any,
}

export default SnackMyProvider
