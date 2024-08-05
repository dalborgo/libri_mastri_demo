import express from 'express'
import session from 'express-session'
import { bucket } from './db'
import { ApolloServer } from 'apollo-server-express'
import typeDefs from './typeDefs'
import resolvers from './resolvers'
import schemaDirectives from './directives'
import config from 'config'
import { cFunctions } from '@adapter/common'
import log from '@adapter/common/src/winston'
import indexRouter from './routes'
import appRouter from './routes/main'
import { childLoader } from './loaders'
import { couchbase } from '@adapter/io'
import http from 'http'
import https from 'https'
import fs from 'fs'

const createError = require('http-errors')
const cookieParser = require('cookie-parser')
const {
  MAXAGE_MINUTES = 60,
  ORIGIN,
  NAMESPACE = 'apollo',
  BODY_LIMIT = '100kb',
  PORT,
  IP,
} = config.get('apollo_express')
const { BUCKET_DEFAULT, IP_DEFAULT } = config.get('couchbase')
const path = require('path')
const cors = require('cors')
const CouchbaseStore = require('connect-couchbase')(session)
const corsDef = { origin: ORIGIN, credentials: true }

bucket.on('error', err => {
  log.error('error code', err.code)
  log.error(err)
  if ([23, 16].includes(err.code)) {
    log.info('RETRY STARTUP')
    process.exit(1) // utilizza il restart del pm2 per riprovare
  }
})

bucket.on('connect', () => {
  const app = express()
  app.disable('x-powered-by')
  app.set('views', path.join(__dirname, 'views'))
  app.set('view engine', 'ejs')
  const couchbaseStore = new CouchbaseStore({
    db: bucket,
    prefix: 'sess::',
  })
  app.use(cors(corsDef))
  app.use(express.urlencoded({ extended: false }))
  app.use(express.json({ limit: BODY_LIMIT }))
  app.use(cookieParser())
  app.use(express.static(path.join(__dirname, 'public')))
  app.use(session({
    cookie: {
      maxAge: parseInt(MAXAGE_MINUTES) * 60 * 1000,
      sameSite: true,
      secure: false, //true if https server
    },
    name: `${NAMESPACE}_session`,
    resave: true,
    rolling: true,
    saveUninitialized: false,
    secret: 'aplocandiemete',
    store: couchbaseStore,
  }))
  const server = new ApolloServer({
    context: ({ req, res }) => ({
      req,
      res,
      childLoader,
    }),
    debug: !cFunctions.isProd(),
    introspection: true,
    playground: cFunctions.isProd()
      ? false
      : {
        settings: {
          'request.credentials': 'include',
        },
      },
    resolvers,
    schemaDirectives,
    typeDefs,
    uploads: { maxFileSize: '500mb', maxFieldSize: 500000000 },
  })
  app.use('/', indexRouter)
  app.use(`/${NAMESPACE}`, appRouter)
  
  server.applyMiddleware({ app, cors: corsDef })
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    log.error(err)
    if (cFunctions.isProd()) {
      res.status(err.status || 500)
    } else {
      res.status(412 || err.status || 500)
    }
    res.json({ ok: false, message: err.message, err })
  })
  app.use(function (req, res) {
    const err = createError(404)
    log.warn(`${err.message} ${req.originalUrl}`)
    res.locals.message = err.message
    res.locals.error = req.app.get('env') === 'development' ? err : {}
    res.status(err.status || 500)
    res.render('error')
  })
  const httpServer = http.createServer(app)
  //server.installSubscriptionHandlers(httpServer)
  httpServer.listen(PORT, async () => {
    const label = cFunctions.isProd() ? 'Production' : 'Development'
    log.info(`Apollo Express ${NAMESPACE} listening on port ${PORT}`)
    //log.info('Subscriptions ready!')
    BUCKET_DEFAULT === 'libri_mastri_dev' && log.silly('--- DEMO ---')
    log.hint(`Environment: ${label}`)
    {
      const { ok, results, message } = await couchbase.getVersion()
      if (ok) {
        log.hint(`Couchbase: ${IP_DEFAULT} / ${BUCKET_DEFAULT} / ${results}`)
      } else {
        log.warn(message)
        log.hint(`Couchbase: ${IP_DEFAULT} / ${BUCKET_DEFAULT}`)
      }
    }
    {
      const { ok, results, message } = await couchbase.getIndexStatus()
      if (ok) {
        log.hint('Index Status', results)
      } else {
        log.warn(message)
      }
    }
    if (!cFunctions.isProd()) {
      log.hint(`GraphQl Url: http://${IP}:${PORT}${server.graphqlPath}`)
      //log.hint(`Subscriptions Url: ws://${IP}:${PORT}${server.graphqlPath}`)
    }
  })
  if (cFunctions.isProd()) {
    const keyPath = path.join(__dirname, '../../../../../cert/key.key')
    const certPath = path.join(__dirname, '../../../../../cert/certificate.pem')
    const httpsConfig = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    }
    const httpsPort = parseInt(PORT, 10) + 2000
    https.createServer(httpsConfig, app).listen(httpsPort, () => {
      log.info(`HTTPS Apollo Express ${NAMESPACE} listening on port ${httpsPort}`)
    })
  }
})
