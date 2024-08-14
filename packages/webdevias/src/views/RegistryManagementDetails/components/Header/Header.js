import React, { memo } from 'react'
import { makeStyles } from '@material-ui/styles'
import { Link, Typography } from '@material-ui/core'
import { Link as RouterLink } from 'react-router-dom'
import compose from 'lodash/fp/compose'
import { envConfig } from 'init'
import { useApolloClient } from '@apollo/react-hooks'
import { ME } from 'queries/users'

const useStyles = makeStyles(theme => {
  const style = {
    divLink: {
      paddingBottom: theme.spacing(1),
    },
  }
  return style
})

const Header = props => {
  const { surname, id } = props
  const classes = useStyles()
  const client = useApolloClient()
  const { me: { priority } } = client.readQuery({ query: ME })
  return (
    <div>
      <div className={classes.divLink}>
        <Link
          component={RouterLink}
          to="/management_reg/registries"
          variant="overline"
        >
          ↩&nbsp;&nbsp;Lista Aziende
        </Link>
      </div>
      <Typography
        component="h1"
        variant="h3"
      >
        {
          priority === 4 ?
            <Link
              color={'inherit'}
              href={`http://${envConfig.SERVER}:8091/ui/index.html#!/buckets/documents/REGISTRY%7C${id}?bucket=registry`}
              target="_blank"
            >
              {surname}
            </Link>
            :
            surname
        }
      </Typography>
    </div>
  )
}

export default compose(
  memo
)(Header)
