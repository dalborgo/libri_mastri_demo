import React from 'react'
import { Link as RouterLink } from 'react-router-dom'
import PropTypes from 'prop-types'
import clsx from 'clsx'
import { makeStyles } from '@material-ui/styles'
import { Avatar, Button, Card, CardContent, Link, Typography } from '@material-ui/core'
import getInitials from 'helpers/getInitials'

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

const RegistryCard = props => {
  const { registry, className, ...rest } = props
  const classes = useStyles()
  return (
    <Card
      {...rest}
      className={clsx(classes.root, className)}
    >
      <CardContent className={classes.content}>
        <div className={classes.header}>
          <Avatar
            alt="Company"
            className={classes.avatar}
            component={RouterLink}
            to={`/management_reg/registries/${registry.id}/summary`}
          >
            {getInitials(registry.name)}
          </Avatar>
          <div>
            <Link
              color="textPrimary"
              component={RouterLink}
              noWrap
              to={`/management_reg/registries/${registry.id}/summary`}
              variant="h5"
            >
              {registry.name}
            </Link>
          </div>
        </div>
        <div className={classes.stats}>
          <Typography variant="body2">P.I.</Typography>
          <Typography
            variant="h6"
          >
            {registry.id}
          </Typography>
        
        </div>
        <div className={classes.actions}>
          <Button
            color="primary"
            component={RouterLink}
            size="small"
            to={`/management_reg/registries/${registry.id}/summary`}
            variant="outlined"
          >
            Vedi
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

RegistryCard.propTypes = {
  className: PropTypes.string,
  handleDelete: PropTypes.any,
  user: PropTypes.object.isRequired,
}

export default RegistryCard
