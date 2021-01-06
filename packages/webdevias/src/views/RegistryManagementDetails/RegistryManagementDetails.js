import React, { useCallback } from 'react'
import { Redirect, useHistory, useParams } from 'react-router-dom'
import { makeStyles } from '@material-ui/styles'
import { colors, Divider, Tab, Tabs } from '@material-ui/core'
import { Page } from 'components'
import { General, Header } from './components'
import { useMutation, useQuery } from '@apollo/react-hooks'
import {
  EDIT_REGISTRY,
  REGISTRY_COMPLETE,
  REGISTRY_COMPLETE_FRAGMENT,
  REGISTRY_EDIT_FRAGMENT,
} from 'queries/registries'
import log from '@adapter/common/src/log'
import { gestError, useAsyncError } from 'helpers'
import compose from 'lodash/fp/compose'
import { withSnackbar } from 'notistack'
import { filter } from 'graphql-anywhere'
import Error404 from '../Error404'
import { validation } from '@adapter/common'

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

const RegistryManagementDetails = ({ enqueueSnackbar }) => {
  const classes = useStyles()
  const { id: registryId, tab } = useParams()
  const history = useHistory()
  const throwError = useAsyncError()
  const handleTabsChange = (event, value) => {
    history.push(value)
  }
  const { data, calledQ, loadingQ, client } = useQuery(REGISTRY_COMPLETE, { variables: { id: registryId } })
  const [editRegistry, { calledM, loadingM }] = useMutation(EDIT_REGISTRY, {
    onError: gestError(throwError, enqueueSnackbar),
  })
  const { registry } = data || {}
  
  const handleEdit = useCallback(async (input, { resetForm }) => {
    log.debug('registryInside', registry)
    let aggregate = Object.assign(registry, input)
    aggregate = validation.trimAll(aggregate)
    const optimistic = filter(REGISTRY_COMPLETE_FRAGMENT, aggregate)
    const res = await editRegistry({
      variables: {
        input: {
          ...filter(REGISTRY_EDIT_FRAGMENT, aggregate),
        },
      },
      optimisticResponse: {
        __typename: 'Mutation',
        editRegistry: {
          ...optimistic,
        },
      },
      /*update: (cache, { data: { edit } }) => {
        let data_
        try { data_ = cache.readQuery({ query: REGISTRIES })} catch (err) {
          log.warn('RegistriesCache not present!')
          return
        }
        log.debug('data_', data_)
        cache.writeQuery({ query: REGISTRIES, data: data_ })
      },*/
    })
    res && resetForm({ ...input })
  }, [editRegistry, registry])
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
  ]
  
  if (!tab) {
    return <Redirect to={`/management_reg/registries/${registryId}/summary`}/>
  }
  
  if (!tabs.find(tab_ => tab_.value === tab)) {
    return <Redirect to="/errors/error-404"/>
  }
  log.debug('registry', registry)
  return (
    <Page
      className={classes.root}
      title="Dettaglio Gestione Utenti"
    >
      {
        registry ?
          <>
            <Header surname={registry.surname} id={registry.id}/>
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
              {tab === 'summary' && <General {...registry} handleEdit={handleEdit}/>}
            </div>
          </>
          :
          registry === null && <Error404/>
      }
    </Page>
  )
}

export default compose(
  withSnackbar
)(RegistryManagementDetails)
