import React, { memo } from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'
import { makeStyles } from '@material-ui/styles'
import { Avatar, Card, CardContent, Link, Typography } from '@material-ui/core'
import compose from 'lodash/fp/compose'
import { getInitials, roleName, useRoleStyleBase } from 'helpers'
import { cDate } from '@adapter/common'
import { StackAvatars } from 'components'
import { Link as RouterLink } from 'react-router-dom'
import { envConfig } from 'init'
import { ME } from 'queries/users'
import { useApolloClient } from '@apollo/react-hooks'

require('moment/locale/it')
const useStyles = makeStyles(theme => ({
  root: {},
  content: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
    textAlign: 'center',
  },
  name: {
    marginTop: theme.spacing(1),
  },
  avatar: {
    height: 50,
    width: 50,
  },
  removeButton: {
    width: '100%',
  },
}))

const ProfileDetails = props => {
  const { className, ...user } = props
  const client = useApolloClient()
  const classesRoleBase = useRoleStyleBase()
  const classes = useStyles()
  const { me: { priority } } = client.readQuery({ query: ME })
  return (
    <Card
      className={clsx(classes.root, className)}
    >
      <CardContent className={classes.content}>
        <Avatar
          className={classes.avatar}
          style={
            classesRoleBase[user.role]
          }
        >
          {getInitials(user.username)}
        </Avatar>
        <Typography
          className={classes.name}
          gutterBottom
          variant="h3"
        >
          {
            priority === 3 ?
              <Link
                color={'inherit'}
                href={`http://${envConfig.SERVER}:8091/ui/index.html#!/buckets/documents/USER%7C${user.username}?bucket=${envConfig.BUCKET}`}
                target="_blank"
              >
                {user.username}
              </Link>
              :
              user.username
          }
        </Typography>
        <Typography
          color="textSecondary"
          variant="body1"
        >
          {roleName(user.role)}
        </Typography>
        {
          user.email &&
          <Typography
            color="textSecondary"
            variant="body2"
          >
            <Link
              color="textSecondary"
              href={`mailto:${user.email}`}
              noWrap
            >
              {user.email}
            </Link>
          </Typography>
        }
        {/*  <Typography
          color="textSecondary"
          variant="body2"
        >
          {'Creato il'} {cDate.mom(user._createdAt, null, 'DD/MM/YY hh:mm')}
        </Typography>*/}
        <Typography
          color="textSecondary"
          gutterBottom
          variant="body2"
        >
          Aggiornato: {cDate.fromNow(user._updatedAt)}
        </Typography>
        {
          ((user.priority === 1 && user.father) || (user.priority > 1 && user.children)) &&
          <>
            <br/>
            <Typography variant="h6">{user.priority > 1 ? 'Filiali' : 'Intermediario'}</Typography>
            {
              user.priority > 1 ?
                <StackAvatars
                  avatars={user.children || []}
                  className={classes.avatarMin}
                  limit={3}
                />
                :
                <Link
                  color="textSecondary"
                  component={RouterLink}
                  noWrap
                  to={`/management/users/${user.father}/summary`}
                  variant="body2"
                >
                  {user.father || ''}
                </Link>
            }
          </>
        }
      </CardContent>
      {/*<CardActions>
        <Button
          className={classes.removeButton}
          variant="text"
        >
          Remove picture
        </Button>
      </CardActions>*/}
    </Card>
  )
}

ProfileDetails.propTypes = {
  className: PropTypes.string,
}

export default compose(
  memo
)(ProfileDetails)

