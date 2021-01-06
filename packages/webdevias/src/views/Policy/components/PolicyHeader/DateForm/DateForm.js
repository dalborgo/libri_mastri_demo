import { cDate } from '@adapter/common'
import { connect, FastField, Field } from 'formik'
import { Card, TextField as TF } from '@material-ui/core'
import { TextField } from 'formik-material-ui'
import { MuiPickersUtilsProvider } from '@material-ui/pickers'
import moment from 'moment'
import MomentUtils from '@date-io/moment'
import clsx from 'clsx'
import { getPolicyEndDate } from 'helpers'
import React, { memo } from 'react'
import compose from 'lodash/fp/compose'
import DatePickerTextField from './DatePickerTextField'

const newLocale = 'it'
require(`moment/locale/${newLocale}`)
moment.locale(newLocale)
const focus = event => event.target.select()
const DateForm = props => {
  const { formik: { values }, globalClass, isNew, generateDates, generateRegDates, isPolicy } = props
  return (
    <div className={globalClass.contentSection} id="headerForm">
      <Card className={globalClass.cardRowFree}>
        {
          isNew &&
          <FastField
            className={globalClass.field}
            component={TextField}
            InputProps={{ className: globalClass.fieldBack }}
            label="Nome Bozza"
            name="number"
            onFocus={focus}
            size="small"
            variant="outlined"
          />
        }
        <MuiPickersUtilsProvider
          locale={newLocale}
          moment={moment}
          utils={MomentUtils}
        >
          <Field
            animateYearScrolling={false}
            autoOk
            cancelLabel="Annulla"
            className={clsx(globalClass.field, globalClass.fieldMid)}
            clearable
            clearLabel="Pulisci"
            component={DatePickerTextField}
            disabled={isPolicy}
            emptyLabel="gg/mm/aaaa"
            format="DD/MM/YYYY"
            generateDates={generateDates}
            generateRegDates={generateRegDates}
            InputProps={
              {
                classes: {
                  disabled: globalClass.fieldDisabled,
                },
                className: globalClass.fieldBack,
              }
            }
            inputVariant="outlined"
            KeyboardButtonProps={{ tabIndex: '-1' }}
            label="Data Decorrenza"
            name="initDate"
            onFocus={focus}
            size="small"
          />
          <Field
            animateYearScrolling={false}
            autoOk
            cancelLabel="Annulla"
            className={clsx(globalClass.field, globalClass.fieldMid)}
            clearable
            clearLabel="Pulisci"
            component={DatePickerTextField}
            disabled={isPolicy}
            emptyLabel="gg/mm/aaaa"
            format="DD/MM/YYYY"
            generateDates={generateDates}
            generateRegDates={generateRegDates}
            InputProps={
              {
                classes: {
                  disabled: globalClass.fieldDisabled,
                },
                className: globalClass.fieldBack,
              }
            }
            inputVariant="outlined"
            KeyboardButtonProps={{ tabIndex: '-1' }}
            label="Data Rateo"
            minDate={cDate.mom(values.initDate, null, 'YYYY-MM-DD', [1, 'd'])}
            minDateMessage="Data iniziale maggiore della data ratina"
            name="midDate"
            onFocus={focus}
            size="small"
          />
        </MuiPickersUtilsProvider>
        <TF
          className={clsx(globalClass.field, globalClass.fieldMid)}
          disabled
          InputProps={
            {
              classes: {
                disabled: globalClass.fieldDisabled,
              },
              className: globalClass.fieldBack,
            }
          }
          label="Data Scadenza"
          size="small"
          value={values.initDate ? getPolicyEndDate(values.initDate, values.midDate) : 'gg/mm/aaaa'}
          variant="outlined"
        />
      </Card>
      {/* <div
        style={
          {
            paddingTop: 20,
          }
        }
      >
        <Button
          className={globalClass.whiteButton}
          onClick={
            () => {
              generateDates()
              generateRegDates()
            }
          }
          size="small"
          variant="outlined"
        >
          <Icon path={mdiEqual} size={1} style={{ marginTop: -1 }}/>&nbsp;Applica ai Frazionamenti
        </Button>
      </div>*/}
    </div>
  
  )
}
export default compose(
  connect,
  memo
)(DateForm)

