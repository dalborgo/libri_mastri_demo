import React, { useCallback } from 'react'
import { EDIT_USER_OPTIONS, ME, USER_ACCESS_FRAGMENT, USER_OPTIONS_EDIT_FRAGMENT } from 'queries/users'
import { Field, Form, Formik } from 'formik'
import { Button, Card, CardActions, CardContent, CardHeader, colors, Divider, Grid } from '@material-ui/core'
import { Switch } from 'formik-material-ui'
import { makeStyles } from '@material-ui/styles'
import useAsyncError from 'helpers/useAsyncError'
import { useMutation } from '@apollo/react-hooks'
import { gestError } from 'helpers'
import compose from 'lodash/fp/compose'
import { withSnackbar } from 'notistack'
import { filter } from 'graphql-anywhere'
import FormControlLabel from '@material-ui/core/FormControlLabel'

const useStyles = makeStyles(theme => ({
  root: {},
  saveButton: {
    color: theme.palette.white,
    backgroundColor: colors.green[600],
    '&:hover': {
      backgroundColor: colors.green[900],
    },
  },
}))

const OptionsForm = props => {
  const { enqueueSnackbar } = props
  const throwError = useAsyncError()
  const classes = useStyles()
  const [editOptions, { client }] = useMutation(EDIT_USER_OPTIONS, {
    onError: gestError(throwError, enqueueSnackbar),
  })
  const { me } = client.readQuery({ query: ME })
  
  const handleEdit = useCallback(async input => {
    const insertOpt = {
      options: {
        neverShowMenu: input.neverShowMenu,
        forceDownloadPdf: input.forceDownloadPdf,
      },
    }
    const aggregate = Object.assign(me, insertOpt)
    const optimistic = filter(USER_ACCESS_FRAGMENT, aggregate)
    await editOptions({
      variables: {
        input: {
          ...filter(USER_OPTIONS_EDIT_FRAGMENT, aggregate),
        },
      },
      optimisticResponse: {
        __typename: 'Mutation',
        editOptions: {
          ...optimistic,
          options: {
            ...optimistic.options,
            __typename: 'UserOptions',
          },
        },
      },
    })
  }, [editOptions, me])
  return (
    <Card
      className={classes.root}
    >
      <Formik
        initialValues={
          {
            neverShowMenu: me?.options?.neverShowMenu,
            forceDownloadPdf: me?.options?.forceDownloadPdf,
          }
        }
        onSubmit={handleEdit}
      >
        {
          ({ isSubmitting, isValid, dirty }) => (
            <Form autoComplete="off">
              <CardHeader title="Opzioni di visualizzazione"/>
              <Divider/>
              <>
                <CardContent>
                  <Grid
                    container
                  >
                    <Grid
                      item
                      md={6}
                      xs={12}
                    >
                      <FormControlLabel
                        control={<Field component={Switch} name="neverShowMenu" type="checkbox"/>}
                        label="Non mostrare il menu di sinistra"
                      />
                      <br/>
                      <FormControlLabel
                        control={<Field component={Switch} name="forceDownloadPdf" type="checkbox"/>}
                        label="Scarica i file senza cercare di mostrarli nel browser"
                      />
                    </Grid>
                    <Grid
                      item
                      md={6}
                      xs={12}
                    />
                    <Grid
                      item
                      md={3}
                      xs={12}
                    />
                  </Grid>
                </CardContent>
                <Divider/>
                <CardActions>
                  <Button
                    className={classes.saveButton}
                    disabled={isSubmitting || !isValid || !dirty}
                    type="submit"
                    variant="contained"
                  >
                    Salva le Modifiche
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
)(OptionsForm)

