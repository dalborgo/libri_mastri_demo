import React, { memo, useMemo, useState } from 'react'
import { Collapse, Divider, List, ListItem, ListItemIcon, ListItemText } from '@material-ui/core'
import ExpandLessIcon from '@material-ui/icons/ExpandLess'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import compose from 'lodash/fp/compose'
import Icon from '@mdi/react'
import { mdiCardAccountDetailsOutline } from '@mdi/js'
import PolicyHoldersForm from './PolicyHoldersForm'
import { useApolloClient, useQuery } from '@apollo/react-hooks'
import { REGISTRIES } from 'queries/registries'
import { gestError, useAsyncError } from 'helpers'
import CircularIndeterminate from 'components/Progress/CircularIndeterminate'
import { useParams } from 'react-router'
import { ME } from 'queries/users'

function Body (props) {
  return (
    <>
      {
        !props.loading && props.called
          ?
          <PolicyHoldersForm
            collaboratorList={props.collaboratorList}
            collaborators={props.collaborators}
            dispatch={props.dispatch}
            globalClass={props.globalClass}
            handleSendGenias={props.handleSendGenias}
            holders={props.holders}
            innerRef={props.innerRef}
            isPolicy={props.isPolicy}
            registries={props.holders ? [...props.holders, ...props.reg.registries] : [...props.reg.registries]}
          />
          :
          <CircularIndeterminate/>
      }
    </>
  )
}

const PolicyHolders = ({ globalClass, holders, innerRef, dispatch, isPolicy, collaborators, parent, handleSendGenias }) => {
  const throwError = useAsyncError()
  const { tab } = useParams()
  const client = useApolloClient()
  const { me: { priority, vat } } = client.readQuery({ query: ME })
  const filter = useMemo(() => {
    if (priority === 4) {
      return undefined
    }
    return JSON.stringify({ producer: vat })
  }, [priority, vat])
  const [expandHeader, setExpandHeader] = useState(true)
  const handleToggleHeader = () => {
    setExpandHeader(expandHeader => !expandHeader)
  }
  const { data: reg, loading, called } = useQuery(REGISTRIES, {
    variables: {
      filter,
    },
    onError: gestError(throwError),
  })
 /* const { data: producers } = useQuery(USERS, {
    onError: gestError(throwError),
  })*/
  /*console.log('producersCCC:', producers)*/
  const bodyProps = {
    loading,
    called,
    dispatch,
    globalClass,
    holders,
    handleSendGenias,
    collaborators,
    collaboratorList: parent?.children?.filter(row => row.role === 'COLLABORATOR') || [],
    innerRef,
    isPolicy,
    reg,
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
                <Icon
                  path={mdiCardAccountDetailsOutline}
                  size={0.87}
                  style={
                    {
                      marginLeft: 2,
                    }
                  }
                />
              </ListItemIcon>
              <ListItemText
                primary="Anagrafica Intestatari / Collaboratori"
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

export default compose(
  memo
)(PolicyHolders)

