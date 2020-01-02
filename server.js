const express = require('express')
const app = express()
const port = process.env.PORT || 3000
const bodyParser = require('body-parser')
const session = require('express-session')
const authApp = express.Router()
const basicAuth = require('basic-auth')

// settings
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json())

// auth
app.use('/admin', authApp)
authApp.use((req, res, next) => {
  const credentials = basicAuth(req)
  if(!credentials || (credentials.name !== 'admin') || credentials.pass !== 'pass') {
    const realm = 'secure!'
    res.header('WWW-Authenticate', `Basic realm="${realm}"`).status(401).end()
  } else {
    next()
  }
})
authApp.get('/test', (req, res) => {
  res.json({status: 'OK'})
})
authApp.get('/*', (req, res) => {
  res.send('You are authenticated.')
})

// route
app.use((req, res, next) => {
  const reqUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`
  const reqDate = new Date()
  const srcIpAddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress
  console.log(`${reqDate} Access '${reqUrl}' from ${srcIpAddr}`)
  next()
})

app.use(express.static('./'))
app.get('/health', (req, res) => {
  res.send('UP')
})
app.get('/users/:userId', (req, res) => {
  res.json({id: req.params.userId, name: 'Jiro'})
})
app.get('/api', (req, res) => {
  res.json({name: 'Taro', profile: {age: 10, sex: 'male'}})
})
app.post('/api', (req, res) => {
  let requestBody = req.body
  console.log(requestBody)
  console.log(`request body: ${JSON.stringify(requestBody)}`)
  res.json(JSON.stringify(requestBody))
})
app.get('/file', (req, res) => {
  res.sendFile(__dirname + '/index.html')
})

// session
const memoryStore = new session.MemoryStore()
const sessionSettings = {
  secret: 'mysecret',
  resave: false,
  saveUninitialized: true,
  cookie: {maxAge: 1000 * 60 * 60 * 12}, // 12 hours
  store: memoryStore
}

if(app.get('env') === 'production') {
  app.set('trust proxy', 1)
  sessionSettings.cookie.secure = true
}
app.use(session(sessionSettings))

app.get('/count', (req, res, next) => {
  console.log(req.session.count)
  if(req.session.count) {
    req.session.count++
  } else {
    req.session.count = 1
  }
  res.json({count: req.session.count})
})

app.listen(port, () => {
  console.log(`Server started on localhost:${port}`)
})
