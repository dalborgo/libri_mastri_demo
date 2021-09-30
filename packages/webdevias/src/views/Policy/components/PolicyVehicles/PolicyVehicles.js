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
  if (props.filtered) {
    props.policy.vehicles = props.policy.vehicles.map(row => {
      if (row.licensePlate === 'FJ388BP') {
        row.escludi = true
      }
      return row
    })
  } else {
    props.policy.vehicles = props.policy.vehicles.map(row => {
      if(row.escludi){
        row.escludi = undefined
      }
      return row
    })
  }
  return (
    <>
      <Header
        dispatch={props.dispatch}
        filtered={props.filtered}
        handleExport={props.handleExport}
        handleExportTotal={props.handleExportTotal}
        handleModeChange={props.handleModeChange}
        isPolicy={props.policy?.state?.isPolicy}
        mode={props.mode}
        priority={props.priority}
        setFiltered={props.setFiltered}
        setTaxableTotal={props.setTaxableTotal}
        taxableTotal={props.taxableTotal}
      />
      {
        props.mode === 'list'
          ?
          <VehiclesTable
            dispatch={props.dispatch}
            filtered={props.filtered}
            forceUpdate={props.forceUpdate}
            formRefHeader={props.formRefHeader}
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

const PolicyVehicles = (
  {
    globalClass,
    dispatch,
    forceUpdate,
    handleExport,
    handleExportTotal,
    policy,
    setChanging,
    tablePd,
    handleUpload,
    mode,
    priority,
    handleModeChange,
    handlePrint,
    vehicleTypes,
    formRefHeader,
  }
) => {
  const [expandHeader, setExpandHeader] = useState(true)
  const [taxableTotal, setTaxableTotal] = useState(true)
  const [filtered, setFiltered] = useState(false)
  const { tab } = useParams()
  const bodyProps = {
    changing: setChanging,
    dispatch,
    forceUpdate,
    formRefHeader,
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
    filtered,
    setFiltered,
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

