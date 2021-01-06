import mysql from 'mysql'
import config from 'config'
import MySQLEvents from '@rodrigogs/mysql-events'
import { cFunctions } from '@adapter/common'

const { STATEMENTS } = MySQLEvents

const { DB_PASS, DB_USER, DB_SERVER, PORT = 3306 } = config.get('mysql')

function createTrigger (trigger) {
  if (!trigger) {throw Error('trigger is not defined!')}
  const { name, statement, expression, onEvent = console.log } = trigger
  if (!expression) {throw Error('expression is not defined!')}
  return {
    expression,
    onEvent,
    name: name || `${statement}_${cFunctions.getUUID(true)}`,
    statement: STATEMENTS[statement] || STATEMENTS['ALL'],
  }
}

const startListener = async (connErrorCallback = console.error) => {
  const connection = mysql.createConnection({
    host: DB_SERVER,
    password: DB_PASS,
    port: PORT,
    user: DB_USER,
  })

  const instance = new MySQLEvents(connection, { startAtEnd: true })

  await instance.start()
  instance.on(MySQLEvents.EVENTS.CONNECTION_ERROR, connErrorCallback)
  instance.on(MySQLEvents.EVENTS.ZONGJI_ERROR, async err => {console.warn(err.message)})
  instance.on(MySQLEvents.EVENTS.TRIGGER_ERROR, console.error)

  const {_socket} = instance.connection
  _socket.setKeepAlive(true, 1000) //second parameter required

  return instance
}

export default {
  startListener,
  createTrigger,
}

