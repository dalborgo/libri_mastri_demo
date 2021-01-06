import React from 'react'

if (process.env.NODE_ENV === 'development') {
  const whyDidYouRender = require('@welldone-software/why-did-you-render')
  whyDidYouRender(React, {
    exclude: [/.*[^Why]$/],
    trackAllPureComponents: true,
    logOnDifferentValues: true,
    logOwnerReasons: true,
    collapseGroups: true,
    titleColor: '#02FC04',
    diffPathColor: 'yellow',
    diffNameColor: 'orange',
  })
}
