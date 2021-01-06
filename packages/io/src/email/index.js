import nodemailer from 'nodemailer'
import config from 'config'
import { validation } from '@adapter/common'
import Q from 'q'
import log from '@adapter/common/src/winston'

!config.has('email') && log.silly('email config is not defined!')
const { TRANSPORTER, TITLE, EMAIL_FROM } = config.has('email') ? config.get('email') : {}

async function send (emails, subject = '', html = '', text = '', _attachments, emailFrom = EMAIL_FROM, title = TITLE) {
  try {
    let errorMails = []
    if (!Array.isArray(emails)) {emails = [emails]}
    if (!emails.length) {return { ok: false, message: 'No email defined!' }}
    emails.forEach((email, index) => {
      const isString = typeof email === 'string' || email instanceof String
      if (!isString) {
        emails.splice(index, 1)
      } else if (!validation.valEmail(email)) {
        errorMails.push(email)
        emails.splice(index, 1)
      }
    })
    if (emails.length === 0) {return { ok: false, message: 'All email are invalid!', err: errorMails }}
    emails = emails.join(';')
    let transporter = nodemailer.createTransport(TRANSPORTER)
    const attachments = []
    let mailOptions = {
      attachments,
      from: '"' + title + '" <' + emailFrom + '>', // sender address
      html,
      subject,
      text,
      to: emails,
    }
    const results = await Q.ninvoke(transporter, 'sendMail', mailOptions)
    return { ok: true, results }
  } catch (err) {
    return { ok: false, message: err.message }
  }
}

export default {
  send,
}
