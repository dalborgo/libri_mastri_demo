import { useEffect, useRef } from 'react'
import log from '@adapter/common/src/log'
export default function why (name, props) {
  // Get a mutable ref object where we can store props ...
  // ... for comparison next time this hook runs.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const previousProps = useRef()

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (previousProps.current) {
      // Get all keys from previous and current props
      const allKeys = Object.keys({ ...previousProps.current, ...props })
      // Use this object to keep track of changed props
      const changesObj = {}
      // Iterate through keys
      allKeys.forEach(key => {
        // If previous is different from current
        if (previousProps.current[key] !== props[key]) {
          // Add to changesObj
          changesObj[key] = {
            from: previousProps.current[key],
            to: props[key],
          }
        }
      })

      // If changesObj not empty then output to console
      if (Object.keys(changesObj).length) {
        log.debug('[why-did-you-update]', name, changesObj)
      }
    }

    // Finally update previousProps with current props for next hook call
    previousProps.current = props
  })
}
