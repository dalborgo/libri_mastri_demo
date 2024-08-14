import React, { useEffect, useMemo } from 'react'
import clsx from 'clsx'
import { makeStyles, useTheme } from '@material-ui/styles'
import { Avatar, Button, Divider, Drawer, Link, Paper, Typography } from '@material-ui/core'
import { Navigation } from 'components'
import navigationConfig from './navigationConfig'
import { useApolloClient } from '@apollo/react-hooks'
import { ME } from 'queries'
import { Link as RouterLink, matchPath, useLocation } from 'react-router-dom'
import { getInitials, useRoleStyleBase } from 'helpers'
import InputIcon from '@material-ui/icons/Input'
import useMediaQuery from '@material-ui/core/useMediaQuery'

const useStyles = makeStyles(theme => ({
  root: {
    height: '100%',
    overflowY: 'auto',
  },
  content: {
    padding: theme.spacing(2),
  },
  profile: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minHeight: 'fit-content',
  },
  avatar: {
    width: 40,
    height: 40,
  },
  name: {
    marginTop: theme.spacing(1),
  },
  divider: {
    marginTop: theme.spacing(2),
  },
  navigation: {
    marginTop: 0,
  },
}))

const NavBar = props => {
  const { openMobile, onMobileClose, handleLogout, className, ...rest } = props
  const client = useApolloClient()
  const classesRoleBase = useRoleStyleBase()
  const classes = useStyles()
  const { pathname } = useLocation()
  const matchUser = matchPath(pathname, { path: '/management/users/:id' }) || { params: { id: null } }
  const matchRegistry = matchPath(pathname, { path: '/management_reg/registries/:id' }) || { params: { id: null } }
  const matchPolicy = matchPath(pathname, { path: '/policies/edit/:id' }) || { params: { id: null } }
  const matchPolicyEdit = matchPath(pathname, { path: '/policies/editpolicy/:id' }) || { params: { id: null } }
  const userParam = matchUser.params.id
  const registryParam = matchRegistry.params.id
  const policyParam = matchPolicy.params.id || matchPolicyEdit.params.id
  const { me } = client.readQuery({ query: ME })
  const theme = useTheme()
  const xlUp = useMediaQuery(theme.breakpoints.up('xl'))
  const lgDown = useMediaQuery(theme.breakpoints.down('lg'))
  const neverShowMenu = me?.options?.neverShowMenu
  useEffect(() => {
    if (openMobile) {
      onMobileClose && onMobileClose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])
  const mePage = pathname !== `/management/users/${me.username}/summary`
  const navigationList = useMemo(() => {
    return navigationConfig(userParam || me.username, policyParam, registryParam, me.priority, pathname).map(list => (
      <Navigation
        component="div"
        key={list.title}
        pages={list.pages}
        title={list.title}
      />
    ))
  }, [me.priority, me.username, pathname, policyParam, registryParam, userParam])
  const navbarContent = (
    <div className={classes.content}>
      <div className={classes.profile}>
        <Avatar
          alt="Person"
          className={classes.avatar}
          component={mePage ? RouterLink : Avatar}
          style={
            classesRoleBase[me.role]
          }
          to={`/management/users/${me.username}/summary`}
        >
          {getInitials(me.username)}
        </Avatar>
        <Typography
          className={classes.name}
          variant="h4"
        >
          {
            mePage && me.priority === 4 ?
              <Link
                color="textPrimary"
                component={RouterLink}
                noWrap
                to={`/management/users/${me.username}/summary`}
              >
                {me.username}
              </Link>
              :
              me.username
          }
        </Typography>
        {/*<Typography variant="body2">
          {
            roleName(me.role)
          }
        </Typography>*/}
        {
          (!xlUp || neverShowMenu) && (
            <Button
              className={classes.logoutButton}
              color={'primary'}
              onClick={handleLogout}
              size={'small'}
            >
              <InputIcon className={classes.logoutIcon}/>
              &nbsp;Esci
            </Button>
          )
        }
      </div>
      <Divider className={classes.divider}/>
      <nav className={classes.navigation}>
        {
          navigationList
        }
      </nav>
    </div>
  )
  return (
    <>
      {
        (!xlUp || neverShowMenu) && (
          <Drawer
            anchor="left"
            onClose={onMobileClose}
            open={openMobile}
            variant="temporary"
          >
            <div
              {...rest}
              className={clsx(classes.root, className)}
            >
              {navbarContent}
            </div>
          </Drawer>
        )
      }
      {
        (!lgDown && !neverShowMenu) && (
          <Paper
            {...rest}
            className={clsx(classes.root, className)}
            elevation={1}
            square
          >
            {navbarContent}
          </Paper>
        )
      }
    </>
  )
}

export default NavBar
