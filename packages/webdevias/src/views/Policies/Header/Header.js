import React, { memo, useState } from 'react'
import { makeStyles } from '@material-ui/styles'
import { Button, Grid, Link, Typography } from '@material-ui/core'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import Icon from '@mdi/react'
import { mdiFilterVariant } from '@mdi/js'
import { Filter } from './components'

const useStyles = makeStyles(theme => ({
  root: {},
  divLink: {
    paddingBottom: theme.spacing(1),
  },
}))

const Header = props => {
  const { priority, filters, setFilters, isFiltered } = props
  const classes = useStyles()
  const [openFilter, setOpenFilter] = useState(false)
  const location = useLocation()
  const handleFilterOpen = () => {
    setOpenFilter(true)
  }
  
  const handleFilterClose = () => {
    setOpenFilter(false)
  }
  
  return (
    <div>
      <Grid
        alignItems="flex-end"
        container
        justify="space-between"
        spacing={3}
      >
        <Grid item>
          {
            priority > 1 &&
            <div className={classes.divLink}>
              <Link
                component={RouterLink}
                to={'/policies/new/all'}
                variant="overline"
              >
                ↩&nbsp;&nbsp;{priority === 3 ? 'Nuova Offerta' : 'Nuova Proposta'}
              </Link>
            </div>
          }
          <Typography
            component="h1"
            variant="h3"
          >
            {location.pathname === '/policies/doclist' ? 'Lista Quotazioni' : 'Lista Polizze'}
          </Typography>
        </Grid>
        <Grid item>
          <Button
            color="inherit"
            disableFocusRipple
            onClick={handleFilterOpen}
            size="small"
            variant="contained"
          >
            <Icon color={isFiltered ? 'red' : '#263238'} path={mdiFilterVariant} size={1}/>
          </Button>
        </Grid>
        <Filter
          filters={filters}
          onClose={handleFilterClose}
          open={openFilter}
          setFilters={setFilters}
        />
      </Grid>
    </div>
  )
}

export default memo(Header)
