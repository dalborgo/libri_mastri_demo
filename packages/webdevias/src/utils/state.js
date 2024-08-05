import React, { createContext, useContext, useReducer } from 'react'
import PropTypes from 'prop-types'

/*const StateContext = createContext()
export const useStateValue = () => useContext(StateContext)
export const StateProvider = ({ children, ...rest }) => {

  const [state] = useReducer(null, {
    ...rest,
  })
  return (
    <StateContext.Provider value={state}>
      {children}
    </StateContext.Provider>
  )
}
StateProvider.propTypes = {
  children: PropTypes.any,
}*/

export const StateContext = createContext()
export const StateProvider = ({ reducer, initialState, children }) => (
  <StateContext.Provider value={useReducer(reducer, initialState)}>
    {children}
  </StateContext.Provider>
)
export const useStateValue = () => useContext(StateContext)

StateProvider.propTypes = {
  children: PropTypes.any,
  initialState: PropTypes.any,
  reducer: PropTypes.any,
}
