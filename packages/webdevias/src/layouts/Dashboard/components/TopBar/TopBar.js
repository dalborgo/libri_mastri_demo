import React, { memo } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import clsx from 'clsx'
import compose from 'lodash/fp/compose'
import { makeStyles, useTheme } from '@material-ui/styles'
import { AppBar, Button, colors, IconButton, Toolbar } from '@material-ui/core'
import InputIcon from '@material-ui/icons/Input'
import MenuIcon from '@material-ui/icons/Menu'
/*import axios from 'utils/axios'
import { NotificationsPopover } from 'components'*/
import { useApolloClient, useQuery } from '@apollo/react-hooks'
import { LOADING, ME } from 'queries'
import ColorLinearProgress from 'components/Progress/ColorLinearProgress'
import useMediaQuery from '@material-ui/core/useMediaQuery'
import { envConfig } from 'init'

const useStyles = makeStyles(theme => ({
  root: {
    boxShadow: 'none',
  },
  flexGrow: {
    flexGrow: 1,
  },
  divPlaceHolder: {
    backgroundColor: theme.palette.primary.main,
  },
  divPlaceHolder2: {
    backgroundColor: '#DD8D83',
  },
  divPlaceHolder3: {
    backgroundColor: 'red',
  },
  search: {
    backgroundColor: 'rgba(255,255,255, 0.1)',
    borderRadius: 4,
    flexBasis: 300,
    height: 36,
    padding: theme.spacing(0, 2),
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    marginRight: theme.spacing(2),
    color: 'inherit',
  },
  searchInput: {
    flexGrow: 1,
    color: 'inherit',
    '& input::placeholder': {
      opacity: 1,
      color: 'inherit',
    },
  },
  searchPopper: {
    zIndex: theme.zIndex.appBar + 100,
  },
  searchPopperContent: {
    marginTop: theme.spacing(1),
  },
  trialButton: {
    marginLeft: theme.spacing(2),
    color: theme.palette.white,
    backgroundColor: colors.green[600],
    '&:hover': {
      backgroundColor: colors.green[900],
    },
  },
  trialIcon: {
    marginRight: theme.spacing(1),
  },
  notificationsButton: {
    marginLeft: theme.spacing(1),
  },
  notificationsBadge: {
    backgroundColor: colors.orange[600],
  },
  logoutButton: {
    marginLeft: theme.spacing(1),
  },
  logoutIcon: {
    marginRight: theme.spacing(1),
  },
}))

const TopBar = props => {
  const { onOpenNavBarMobile, className, handleLogout, ...rest } = props
  const client = useApolloClient()
  const { data = {} } = useQuery(LOADING)
  const classes = useStyles()
  const { me } = client.readQuery({ query: ME })
  const neverShowMenu = me?.options?.neverShowMenu
  //const notificationsRef = useRef(null)
  /*const [notifications, setNotifications] = useState([])
  const [openNotifications, setOpenNotifications] = useState(false)*/
  
  /*useEffect(() => {
    let mounted = true

    const fetchNotifications = () => {
      axios.get('/api/account/notifications').then(response => {
        if (mounted) {
          setNotifications(response.data.notifications)
        }
      })
    }

    fetchNotifications()

    return () => {
      mounted = false
    }
  }, [])*/
  
  /*const handleNotificationsClose = () => {
    setOpenNotifications(false)
  }*/
  
  const theme = useTheme()
  const xlUp = useMediaQuery(theme.breakpoints.up('xl'))
  const lgDown = useMediaQuery(theme.breakpoints.down('lg'))
  return (
    <>
      <AppBar
        {...rest}
        className={clsx(classes.root, className)}
        color={envConfig.BUCKET === 'libri_mastri' ? 'primary' : 'inherit'}
      >
        <Toolbar>
          <RouterLink to="/">
            <img
              alt="Logo"
              src="/images/logos/logo--white.svg"
            />
          </RouterLink>
          <div className={classes.flexGrow}/>
          {
            (!lgDown && !neverShowMenu) && (
              <Button
                className={classes.logoutButton}
                color="inherit"
                onClick={handleLogout}
              >
                <InputIcon className={classes.logoutIcon}/>
                Esci
              </Button>
            )
          }
          {
            (!xlUp || neverShowMenu) && (
              <IconButton
                color="inherit"
                disableFocusRipple
                onClick={onOpenNavBarMobile}
              >
                <MenuIcon/>
              </IconButton>
            )
          }
        </Toolbar>
        <ColorLinearProgress
          style={{ visibility: data.loading ? 'visible' : 'hidden' }}
        />
      </AppBar>
    </>
  )
}

export default compose(
  memo
)(TopBar)
