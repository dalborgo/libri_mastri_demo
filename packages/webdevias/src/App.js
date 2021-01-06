import React, { useRef } from 'react'
import { Router } from 'react-router-dom'
import { createBrowserHistory } from 'history'
import { renderRoutes } from 'react-router-config'
import log from '@adapter/common/src/log'
import { ME } from 'queries'
import { useQuery } from '@apollo/react-hooks'
import { withSnackbar } from 'notistack'
import { roleRoutes } from './routes'
import { ScrollReset } from './components'
import './mixins/moment'
import './mixins/validate'
import './assets/scss/index.scss'
import compose from 'lodash/fp/compose'
import { envConfig } from './init'
import uuid from 'uuid/v1'

const history = createBrowserHistory()

const App = props => {
  const { enqueueSnackbar, closeSnackbar } = props
  
  const { data = {}, networkStatus, startPolling } = useQuery(ME, {
    notifyOnNetworkStatusChange: true,
    onCompleted: () => {
      if (connStatus.current) {
        closeSnackbar(connStatus.current)
        connStatus.current = null
      }
    },
    onError: () => {
      if (!connStatus.current && networkStatus === 8) {
        connStatus.current = enqueueSnackbar('Errore Connessione al Server!', {
          persist: true,
          key: `persistent_${uuid()}`,
          preventDuplicate: true,
        })
      }
    },
  })
  const { me } = data
  log.debug('me', me)
  const connStatus = useRef(null)
  if (networkStatus === 8) {
    startPolling(1000)
  }
  if (networkStatus === 7) {
    startPolling(envConfig['POLLING_MILLI'])
  }
  return (
    <Router history={history}>
      <ScrollReset/>
      {
        me
          ? renderRoutes(roleRoutes(me.role, me.pathRef, history))
          : null
      }
    </Router>
  )
}

export default compose(
  withSnackbar
)(App)
