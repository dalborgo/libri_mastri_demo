import React, { useCallback } from 'react'
import { makeStyles } from '@material-ui/styles'
import PropTypes from 'prop-types'
import { Page } from 'components'
import { Header, RegistryCreationCard } from './components'
import log from '@adapter/common/src/log'
import { filter } from 'graphql-anywhere'
import { ADD_REGISTRY, REGISTRIES, REGISTRY_ADD_FRAGMENT } from 'queries/registries'
import { useMutation } from '@apollo/react-hooks'
import { gestError, useAsyncError } from 'helpers'
import { withSnackbar } from 'notistack'
import compose from 'lodash/fp/compose'
import { validation } from '@adapter/common'

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(3),
  },
  results: {
    marginTop: theme.spacing(3),
  },
}))
const RegistryCreation = ({ enqueueSnackbar }) => {
  const classes = useStyles()
  const throwError = useAsyncError()
  const [addRegistry, { client }] = useMutation(ADD_REGISTRY, {
    onError: gestError(throwError, enqueueSnackbar),
  })
  const handleCreate = useCallback(async (input, { resetForm }) => {
    log.debug('input', input)
    let aggregate = filter(REGISTRY_ADD_FRAGMENT, input)
    aggregate = validation.trimAll(aggregate)
    log.debug('aggregate', aggregate)
    client.writeData({ data: { loading: true } })
    const res = await addRegistry({
      variables: {
        input: {
          ...aggregate,
          username: aggregate.vat,
          password: 'Pw123456',
        },
      },
      update: (cache, { data: { addRegistry } }) => {
        let data
        try {
          data = cache.readQuery({
            query: REGISTRIES,
            variables: {
              filter: JSON.stringify({ producer: { $missing: true } }),
            },
          })
        } catch (err) {
          log.warn('RegistriesCache not present!')
          return
        }
        data.registries.unshift(addRegistry)
        log.debug('data', data.registries)
        cache.writeQuery({ query: REGISTRIES, data })
      },
    })
    client.writeData({ data: { loading: false } })
    enqueueSnackbar('Inserimento avvenuto con successo', { variant: 'success' })
    res && resetForm()
  }, [addRegistry, client, enqueueSnackbar])
  return (
    <Page
      className={classes.root}
      title="Creazione Società di Leasing"
    >
      <Header/>
      <div className={classes.results}>
        <RegistryCreationCard handleCreate={handleCreate}/>
      </div>
    </Page>
  )
}

RegistryCreation.propTypes = {
  enqueueSnackbar: PropTypes.any,
}

export default compose(
  withSnackbar
)(RegistryCreation)
