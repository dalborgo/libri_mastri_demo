import React, { useState } from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'
import { makeStyles } from '@material-ui/styles'
import { Button, Collapse, Divider, Drawer, TextField, Typography } from '@material-ui/core'
import ExpandLessIcon from '@material-ui/icons/ExpandLess'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import CloseIcon from '@material-ui/icons/Close'
import DeleteIcon from '@material-ui/icons/DeleteOutlined'

const useStyles = makeStyles(theme => ({
  root: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  drawer: {
    width: 420,
    maxWidth: '100%',
  },
  header: {
    padding: theme.spacing(2, 1),
    display: 'flex',
    justifyContent: 'space-between',
  },
  buttonIcon: {
    marginRight: theme.spacing(1),
  },
  content: {
    padding: theme.spacing(0, 3),
    flexGrow: 1,
  },
  contentSection: {
    padding: theme.spacing(2, 0),
  },
  contentSectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    cursor: 'pointer',
  },
  contentSectionContent: {},
  formGroup: {
    padding: theme.spacing(2, 0),
  },
  fieldGroup: {
    display: 'flex',
    alignItems: 'center',
  },
  field: {
    marginTop: 0,
    marginBottom: 0,
  },
  flexGrow: {
    flexGrow: 1,
  },
  addButton: {
    marginLeft: theme.spacing(1),
  },
  tags: {
    marginTop: theme.spacing(1),
  },
  minAmount: {
    marginRight: theme.spacing(3),
  },
  maxAmount: {
    marginLeft: theme.spacing(3),
  },
  radioGroup: {},
  actions: {
    padding: theme.spacing(3),
    '& > * + *': {
      marginTop: theme.spacing(2),
    },
  },
}))

export const filtersInitialValue = {
  docNumber: '',
}

const Filter = props => {
  const { open, onClose, className, filters, setFilters, ...rest } = props
  const classes = useStyles()
  
  const [expandProject, setExpandProject] = useState(true)
  const [values, setValues] = useState(() => filters ? { ...filters } : filtersInitialValue)
  
  const handleFieldChange = (event, field, value) => {
    event.persist && event.persist()
    setValues(values => ({
      ...values,
      [field]: value,
    }))
  }
  const handleClear = () => {
    setValues({ ...filtersInitialValue })
  }
  const handleToggleProject = () => {
    setExpandProject(expandProject => !expandProject)
  }
  
  const handleSubmit = event => {
    event.preventDefault()
    setFilters(values)
    onClose()
  }
  
  return (
    <Drawer
      anchor="right"
      classes={{ paper: classes.drawer }}
      keepMounted
      onClose={onClose}
      open={open}
      variant="temporary"
    >
      <form
        {...rest}
        className={clsx(classes.root, className)}
        onSubmit={handleSubmit}
      >
        <div className={classes.header}>
          <Button
            onClick={onClose}
            size="small"
          >
            <CloseIcon className={classes.buttonIcon}/>
            Chiudi
          </Button>
        </div>
        <div className={classes.content}>
          <div className={classes.contentSection}>
            <div
              className={classes.contentSectionHeader}
              onClick={handleToggleProject}
            >
              <Typography variant="h5">Documento</Typography>
              {expandProject ? <ExpandLessIcon/> : <ExpandMoreIcon/>}
            </div>
            <Divider/>
            <Collapse addEndListener={null} in={expandProject}>
              <div className={classes.contentSectionContent}>
                <div className={classes.formGroup}>
                  <TextField
                    className={classes.field}
                    fullWidth
                    label="Numero"
                    margin="dense"
                    name="docNumber"
                    onChange={
                      event =>
                        handleFieldChange(
                          event,
                          'docNumber',
                          event.target.value
                        )
                    }
                    value={values.docNumber}
                    variant="outlined"
                  />
                </div>
              </div>
            </Collapse>
          </div>
        </div>
        <div className={classes.actions}>
          <Button
            fullWidth
            onClick={handleClear}
            variant="contained"
          >
            <DeleteIcon className={classes.buttonIcon}/>
            Pulisci
          </Button>
          <Button
            color="primary"
            fullWidth
            type="submit"
            variant="contained"
          >
            Applica Filtri
          </Button>
        </div>
      </form>
    </Drawer>
  )
}

Filter.propTypes = {
  className: PropTypes.string,
  onClose: PropTypes.func,
  open: PropTypes.bool.isRequired,
  setFilters: PropTypes.func,
}
export default Filter
