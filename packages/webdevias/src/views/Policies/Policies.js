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
import { CLONE_POLICY, UPDATE_POLICY } from 'queries/policies'
import { useConfirm } from 'material-ui-confirm'
import log from '@adapter/common/src/log'
import { useHistory, useLocation } from 'react-router-dom'
import ChangePasswordDialog from './ChangePasswordDialog'

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
  const isQuotation = location.pathname === '/policies/doclist'
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
        if (filters.docNumber && (!curr.number.includes(filters.docNumber.trim()) && !curr?.numPolizzaCompagnia?.includes(filters.docNumber.trim()))) {
          toInclude &= false
        }
        if (toInclude && filters.docSigner && !curr.signer?.surname?.toLowerCase().includes(filters.docSigner.toLowerCase().trim())) {
          toInclude &= false
        }
        if (toInclude && filters.docProducer && !curr.producer?.username?.toLowerCase().includes(filters.docProducer.toLowerCase().trim())) {
          toInclude &= false
        }
        if (toInclude && filters.docSubAgent && !curr.subAgent?.username?.toLowerCase().includes(filters.docSubAgent.toLowerCase().trim())) {
          toInclude &= false
        }
        /* if (toInclude && filters.docCollaborator && !curr.collaborator?.username?.toLowerCase().includes(filters.docCollaborator.toLowerCase().trim())) {
           toInclude &= false
         }*/
        toInclude && prev.push(curr)
        return prev
      }, [])
    } else {
      return data.policies
    }
  }, [data, isFiltered, filters.docNumber, filters.docSigner, filters.docProducer, filters.docSubAgent])
  const { me: { priority }, me } = client.readQuery({ query: ME })
  const [delPolicy] = useMutation(DELETE_POLICY, {
    onError: gestError(throwError, enqueueSnackbar),
  })
  const [clonePolicy] = useMutation(CLONE_POLICY, {
    onError: gestError(throwError, enqueueSnackbar),
  })
  const [updatePolicy] = useMutation(UPDATE_POLICY, {
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
      update: async (cache) => {
        !isQuotation && delete cache.data.data['ROOT_QUERY']['policies({"origin":"/policies/doclist"})']
      },
    })
    client.writeData({ data: { loading: false } })
    isQuotation && refetch()
    history.push('/policies/doclist')
  }, [client, clonePolicy, history, isQuotation, refetch])
  const updatePolicy_ = useCallback(number => async () => {
    client.writeData({ data: { loading: true } })
    await updatePolicy({
      variables: {
        id: number,
      },
      update: async (cache) => {
        delete cache.data.data['ROOT_QUERY']['policies({"origin":"/policies/doclist"})']
      },
    })
    client.writeData({ data: { loading: false } })
    history.push('/policies/doclist')
  }, [client, history, updatePolicy])
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
              updatePolicy={updatePolicy_}
            />
          </div>
          :
          <CircularIndeterminate/>
      }
      <ChangePasswordDialog {...me}/>
    </Page>
  )
}

export default compose(
  withSnackbar
)(Policies)
