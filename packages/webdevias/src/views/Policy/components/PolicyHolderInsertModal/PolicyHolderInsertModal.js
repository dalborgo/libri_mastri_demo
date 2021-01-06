import React from 'react'
import clsx from 'clsx'
import { makeStyles } from '@material-ui/styles'
import { Button, colors, Dialog, Divider, Grid, IconButton, Paper, Typography } from '@material-ui/core'
import CloseIcon from '@material-ui/icons/CloseOutlined'
import { useApolloClient } from '@apollo/react-hooks'
import { HOLDER_SAVE_FRAGMENT, REGISTRIES } from 'queries'
import InsertForm, { insertFormSchema } from 'views/Registry/components/InsertForm'
import { Formik } from 'formik'
import reduce from 'lodash/reduce'
import Slide from '@material-ui/core/Slide'
import { cGraphQL } from '@adapter/common'

//region STYLE
const useStyles = makeStyles(theme => ({
  root: {
    width: 960,
    backgroundColor: colors.grey[100],
  },
  header: {
    padding: theme.spacing(1),
  },
  content: {
    marginTop: theme.spacing(1),
    padding: theme.spacing(2),
    margin: '0 auto',
  },
  body: {
    overflow: 'unset',
    position: 'relative',
    padding: theme.spacing(5, 3),
  },
  image: {
    borderRadius: theme.shape.borderRadius,
    position: 'absolute',
    top: -24,
    left: theme.spacing(3),
    height: 48,
    width: 48,
    fontSize: 24,
  },
  divider: {
    margin: theme.spacing(1, 0, 3),
  },
  actions: {
    padding: theme.spacing(2),
    display: 'flex',
    justifyContent: 'center',
  },
  saveButton: {
    margin: theme.spacing(0, 2),
    color: theme.palette.white,
    backgroundColor: colors.green[600],
    '&:hover': {
      backgroundColor: colors.green[900],
    },
  },
  clearButton: {
    margin: theme.spacing(0, 2),
    color: theme.palette.white,
    backgroundColor: colors.blueGrey[500],
    '&:hover': {
      backgroundColor: colors.blueGrey[800],
    },
  },
}))

//endregion

const Transition = React.forwardRef(function Transition (props, ref) {
  return <Slide direction="down" ref={ref} {...props} />
})

function getOnClose (handleReset, dispatch) {
  return () => {
    handleReset()
    dispatch({ type: 'setClose' })
  }
}

const PolicyHolderInsertModal = props => {
  const { open, index, dispatch, className, formRefHolders, activities } = props
  const classes = useStyles()
  const client = useApolloClient()
  const currentValue = formRefHolders?.current?.values?.holders[index]
  return (
    <Formik
      enableReinitialize
      initialValues={
        {
          ...cGraphQL.formInitialByFragment(HOLDER_SAVE_FRAGMENT, currentValue),
          activity: currentValue?.activity || null,
        }
      }
      onSubmit={() => {}}
      validationSchema={insertFormSchema}
    >
      {
        ({ values, isValid, dirty, setValues, handleReset }) => (
          <Dialog
            maxWidth="lg"
            onClose={getOnClose(handleReset, dispatch)}
            open={open}
            TransitionComponent={Transition}
          >
            <div
              className={clsx(classes.root, className)}
            >
              <Grid
                alignItems="center"
                className={classes.header}
                container
                justify="space-between"
              >
                <Grid item/>
                <Grid item>
                  <Typography
                    align="center"
                    variant="h4"
                  >
                    INSERISCI ANAGRAFICA
                  </Typography>
                </Grid>
                <Grid item>
                  <IconButton onClick={getOnClose(handleReset, dispatch)}>
                    <CloseIcon/>
                  </IconButton>
                </Grid>
              </Grid>
              <div className={classes.content}>
                <Grid
                  container
                  spacing={4}
                >
                  <Grid
                    item
                    xs={12}
                  >
                    <Paper
                      className={classes.body}
                      elevation={1}
                    >
                      <img
                        alt="Role"
                        className={classes.image}
                        src={index === 0 ? '/images/products/product_freelancer.svg' : '/images/products/product_agency.svg'}
                      />
                      <Typography
                        component="h3"
                        gutterBottom
                        variant="overline"
                      >
                        {index > 0 ? 'Co-Assicurato' : 'Intestatario'}
                      </Typography>
                      <Divider className={classes.divider}/>
                      <InsertForm activities={activities}/>
                    </Paper>
                  </Grid>
                </Grid>
              </div>
              <div className={classes.actions}>
                <Button
                  className={classes.saveButton}
                  disabled={!isValid || !dirty}
                  onClick={
                    async () => {
                      const { registries } = client.readQuery({ query: REGISTRIES })
                      const { setFieldValue } = formRefHolders.current
                      const combo = reduce(values, (prev, curr, key) => {
                        prev[key] = values[key]
                        return prev
                      }, { __typename: 'Registry' })
                      const newRegistries = [combo, ...registries]
                      await client.writeQuery({ query: REGISTRIES, data: { registries: newRegistries } })
                      setFieldValue(`holders.${index}.combo`, combo)
                      for (let key in combo) {
                        setFieldValue(`holders.${index}.${key}`, combo[key] || '')
                      }
                      dispatch({ type: 'setClose' })
                    }
                  }
                  variant="contained"
                >
                  Conferma Anagrafica
                </Button>
                <Button
                  className={classes.clearButton}
                  onClick={
                    () => {
                      handleReset() //to reset touched value
                      setValues(reduce(values, (prev, _, key) => {
                        if (key === 'activity') {
                          prev[key] = null
                        } else {
                          prev[key] = ''
                        }
                        return prev
                      }, {}))
                    }
                  }
                  variant="contained"
                >
                  Pulisci
                </Button>
              </div>
            </div>
          </Dialog>
        )
      }
    </Formik>
  )
}

export default PolicyHolderInsertModal
