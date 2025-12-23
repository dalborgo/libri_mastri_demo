import React, { memo, useMemo, useState } from 'react'
import { FastField, Formik } from 'formik'
import {
  Box,
  Card,
  CardContent,
  Collapse,
  colors,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@material-ui/core'
import ExpandLessIcon from '@material-ui/icons/ExpandLess'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import Icon from '@mdi/react'
import { mdiCardBulletedOutline, mdiDeleteCircle, mdiPencilCircle } from '@mdi/js'
import DateForm from './DateForm'
import FractionTable from './FractionTable'
import HeaderFractionTable from './HeaderFractionTable'
import RegulationTable from './RegulationTable'
import HeaderRegulationTable from './HeaderRegulationTable'
import { cDate, cFunctions } from '@adapter/common'
import { useParams } from 'react-router'
import clsx from 'clsx'
import { TextField } from 'formik-material-ui'
import { makeStyles } from '@material-ui/styles'
import DialogNotes from './DialogNotes'

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
      marginTop: theme.spacing(2),
      marginLeft: theme.spacing(4),
      marginRight: theme.spacing(4),
      marginBottom: theme.spacing(1.5),
      maxHeight: 370,
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
// eslint-disable-next-line react/display-name
const Body = memo(props => {
  const classes = useStyles()
  const [notesOpen, setNotesOpen] = useState(false)
  return (
    <Formik
      initialValues={
        {
          notes: props.notes || '',
          number: props.number || '',
          initDate: props.initDate ? cDate.mom(props.initDate, 'YYYY-MM-DD', 'YYYY-MM-DD') : null,
          isRecalculateFraction: props.isRecalculateFraction || 'NO',
          midDate: props.midDate ? cDate.mom(props.midDate, 'YYYY-MM-DD', 'YYYY-MM-DD') : null,
          paymentFract: props.paymentFract || 'UNIQUE',
          regulationFract: props.regulationFract || 'UNIQUE',
          renewMode: props.renewMode || '0',
        }
      }
      innerRef={props.innerRef}
      onSubmit={() => {}}
    >
      {
        ({ values, setFieldValue }) => (
          <div>
            <form autoComplete="off">
              <Box display="flex">
                <Box>
                  <DateForm
                    generateDates={props.generateDates}
                    generateRegDates={props.generateRegDates}
                    globalClass={props.globalClass}
                    isNew={props.isNew}
                    isPolicy={props.isPolicy}
                    priority={props.priority}
                  />
                  <HeaderFractionTable
                    dispatch={props.dispatch}
                    generateRegDates={props.generateRegDates}
                    globalClass={props.globalClass}
                    isPolicy={props.isPolicy}
                  />
                  <FractionTable
                    fractions={props.payFractions}
                    isPolicy={props.isPolicy}
                    paidFractions={props.paidFractions}
                    setPaidFractions={props.setPaidFractions}
                  />
                  <HeaderRegulationTable
                    generateRegDates={props.generateRegDates}
                    globalClass={props.globalClass}
                    isPolicy={props.isPolicy}
                    priority={props.priority}
                  />
                  <RegulationTable
                    checkPolicy={props.checkPolicy}
                    code={props._code}
                    consolidatePolicy={props.consolidatePolicy}
                    fractions={props.regFractions}
                    handlePrint={props.handlePrint}
                    isPolicy={props.isPolicy}
                    isRecalculateFraction={props.isRecalculateFraction}
                  />
                </Box>
                <Box flexGrow={1}/>
                {
                  props.priority === 4 &&
                  <Card className={classes.cardAdding}>
                    <Typography className={classes.cardTitle} variant={'h6'}>
                      Note
                    </Typography>
                    <CardContent className={classes.cardContentAdding}>
                      <FastField
                        className={clsx(props.globalClass.field, props.globalClass.fieldMid)}
                        component={TextField}
                        InputProps={
                          {
                            classes: {
                              disabled: props.globalClass.fieldDisabled,
                            },
                            className: props.globalClass.fieldBack,
                          }
                        }
                        label="Testo privato"
                        multiline
                        name="notes"
                        rows={15}
                        rowsMax={15}
                        style={{ width: 500 }}
                        variant="outlined"
                      />
                      <div>
                        <IconButton
                          className={classes.iconButton}
                          color={values.notes ? 'primary' : 'default'}
                          onClick={() => setNotesOpen(true)}
                        >
                          <Icon path={mdiPencilCircle} size={1}/>
                        </IconButton>
                        <br/>
                        {
                          <IconButton
                            className={classes.iconButton}
                            color={values.notes ? 'primary' : 'default'}
                            onClick={() => setFieldValue('notes', '')}
                          >
                            <Icon path={mdiDeleteCircle} size={1}/>
                          </IconButton>
                        }
                      </div>
                    </CardContent>
                  </Card>
                }
              </Box>
            </form>
            {
              props.priority === 4 &&
              <DialogNotes
                defaultValue={values['notes']}
                open={notesOpen}
                setFieldValue={setFieldValue}
                setOpen={setNotesOpen}
              />
            }
          </div>
        )
      }
    </Formik>
  )
})

const PolicyHeader = props => {
  const {
    _code,
    checkPolicy,
    consolidatePolicy,
    dispatch,
    generateDates,
    generateRegDates,
    globalClass,
    handlePrint,
    initDate,
    innerRef,
    isNew,
    isPolicy,
    isRecalculateFraction,
    midDate,
    notes,
    number,
    paidFractions,
    payFractionsDef,
    paymentFract,
    priority,
    regFractions,
    regulationFract,
    renewMode,
    setPaidFractions,
  } = props
  const [expandHeader, setExpandHeader] = useState(true)
  const { tab } = useParams()
  const handleToggleHeader = () => {
    setExpandHeader(expandHeader => !expandHeader)
  }
  const payFractions = useMemo(() => {
    if (payFractionsDef?.length) {
      return cFunctions.normPayFractions(payFractionsDef)
    } else {
      return generateDates()
    }
  }, [generateDates, payFractionsDef])
  const bodyProps = {
    _code,
    checkPolicy,
    consolidatePolicy,
    dispatch,
    generateDates,
    generateRegDates,
    globalClass,
    handlePrint,
    initDate,
    innerRef,
    isNew,
    isPolicy,
    isRecalculateFraction,
    midDate,
    notes,
    number,
    paidFractions,
    payFractions,
    paymentFract,
    priority,
    regFractions,
    regulationFract,
    renewMode,
    setPaidFractions,
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
                <Icon path={mdiCardBulletedOutline} size={1}/>
              </ListItemIcon>
              <ListItemText
                primary="Intestazione"
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

export default memo(PolicyHeader)
