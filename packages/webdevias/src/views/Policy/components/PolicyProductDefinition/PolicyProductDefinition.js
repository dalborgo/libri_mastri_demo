import React, { memo, useMemo, useState } from 'react'
import {
  Card,
  CardContent,
  Collapse,
  colors,
  Divider,
  Fab,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField as TF,
  Tooltip,
  Typography,
} from '@material-ui/core'
import ExpandLessIcon from '@material-ui/icons/ExpandLess'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import { FastField, Field, FieldArray, Formik } from 'formik'
import { TextField } from 'formik-material-ui'
import moment from 'moment'
import NumberFormatComp from 'components/NumberFormatComp'
import clsx from 'clsx'
import { addMethod, array, object, string } from 'yup'
import { makeStyles } from '@material-ui/styles'
import Remove from '@material-ui/icons/Remove'
import Add from '@material-ui/icons/Add'
import Header from './Header'
import { cFunctions, numeric } from '@adapter/common'
import Icon from '@mdi/react'
import { mdiContentDuplicate, mdiDeleteCircle, mdiEyeCircle, mdiIdCard, mdiPencilCircle } from '@mdi/js'
import { useParams } from 'react-router'
import DialogSpecialArrangements from './DialogSpecialArrangements'
import keyBy from 'lodash/keyBy'
import DialogEditConditions from './DialogEditConditions'
import { calculateRows, checkChangeRows } from './helpers'
import { ME } from 'queries/users'
import { useApolloClient } from '@apollo/react-hooks'
import sortBy from 'lodash/sortBy'

const newLocale = 'it'
require(`moment/locale/${newLocale}`)
moment.locale(newLocale)

const useStyles = makeStyles(theme => {
  const style = {
    root: {},
    iconButton: {
      marginTop: 7,
      marginBottom: 1,
      padding: theme.spacing(0),
    },
    cardAdding: {
      display: 'inline-block',
      marginTop: theme.spacing(3),
    },
    cardContentAdding: {
      padding: theme.spacing(2),
      paddingTop: theme.spacing(1),
      display: 'flex',
    },
    cardTitle: {
      paddingTop: theme.spacing(2),
      paddingLeft: theme.spacing(2),
    },
    contentSection: {
      paddingBottom: theme.spacing(2),
    },
    iconPlus: {
      marginRight: theme.spacing(2),
      marginBottom: 14,
      width: 35,
      height: 30,
      marginLeft: 12,
    },
    iconPencil: {
      color: 'red',
    },
    iconMinus: {
      marginTop: 5,
      width: 35,
      height: 30,
      marginRight: theme.spacing(1.5),
      marginLeft: theme.spacing(0.5),
      color: theme.palette.grey[600],
      backgroundColor: colors.grey[300],
      '&:hover': {
        backgroundColor: colors.grey[500],
      },
    },
  }
  return style
})

function uniqueProductCode (propertyName, message) {
  return this.test('unique', message, function (value) {
    if (!value || !value[propertyName]) {
      return true
    }
    if (
      this.parent
        .filter(val => val !== value)
        .some(val => cFunctions.camelDeburr(val[propertyName] + val['vehicleType']) === cFunctions.camelDeburr(value[propertyName] + value['vehicleType']))
    ) {
      throw this.createError({
        path: `${this.path}.${propertyName}`,
      })
    }
    return true
  })
}

addMethod(object, 'uniqueProperty', uniqueProductCode)

const schema = object().shape({
  productDefinitions: array()
    .of(
      object().shape({
        productCode: string().required('Codice vuoto'),
      }).uniqueProperty('productCode', 'Nome duplicato!')
    ),
})

const defaultPD = {
  productCode: '',
  vehicleType: '',
  coverageType: '',
  rate: 0,
  overdraft: 0,
  excess: 0,
  minimum: 0,
  taxRate: 13.5,
  glassCap: 0,
  glass: 0,
  towing: 0,
  conditions: '',
  statements: '',
  statementsTowing: '',
}
const focus = event => event.target.select()
const Body = props => {
  const [specialArrangementsOpen, setSpecialArrangementsOpen] = useState(false)
  const [editConditionsIndex, setEditConditionsIndex] = useState(-1)
  const client = useApolloClient()
  const { me: { priority } } = client.readQuery({ query: ME })
  const isDisabled = props.isPolicy
  const isNotAdmin = priority < 4
  const coverageTypesToKey = useMemo(() => keyBy(props.coverageTypes, 'id'), [props.coverageTypes])
  const classes = useStyles()
  const [initialPD] = useState(() => props.productDefinitions.map(prop => {
    return {
      ...prop,
      rate: numeric.printDecimal(prop.rate, 3),
      minimum: numeric.printDecimal(prop.minimum),
      taxRate: prop.taxRate ? numeric.printDecimal(prop.taxRate) : 13.5,
    }
  }))
  return (
    <Formik
      initialValues={
        {
          productDefinitions: initialPD,
          specialArrangements: props.specialArrangements || '',
        }
      }
      innerRef={props.innerRef}
      onSubmit={() => {}}
      validationSchema={schema}
    >
      {
        ({ values, setFieldValue, handleChange }) => {
          const isConditionNew = values.productDefinitions?.[editConditionsIndex]?.isNew
          return (
            <div className={classes.contentSection}>
              {
                props.tab === 'all' ?
                  <Header dispatch={props.dispatch} priority={priority} setFieldValue={setFieldValue} values={values}/>
                  :
                  <div style={{ paddingTop: 20 }}/>
              }
              <form autoComplete="off">
                <FieldArray
                  name="productDefinitions"
                  render={
                    arrayHelpers => (
                      <>
                        <Fab
                          className={classes.iconPlus}
                          color={'primary'}
                          disabled={isDisabled && isNotAdmin}
                          onClick={
                            () => {
                              const taxRate = values.productDefinitions?.[0]?.taxRate ?? 13.5
                              arrayHelpers.push({ ...defaultPD, taxRate, isNew: true })
                            }
                          }
                          size="small"
                        >
                          <Add fontSize="small"/>
                        </Fab>
                        <div className={props.globalClass.divCard}>
                          <div id="pdsForm">
                            {
                              values.productDefinitions.map((ps, index) => {
                                const selectedVehicleType = props.vehicleTypes.find(
                                  vt => vt.id === values.productDefinitions[index]?.vehicleType
                                )
                                const isNew = values.productDefinitions[index].isNew
                                return (
                                  <div className={props.globalClass.rowDiv} key={index}>
                                    <Card className={props.globalClass.cardRow}>
                                      <CardContent
                                        className={props.globalClass.cardRowContent}
                                        style={
                                          {
                                            backgroundColor: values.productDefinitions[index].productCode === '' ? '#E1E5E7' : '#FFFFFF',
                                          }
                                        }
                                      >
                                        <Fab
                                          className={classes.iconMinus}
                                          color="primary"
                                          disabled={!values.productDefinitions[index].isNew && isDisabled}
                                          onClick={
                                            () => arrayHelpers.remove(index)
                                          }
                                          size="small"
                                          tabIndex={-1}
                                        >
                                          <Remove fontSize="small"/>
                                        </Fab>
                                        <Fab
                                          className={classes.iconMinus}
                                          color="primary"
                                          disabled={!isNew && isDisabled && isNotAdmin}
                                          onClick={
                                            () => {
                                              //const { values: pds } = props.innerRef.current || {}
                                              const newLine = {
                                                ...defaultPD,
                                                ...values.productDefinitions[index],
                                              }
                                              //const newPds = [...pds.productDefinitions, newLine]
                                              return arrayHelpers.insert(index + 1, {
                                                ...newLine,
                                                productCode: '', //calculateRowsInLine(newPds, index + 1),
                                                isNew: true,
                                              })
                                            }
                                          }
                                          size="small"
                                          tabIndex={-1}
                                        >
                                          <Icon path={mdiContentDuplicate} size={0.8}/>
                                        </Fab>
                                        <Tooltip
                                          placement="bottom"
                                          title={selectedVehicleType?.display || ''}
                                        >
                                          <span>
                                            <Field
                                              as={TF}
                                              className={props.globalClass.field}
                                              disabled={!isNew && isDisabled}
                                              InputLabelProps={
                                                {
                                                  shrink: true,
                                                }
                                              }
                                              InputProps={
                                                {
                                                  classes: {
                                                    disabled: props.globalClass.fieldDisabled,
                                                  },
                                                  className: props.globalClass.fieldBack,
                                                }
                                              }
                                              label="Tipo Veicolo"
                                              name={`productDefinitions.${index}.vehicleType`}
                                              onChange={
                                                async event => {
                                                  await handleChange(event)
                                                  const { values: pds } = props.innerRef.current || {}
                                                  calculateRows(pds.productDefinitions, setFieldValue)
                                                }
                                              }
                                              select
                                              SelectProps={{ native: true }}
                                              size="small"
                                              style={{ width: 150 }}
                                              variant="outlined"
                                            >
                                              <option
                                                value={''}
                                              >
                                                {''}
                                              </option>
                                              {
                                                props.vehicleTypes.filter(({ priority: priority_ }) => !priority_ || priority_ === priority).reduce((acc, vt) => {
                                                  if (vt.id === 'RIMORCHIO' && values.productDefinitions[index]?.coverageType === 'CRISTALLI') {
                                                    //skip
                                                  } else {
                                                    acc.push(
                                                      <option
                                                        key={vt.id}
                                                        value={vt.id}
                                                      >
                                                        {vt.display}
                                                      </option>
                                                    )
                                                  }
                                                  return acc
                                                }, [])
                                              }
                                            </Field>
                                          </span>
                                        </Tooltip>
                                        <Tooltip
                                          placement="bottom"
                                          title={values.productDefinitions[index]?.coverageType}
                                        >
                                          <span>
                                            <Field
                                              as={TF}
                                              className={props.globalClass.field}
                                              disabled={!isNew && isDisabled}
                                              InputLabelProps={
                                                {
                                                  shrink: true,
                                                }
                                              }
                                              InputProps={
                                                {
                                                  classes: {
                                                    disabled: props.globalClass.fieldDisabled,
                                                  },
                                                  className: props.globalClass.fieldBack,
                                                }
                                              }
                                              label="Tipo Copertura"
                                              name={`productDefinitions.${index}.coverageType`}
                                              onChange={
                                                async event => {
                                                  await handleChange(event)
                                                  const { values: pds } = props.innerRef.current || {}
                                                  calculateRows(pds.productDefinitions, setFieldValue)
                                                }
                                              }
                                              select
                                              SelectProps={{ native: true }}
                                              size="small"
                                              style={{ width: 250 }}
                                              variant="outlined"
                                            >
                                              <option
                                                value={''}
                                              >
                                                {''}
                                              </option>
                                              {
                                                props.coverageTypes.reduce((acc, pt) => {
                                                  if (pt.id === 'CRISTALLI' && values.productDefinitions[index]?.vehicleType === 'RIMORCHIO') {
                                                    //skip
                                                  } else {
                                                    acc.push(
                                                      <option key={pt.id} value={pt.id}>
                                                        {pt.display}
                                                      </option>
                                                    )
                                                  }
                                                  return acc
                                                }, [])
                                              }
                                            </Field>
                                          </span>
                                        </Tooltip>
                                        <Field
                                          as={TF}
                                          className={props.globalClass.field}
                                          disabled={(!isNew && isDisabled) || values.productDefinitions[index]?.coverageType === 'CRISTALLI'}
                                          InputProps={
                                            {
                                              className: clsx(props.globalClass.fieldBack),
                                              inputComponent: NumberFormatComp,
                                              inputProps: {
                                                thousandSeparator: '.',
                                                decimalScale: 3,
                                                max: 100,
                                              },
                                              startAdornment: <InputAdornment position="start">%</InputAdornment>,
                                            }
                                          }
                                          label="Tasso Lordo"
                                          name={`productDefinitions.${index}.rate`}
                                          onBlur={
                                            () => {
                                              const { values: pds } = props.innerRef.current || {}
                                              calculateRows(pds.productDefinitions, setFieldValue)
                                            }
                                          }
                                          onFocus={focus}
                                          size="small"
                                          style={{ width: 90 }}
                                          variant="outlined"
                                        />
                                        <Field
                                          as={TF}
                                          className={props.globalClass.field}
                                          disabled={(!isNew && isDisabled) || values.productDefinitions[index]?.coverageType === 'CRISTALLI'}
                                          InputProps={
                                            {
                                              className: clsx(props.globalClass.fieldBack),
                                              inputComponent: NumberFormatComp,
                                              inputProps: {
                                                thousandSeparator: '.',
                                                max: 100,
                                              },
                                              startAdornment: <InputAdornment position="start">%</InputAdornment>,
                                            }
                                          }
                                          label="Scoperto"
                                          name={`productDefinitions.${index}.overdraft`}
                                          onBlur={
                                            () => {
                                              const { values: pds } = props.innerRef.current || {}
                                              calculateRows(pds.productDefinitions, setFieldValue)
                                            }
                                          }
                                          onFocus={focus}
                                          size="small"
                                          style={{ width: 80 }}
                                          variant="outlined"
                                        />
                                        <Field
                                          as={TF}
                                          className={props.globalClass.field}
                                          disabled={(!isNew && isDisabled) || values.productDefinitions[index]?.coverageType === 'CRISTALLI'}
                                          InputProps={
                                            {
                                              className: clsx(props.globalClass.fieldBack),
                                              inputComponent: NumberFormatComp,
                                              inputProps: {
                                                thousandSeparator: '.',
                                                decimalScale: 2,
                                              },
                                              startAdornment: <InputAdornment position="start">€</InputAdornment>,
                                            }
                                          }
                                          label="Franchigia"
                                          name={`productDefinitions.${index}.excess`}
                                          onBlur={
                                            () => {
                                              const { values: pds } = props.innerRef.current || {}
                                              calculateRows(pds.productDefinitions, setFieldValue)
                                            }
                                          }
                                          onFocus={focus}
                                          size="small"
                                          style={{ width: 80 }}
                                          variant="outlined"
                                        />
                                        <Field
                                          as={TF}
                                          className={props.globalClass.field}
                                          disabled={(!isNew && isDisabled && isNotAdmin) || values.productDefinitions[index]?.vehicleType === 'RIMORCHIO'}
                                          InputProps={
                                            {
                                              className: clsx(props.globalClass.fieldBack),
                                              inputComponent: NumberFormatComp,
                                              inputProps: {
                                                thousandSeparator: '.',
                                              },
                                              startAdornment: <InputAdornment position="start">€</InputAdornment>,
                                            }
                                          }
                                          label="Mass. Cristalli"
                                          name={`productDefinitions.${index}.glassCap`}
                                          onBlur={
                                            () => {
                                              const { values: pds } = props.innerRef.current || {}
                                              if (props.isPolicy) {
                                                const missingItems = checkChangeRows(initialPD)
                                                if (missingItems.length) {
                                                  alert(`Attenzione stai facendo sparire il pacchetto: ${missingItems.join(', ')}`)
                                                  props.setProductDisappeared(missingItems)
                                                }
                                              } else {
                                                calculateRows(pds.productDefinitions, setFieldValue)
                                              }
                                            }
                                          }
                                          onFocus={focus}
                                          size="small"
                                          style={{ width: 100 }}
                                          variant="outlined"
                                        />
                                        <Field
                                          as={TF}
                                          className={props.globalClass.field}
                                          disabled={(!isNew && isDisabled && isNotAdmin) || values.productDefinitions[index]?.vehicleType === 'RIMORCHIO'}
                                          InputProps={
                                            {
                                              className: clsx(props.globalClass.fieldBack),
                                              inputComponent: NumberFormatComp,
                                              inputProps: {
                                                thousandSeparator: '.',
                                                decimalScale: 2,
                                              },
                                              startAdornment: <InputAdornment position="start">€</InputAdornment>,
                                            }
                                          }
                                          label="Cristalli"
                                          name={`productDefinitions.${index}.glass`}
                                          onFocus={focus}
                                          size="small"
                                          style={{ width: 80 }}
                                          variant="outlined"
                                        />
                                        <Field
                                          as={TF}
                                          className={props.globalClass.field}
                                          disabled={(!isNew && isDisabled && isNotAdmin) || values.productDefinitions[index]?.coverageType === 'CRISTALLI'}
                                          InputProps={
                                            {
                                              className: clsx(props.globalClass.fieldBack),
                                              inputComponent: NumberFormatComp,
                                              inputProps: {
                                                thousandSeparator: '.',
                                                decimalScale: 2,
                                              },
                                              startAdornment: <InputAdornment position="start">€</InputAdornment>,
                                            }
                                          }
                                          label="Traino"
                                          name={`productDefinitions.${index}.towing`}
                                          onFocus={focus}
                                          size="small"
                                          style={{ width: 80 }}
                                          variant="outlined"
                                        />
                                        {
                                          priority === 4 &&
                                          <Field
                                            as={TF}
                                            className={props.globalClass.field}
                                            disabled={(!isNew && isDisabled) || values.productDefinitions[index]?.coverageType === 'CRISTALLI'}
                                            InputProps={
                                              {
                                                className: clsx(props.globalClass.fieldBack),
                                                inputComponent: NumberFormatComp,
                                                inputProps: {
                                                  thousandSeparator: '.',
                                                  decimalScale: 2,
                                                },
                                                startAdornment: <InputAdornment position="start">€</InputAdornment>,
                                              }
                                            }
                                            label="Min. Premio L."
                                            name={`productDefinitions.${index}.minimum`}
                                            onBlur={
                                              () => {
                                                const { values: pds } = props.innerRef.current || {}
                                                calculateRows(pds.productDefinitions, setFieldValue)
                                              }
                                            }
                                            onFocus={focus}
                                            size="small"
                                            style={{ width: 100 }}
                                            variant="outlined"
                                          />
                                        }
                                        {
                                          priority === 4 &&
                                          <Field
                                            as={TF}
                                            className={props.globalClass.field}
                                            disabled={(!isNew && isDisabled) || values.productDefinitions[index]?.coverageType === 'CRISTALLI'}
                                            InputProps={
                                              {
                                                className: clsx(props.globalClass.fieldBack),
                                                inputComponent: NumberFormatComp,
                                                inputProps: {
                                                  thousandSeparator: '.',
                                                  decimalScale: 2,
                                                },
                                                startAdornment: <InputAdornment position="start">%</InputAdornment>,
                                              }
                                            }
                                            label="Tasse"
                                            name={`productDefinitions.${index}.taxRate`}
                                            onFocus={focus}
                                            size="small"
                                            style={{ width: 80 }}
                                            variant="outlined"
                                          />
                                        }
                                        <Tooltip
                                          placement="bottom"
                                          title={values.productDefinitions[index]?.productCode}
                                        >
                                          <span>
                                            <Field
                                              className={clsx(props.globalClass.field, props.globalClass.fieldMid)}
                                              component={TextField}
                                              disabled
                                              InputProps={
                                                {
                                                  classes: {
                                                    disabled: props.globalClass.fieldDisabled,
                                                  },
                                                  className: props.globalClass.fieldBack,
                                                }
                                              }
                                              label="Codice Prodotto"
                                              name={`productDefinitions.${index}.productCode`}
                                              onFocus={focus}
                                              size="small"
                                              style={{ width: 190 }}
                                              variant="outlined"
                                            />
                                          </span>
                                        </Tooltip>
                                        <IconButton
                                          classes={
                                            {
                                              colorPrimary: classes.iconPencil,
                                            }
                                          }
                                          className={classes.iconButton}
                                          color={(values.productDefinitions[index]?.conditions || values.productDefinitions[index]?.statements) ? 'primary' : 'default'}
                                          disabled={(!isNew && isDisabled) && !values.productDefinitions[index]?.conditions && !values.productDefinitions[index]?.statements}
                                          onClick={() => setEditConditionsIndex(index)}
                                          style={
                                            {
                                              marginTop: 10,
                                            }
                                          }
                                        >
                                          {
                                            (!isNew && isDisabled) ?
                                              <Icon path={mdiEyeCircle} size={1}/>
                                              :
                                              <Icon
                                                path={mdiPencilCircle}
                                                size={1}
                                              />
                                          }
                                        </IconButton>
                                        <FastField
                                          component={TextField}
                                          name={`productDefinitions.${index}.conditions`}
                                          style={{ display: 'none' }}
                                        />
                                        <FastField
                                          component={TextField}
                                          name={`productDefinitions.${index}.statements`}
                                          style={{ display: 'none' }}
                                        />
                                        <FastField
                                          component={TextField}
                                          name={`productDefinitions.${index}.statementsTowing`}
                                          style={{ display: 'none' }}
                                        />
                                      </CardContent>
                                    </Card>
                                  </div>
                                )
                              })
                            }
                          </div>
                        </div>
                      </>
                    )
                  }
                />
                <div/>
                <Card className={classes.cardAdding}>
                  <Typography className={classes.cardTitle} variant={'h6'}>
                    Dati Aggiuntivi
                  </Typography>
                  <CardContent className={classes.cardContentAdding}>
                    <FastField
                      className={clsx(props.globalClass.field, props.globalClass.fieldMid)}
                      component={TextField}
                      disabled={isDisabled}
                      InputProps={
                        {
                          classes: {
                            disabled: props.globalClass.fieldDisabled,
                          },
                          className: props.globalClass.fieldBack,
                        }
                      }
                      label="Accordi Speciali"
                      multiline
                      name="specialArrangements"
                      rowsMax={5}
                      style={{ width: 500 }}
                      variant="outlined"
                    />
                    <div>
                      <IconButton
                        className={classes.iconButton}
                        color={values.specialArrangements ? 'primary' : 'default'}
                        onClick={() => setSpecialArrangementsOpen(true)}
                      >
                        {isDisabled ? <Icon path={mdiEyeCircle} size={1}/> : <Icon path={mdiPencilCircle} size={1}/>}
                      </IconButton>
                      <br/>
                      {
                        !isDisabled &&
                        <IconButton
                          className={classes.iconButton}
                          color={values.specialArrangements ? 'primary' : 'default'}
                          disabled={isDisabled}
                          onClick={() => setFieldValue('specialArrangements', '')}
                        >
                          <Icon path={mdiDeleteCircle} size={1}/>
                        </IconButton>
                      }
                    </div>
                  </CardContent>
                </Card>
              </form>
              <DialogSpecialArrangements
                defaultValue={values['specialArrangements']}
                isDisabled={isDisabled}
                open={specialArrangementsOpen}
                setFieldValue={setFieldValue}
                setOpen={setSpecialArrangementsOpen}
              />
              <DialogEditConditions
                coverageTypesToKey={coverageTypesToKey}
                defaultValue={values.productDefinitions}
                index={editConditionsIndex}
                isDisabled={!isConditionNew && isDisabled}
                setFieldValue={setFieldValue}
                setIndex={setEditConditionsIndex}
              />
            </div>
          )
        }
      }
    </Formik>
  )
}

const PolicyProductDefinition = props => {
  const {
    setProductDisappeared,
    productDefinitions = [],
    vehicleTypes,
    innerRef,
    coverageTypes,
    dispatch,
    globalClass,
    specialArrangements,
    isPolicy,
  } = props
  const { tab } = useParams()
  const [expandHeader, setExpandHeader] = useState(true)
  const handleToggleHeader = () => {
    setExpandHeader(expandHeader => !expandHeader)
  }
  const bodyProps = {
    coverageTypes: sortBy(coverageTypes, 'index'),
    setProductDisappeared,
    globalClass,
    dispatch,
    innerRef,
    isPolicy,
    productDefinitions,
    specialArrangements,
    tab,
    vehicleTypes,
  }
  if (tab === 'all') {
    return (
      <div className={globalClass.content}>
        <div
          className={globalClass.contentSectionHeader}
          onClick={handleToggleHeader}
        >
          <List dense disablePadding>
            <ListItem disableGutters>
              <ListItemIcon className={globalClass.iconCollapse}>
                <Icon path={mdiIdCard} size={1}/>
              </ListItemIcon>
              <ListItemText
                primary="Definizione Prodotti (i premi e i tassi indicati sono lordi)"
                primaryTypographyProps={{ variant: 'h5' }}
              />
            </ListItem>
          </List>
          {expandHeader ? <ExpandLessIcon/> : <ExpandMoreIcon/>}
        </div>
        <Divider/>
        <Collapse addEndListener={null} in={expandHeader}>
          <Body {...bodyProps}/>
        </Collapse>
      </div>
    )
  } else {
    return (
      <div className={globalClass.content}>
        <Body {...bodyProps}/>
      </div>
    )
  }
}

export default memo(PolicyProductDefinition)
