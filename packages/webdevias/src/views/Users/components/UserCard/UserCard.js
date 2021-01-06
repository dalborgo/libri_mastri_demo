import React from 'react'
import { Link as RouterLink } from 'react-router-dom'
import PropTypes from 'prop-types'
import clsx from 'clsx'
import { makeStyles } from '@material-ui/styles'
import { Avatar, Button, Card, CardContent, Link, Tooltip, Typography } from '@material-ui/core'
import { cDate } from '@adapter/common'
import getInitials from 'helpers/getInitials'
import { StackAvatars } from 'components'
import { statusColors, useRoleStyleBase } from 'helpers'
import truncate from 'lodash/truncate'

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: theme.spacing(2),
    minHeight: 100,
  },
  delButton: {
    borderColor: theme.palette.error.light,
    '&:hover': {
      borderColor: theme.palette.error.dark,
    },
    color: 'red',
  },
  content: {
    padding: theme.spacing(2),
    flexGrow: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    [theme.breakpoints.down('sm')]: {
      width: '100%',
      flexWrap: 'wrap',
    },
    '&:last-child': {
      paddingBottom: theme.spacing(2),
    },
  },
  header: {
    maxWidth: '100%',
    width: 240,
    display: 'flex',
    [theme.breakpoints.down('sm')]: {
      marginBottom: theme.spacing(2),
      flexBasis: '100%',
    },
  },
  avatar: {
    marginRight: theme.spacing(2),
  },
  avatarMin: {
    width: 30,
    height: 30,
  },
  stats: {
    padding: theme.spacing(1),
    [theme.breakpoints.down('sm')]: {
      flexBasis: '50%',
    },
  },
  actions: {
    padding: theme.spacing(1),
    [theme.breakpoints.down('sm')]: {
      flexBasis: '50%',
    },
  },
}))

const UserCard = props => {
  const { user, className, handleDelete, ...rest } = props
  const classesRoleBase = useRoleStyleBase()
  const classes = useStyles()

  return (
    <Card
      {...rest}
      className={clsx(classes.root, className)}
    >
      <CardContent className={classes.content}>
        <div className={classes.header}>
          <Avatar
            alt="Author"
            className={classes.avatar}
            component={RouterLink}
            style={
              classesRoleBase[user.role]
            }
            to={`/management/users/${user.id}/summary`}
          >
            {getInitials(user.username)}
          </Avatar>
          <div>
            <Link
              color="textPrimary"
              component={RouterLink}
              noWrap
              to={`/management/users/${user.id}/summary`}
              variant="h5"
            >
              {user.username}
            </Link>
            <Typography variant="body2">
              il{' '}
              {cDate.mom(user._createdAt, null, 'DD/MM/YY hh:mm')}
            </Typography>
          </div>
        </div>
        <div className={classes.stats}>
          <Typography variant="body2">Aggiornato</Typography>
          <Typography variant="h6">
            {cDate.mom(user._updatedAt, null, 'DD/MM/YY HH:mm')}
          </Typography>
        </div>
        <div className={classes.stats}>
          <Typography variant="body2">Email</Typography>
          <Typography variant="h6">
            <Tooltip
              key={user.id}
              title="Email"
            >
              <Link
                color="textPrimary"
                href={`mailto:${user.email}`}
                noWrap
              >
                {truncate(user.email, { length: 18 })}
              </Link>
            </Tooltip>
          </Typography>
        </div>
        <div className={classes.stats}>
          <Typography variant="body2">{
            user.priority > 1 ? 'Filiali' : 'Intermediario'
          }
          </Typography>
          {
            (user.priority === 1 || (user.priority > 1 && user.children)) &&
            <Typography variant="h6">
              {
                user.priority > 1 ?
                  <StackAvatars
                    avatars={user.children || []}
                    className={classes.avatarMin}
                    limit={3}
                  /> :
                  <Link
                    color="textPrimary"
                    component={RouterLink}
                    noWrap
                    to={`/management/users/${user.father}/summary`}
                    variant="h5"
                  >
                    {user.father ? user.father : ''}
                  </Link>
              }
            </Typography>
          }
        </div>
        <div className={classes.stats}>
          <Typography variant="body2">Classificazione</Typography>
          <Typography
            style={{ color: statusColors(user.role) }}
            variant="h6"
          >
            {user.role}
          </Typography>

        </div>
        <div className={classes.actions}>
          <Button
            color="primary"
            component={RouterLink}
            size="small"
            to={`/management/users/${user.id}/summary`}
            variant="outlined"
          >
            Vedi
          </Button>
          &nbsp;&nbsp;
          <Button
            classes={
              {
                outlined: classes.delButton,
              }
            }
            onClick={handleDelete(user)}
            size="small"
            variant="outlined"
          >
            Elimina
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

UserCard.propTypes = {
  className: PropTypes.string,
  handleDelete: PropTypes.any,
  user: PropTypes.object.isRequired,
}

export default UserCard
