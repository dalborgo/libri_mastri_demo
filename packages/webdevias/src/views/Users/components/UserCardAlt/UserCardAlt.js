import React from 'react'
import { Link as RouterLink } from 'react-router-dom'
import PropTypes from 'prop-types'
import clsx from 'clsx'
import { makeStyles } from '@material-ui/styles'
import Create from '@material-ui/icons/Create'
import Delete from '@material-ui/icons/DeleteOutline'
import {
  Avatar,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  IconButton,
  Link,
  Tooltip,
  Typography,
} from '@material-ui/core'
import { cDate } from '@adapter/common'
import getInitials from 'helpers/getInitials'
import { roleName, useRoleColorBase, useRoleStyleBase } from 'helpers'
import { Label, StackAvatars } from 'components'
import { ME } from 'queries/users'
import { useApolloClient } from '@apollo/react-hooks'

require('moment/locale/it')
const useStyles = makeStyles(theme => ({
  root: {
    marginBottom: theme.spacing(2),
  },
  header: {
    paddingBottom: 0,
  },
  delButton: {
    marginRight: theme.spacing(1),
  },
  content: {
    padding: 0,
    '&:last-child': {
      paddingBottom: 0,
    },
  },
  description: {
    padding: theme.spacing(1, 0),
  },
  avatarMin: {
    width: 30,
    height: 30,
  },
  tags: {
    padding: theme.spacing(0, 3, 1, 3),
    '& > * + *': {
      marginLeft: theme.spacing(1),
    },
  },
  details: {
    padding: theme.spacing(1, 3),
  },
}))

const UserCardAlt = props => {
  const { user, className, handleDelete, ...rest } = props
  const client = useApolloClient()
  const { me } = client.readQuery({ query: ME })
  const classesRoleBase = useRoleStyleBase()
  const roleColors = useRoleColorBase()
  const classes = useStyles()
  const hasFatherOrChildren = Boolean(user?.children?.length || user?.father)
  return (
    <Card
      {...rest}
      className={clsx(classes.root, className)}
    >
      <CardHeader
        avatar={
          <Avatar
            alt="Role"
            component={RouterLink}
            style={
              classesRoleBase[user.role]
            }
            to={`/management/users/${user.id}/summary`}
          >
            {getInitials(user.username)}
          </Avatar>
        }
        className={classes.header}
        disableTypography
        subheader={
          <Typography variant="body2">
            Aggiornato: {cDate.fromNow(user._updatedAt)}
          </Typography>
        }
        title={
          <Link
            color="textPrimary"
            component={RouterLink}
            to={`/management/users/${user.id}/summary`}
            variant="h5"
          >
            {user.username}
          </Link>
        }
      />
      <CardContent className={classes.content}>
        <div className={classes.description}/>
        <div className={classes.tags}>
          <Label
            color={roleColors[user.role]}
          >
            {roleName(user.role)}
          </Label>
        </div>
        <Divider/>
        <div className={classes.details}>
          <Grid
            alignItems="center"
            container
            justify="space-between"
            spacing={3}
          >
            <Grid
              item
              md={3}
              sm={6}
              xs={12}
            >
              <Typography variant="h6">
                <Link
                  color="textPrimary"
                  href={`mailto:${user.email}`}
                  noWrap
                >
                  {user.email ? user.email : ''}
                </Link>
              </Typography>
              <Typography variant="body2">Email</Typography>
            </Grid>
            {
              user.vat &&
              <Grid
                item
                md={3}
                sm={6}
                xs={12}
              >
                <Typography variant="h6">
                  {user.vat ? user.vat : ''}
                </Typography>
                <Typography variant="body2">Partita Iva</Typography>
              </Grid>
            }
            <Grid
              item
              md={3}
              sm={6}
              xs={12}
            >
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
                        variant="h6"
                      >
                        {user.father ? user.father : ''}
                      </Link>
                  }
                </Typography>
              }
              {
                hasFatherOrChildren &&
                <Typography variant="body2">{user.priority > 1 ? 'Filiali' : 'Intermediario'}</Typography>
              }
            </Grid>
            <Grid item>
              <Tooltip placement="top" title="Modifica">
                <IconButton
                  component={RouterLink}
                  to={`/management/users/${user.id}/summary`}
                >
                  <Create/>
                </IconButton>
              </Tooltip>
              <span
                style={
                  {
                    visibility: me.id === user.id ? 'hidden' : 'visible',
                  }
                }
              >
                <Tooltip placement="top" title="Elimina">
                  <IconButton
                    className={classes.delButton}
                    onClick={handleDelete(user)}
                  >
                    <Delete/>
                  </IconButton>
                </Tooltip>
              </span>
            </Grid>
          </Grid>
        </div>
      </CardContent>
    </Card>
  )
}

UserCardAlt.propTypes = {
  className: PropTypes.string,
  user: PropTypes.object.isRequired,
}

export default UserCardAlt
