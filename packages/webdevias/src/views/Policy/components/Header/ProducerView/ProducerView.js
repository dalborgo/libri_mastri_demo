import React, { useMemo } from 'react'
import { Box, FormControl, InputAdornment, Link, TextField as TF, Typography } from '@material-ui/core'
import { Link as RouterLink } from 'react-router-dom'
import { makeStyles } from '@material-ui/styles'
import { FastField, Field, Formik } from 'formik'
import { Autocomplete } from 'material-ui-formik-components/Autocomplete'
import { gestError, match, useAsyncError } from 'helpers'
import parse from 'autosuggest-highlight/parse'
import { useQuery } from '@apollo/react-hooks'
import { USERS, USERS_PRODUCERS_FRAGMENT } from 'queries'
import { filter } from 'graphql-anywhere'
import TextField from '@material-ui/core/TextField'
import find from 'lodash/find'
import NumberFormatComp from '../../../../../components/NumberFormatComp'

const useStyles = makeStyles(theme => ({
  divLinkShort: {
    paddingTop: theme.spacing(0.3),
    paddingBottom: theme.spacing(0.3),
    marginLeft: 5,
  },
  field: {},
  listBox: { overflowX: 'hidden' },
}))

const defaultProvvigioni = value => value ?
  {
    attive: value.attive / 1000,
    passive: value.passive / 1000,
    //codice: value['provvigioni'].codice,
  }
  :
  { attive: 0, passive: 0 }

const FormProducer = props => {
  const { producers, formRefProd, formRefHolders, setProducer, producer, provvigioni } = props
  const classes = useStyles()
  const prodList = useMemo(() => producers.filter(producer => producer.priority < 4 && producer.priority > 1), [producers])
  const prodDefault = useMemo(() => {
    return find(producers, { id: producer?.id })
  }, [producer, producers])
  return (
    <Formik
      initialValues={
        {
          producer: prodDefault || null,
          provvigioni: defaultProvvigioni(provvigioni || prodDefault?.provvigioni),
        }
      }
      innerRef={formRefProd}
      onSubmit={() => {}}
    >
      {
        ({ setFieldValue }) => (
          <form autoComplete="off">
            <Box display="flex" gridGap={8}>
              <div style={{ width: 350 }}>
                <FastField
                  classes={
                    {
                      listbox: classes.listBox,
                    }
                  }
                  className={classes.field}
                  component={Autocomplete}
                  getOptionLabel={
                    option => {
                      if (!option) {return ''}
                      return option.longName
                    }
                  }
                  getOptionSelected={
                    (option, value) => option.id === value.id
                  }
                  name="producer"
                  noOptionsText="Nessuna opzione"
                  onChange={
                    async (_, value) => {
                      await setFieldValue('producer', value)
                      await setFieldValue('provvigioni', defaultProvvigioni(value?.provvigioni))
                      const { setFieldValue: setHolderValue, values } = formRefHolders.current || {}
                      if (values?.collaborators?.length) {
                        await setHolderValue('collaborators', [])
                      }
                      setProducer(value)
                    }
                  }
                  options={prodList}
                  renderOption={
                    (option, { inputValue }) => {
                      const matches = match(option.longName, inputValue)
                      const parts = parse(option.longName, matches)
                      return (
                        <div>
                          {
                            parts.map((part, index) => (
                              <span
                                key={index}
                                style={
                                  {
                                    fontWeight: part.highlight ? 700 : 400,
                                  }
                                }
                              >
                                {part.text}
                              </span>
                            ))
                          }
                        </div>
                      )
                    }
                  }
                  required
                  size={'small'}
                  textFieldProps={
                    {
                      label: 'Intermediario/Filiale',
                      margin: 'none',
                      style: { marginTop: 10, backgroundColor: 'white' },
                      variant: 'outlined',
                    }
                  }
                />
              </div>
              <div style={{ width: 150 }}>
                <FormControl variant="outlined">
                  <Field
                    as={TF}
                    InputProps={
                      {
                        inputComponent: NumberFormatComp,
                        inputProps: {
                          thousandSeparator: '.',
                          decimalScale: 3,
                          fixedDecimalScale: 3,
                          max: 100,
                        },
                        startAdornment: <InputAdornment position="start">%</InputAdornment>,
                      }
                    }
                    label="Provvigioni Attive"
                    name="provvigioni.attive"
                    size="small"
                    style={{ marginTop: 10, width: 150, backgroundColor: 'white' }}
                    variant="outlined"
                  />
                </FormControl>
              </div>
              <div style={{ width: 150 }}>
                <FormControl variant="outlined">
                  <Field
                    as={TF}
                    InputProps={
                      {
                        inputComponent: NumberFormatComp,
                        inputProps: {
                          thousandSeparator: '.',
                          decimalScale: 3,
                          fixedDecimalScale: 3,
                          max: 100,
                        },
                        startAdornment: <InputAdornment position="start">%</InputAdornment>,
                      }
                    }
                    label="Provvigioni Passive"
                    name="provvigioni.passive"
                    size="small"
                    style={{ marginTop: 10, width: 150, backgroundColor: 'white' }}
                    variant="outlined"
                  />
                </FormControl>
              </div>
            </Box>
          </form>
        )
      }
    </Formik>
  )
}

const ProducerView = props => {
  const { producer, formRefProd, priority, setProducer, state, subAgent, formRefHolders, provvigioni } = props
  const classes = useStyles()
  const throwError = useAsyncError()
  const autoProd = (!state || state?.code === 'DRAFT') && priority === 4
  const { data: producers, loading, called } = useQuery(USERS, {
    onError: gestError(throwError),
    skip: !autoProd,
  })
  return (
    <Typography
      component="h2"
      variant="overline"
    >
      {
        !autoProd && priority === 4
          ?
          <div className={classes.divLinkShort}>
            Intermediario:&nbsp;
            <Link
              className={classes.link}
              component={RouterLink}
              target="_blank"
              to={`/management/users/${producer?.username}/summary`}
            >
              {producer?.username}
            </Link>
            {
              subAgent &&
              <>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Filiale:&nbsp;
                <Link
                  className={classes.link}
                  component={RouterLink}
                  target="_blank"
                  to={`/management/users/${subAgent?.username}/summary`}
                >
                  {subAgent?.username}
                </Link>
              </>
            }
          </div>
          :
          <>
            {
              (() => {
                if (called && !loading && autoProd) {
                  return (
                    <FormProducer
                      formRefHolders={formRefHolders}
                      formRefProd={formRefProd}
                      producer={subAgent || producer}
                      producers={filter(USERS_PRODUCERS_FRAGMENT, producers.users)}
                      provvigioni={provvigioni}
                      setProducer={setProducer}
                    />
                  )
                }
                if (loading) {
                  return (
                    <TextField
                      disabled
                      label="Caricamento..."
                      margin="none"
                      size="small"
                      style={{ marginTop: 10, backgroundColor: 'white', width: 250 }}
                      variant="outlined"
                    />
                  )
                } else {
                  return null
                }
              })()
            }
          </>
      }
    </Typography>
  )
}

export default ProducerView
