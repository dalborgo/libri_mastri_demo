import React, { memo } from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'
import uuid from 'uuid/v1'
import { makeStyles } from '@material-ui/styles'
import { Avatar, Tooltip } from '@material-ui/core'
import { getInitials, useRoleStyleBase } from 'helpers'
import { Link as RouterLink } from 'react-router-dom'

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
    paddingLeft: 20,
  },
  avatar: {
    border: `3px solid ${theme.palette.white}`,
    marginLeft: -20,
    '&:hover': {
      zIndex: 2,
    },
  },
  more: {
    backgroundColor: theme.palette.error.main,
    color: theme.palette.error.contrastText,
    fontSize: 14,
    fontWeight: theme.typography.fontWeightMedium,
  },
}))

const StackAvatars = props => {
  const { avatars, limit, className, ...rest } = props
  const classesRoleBase = useRoleStyleBase()
  const classes = useStyles()
  const avatarNodes = avatars.slice(0, limit).map(user => (
    <Tooltip
      key={uuid()}
      title={user.id || 'Vedi'}
    >
      <Avatar
        className={clsx(classes.avatar, className)}
        component={RouterLink}
        style={
          classesRoleBase[user.role]
        }
        to={`/management/users/${user.id}/summary`}
      >
        {getInitials(user.id)}
      </Avatar>
    </Tooltip>
  ))
  
  if (avatars.length > limit) {
    avatarNodes.push(
      <Tooltip
        key={uuid()}
        title="Altri"
      >
        <Avatar className={clsx(classes.avatar, classes.more, className)}>
          +{avatars.length - limit}
        </Avatar>
      </Tooltip>
    )
  }
  
  return (
    <div
      {...rest}
      className={clsx(classes.root, className)}
    >
      {avatarNodes}
    </div>
  )
}

StackAvatars.propTypes = {
  avatars: PropTypes.array.isRequired,
  className: PropTypes.string,
  limit: PropTypes.number.isRequired,
}

StackAvatars.defaultProps = {
  limit: 3,
}

export default memo(StackAvatars)
