import React, { memo, useState } from 'react'
import { Collapse, Divider, List, ListItem, ListItemIcon, ListItemText } from '@material-ui/core'
import ExpandLessIcon from '@material-ui/icons/ExpandLess'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import compose from 'lodash/fp/compose'
import Icon from '@mdi/react'
import { mdiAttachment } from '@mdi/js'
import { useParams } from 'react-router'
import AttachmentsComponent from './AttachmentsComponent'

const PolicyAttachments = ({ globalClass, dispatch, attachments = [] }) => {
  const { tab } = useParams()
  const [expandHeader, setExpandHeader] = useState(!!attachments.length)
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
                <Icon
                  path={mdiAttachment}
                  size={1.15}
                />
              </ListItemIcon>
              <ListItemText
                primary="Allegati"
                primaryTypographyProps={{ variant: 'h5' }}
              />
            </ListItem>
          </List>
          {expandHeader ? <ExpandLessIcon/> : <ExpandMoreIcon/>}
        </div>
        <Divider/>
        <Collapse addEndListener={null} in={expandHeader}>
          <AttachmentsComponent attachments={attachments} dispatch={dispatch}/>
        </Collapse>
      </div>
    )
  } else {
    return (
      <div className={globalClass.content}>
        <AttachmentsComponent attachments={attachments} dispatch={dispatch}/>
      </div>
    )
  }
}

export default compose(
  memo
)(PolicyAttachments)

