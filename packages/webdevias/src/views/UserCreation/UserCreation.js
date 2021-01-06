import React, { useCallback } from 'react'
import { makeStyles } from '@material-ui/styles'
import PropTypes from 'prop-types'
import { Page } from 'components'
import { Header, UserCreationCard } from './components'
import log from '@adapter/common/src/log'
import { filter } from 'graphql-anywhere'
import { ADD_USER, CHILDREN_FROM_LIST, MAIN_USERS, MAIN_USERS_FRAGMENT, USER_ADD_FRAGMENT, USERS } from 'queries/users'
import { useMutation } from '@apollo/react-hooks'
import { gestError, useAsyncError } from 'helpers'
import { withSnackbar } from 'notistack'
import compose from 'lodash/fp/compose'
import find from 'lodash/find'
import sortBy from 'lodash/sortBy'
import { validation } from '@adapter/common'

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(3),
  },
  results: {
    marginTop: theme.spacing(3),
  },
}))

const UserCreation = ({ enqueueSnackbar }) => {
  const classes = useStyles()
  const throwError = useAsyncError()
  const [add, { client }] = useMutation(ADD_USER, {
    onError: gestError(throwError, enqueueSnackbar),
  })
  const handleCreate = useCallback(async (input, { resetForm }) => {
    log.debug('input', input)
    if (input.role !== 'SUB_AGENT') {
      input.father = null
    }
    let aggregate = filter(USER_ADD_FRAGMENT, input)
    aggregate = validation.trimAll(aggregate)
    log.debug('aggregate', aggregate)
    client.writeData({ data: { loading: true } })
    const res = await add({
      variables: {
        input: {
          ...aggregate,
          email: input.email ? input.email : null,
        },
      },
      update: (cache, { data: { add } }) => {
        let data, dataMainUsers

        try { dataMainUsers = cache.readQuery({ query: MAIN_USERS })} catch (err) {
          log.warn('MainUserCache not present!')
        }
        if (dataMainUsers && !add.father) {
          const newDataMainUsers = { ...dataMainUsers }
          newDataMainUsers.mainUsers.unshift(filter(MAIN_USERS_FRAGMENT, add))
          newDataMainUsers.mainUsers = sortBy(newDataMainUsers.mainUsers, 'id')
          cache.writeQuery({ query: MAIN_USERS, data: newDataMainUsers })
        }
        try { data = cache.readQuery({ query: USERS })} catch (err) {
          log.warn('UsersCache not present!')
          return
        }

        if (add.father) {
          const found = find(data.users, { id: add.father })
          if (found.children) {
            found.children.push(filter(CHILDREN_FROM_LIST, add))
          } else {
            found.children = [filter(CHILDREN_FROM_LIST, add)]
          }
        }
        data.users.unshift(add)
        log.debug('data', data.users)
        cache.writeQuery({ query: USERS, data })
      },
    })
    client.writeData({ data: { loading: false } })
    enqueueSnackbar('Inserimento avvenuto con successo', { variant: 'success' })
    res && resetForm()
  }, [add, client, enqueueSnackbar])
  return (
    <Page
      className={classes.root}
      title="Creazione Utente"
    >
      <Header/>
      <div className={classes.results}>
        <UserCreationCard handleCreate={handleCreate}/>
      </div>
    </Page>
  )
}

UserCreation.propTypes = {
  enqueueSnackbar: PropTypes.any,
}

export default compose(
  withSnackbar
)(UserCreation)
