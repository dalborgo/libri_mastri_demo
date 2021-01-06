import React from 'react'
import ReactDOM from 'react-dom'
import { ApolloProvider, useQuery } from '@apollo/react-hooks'
import client from 'client'
import { INIT } from 'queries'
import App from './App'
import ErrorBoundary from 'react-error-boundary'
import log from '@adapter/common/src/log'
import Error503 from 'views/Error503'
import theme from './theme'
import { ThemeProvider } from '@material-ui/styles'
import { ConfirmProvider } from 'material-ui-confirm'
import { gestError } from './helpers'
import CircularIndeterminate from 'components/Progress/CircularIndeterminate'
import SnackMyProvider from './components/Snack/SnackComponents'
import Error500 from './views/Error500'
import './wdyr'

require('init')

const myErrorHandler = (error, componentStack) => {
  log.error('Global error', error)
  log.error('Global componentStack', componentStack)
}

const StartUp = () => {
  const { data, error, loading, networkStatus } = useQuery(INIT, {
    notifyOnNetworkStatusChange: true,
    onError: gestError(),
  })
  return (
    <SnackMyProvider>
      <ConfirmProvider
        defaultOptions={
          {
            cancellationText: 'Annulla',
            confirmationText: 'Conferma',
            title: 'Conferma operazione',
            dialogProps: {
              transitionDuration: 0,
              id: 'confirmDialog',
            },
            confirmationButtonProps: {
              size: 'small',
              style: { marginRight: 15 },
              variant: 'contained',
            },
            cancellationButtonProps: {
              size: 'small',
              style: { marginRight: 5 },
              variant: 'contained',
            },
          }
        }
      >
        {
          (() => {
            if (data) {
              return <App/>
            }
            if (loading) {
              return <CircularIndeterminate/>
            }
            if (networkStatus === 8) {
              return <Error503 message={error.message}/>
            }
          })()
        }
      </ConfirmProvider>
    </SnackMyProvider>
  )
}

const Base = () => {
  return (
    <ThemeProvider theme={theme}>
      <ErrorBoundary FallbackComponent={Error500} onError={myErrorHandler}>
        <ApolloProvider client={client}>
          <StartUp/>
        </ApolloProvider>
      </ErrorBoundary>
    </ThemeProvider>
  )
}

ReactDOM.render(<Base/>, document.getElementById('root'))
