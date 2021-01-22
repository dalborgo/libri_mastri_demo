import React, { useCallback, useMemo, useState } from 'react'
import { CircularIndeterminate, Page } from 'components'
import { checkNullish, gestError, useAsyncError } from 'helpers'
import { useMutation, useQuery } from '@apollo/react-hooks'
import { DELETE_POLICY, ME, POLICIES } from 'queries'
import { makeStyles } from '@material-ui/styles'
import Header from './Header'
import PolicyListTable from './PolicyListTable'
import compose from 'lodash/fp/compose'
import { withSnackbar } from 'notistack'
import { filtersInitialValue } from './Header/components/Filter'
import { CLONE_POLICY } from 'queries/policies'
import { useConfirm } from 'material-ui-confirm'
import log from '@adapter/common/src/log'
import { useHistory, useLocation } from 'react-router-dom'

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(3),
  },
  results: {
    marginTop: theme.spacing(3),
  },
}))

const Policies = ({ enqueueSnackbar }) => {
  const classes = useStyles()
  const throwError = useAsyncError()
  const confirm = useConfirm()
  const location = useLocation()
  const history = useHistory()
  //const [selection, setSelection] = useState([])
  const [filters, setFilters] = useState(filtersInitialValue)
  const isFiltered = useMemo(() => checkNullish(filters, filtersInitialValue), [filters])
  const { data, loading, called, refetch, client } = useQuery(POLICIES, {
    variables: {
      origin: location.pathname,
    },
    onError: gestError(throwError),
    pollInterval: 30000,
  })
  const filteredRows = useMemo(() => {
    if (!data) {return []}
    if (isFiltered) {
      return data.policies.reduce((prev, curr) => {
        let toInclude = true
        if (filters.docNumber && !curr.number.includes(filters.docNumber)) {
          toInclude &= false
        }
        if (toInclude && filters.docSigner && !curr.signer?.surname?.toLowerCase().includes(filters.docSigner.toLowerCase())) {
          toInclude &= false
        }
        toInclude && prev.push(curr)
  
        return prev
      }, [])
    } else {
      return data.policies
    }
  }, [data, filters.docNumber, filters.docSigner, isFiltered])
  const { me: { priority } } = client.readQuery({ query: ME })
  const [delPolicy] = useMutation(DELETE_POLICY, {
    onError: gestError(throwError, enqueueSnackbar),
  })
  const [clonePolicy] = useMutation(CLONE_POLICY, {
    onError: gestError(throwError, enqueueSnackbar),
  })
  const deletePolicy = useCallback((id, number, __typename) => async () => {
    try {
      await confirm({ description: `Vuoi veramente eliminare il documento "${number}" ?` })
      client.writeData({ data: { loading: true } })
      await delPolicy({
        variables: {
          id,
        },
      })
      client.writeData({ data: { loading: false } })
      await refetch()
    } catch (err) {
      err && log.error(err)
    }
    /*const result = await delPolicy({
      variables: {
        id: number,
      },
      optimisticResponse: {
        __typename: 'Mutation',
        delPolicy: {
          id: number,
          meta: null,
          __typename,
        },
      },
      update: (cache, { data: { delPolicy } }) => {
        const data = cache.readQuery({ query: POLICIES })
        const policies = data.policies.filter(policy => policy.id !== delPolicy.id)
        cache.writeQuery({ query: POLICIES, data: { policies } })
      },
    })
    if(result){
      const { delPolicy: deletePolicyResult } = result.data || {}
      //only for debug purposes
      if (deletePolicyResult?.meta?.version > 0 && !cFunctions.isProd()) {
        await refetch()
      }
    }*/
  }, [client, confirm, delPolicy, refetch])
  
  const clonePolicy_ = useCallback(number => async () => {
    client.writeData({ data: { loading: true } })
    await clonePolicy({
      variables: {
        id: number,
      },
    })
    client.writeData({ data: { loading: false } })
    await refetch()
    history.push('/policies/doclist')
  }, [client, clonePolicy, history, refetch])
  return (
    <Page
      className={classes.root}
      title={location.pathname === '/policies/doclist' ? 'Lista Quotazioni' : 'Lista Polizze'}
    >
      <Header filters={filters} isFiltered={isFiltered} priority={priority} setFilters={setFilters}/>
      {
        called && !loading
          ?
          <div className={classes.results}>
            <PolicyListTable
              clonePolicy={clonePolicy_}
              deletePolicy={deletePolicy}
              rows={filteredRows}
            />
          </div>
          :
          <CircularIndeterminate/>
      }
    </Page>
  )
}

export default compose(
  withSnackbar
)(Policies)
