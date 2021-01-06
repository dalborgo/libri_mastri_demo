import schedule from 'node-schedule'
import log from '@adapter/common/src/winston'
import Q from 'q'

function startCron (jobName, _rule, _errorRule, _operation, _args = []) {
  if (!Array.isArray(_args)) {
    _args = [_args]
  }
  log.info(`Cron ${jobName} ready!`)
  log.info('Rule:', JSON.stringify(_rule, null, 2))
  log.info('Error Rule:', JSON.stringify(_errorRule, null, 2))
  let rule = {...new schedule.RecurrenceRule(), ..._rule}

  schedule.scheduleJob(rule, async function () {
    const res = await Q.fapply(_operation, _args)
    const { ok, message, results } = res
    if (ok) {
      log.info(`Cron ${jobName} response:`, JSON.stringify(results, null, 2))
      rule = {...new schedule.RecurrenceRule(), ..._rule}
      this.reschedule(rule)
    } else {
      log.error(`Cron ${jobName} error:`, message)
      rule = {...new schedule.RecurrenceRule(), ..._errorRule}
      this.reschedule(rule)
    }
    const nextInv = this.nextInvocation()._date
    log.info(`Cron ${jobName} next invocation:`, nextInv.toString())
  })
}

export default {
  startCron,
}
