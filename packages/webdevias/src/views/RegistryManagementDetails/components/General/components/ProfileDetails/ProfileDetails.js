import React, { memo } from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'
import { makeStyles } from '@material-ui/styles'
import { Avatar, Card, CardContent, Link, Typography } from '@material-ui/core'
import compose from 'lodash/fp/compose'
import { getInitials } from 'helpers'
import { envConfig } from 'init'
import { useApolloClient } from '@apollo/react-hooks'
import { ME } from 'queries/users'

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
  const { className, ...registry } = props
  const client = useApolloClient()
  const { me: { priority } } = client.readQuery({ query: ME })
  const classes = useStyles()
  return (
    <Card
      className={clsx(classes.root, className)}
    >
      <CardContent className={classes.content}>
        <Avatar
          className={classes.avatar}
        >
          {getInitials(registry.surname)}
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
                href={`http://${envConfig.SERVER}:8091/ui/index.html#!/buckets/documents/REGISTRY%7C${registry.id}?bucket=registry`}
                target="_blank"
              >
                {registry.surname}
              </Link>
              :
              registry.surname
          }
        </Typography>
        <Typography
          color="textSecondary"
          variant="body1"
        >
          P.I.: {registry.id}
        </Typography>
        {
          registry.email &&
          <Typography
            color="textSecondary"
            variant="body2"
          >
            Email:&nbsp;
            <Link
              color="textSecondary"
              href={`mailto:${registry.email}`}
              noWrap
            >
              {registry.email}
            </Link>
          </Typography>
        }
      </CardContent>
    </Card>
  )
}

ProfileDetails.propTypes = {
  className: PropTypes.string,
}

export default compose(
  memo
)(ProfileDetails)

