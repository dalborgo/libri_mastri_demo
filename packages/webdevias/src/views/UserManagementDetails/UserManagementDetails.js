import React, { useCallback } from 'react'
import { Redirect, useHistory, useParams } from 'react-router-dom'
import { makeStyles } from '@material-ui/styles'
import { colors, Divider, Tab, Tabs } from '@material-ui/core'
import { Page } from 'components'
import { General, Header, Options, Password } from './components'
import { useMutation, useQuery } from '@apollo/react-hooks'
import {
  CHILDREN_FROM_LIST,
  EDIT_USER,
  ME,
  USER,
  USER_COMPLETE_FRAGMENT,
  USER_EDIT_FRAGMENT,
  USERS,
} from 'queries/users'
import log from '@adapter/common/src/log'
import { gestError, useAsyncError } from 'helpers'
import compose from 'lodash/fp/compose'
import { withSnackbar } from 'notistack'
import { filter } from 'graphql-anywhere'
import find from 'lodash/find'
import remove from 'lodash/remove'
import Error404 from '../Error404'
import { validation } from '@adapter/common'
import Provvigioni from './components/Provvigioni'

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(3),
  },
  tabs: {
    marginTop: theme.spacing(3),
  },
  divider: {
    backgroundColor: colors.grey[300],
  },
  content: {
    marginTop: theme.spacing(3),
  },
}))

const UserManagementDetails = ({ enqueueSnackbar }) => {
  const classes = useStyles()
  const { id: userId, tab } = useParams()
  const history = useHistory()
  const throwError = useAsyncError()
  const handleTabsChange = (event, value) => {
    history.push(value)
  }
  const { data, calledQ, loadingQ, client } = useQuery(USER, { variables: { id: userId } })
  const { me: { priority }, me } = client.readQuery({ query: ME })
  const [edit, { calledM, loadingM }] = useMutation(EDIT_USER, {
    onError: gestError(throwError, enqueueSnackbar),
  })
  const { user } = data || {}
  
  const handleEdit = useCallback(async (input, { resetForm }) => {
    const prevFather = user.father
    log.debug('userInside', user)
    if (!['SUB_AGENT', 'COLLABORATOR'].includes(input.role)) {
      input.father = null
    }
    let aggregate = Object.assign(user, input)
    aggregate = validation.trimAll(aggregate)
    delete aggregate['provvigioni']
    input.active = input.active !== false //forza a booleano
    const optimistic = filter(USER_COMPLETE_FRAGMENT, aggregate)
    const res = await edit({
      variables: {
        input: {
          ...filter(USER_EDIT_FRAGMENT, aggregate),
          email: input.email ? input.email : null,
        },
      },
      optimisticResponse: {
        __typename: 'Mutation',
        edit: {
          ...optimistic,
          _updatedAt: new Date(),
        },
      },
      update: (cache, { data: { edit } }) => {
        let data_
        try { data_ = cache.readQuery({ query: USERS })} catch (err) {
          log.warn('UsersCache not present!')
          return
        }
        log.debug('data_', data_)
        let actualFatherObj, prevFatherObj
        if (input.father) {
          actualFatherObj = find(data_.users, { id: edit.father })
          let childrenObj
          if (actualFatherObj) {
            childrenObj = find(actualFatherObj.children, { id: edit.id })
          }
          if (!childrenObj) {
            if (actualFatherObj.children) {
              actualFatherObj.children.push({
                ...filter(CHILDREN_FROM_LIST, aggregate),
              })
            } else {
              actualFatherObj.children = [{
                ...filter(CHILDREN_FROM_LIST, aggregate),
              }]
            }
          }
        }
        if (prevFather !== edit.father) {
          prevFatherObj = find(data_.users, { id: prevFather })
          log.debug('prevFatherObj1', prevFatherObj)
          if (prevFatherObj) {
            remove(prevFatherObj.children, function (obj) {
              return !obj.id || obj.id === edit.id
            })
            if (!prevFatherObj.children.length) {
              prevFatherObj.children = null
            }
          }
          log.debug('prevFatherObj', prevFatherObj)
        }
        cache.writeQuery({ query: USERS, data: data_ })
      },
    })
    res && resetForm({ ...input })
  }, [edit, user])
  const called = calledQ || calledM
  const loading = loadingQ || loadingM
  if (called && loading) {
    client.writeData({ data: { loading: true } })
  }
  if (called && !loading) {
    client.writeData({ data: { loading: false } })
  }
  const tabs = [
    { value: 'summary', label: 'Riepilogo' },
    { value: 'options', label: 'Impostazioni' },
    { value: 'provvigioni', label: 'Provvigioni' },
    { value: 'password', label: 'Reset Password' },
  ]
  priority !== 4 && tabs.pop()
  if (!tab) {
    return <Redirect to={`/management/users/${userId}/summary`}/>
  }
  
  if (!tabs.find(tab_ => tab_.value === tab)) {
    return <Redirect to="/errors/error-404"/>
  }
  log.debug('user', user)
  /*const userHeader = user && filter( gql`
    fragment header on User {
      email
      username
    }`, user)*/
  return (
    <Page
      className={classes.root}
      title="Dettaglio Gestione Utenti"
    >
      {
        user ?
          <>
            <Header priority={priority} username={user.username}/>
            <Tabs
              className={classes.tabs}
              onChange={handleTabsChange}
              scrollButtons="auto"
              value={tab}
              variant="scrollable"
            >
              {
                tabs.map(tab => (
                  <Tab
                    key={tab.value}
                    label={tab.label}
                    value={tab.value}
                  />
                ))
              }
            </Tabs>
            <Divider className={classes.divider}/>
            <div className={classes.content}>
              {tab === 'summary' && <General {...user} handleEdit={handleEdit}/>}
              {tab === 'options' && <Options {...user}/>}
              {tab === 'provvigioni' && <Provvigioni {...user} me={me}/>}
              {tab === 'password' && <Password {...user} me={me}/>}
            </div>
          </>
          :
          user === null && <Error404/>
      }
    </Page>
  )
}

export default compose(
  withSnackbar
)(UserManagementDetails)
