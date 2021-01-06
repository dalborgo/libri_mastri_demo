import React, { memo } from 'react'
import { makeStyles } from '@material-ui/styles'
import { Link, Typography } from '@material-ui/core'
import { Link as RouterLink } from 'react-router-dom'
import compose from 'lodash/fp/compose'
import { envConfig } from 'init'
//import { useApolloClient } from '@apollo/react-hooks'

const useStyles = makeStyles(theme => {
  const style = {
    divLink: {
      paddingBottom: theme.spacing(1),
    },
  }
  return style
})

const Header = props => {
  const { username, priority } = props
  /*
  const client = useApolloClient()
  const { id: userId } = useParams()
  const user = client.readFragment({id:`User:${userId}`, fragment: gql`
    fragment header on User {
      email
      username
    }`})*/
  const classes = useStyles()
  return (
    <div>
      <div className={classes.divLink}>
        <Link
          component={RouterLink}
          to={priority === 3 ? '/management/users' : '/policies/list'}
          variant="overline"
        >
          ↩&nbsp;&nbsp;{priority === 3 ? 'Lista Utenti' : 'Lista Polizze'}
        </Link>
      </div>
      <Typography
        component="h1"
        variant="h3"
      >
        {
          priority === 3 ?
            <Link
              color={'inherit'}
              href={`http://${envConfig.SERVER}:8091/ui/index.html#!/buckets/documents/USER%7C${username}?bucket=${envConfig.BUCKET}`}
              target="_blank"
            >
              {username}
            </Link>
            :
            username
        }
      </Typography>
    </div>
  )
}

export default compose(
  memo
)(Header)
