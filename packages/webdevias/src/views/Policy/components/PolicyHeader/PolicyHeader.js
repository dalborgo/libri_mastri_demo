import React, { memo, useMemo, useState } from 'react'
import { Formik } from 'formik'
import { Collapse, Divider, List, ListItem, ListItemIcon, ListItemText } from '@material-ui/core'
import ExpandLessIcon from '@material-ui/icons/ExpandLess'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import Icon from '@mdi/react'
import { mdiCardBulletedOutline } from '@mdi/js'
import DateForm from './DateForm'
import FractionTable from './FractionTable'
import HeaderFractionTable from './HeaderFractionTable'
import RegulationTable from './RegulationTable'
import HeaderRegulationTable from './HeaderRegulationTable'
import { cDate, cFunctions } from '@adapter/common'
import { useParams } from 'react-router'
// eslint-disable-next-line react/display-name
const Body = memo(props => {
  return (
    <Formik
      initialValues={
        {
          number: props.number || '',
          initDate: props.initDate ? cDate.mom(props.initDate, 'YYYY-MM-DD', 'YYYY-MM-DD') : null,
          isRecalculateFraction: props.isRecalculateFraction || 'NO',
          midDate: props.midDate ? cDate.mom(props.midDate, 'YYYY-MM-DD', 'YYYY-MM-DD') : null,
          paymentFract: props.paymentFract || 'UNIQUE',
          regulationFract: props.regulationFract || 'UNIQUE',
        }
      }
      innerRef={props.innerRef}
      onSubmit={() => {}}
    >
      {
        () => (
          <form autoComplete="off">
            <DateForm
              generateDates={props.generateDates}
              generateRegDates={props.generateRegDates}
              globalClass={props.globalClass}
              isNew={props.isNew}
              isPolicy={props.isPolicy}
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
            />
            <RegulationTable
              consolidatePolicy={props.consolidatePolicy}
              fractions={props.regFractions}
              handlePrint={props.handlePrint}
              isPolicy={props.isPolicy}
              isRecalculateFraction={props.isRecalculateFraction}
            />
          </form>
        )
      }
    </Formik>
  )
})

const PolicyHeader = props => {
  const {
    consolidatePolicy,
    dispatch,
    handlePrint,
    isPolicy,
    paidFractions,
    setPaidFractions,
    isNew,
    innerRef,
    globalClass,
    number,
    initDate,
    midDate,
    paymentFract,
    regulationFract,
    isRecalculateFraction,
    regFractions,
    generateDates,
    generateRegDates,
    payFractionsDef,
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
    number,
    paidFractions,
    payFractions,
    paymentFract,
    regFractions,
    regulationFract,
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
