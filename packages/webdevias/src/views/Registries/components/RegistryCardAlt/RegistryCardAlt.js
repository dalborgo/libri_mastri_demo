import React from 'react'
import { Link as RouterLink } from 'react-router-dom'
import PropTypes from 'prop-types'
import clsx from 'clsx'
import { makeStyles } from '@material-ui/styles'
import Create from '@material-ui/icons/Create'
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
import getInitials from 'helpers/getInitials'

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

const RegistryCardAlt = props => {
  const { registry, className, handleDelete, ...rest } = props
  const classes = useStyles()
  return (
    <Card
      {...rest}
      className={clsx(classes.root, className)}
    >
      <CardHeader
        avatar={
          <Avatar
            alt="Author"
            component={RouterLink}
            to={`/management_reg/registries/${registry.id}/summary`}
          >
            {getInitials(registry.surname)}
          </Avatar>
        }
        className={classes.header}
        disableTypography
        /*subheader={
          <Typography variant="body2">
            Aggiornato: {cDate.fromNow(registry._updatedAt)}
          </Typography>
        }*/
        title={
          <Link
            color="textPrimary"
            component={RouterLink}
            to={`/management_reg/registries/${registry.id}/summary`}
            variant="h5"
          >
            {registry.surname}
          </Link>
        }
      />
      <CardContent className={classes.content}>
        <div className={classes.description}/>
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
                {registry.id ? registry.id : ''}
              </Typography>
              <Typography variant="body2">P.I.</Typography>
            </Grid>
            <Grid
              item
              md={3}
              sm={6}
              xs={12}
            />
            <Grid item>
              <Tooltip placement="top" title="Modifica">
                <IconButton
                  component={RouterLink}
                  to={`/management_reg/registries/${registry.id}/summary`}
                >
                  <Create/>
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        </div>
      </CardContent>
    </Card>
  )
}

RegistryCardAlt.propTypes = {
  className: PropTypes.string,
  registry: PropTypes.object.isRequired,
}

export default RegistryCardAlt
