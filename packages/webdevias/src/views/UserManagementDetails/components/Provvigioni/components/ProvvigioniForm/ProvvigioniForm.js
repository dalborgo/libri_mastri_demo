import React, { useCallback } from 'react'
import { UPDATE_USER_PROVVIGIONI } from 'queries/users'
import { Field, Form, Formik } from 'formik'
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  colors,
  Divider,
  FormControl,
  Grid,
  InputAdornment,
  TextField as TF,
} from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import useAsyncError from 'helpers/useAsyncError'
import { useMutation } from '@apollo/react-hooks'
import { gestError } from 'helpers'
import compose from 'lodash/fp/compose'
import { withSnackbar } from 'notistack'
import NumberFormatComp from 'components/NumberFormatComp'
import { numeric } from '@adapter/common'

const useStyles = makeStyles(theme => ({
  root: {
    maxWidth: 500,
  },
  saveButton: {
    color: theme.palette.white,
    backgroundColor: colors.green[600],
    '&:hover': {
      backgroundColor: colors.green[900],
    },
  },
}))

const focus = event => event.target.select()
const ProvvigioniForm = props => {
  const { enqueueSnackbar, provvigioni, username } = props
  const throwError = useAsyncError()
  const classes = useStyles()
  const [updateProvvigioni, { client }] = useMutation(UPDATE_USER_PROVVIGIONI, {
    onError: gestError(throwError, enqueueSnackbar),
  })
  const handleUpdateProvvigioni = useCallback(async (input, { resetForm }) => {
    client.writeData({ data: { loading: true } })
    const insertProv = {
      provvigioni: {
        attive: numeric.normNumb(input.attive),
        passive: numeric.normNumb(input.passive),
        codice: numeric.normNumb(input.codice, false),
      },
    }
    const response = await updateProvvigioni({
      variables: {
        username,
        input: insertProv,
      },
    })
    client.writeData({ data: { loading: false } })
    if (response?.data?.updateProvvigioni) {
      enqueueSnackbar('Provvigioni aggiornate', { variant: 'success' })
      resetForm()
    }
  }, [client, enqueueSnackbar, updateProvvigioni, username])
  return (
    <Card
      className={classes.root}
    >
      <Formik
        initialValues={
          {
            attive: provvigioni['attive'] / 1000,
            passive: provvigioni['passive'] / 1000,
            codice: provvigioni['codice'] || '',
          }
        }
        onSubmit={handleUpdateProvvigioni}
      >
        {
          ({ isSubmitting, dirty }) => (
            <Form autoComplete="off">
              <CardHeader title="Inserisci le provvigioni"/>
              <Divider/>
              <>
                <CardContent>
                  <Grid
                    container
                    spacing={3}
                  >
                    <Grid
                      item
                      xs={12}
                    >
                      <FormControl fullWidth variant="outlined">
                        <Field
                          as={TF}
                          InputProps={
                            {
                              inputComponent: NumberFormatComp,
                              inputProps: {
                                decimalScale: 0,
                              },
                            }
                          }
                          label="Codice"
                          name="codice"
                          onFocus={focus}
                          size="small"
                          style={{ width: 200 }}
                          variant="outlined"
                        />
                      </FormControl>
                    </Grid>
                    <Grid
                      item
                      xs={12}
                    >
                      <FormControl fullWidth variant="outlined">
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
                          label="Attive"
                          name="attive"
                          onFocus={focus}
                          size="small"
                          style={{ width: 200 }}
                          variant="outlined"
                        />
                      </FormControl>
                    </Grid>
                    <Grid
                      item
                      xs={12}
                    >
                      <FormControl fullWidth variant="outlined">
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
                          label="Passive"
                          name="passive"
                          onFocus={focus}
                          size="small"
                          style={{ width: 200 }}
                          variant="outlined"
                        />
                      </FormControl>
                    </Grid>
                  </Grid>
                </CardContent>
                <Divider/>
                <CardActions>
                  <Button
                    className={classes.saveButton}
                    disabled={isSubmitting || !dirty}
                    type="submit"
                    variant="contained"
                  >
                    Aggiorna le Provvigioni
                  </Button>
                </CardActions>
              </>
            </Form>
          )
        }
      </Formik>
    </Card>
  )
}

export default compose(
  withSnackbar
)(ProvvigioniForm)

