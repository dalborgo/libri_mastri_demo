import React, { useRef } from 'react'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'
import TextareaAutosize from '@material-ui/core/TextareaAutosize'
import Typography from '@material-ui/core/Typography'
import Slide from '@material-ui/core/Slide'
import { useTheme } from '@material-ui/styles'
import typography from 'theme/typography'

const Transition = React.forwardRef(function Transition (props, ref) {
  return <Slide direction="down" ref={ref} {...props} />
})

const DialogSpecialArrangements = props => {
  const { open, setOpen, setFieldValue, defaultValue, isDisabled } = props
  const handleClose = () => {
    setOpen(false)
  }
  const textAreaRef = useRef(null)
  const theme = useTheme()
  return (
    <Dialog
      disableBackdropClick
      fullWidth
      maxWidth="lg"
      onClose={handleClose}
      open={open}
      TransitionComponent={Transition}
    >
      <DialogTitle disableTypography>
        <Typography variant="h4">
          Accordi Speciali
        </Typography>
      </DialogTitle>
      <DialogContent>
        <TextareaAutosize
          autoFocus
          defaultValue={defaultValue}
          disabled={isDisabled}
          ref={textAreaRef}
          style={
            {
              ...typography.body1,
              backgroundColor: theme.palette.grey[200],
              border: '1px solid',
              borderColor: theme.palette.grey[400],
              borderRadius: 5,
              fontFamily: 'Roboto',
              height: '80vh',
              overflow: 'auto',
              padding: 7,
              resize: 'none',
              width: '100%',
            }
          }
        />
      </DialogContent>
      <DialogActions style={{marginRight: 10}}>
        <Button color="primary" onClick={handleClose}>
          {isDisabled ? 'Chiudi' : 'Annulla'}
        </Button>
        {
          !isDisabled &&
          <Button
            color="primary"
            onClick={
              () => {
                setFieldValue('specialArrangements', textAreaRef.current.value.trim())
                handleClose()
              }
            }
          >
            Conferma
          </Button>
        }
      </DialogActions>
    </Dialog>
  )
}

export default DialogSpecialArrangements
