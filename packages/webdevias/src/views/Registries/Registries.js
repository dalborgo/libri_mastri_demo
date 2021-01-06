import React, { useCallback, useMemo, useState } from 'react'
import { makeStyles } from '@material-ui/styles'
import { Typography } from '@material-ui/core'
import { useQuery } from '@apollo/react-hooks'
import { Page, Paginate, SearchBar } from 'components'
import { Header, RegistryCardAlt } from './components'
import { REGISTRIES } from 'queries'
import { gestError, useAsyncError } from 'helpers'
import CircularIndeterminate from 'components/Progress/CircularIndeterminate'

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

const Registries = () => {
  const throwError = useAsyncError()
  const { data, loading, called } = useQuery(REGISTRIES, {
    variables: {
      filter: JSON.stringify({ producer: { $missing: true } }),
    },
    onError: gestError(throwError),
  })
  const [searchFilter, setSearchFilter] = useState('')
  const rowsPerPage = 4
  const [page, setPage] = useState(0)
  const { registries } = data || {}
  const classes = useStyles()
  const onPageChange = useCallback(({ selected }) => {
    setPage(selected)
  }, [])
  
  //const handleFilter = () => {}
  const handleSearch = () => {
    setPage(0)
    setSearchFilter(document.getElementById('search_bar').value)
  }
  const registriesFiltered = useMemo(() => {
    let filteredRegistries = registries || []
    if (searchFilter) {
      filteredRegistries = registries.filter(registry => registry.surname.toLowerCase().includes(searchFilter.toLowerCase()))
    }
    const factor = page * rowsPerPage
    const tot = filteredRegistries.length
    return { list: filteredRegistries.slice(factor, factor + rowsPerPage) || [], tot }
  }, [page, searchFilter, registries])
  return (
    <Page
      className={classes.root}
      title="Società di Leasing"
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
                {registriesFiltered.tot} Società trovate. Pagina {page + 1} di{' '}
                {Math.ceil(registriesFiltered.tot / rowsPerPage)}
              </Typography>
              {
                registriesFiltered.list.map(registry => (
                  <RegistryCardAlt
                    key={registry.id}
                    registry={registry}
                  />
                ))
              }
            </div>
            <div className={classes.paginate}>
              <Paginate
                forcePage={page}
                onPageChange={onPageChange}
                pageCount={Math.ceil(registriesFiltered.tot / rowsPerPage)}
                totElem={registriesFiltered.tot}
              />
            </div>
          </>
          :
          <CircularIndeterminate/>
      }
    </Page>
  )
}

export default Registries

