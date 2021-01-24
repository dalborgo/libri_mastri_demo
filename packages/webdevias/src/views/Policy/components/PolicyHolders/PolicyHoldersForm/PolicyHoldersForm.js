import React, { memo, useState } from 'react'
import { Card, CardContent, colors, Fab, Grid, IconButton, Tooltip } from '@material-ui/core'
import { FastField, FieldArray, Formik } from 'formik'
import { TextField as MuiTextField } from 'formik-material-ui'
import { Autocomplete } from 'material-ui-formik-components/Autocomplete'
import moment from 'moment'
import clsx from 'clsx'
import { makeStyles, useTheme } from '@material-ui/styles'
import Remove from '@material-ui/icons/Remove'
import Add from '@material-ui/icons/Add'
import Icon from '@mdi/react'
import { mdiAccountMultipleOutline, mdiPencilCircle, mdiShieldAccountOutline, mdiShieldPlusOutline } from '@mdi/js'
import reduce from 'lodash/reduce'
import { HOLDER_SAVE_FRAGMENT } from 'queries/policies'
import { cGraphQL } from '@adapter/common'
import parse from 'autosuggest-highlight/parse'
import { match } from 'helpers'
import { ME } from '../../../../../queries'
import { useApolloClient } from '@apollo/react-hooks'

const newLocale = 'it'
require(`moment/locale/${newLocale}`)
moment.locale(newLocale)

const useStyles = makeStyles(theme => {
  const style = {
    root: {},
    listBox: { overflowX: 'hidden' },
    plusButton: {
      padding: theme.spacing(1),
      marginTop: theme.spacing(1),
      marginRight: theme.spacing(1),
      marginLeft: -5,
    },
    contentSection: {
      paddingBottom: theme.spacing(2),
      paddingTop: theme.spacing(2),
    },
    iconPlus: {
      marginRight: theme.spacing(2),
      marginTop: 14,
    },
    highlightHolder: {
      color: theme.palette.primary.main,
    },
    iconMinus: {
      marginRight: theme.spacing(2),
      marginLeft: theme.spacing(1),
      color: theme.palette.grey[600],
      backgroundColor: colors.grey[300],
      '&:hover': {
        backgroundColor: colors.grey[500],
      },
      '&:disabled': {
        color: theme.palette.grey[600],
      },
    },
  }
  return style
})
const initValue = {
  combo: null,
  ...cGraphQL.formInitialByFragment(HOLDER_SAVE_FRAGMENT),
}

const PolicyHoldersForm = props => {
  const { holders = [], innerRef, globalClass, registries = [], dispatch, isPolicy } = props
  const classes = useStyles()
  const theme = useTheme()
  const client = useApolloClient()
  const { me: { priority } } = client.readQuery({ query: ME })
  const [holdersLength] = useState(holders.length)
  //const focus = event => event.target.select()
  const isDisabled = (isPolicy && priority < 3)
  return (
    <Formik
      initialValues={
        {
          holders: reduce(holders, (prev, curr) => {
            const value = reduce(curr, (prev, _, key) => {
              prev[key] = curr[key] || ''
              return prev
            }, {})
            value['combo'] = { ...value }
            prev.push(value)
            return prev
          }, []),
        }
      }
      innerRef={innerRef}
      onSubmit={() => {}}
    >
      {
        ({ values, setFieldValue }) => (
          <div className={classes.contentSection}>
            <form autoComplete="off">
              <FieldArray
                name="holders"
                render={
                  arrayHelpers => (
                    <div className={globalClass.divCard}>
                      <Grid container direction="column">
                        <Tooltip
                          placement="top"
                          title={values?.holders?.length ? 'Aggiungi assicurato' : 'Aggiungi Intestatario'}
                        >
                          <span>
                            <Fab
                              className={classes.iconPlus}
                              color={'primary'}
                              disabled={isDisabled}
                              onClick={
                                () => {
                                  arrayHelpers.push(initValue)
                                }
                              }
                              size="small"
                            >
                              <Add/>
                            </Fab>
                          </span>
                        </Tooltip>
                        {
                          !!values.holders.length &&
                          <Tooltip placement="bottom" title="Aggiungi in testa e diventa Intestatario">
                            <span>
                              <Fab
                                className={classes.iconPlus}
                                color={'primary'}
                                disabled={isPolicy}
                                onClick={
                                  () => {
                                    arrayHelpers.unshift(initValue)
                                  }
                                }
                                size="small"
                              >
                                <Icon path={mdiShieldPlusOutline} size={1}/>
                              </Fab>
                            </span>
                          </Tooltip>
                        }
                      </Grid>
                      <div>
                        {
                          values.holders.map((ps, index) => (
                            <div className={globalClass.rowDiv} key={index}>
                              <Card
                                className={globalClass.cardRow}
                                style={{ backgroundColor: index !== 0 ? '#F9F9F9' : null }}
                              >
                                <CardContent className={globalClass.cardRowContent}>
                                  <Fab
                                    classes={
                                      {
                                        disabled: classes.iconMinus,
                                      }
                                    }
                                    color="primary"
                                    disabled
                                    size="small"
                                    style={{ marginTop: 5 }}
                                    tabIndex={-1}
                                  >
                                    <Icon
                                      path={index === 0 ? mdiShieldAccountOutline : mdiAccountMultipleOutline}
                                      size={1}
                                    />
                                  </Fab>
                                  <Fab
                                    className={classes.iconMinus}
                                    color="primary"
                                    disabled={isPolicy && (isPolicy && index < holdersLength)}
                                    onClick={
                                      () => arrayHelpers.remove(index)
                                    }
                                    size="small"
                                    tabIndex={-1}
                                  >
                                    <Remove/>
                                  </Fab>
                                  <FastField
                                    classes={
                                      {
                                        listbox: classes.listBox,
                                      }
                                    }
                                    className={clsx(globalClass.field, globalClass.fieldMid)}
                                    component={Autocomplete}
                                    disabled={isDisabled || (isPolicy && index < holdersLength)}
                                    getOptionLabel={(option) => `${option.surname}${option.name ? ` ${option.name}` : ''} ${option.id ? `(${option.id})` : ''}`.trim()}
                                    getOptionSelected={(option, value) => option.id === value.id && option.__typename === value.__typename}
                                    name={`holders.${index}.combo`}
                                    noOptionsText="Nessuna opzione"
                                    onChange={
                                      (_, value) => {
                                        const listIds = cGraphQL.extractFieldsFromFragment(HOLDER_SAVE_FRAGMENT)
                                        setFieldValue(`holders.${index}.combo`, value)
                                        for (let key of listIds) {
                                          setFieldValue(`holders.${index}.${key}`, value?.[key] ?? '')
                                        }
                                      }
                                    }
                                    options={registries}
                                    renderOption={
                                      (option, { inputValue }) => {
                                        const surname = option.surname
                                        const name = option.name ? ` ${option.name}` : ''
                                        const display = `${surname}${name}`
                                        const partsId = parse(option.id, match(option.id, inputValue))
                                        const partsName = parse(display, match(display, inputValue))
                                        return (
                                          <Grid alignItems="center" container>
                                            <Grid
                                              item
                                              xs={12}
                                            >
                                              {
                                                partsName.map((part, index) => (
                                                  <span
                                                    key={index}
                                                    style={{ fontWeight: part.highlight ? 700 : 400 }}
                                                  >
                                                    {part.text}
                                                  </span>
                                                ))
                                              }
                                            </Grid>
                                            <Grid item xs={12}>
                                              {
                                                partsId.map((part, index) => (
                                                  <span
                                                    key={index}
                                                    style={
                                                      {
                                                        fontSize: '12px',
                                                        color: part.highlight ? theme.palette.grey[700] : theme.palette.text.secondary,
                                                        fontWeight: part.highlight ? 700 : 400,
                                                      }
                                                    }
                                                  >
                                                    {part.text}
                                                  </span>
                                                ))
                                              }
                                            </Grid>
                                          </Grid>
                                        )
                                      }
                                    }
                                    size={'small'}
                                    style={{ display: 'inline-block', width: 300 }}
                                    textFieldProps={
                                      {
                                        label: 'Denominazione',
                                        style: { marginTop: -5 },
                                        variant: 'outlined',
                                        className: globalClass.fieldBack,
                                      }
                                    }
                                  />
                                  <IconButton
                                    className={classes.plusButton}
                                    color={values.holders[index]?.id ? 'primary' : 'default'}
                                    disabled={isDisabled || (isPolicy && index < holdersLength)}
                                    onClick={() => dispatch({ type: 'setOpen', index })}
                                  >
                                    <Icon path={mdiPencilCircle} size={1}/>
                                  </IconButton>
                                  <FastField
                                    className={clsx(globalClass.field, globalClass.fieldMid)}
                                    component={MuiTextField}
                                    disabled={isDisabled || (isPolicy && index < holdersLength)}
                                    InputProps={{ className: globalClass.fieldBack, readOnly: true }}
                                    label="P.I./C.F."
                                    name={`holders.${index}.id`}
                                    size="small"
                                    style={{ width: 170 }}
                                    variant="outlined"
                                  />
                                  {
                                    cGraphQL.extractFieldsFromFragment(HOLDER_SAVE_FRAGMENT, ['id']).map(
                                      field =>
                                        (
                                          <FastField
                                            component={MuiTextField}
                                            key={field}
                                            name={`holders.${index}.${field}`}
                                            style={{ display: 'none' }}
                                          />
                                        )
                                    )
                                  }
                                </CardContent>
                              </Card>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )
                }
              />
            </form>
          </div>
        )
      }
    </Formik>
  )
}

export default memo(PolicyHoldersForm)
