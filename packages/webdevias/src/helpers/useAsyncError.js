import React from 'react'

const useAsyncError = () => {
  const [, setError] = React.useState()
  return React.useCallback(
    message => {
      setError(() => {
        throw message
      })
    },
    [setError]
  )
}

export default useAsyncError
