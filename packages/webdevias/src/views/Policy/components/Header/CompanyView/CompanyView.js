import React from 'react'
import { Typography } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import { FastField, Formik } from 'formik'
import { Autocomplete } from 'material-ui-formik-components/Autocomplete'
import { match } from 'helpers'
import parse from 'autosuggest-highlight/parse'

const useStyles = makeStyles(theme => ({
  divLinkShort: {
    paddingTop: theme.spacing(0.3),
    paddingBottom: theme.spacing(0.3),
    marginLeft: 5,
  },
  container: {
    marginLeft: theme.spacing(1),
  },
  field: {},
  listBox: { overflowX: 'hidden' },
}))

const CompanyProducer = props => {
  const { companies, formRefComp, setCompany, company } = props
  const classes = useStyles()
  return (
    <Formik
      initialValues={
        {
          company: company || null,
        }
      }
      innerRef={formRefComp}
      onSubmit={() => {}}
    >
      {
        ({ setFieldValue }) => (
          <form autoComplete="off">
            <div style={{ width: 250 }}>
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
                    return option
                  }
                }
                getOptionSelected={
                  (option, value) => option === value
                }
                name="company"
                noOptionsText="Nessuna opzione"
                onChange={
                  async (_, value) => {
                    await setFieldValue('company', value)
                    setCompany(value)
                  }
                }
                options={companies}
                renderOption={
                  (option, { inputValue }) => {
                    const matches = match(option, inputValue)
                    const parts = parse(option, matches)
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
                    label: 'Compagnia',
                    margin: 'none',
                    style: { marginTop: 10, backgroundColor: 'white' },
                    variant: 'outlined',
                  }
                }
              />
            </div>
          </form>
        )
      }
    </Formik>
  )
}

const COMPANIES = [
  'TUA ASSICURAZIONI SPA',
  'ASSICURATRICE MILANESE SPA',
]

const CompanyView = props => {
  const { company, formRefComp, priority, setCompany, state } = props
  const autoComp = (!state || state?.code === 'DRAFT') && priority === 4
  const classes = useStyles()
  return (
    <Typography
      component="h2"
      variant="overline"
    >
      {
        !autoComp && priority === 4
          ?
          <div className={classes.divLinkShort}>
            Compagnia:&nbsp;
            <Typography color="primary" display="inline" variant="overline">{company}</Typography>
          </div>
          :
          <>
            {
              (() => {
                if (autoComp) {
                  return (
                    <CompanyProducer
                      companies={COMPANIES}
                      company={company}
                      formRefComp={formRefComp}
                      setCompany={setCompany}
                    />
                  )
                }
              })()
            }
          </>
      }
    </Typography>
  )
}

export default CompanyView
