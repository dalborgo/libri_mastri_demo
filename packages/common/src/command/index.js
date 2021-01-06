import { exec } from 'child_process'
import Q from 'q'

async function execCommand (command, options) {
  try {
    const [results] = await Q.nfcall(exec, command, options)
    return { ok: true, results }
  } catch (err) {
    return { ok: false, message: err.message }
  }
}

export default {
  execCommand,
}
