import React from 'react'
import { Field, Formik } from 'formik'
import { makeStyles } from '@material-ui/styles'
import clsx from 'clsx'
import { cDate } from '@adapter/common'
import { KeyboardDatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers'
import moment from 'moment'
import MomentUtils from '@date-io/moment'
import { fieldToTextField } from 'formik-material-ui'
import { Card } from '@material-ui/core'

const newLocale = 'it'
moment.locale(newLocale)
require(`moment/locale/${newLocale}`)
const focus = event => event.target.select()
const useStyles = makeStyles(theme => ({
  fieldBack: {
    backgroundColor: theme.palette.grey[100],
  },
  fieldMid: {
    width: 160,
  },
  fieldDisabled: {
    '&:disabled': {
      color: theme.palette.text.secondary,
    },
  },
  field: {
    margin: theme.spacing(1, 1),
    minWidth: 100,
  },
  contentSection: {
    paddingTop: theme.spacing(2),
  },
  cardRowFree: {
    display: 'inline-flex',
    padding: theme.spacing(1),
  },
}))

function DatePickerTextField (props) {
  const { generateDates, generateRegDates, ...rest } = props
  const {
    form: { setFieldValue },
    field: { name },
  } = props
  const onChange = React.useCallback(
    async value => {
      await setFieldValue(name, value)
      const date = String(value)
      if (date !== 'Invalid date') {}
    },
    [setFieldValue, name]
  )
  
  return <KeyboardDatePicker {...fieldToTextField(rest)} onChange={onChange}/>
}

const BdxForm = ({ formRefBdx }) => {
  const classes = useStyles()
  return (
    <Formik
      initialValues={
        {
          startDate: null,
          endDate: null,
        }
      }
      innerRef={formRefBdx}
      onSubmit={() => {}}
    >
      {
        ({ values }) => (
          <form autoComplete="off">
            <div className={classes.contentSection} id="headerForm">
              <Card className={classes.cardRowFree}>
                <MuiPickersUtilsProvider
                  locale={newLocale}
                  moment={moment}
                  utils={MomentUtils}
                >
                  <Field
                    animateYearScrolling={false}
                    autoOk
                    cancelLabel="Annulla"
                    className={clsx(classes.field, classes.fieldMid)}
                    clearable
                    clearLabel="Pulisci"
                    component={DatePickerTextField}
                    emptyLabel="gg/mm/aaaa"
                    format="DD/MM/YYYY"
                    InputProps={
                      {
                        classes: {
                          disabled: classes.fieldDisabled,
                        },
                        className: classes.fieldBack,
                      }
                    }
                    inputVariant="outlined"
                    KeyboardButtonProps={{ tabIndex: '-1' }}
                    label="Estrazione dal"
                    name="startDate"
                    onFocus={focus}
                    size="small"
                  />
                  <Field
                    animateYearScrolling={false}
                    autoOk
                    cancelLabel="Annulla"
                    className={clsx(classes.field, classes.fieldMid)}
                    clearable
                    clearLabel="Pulisci"
                    component={DatePickerTextField}
                    emptyLabel="gg/mm/aaaa"
                    format="DD/MM/YYYY"
                    InputProps={
                      {
                        classes: {
                          disabled: classes.fieldDisabled,
                        },
                        className: classes.fieldBack,
                      }
                    }
                    inputVariant="outlined"
                    KeyboardButtonProps={{ tabIndex: '-1' }}
                    label="Estrazione al"
                    minDate={cDate.mom(values.startDate, null, 'YYYY-MM-DD', [1, 'd'])}
                    minDateMessage="Data iniziale maggiore della data ratina"
                    name="endDate"
                    onFocus={focus}
                    size="small"
                  />
                </MuiPickersUtilsProvider>
              </Card>
            </div>
          </form>
        )
      }
    </Formik>
  )
}

export default BdxForm
