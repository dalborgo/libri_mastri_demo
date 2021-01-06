import React, { useCallback, useMemo, useState } from 'react'
import { makeStyles } from '@material-ui/styles'
import { Typography } from '@material-ui/core'
import { useMutation, useQuery } from '@apollo/react-hooks'
import { Page, Paginate, SearchBar } from 'components'
import { Header, UserCardAlt } from './components'
import { DELETE_USER, MAIN_USERS, USERS } from 'queries'
import log from '@adapter/common/src/log'
import { gestError, useAsyncError } from 'helpers'
import CircularIndeterminate from 'components/Progress/CircularIndeterminate'
import find from 'lodash/find'
import remove from 'lodash/remove'
import { withSnackbar } from 'notistack'
import compose from 'lodash/fp/compose'
import sortBy from 'lodash/sortBy'

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(3),
  },
  results: {
    marginTop: theme.spacing(3),
  },
  paginate: {
    marginTop: theme.spacing(3),
    display: 'flex',
    justifyContent: 'center',
  },
}))

const Users = ({ enqueueSnackbar }) => {
  const throwError = useAsyncError()
  const { data, loading, called } = useQuery(USERS, { onError: gestError(throwError) })
  const [del] = useMutation(DELETE_USER, {
    onError: gestError(throwError, enqueueSnackbar),
  })
  const [searchFilter, setSearchFilter] = useState('')
  const rowsPerPage = 3
  const [page, setPage] = useState(0)
  const handleDelete = useCallback(user => async () => {
    await del({
      variables: {
        id: user.id,
      },
      optimisticResponse: {
        __typename: 'Mutation',
        del: {
          ...user,
        },
      },
      update: (cache) => {
        let newData, dataMainUsers
        try { dataMainUsers = cache.readQuery({ query: MAIN_USERS })} catch (err) {
          log.warn('MainUserCache not present!')
        }
        if (dataMainUsers && !user.father) {
          const newDataMainUsers = { ...dataMainUsers }
          remove(newDataMainUsers.mainUsers, function (obj) {
            return obj.id === user.id
          })
          newDataMainUsers.mainUsers = sortBy(newDataMainUsers.mainUsers, 'id')
          cache.writeQuery({ query: MAIN_USERS, data: newDataMainUsers })
        }
        try {
          const data = cache.readQuery({ query: USERS })
          newData = {
            ...data,
          }
        } catch (err) {
          log.warn('UsersCache not present!')
          return
        }
        if (user.father) {
          const found = find(newData.users, { id: user.father })
          remove(found.children, function (obj) {
            return obj.id === user.id
          })
          found.children = found.children.length === 0 ? null : found.children
        }
        if (user.children && user.children.length) {
          for (let { id } of user.children) {
            const found = find(newData.users, { id })
            found.father = ''
          }
        }
        remove(newData.users, function (obj) {
          return obj.id === user.id
        })
        log.debug('newDataUSER', newData.users)
        cache.writeQuery({ query: USERS, data: newData })
        if (newData.users?.length % rowsPerPage === 0 && page > 0) {
          setPage(page - 1)
        }
      },
    })
  }, [del, page])
  const { users } = data || {}
  const classes = useStyles()
  const onPageChange = useCallback(({ selected }) => {
    setPage(selected)
  }, [])
  
  //const handleFilter = () => {}
  const handleSearch = () => {
    setPage(0)
    setSearchFilter(document.getElementById('search_bar').value)
  }
  const usersFiltered = useMemo(() => {
    let filteredUsers = users || []
    if (searchFilter) {
      filteredUsers = users.filter(user => user.username.toLowerCase().includes(searchFilter.toLowerCase()))
    }
    const factor = page * rowsPerPage
    const tot = filteredUsers.length
    return { list: filteredUsers.slice(factor, factor + rowsPerPage) || [], tot }
  }, [page, searchFilter, users])
  return (
    <Page
      className={classes.root}
      title="Utenti"
    >
      <Header/>
      <SearchBar
        onSearch={handleSearch}
      />
      {
        called && !loading
          ?
          <>
            <div className={classes.results}>
              <Typography
                color="textSecondary"
                gutterBottom
                variant="body2"
              >
                {usersFiltered.tot} Utenti trovati. Pagina {page + 1} di{' '}
                {Math.ceil(usersFiltered.tot / rowsPerPage)}
              </Typography>
              {
                usersFiltered.list.map(user => (
                  <UserCardAlt
                    handleDelete={handleDelete}
                    key={user.id}
                    user={user}
                  />
                ))
              }
            </div>
            <div className={classes.paginate}>
              <Paginate
                forcePage={page}
                onPageChange={onPageChange}
                pageCount={Math.ceil(usersFiltered.tot / rowsPerPage)}
                totElem={usersFiltered.tot}
              />
            </div>
          </>
          :
          <CircularIndeterminate/>
      }
    </Page>
  )
}

export default compose(
  withSnackbar
)(Users)

