import React, { useRef } from 'react'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'
import TextareaAutosize from '@material-ui/core/TextareaAutosize'
import Typography from '@material-ui/core/Typography'
import Slide from '@material-ui/core/Slide'
import { useTheme } from '@material-ui/styles'
import typography from 'theme/typography'
import { Grid } from '@material-ui/core'

const Transition = React.forwardRef(function Transition (props, ref) {
  return <Slide direction="down" ref={ref} {...props} />
})

const DialogEditConditions = props => {
  const { index, setIndex, setFieldValue, defaultValue, coverageTypesToKey, isDisabled } = props
  const handleClose = () => {
    setIndex(-1)
  }
  const firstTextAreaRef = useRef(null)
  const secondTextAreaRef = useRef(null)
  const thirdTextAreaRef = useRef(null)
  const theme = useTheme()
  return (
    <Dialog
      disableBackdropClick
      fullWidth
      maxWidth="md"
      onClose={handleClose}
      open={index > -1}
      TransitionComponent={Transition}
    >
      {
        !isDisabled &&
        <DialogTitle disableTypography>
          <Typography variant="h4">
            Modifica Testi
          </Typography>
        </DialogTitle>
      }
      <DialogContent>
        <Typography
          gutterBottom
          style={
            {
              color: theme.palette.grey[800],
              fontWeight: 'normal',
            }
          }
          variant="h5"
        >
          &nbsp;&nbsp;Scoperti e Franchigie
        </Typography>
        <TextareaAutosize
          autoFocus
          defaultValue={defaultValue?.[index]?.conditions}
          disabled={isDisabled}
          ref={firstTextAreaRef}
          style={
            {
              ...typography.body1,
              backgroundColor: theme.palette.grey[200],
              border: '1px solid',
              borderColor: theme.palette.grey[400],
              borderRadius: 5,
              fontFamily: 'Roboto',
              height: 150,
              overflow: 'auto',
              padding: 7,
              resize: 'vertical',
              width: '100%',
            }
          }
        />
        {
          !isDisabled &&
          <Button
            color="primary"
            onClick={
              () => {
                const arr = coverageTypesToKey[defaultValue?.[index]?.coverageType]?.conditions ?? []
                firstTextAreaRef.current.value = arr.reduce((prev, curr) => {
                  return `${prev}${curr} scoperto … % min. € …
`
                }, '').trim()
              }
            }
          >
            Predefinito {coverageTypesToKey[defaultValue?.[index]?.coverageType]?.display}
          </Button>
        }
        <br/>
        <br/>
        <Typography
          gutterBottom
          style={
            {
              color: theme.palette.grey[800],
              fontWeight: 'normal',
            }
          }
          variant="h5"
        >
          &nbsp;&nbsp;Garanzia Cristalli
        </Typography>
        <TextareaAutosize
          defaultValue={defaultValue?.[index]?.statements}
          disabled={isDisabled}
          ref={secondTextAreaRef}
          style={
            {
              ...typography.body1,
              backgroundColor: theme.palette.grey[200],
              border: '1px solid',
              borderColor: theme.palette.grey[400],
              borderRadius: 5,
              fontFamily: 'Roboto',
              height: 100,
              overflow: 'auto',
              padding: 7,
              resize: 'vertical',
              width: '100%',
            }
          }
        />
        {
          !isDisabled &&
          <Button
            color="primary"
            onClick={
              () => {
                secondTextAreaRef.current.value = 'Art. II.1. Cristalli con Massimale di € … per sinistro e per periodo assicurativo - Franchigia € 150,00 (Nessuna franchigia per riparazione in rete convenzionata)'
              }
            }
          >
            Predefinito Cristalli
          </Button>
        }
        <br/>
        <br/>
        <Typography
          gutterBottom
          style={
            {
              color: theme.palette.grey[800],
              fontWeight: 'normal',
            }
          }
          variant="h5"
        >
          &nbsp;&nbsp;Garanzia Traino
        </Typography>
        <TextareaAutosize
          defaultValue={defaultValue?.[index]?.statementsTowing}
          disabled={isDisabled}
          ref={thirdTextAreaRef}
          style={
            {
              ...typography.body1,
              backgroundColor: theme.palette.grey[200],
              border: '1px solid',
              borderColor: theme.palette.grey[400],
              borderRadius: 5,
              fontFamily: 'Roboto',
              height: 100,
              overflow: 'auto',
              padding: 7,
              resize: 'vertical',
              width: '100%',
            }
          }
        />
      </DialogContent>
      <Grid
        container
        justify="space-between"
        style={
          {
            padding: theme.spacing(1, 2),
          }
        }
      >
        <Grid item/>
        <Grid item>
          <Button color="primary" onClick={handleClose}>
            {isDisabled ? 'Chiudi' : 'Annulla'}
          </Button>
          {
            !isDisabled &&
            <>
              &nbsp;&nbsp;
              <Button
                color="primary"
                onClick={
                  () => {
                    setFieldValue(`productDefinitions.${index}.conditions`, firstTextAreaRef.current.value.trim() || '')
                    setFieldValue(`productDefinitions.${index}.statements`, secondTextAreaRef.current.value.trim() || '')
                    setFieldValue(`productDefinitions.${index}.statementsTowing`, thirdTextAreaRef.current.value.trim() || '')
                    handleClose()
                  }
                }
              >
                Conferma
              </Button>
            </>
          }
        </Grid>
      </Grid>
    </Dialog>
  )
}

export default DialogEditConditions
