const { override } = require('customize-cra')
const { addReactRefresh } = require('customize-cra-react-refresh')
const rewireYarnWorkspaces = require('react-app-rewire-yarn-workspaces')

module.exports = (config, env) => rewireYarnWorkspaces(config, env)

module.exports = override(addReactRefresh({ disableRefreshCheck: true }))

