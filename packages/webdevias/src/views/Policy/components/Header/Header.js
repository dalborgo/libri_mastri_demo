import React, { memo, useState } from 'react'
import { makeStyles } from '@material-ui/styles'
import {
  Button,
  CircularProgress,
  colors,
  Fab,
  Grid,
  Link,
  ListItemIcon,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from '@material-ui/core'
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab'
import { Link as RouterLink, useParams } from 'react-router-dom'
import ViewDay from '@material-ui/icons/ViewDay'
import ViewWeek from '@material-ui/icons/ViewWeek'
import CompareArrows from '@material-ui/icons/CompareArrows'
import clsx from 'clsx'
import { ME } from 'queries/users'
import { useApolloClient } from '@apollo/react-hooks'
import { getPolicyState } from 'helpers'
import ProducerView from './ProducerView'
import SubAgentView from './SubAgentView'
import truncate from 'lodash/truncate'
import { mdiFilePdfOutline, mdiPrinterSettings } from '@mdi/js'
import Icon from '@mdi/react'
import { envConfig } from 'init'

const useStyles = makeStyles(theme => ({
  whiteButton: {
    backgroundColor: theme.palette.white,
    margin: theme.spacing(0.5),
  },
  rootButton: {
    display: 'inline-flex',
    alignItems: 'center',
  },
  fabRoot: {
    boxShadow: 'none',
    height: 30,
  },
  fabLabel: {
    textTransform: 'capitalize',
    fontSize: 13,
    
  },
  divLink: {
    paddingBottom: theme.spacing(1),
  },
  divLinkShort: {
    paddingTop: theme.spacing(0.3),
    paddingBottom: theme.spacing(0.3),
  },
  link: {
    color: colors.blueGrey[700],
  },
  toolbar: {
    padding: theme.spacing(1, 2),
  },
  gapLeft: {
    marginLeft: 5,
  },
  wrapperButton: {
    position: 'relative',
  },
  buttonProgress: {
    color: theme.palette.main,
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -12,
    marginLeft: -12,
  },
  extendedIcon: {
    marginLeft: theme.spacing(0.5),
    fontSize: 20,
  },
  buttonDiff: {
    marginLeft: theme.spacing(1),
  },
}))

function HeaderButton (props) {
  return (
    <Button
      className={props.classes.whiteButton}
      name={props.name}
      onClick={props.onClick}
      variant="outlined"
    >
      {props.text}
    </Button>
  )
}

function PrintMenu (props) {
  const { items: itemsRaw, classes } = props
  const items = Array.isArray(itemsRaw) ? itemsRaw : [itemsRaw]
  const [anchorEl, setAnchorEl] = React.useState(null)
  
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget)
  }
  
  const handleClose = () => {
    setAnchorEl(null)
  }
  
  return (
    <div>
      <Button
        aria-controls="print-menu"
        aria-haspopup="true"
        className={classes.whiteButton}
        disableFocusRipple
        onClick={handleClick}
        variant="outlined"
      >
        <Icon path={mdiPrinterSettings} size={1}/>
      </Button>
      <Menu
        anchorEl={anchorEl}
        anchorOrigin={
          {
            horizontal: 'left',
            vertical: 'bottom',
          }
        }
        getContentAnchorEl={null}
        id="print-menu"
        keepMounted
        onClose={handleClose}
        open={Boolean(anchorEl)}
      >
        {
          items.map(item => {
            return (
              <MenuItem
                key={item.id}
                onClick={
                  () => {
                    item.print()
                    handleClose()
                  }
                }
              >
                <ListItemIcon>
                  <Icon path={mdiFilePdfOutline} size={1}/>
                </ListItemIcon>
                {item.text}
              </MenuItem>
            )
          })
        }
      </Menu>
    </div>
  )
}

function getSaveButtons (state = {}, meta = {}, top, priority, producer, number, classes, handleSave, handlePrint, handlePolicySave) {
  const proposal = { id: 'proposal', text: 'Offerta', print: handlePrint('proposal') },
    policy = { id: 'policy', text: 'Polizza', print: handlePrint('policy') }
  const proposalAndPolicy = [proposal, policy]
  return (() => {
    switch (state.code) {
      case 'ACCEPTED':
        if (state.isPolicy) {
          return (
            <>
              {priority !== 1 && <PrintMenu classes={classes} items={policy}/>}
              <HeaderButton classes={classes} name="CHANGED" onClick={handlePolicySave} text="Salva"/>
            </>
          )
        } else {
          return (
            <>
              {
                priority === 3 ?
                  <>
                    <PrintMenu classes={classes} items={policy}/>
                    <HeaderButton classes={classes} name="ACCEPTED" onClick={handleSave} text="Salva"/>
                    <HeaderButton classes={classes} name="TO_POLICY" onClick={handleSave} text="Emetti Polizza"/>
                  </>
                  :
                  null
              }
            </>
          )
        }
      case 'REST_QUBO':
      case 'TO_QUBO':
        return (
          <>
            {
              priority === 3 ?
                <>
                  {
                    state?.code === 'REST_QUBO' && priority !== 1 &&
                    <PrintMenu classes={classes} items={proposal}/>
                  }
                  {
                    (!meta.toDoc && !top) &&
                    <>
                      <HeaderButton classes={classes} name="REST_QUBO" onClick={handleSave} text="Salva"/>
                      <HeaderButton
                        classes={classes}
                        name="TO_AGENT"
                        onClick={handleSave}
                        text={`Invia a ${producer.username}`}
                      />
                    </>
                  }
                </>
                :
                null
            }
          </>
        )
      case 'REST_AGENT':
      case 'TO_AGENT':
        return (
          <>
            {
              priority !== 3 && !meta.toDoc && !top ?
                <>
                  {
                    meta?.modified === false && priority !== 1 &&
                    <PrintMenu classes={classes} items={proposal}/>
                  }
                  <HeaderButton classes={classes} name="REST_AGENT" onClick={handleSave} text="Salva"/>
                  {
                    priority !== 1 &&
                    <HeaderButton
                      classes={classes}
                      name="TO_QUBO"
                      onClick={handleSave}
                      text="Invia a Qubo"
                    />
                  } {/*blocco invio sub agent*/}
                </>
                :
                <PrintMenu classes={classes} items={proposal}/>
            }
          </>
        )
      default:
        return (
          <>
            {
              priority === 3 &&
              <PrintMenu classes={classes} items={proposalAndPolicy}/>
            }
            <Button
              className={classes.whiteButton}
              disableFocusRipple
              onClick={handleSave}
              variant="outlined"
            >
              {number ? 'Salva' : 'Salva bozza'}
            </Button>
            {
              (producer || priority !== 3) && priority !== 1 && //blocco invio sub_agent
              <Button
                className={classes.whiteButton}
                disableFocusRipple
                name={priority !== 3 ? 'TO_QUBO' : 'TO_AGENT'}
                onClick={handleSave}
                variant="outlined"
              >
                Invia a {priority !== 3 ? 'Qubo' : truncate(producer?.username, { length: 18 })}
              </Button>
            }
            {
              priority === 3 &&
              <>
                {
                  producer &&
                  <HeaderButton classes={classes} name="TO_POLICY" onClick={handleSave} text="Emetti Polizza"/>
                }
              </>
            }
          </>
        )
    }
  })()
}

const Header = props => {
  const {
    _code,
    number,
    handleSave,
    handlePolicySave,
    handleModeChange,
    producer: prodDefault,
    subAgent: subAgentDefault,
    handlePrint, state, formRefProd, formRefSub, meta, top, loadDiff, calledDiff, loadingDiff, setOpenDiff,
  } = props
  const { tab } = useParams()
  const classes = useStyles()
  const client = useApolloClient()
  const { me: { priority } } = client.readQuery({ query: ME })
  const [producer, setProducer] = useState(prodDefault)
  const [subAgent, setSubAgent] = useState(subAgentDefault)
  const stateChip = getPolicyState(state, meta, top, priority)
  const { code: stateCode, isPolicy } = state || {}
  const showDiff = !top && meta?.modified === false && stateCode !== 'ACCEPTED' && meta?.version > 0
  const loading = calledDiff && loadingDiff
  return (
    <div className={classes.toolbar}>
      <Grid
        alignItems="center"
        container
        spacing={3}
      >
        <Grid item xs={5}>
          <div className={clsx(number ? { [classes.divLinkShort]: true } : { [classes.divLink]: true })}>
            <Link
              component={RouterLink}
              to={isPolicy ? '/policies/list' : '/policies/doclist'}
              variant="overline"
            >
              <span className={classes.gapLeft}>
                ↩&nbsp;&nbsp;{isPolicy ? 'Lista Polizze' : 'Lista Quotazioni'}
              </span>
            </Link>
          </div>
          <Typography
            component="h1"
            variant="h4"
          >
            <span className={classes.gapLeft}>
              {
                number ?
                  <>
                    Doc n.&nbsp;
                    {
                      priority === 3 ?
                        <Link
                          color={'inherit'}
                          href={`http://${envConfig.SERVER}:8091/ui/index.html#!/buckets/documents/MB_POLICY%7C${_code}?bucket=${envConfig.BUCKET}`}
                          target="_blank"
                        >
                          {number}
                        </Link>
                        :
                        <span>{number}</span>
                    }
                  </>
                  :
                  priority === 3 ? 'Nuova Offerta' : 'Nuova Proposta'
              } &nbsp;{number ? stateChip : ''}
            </span>
            {
              showDiff &&
              <div className={classes.rootButton}>
                <div className={classes.wrapperButton}>
                  <Fab
                    classes={
                      {
                        extended: classes.fabRoot,
                        label: classes.fabLabel,
                      }
                    }
                    className={classes.buttonDiff}
                    disabled={loading}
                    onClick={
                      () => {
                        setOpenDiff(true)
                        loadDiff()
                      }
                    }
                    size="small"
                    variant="extended"
                  >
                    &nbsp;Modifiche
                    <CompareArrows className={classes.extendedIcon}/>
                  </Fab>
                  {
                    loading && <CircularProgress className={classes.buttonProgress} size={24}/>
                  }
                </div>
              </div>
            }
          </Typography>
          {
            (() => {
              switch (priority) {
                case 3:
                  return (
                    <ProducerView
                      formRefProd={formRefProd}
                      priority={priority}
                      producer={producer}
                      setProducer={setProducer}
                      state={state}
                      subAgent={subAgent}
                    />
                  )
                case 2:
                  return (
                    <SubAgentView
                      formRefSub={formRefSub}
                      setSubAgent={setSubAgent}
                      state={state}
                      subAgent={subAgent}
                    />
                  )
                default:
                  return null
              }
            })()
          }
        </Grid>
        <Grid item xs={2}>
          <Grid container justify="center">
            <ToggleButtonGroup
              exclusive
              onChange={handleModeChange}
              value={tab === 'all' ? 'list' : 'tab'}
            >
              <ToggleButton
                style={{ backgroundColor: 'white', cursor: tab === 'all' ? 'default' : 'pointer' }}
                value="list"
              >
                <Tooltip enterDelay={1000} title="Lista"><ViewDay/></Tooltip>
              </ToggleButton>
              <ToggleButton
                style={{ backgroundColor: 'white', cursor: tab === 'all' ? 'pointer' : 'default' }}
                value="tab"
              >
                <Tooltip enterDelay={1000} title="Schede"><ViewWeek/></Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>
        </Grid>
        <Grid item xs={5}>
          <Grid container justify="flex-end">
            {
              getSaveButtons(state, meta, top, priority, producer, number, classes, handleSave, handlePrint, handlePolicySave)
            }
          </Grid>
        </Grid>
      </Grid>
    </div>
  )
}

export default memo(Header)
