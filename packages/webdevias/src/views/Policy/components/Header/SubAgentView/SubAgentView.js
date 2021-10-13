import React, { useMemo } from 'react'
import { Typography } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import { FastField, Formik } from 'formik'
import { Autocomplete } from 'material-ui-formik-components/Autocomplete'
import { match } from 'helpers'
import parse from 'autosuggest-highlight/parse'
import { useApolloClient } from '@apollo/react-hooks'
import { ME } from 'queries'
import find from 'lodash/find'

const useStyles = makeStyles(theme => ({
  divLinkShort: {
    paddingTop: theme.spacing(0.3),
    paddingBottom: theme.spacing(0.3),
    marginLeft: 5,
  },
  field: {},
  listBox: { overflowX: 'hidden' },
}))

const FormSubAgent = props => {
  const { subAgents, formRefSub, setSubAgent, subAgent } = props
  const classes = useStyles()
  const subAgentList = subAgents
  const subAgentDefault = useMemo(() => {
    return find(subAgents, { id: subAgent?.id })
  }, [subAgent, subAgents])
  return (
    <Formik
      initialValues={
        {
          subAgent: subAgentDefault || null,
        }
      }
      innerRef={formRefSub}
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
                    return option.longName
                  }
                }
                getOptionSelected={
                  (option, value) => option.id === value.id
                }
                name="subAgent"
                noOptionsText="Nessuna opzione"
                onChange={
                  async (_, value) => {
                    await setFieldValue('subAgent', value)
                    setSubAgent(value)
                  }
                }
                options={subAgentList}
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
                    label: 'Filiale',
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

const SubAgentView = props => {
  const { subAgent, formRefSub, setSubAgent, state } = props
  const classes = useStyles()
  const client = useApolloClient()
  const { me: { children = [] } } = client.readQuery({ query: ME })
  const autoProd = (!state || state?.code === 'DRAFT')
  return (
    <Typography
      component="h2"
      variant="overline"
    >
      {
        !autoProd
          ?
          subAgent &&
          <div className={classes.divLinkShort}>
            Filiale:&nbsp;
            <strong>{subAgent?.username}</strong>
          </div>
          :
          children?.length ?
            <FormSubAgent
              formRefSub={formRefSub}
              setSubAgent={setSubAgent}
              subAgent={subAgent}
              subAgents={children}
            />
            :
            null
      }
    </Typography>
  )
}

export default SubAgentView
