import React, { memo, useState } from 'react'
import { Collapse, Divider, List, ListItem, ListItemIcon, ListItemText } from '@material-ui/core'
import ExpandLessIcon from '@material-ui/icons/ExpandLess'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import compose from 'lodash/fp/compose'
import VehiclesTable from './VehiclesTable'
import PolicyVehiclesUpload from './PolicyVehicleUpload'
import Header from './Header'
import Icon from '@mdi/react'
import { mdiCarSide } from '@mdi/js'
import { useParams } from 'react-router-dom'

// eslint-disable-next-line react/display-name
const Body = memo(props => {
  return (
    <>
      <Header
        dispatch={props.dispatch}
        handleExport={props.handleExport}
        handleExportTotal={props.handleExportTotal}
        handleModeChange={props.handleModeChange}
        isPolicy={props.policy?.state?.isPolicy}
        mode={props.mode}
        priority={props.priority}
        setTaxableTotal={props.setTaxableTotal}
        taxableTotal={props.taxableTotal}
      />
      {
        props.mode === 'list'
          ?
          <VehiclesTable
            dispatch={props.dispatch}
            forceUpdate={props.forceUpdate}
            handlePrint={props.handlePrint}
            policy={props.policy}
            priority={props.priority}
            setChanging={props.changing}
            tablePd={props.tablePd}
            taxableTotal={props.taxableTotal}
            vehicleTypes={props.vehicleTypes}
          />
          :
          <PolicyVehiclesUpload handleUpload={props.handleUpload}/>
      }
    </>
  )
})

const PolicyVehicles = ({ globalClass, dispatch, forceUpdate, handleExport, handleExportTotal, policy, setChanging, tablePd, handleUpload, mode, priority, handleModeChange, handlePrint, vehicleTypes }) => {
  const [expandHeader, setExpandHeader] = useState(true)
  const [taxableTotal, setTaxableTotal] = useState(true)
  const { tab } = useParams()
  const bodyProps = {
    changing: setChanging,
    dispatch,
    forceUpdate,
    handleExport,
    handleExportTotal,
    handleModeChange,
    handlePrint,
    handleUpload,
    mode,
    policy,
    priority,
    tablePd,
    taxableTotal,
    setTaxableTotal,
    vehicleTypes,
  }
  const handleToggleHeader = () => {
    setExpandHeader(expandHeader => !expandHeader)
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
                <Icon path={mdiCarSide} size={1}/>
              </ListItemIcon>
              <ListItemText
                primary="Lista Veicoli"
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
      <Body {...bodyProps}/>
    )
  }
}

export default compose(
  memo
)(PolicyVehicles)

