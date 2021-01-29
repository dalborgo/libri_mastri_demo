import React, { Suspense, useState } from 'react'
import { renderRoutes } from 'react-router-config'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/styles'
import { LinearProgress } from '@material-ui/core'
import { useMutation } from '@apollo/react-hooks'
import { LOGOUT, ME } from 'queries'
import { gestError, useAsyncError } from 'helpers'
import { NavBar, TopBar } from './components'

const useStyles = makeStyles(() => ({
  root: {
    height: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  topBar: {
    zIndex: 2,
    position: 'relative',
  },
  container: {
    display: 'flex',
    flex: '1 1 auto',
    overflow: 'hidden',
  },
  navBar: {
    zIndex: 3,
    width: 256,
    minWidth: 256,
    flex: '0 0 auto',
  },
  content: {
    overflowY: 'auto',
    flex: '1 1 auto',
  },
}))

const Dashboard = props => {
  const { route } = props
  const classes = useStyles()
  const [openNavBarMobile, setOpenNavBarMobile] = useState(false)
  const throwError = useAsyncError()
  const [signOut, { client }] = useMutation(LOGOUT, {
    onError: gestError(throwError),
  })
  const handleLogout = async () => {

    client.writeData({ data: { loading: true } })
    await signOut({
      update: (cache, { data: { signOut } }) => {
        Object.keys(cache.data.data).forEach(key => {
          key.match(/Policy:/) && cache.data.delete(key)
        })
        delete cache.data.data['ROOT_QUERY']['policies({"origin":"/policies/list"})']
        delete cache.data.data['ROOT_QUERY']['policies({"origin":"/policies/doclist"})']
        cache.writeQuery({
          query: ME,
          data: { me: { ...signOut, __typename: 'MainUser', priority: 0, pathRef: '' } },
        })
      },
    })
    client.writeData({ data: { loading: false } })
  }

  const handleNavBarMobileOpen = () => {
    setOpenNavBarMobile(true)
  }

  const handleNavBarMobileClose = () => {
    setOpenNavBarMobile(false)
  }

  return (
    <div className={classes.root}>
      <TopBar
        className={classes.topBar}
        handleLogout={handleLogout}
        onOpenNavBarMobile={handleNavBarMobileOpen}
      />
      <div className={classes.container}>
        <NavBar
          className={classes.navBar}
          handleLogout={handleLogout}
          onMobileClose={handleNavBarMobileClose}
          openMobile={openNavBarMobile}
        />
        <main className={classes.content}>
          <Suspense fallback={<LinearProgress/>}>
            {renderRoutes(route.routes)}
          </Suspense>
        </main>
      </div>
    </div>
  )
}

Dashboard.propTypes = {
  route: PropTypes.object,
}

export default Dashboard
