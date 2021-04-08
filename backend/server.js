const express = require('express')
const { Expo } = require('expo-server-sdk')
const app = express()
const expo = new Expo()
const cors = require('cors')

app.use(cors())

let savedData = []
const PORT = process.env.PORT || 3000

const handlePushTokens = ({ title, body }) => {
  let notifications = []
  for (let data of savedData) {
    if (!Expo.isExpoPushToken(data.pushToken)) {
      console.error(
        `Push token ${data.pushToken} is not a valid Expo push token`
      )
      continue
    }

    notifications.push({
      to: data.pushToken,
      sound: 'default',
      title: title,
      body: body,
      data: { body }
    })
  }

  let chunks = expo.chunkPushNotifications(notifications)

  ;(async () => {
    for (let chunk of chunks) {
      try {
        let receipts = await expo.sendPushNotificationsAsync(chunk)
        console.log(receipts)
      } catch (error) {
        console.error(error)
      }
    }
  })()
}

const saveData = (data) => {
  const exists = savedData.find((d) => d.token === data.token)
  if (!exists) {
    savedData.push(data)
  }
}

app.use(express.json())

app.get('/', (req, res) => {
  res.send('Push Notification Server Running')
})

app.post('/data', (req, res) => {
  console.log('req.body: ', req.body)
  saveData(req.body)
  res.send('Received push token with data on backend')
})

app.post('/message', (req, res) => {
  handlePushTokens(req.body)
  console.log(`Received message, with title: ${req.body.title}`)
  res.send(`Received message, with title: ${req.body.title}`)
})

app.listen(PORT, () => {
  console.log(`Server Online on Port ${PORT}`)
})
