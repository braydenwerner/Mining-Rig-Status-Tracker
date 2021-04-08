const express = require('express')
const axios = require('axios')
const { Expo } = require('expo-server-sdk')
const app = express()
const expo = new Expo()
const cors = require('cors')

app.use(cors())

let savedData = []
const PORT = process.env.PORT || 3000

const sendNotifications = () => {
  let notifications = []
  for (let data of savedData) {
    if (!Expo.isExpoPushToken(data.token)) {
      console.error(`Push token ${data.token} is not a valid Expo push token`)
      continue
    }

    //  if hashrate or active workers are below min for this wallet, push to the
    //  appropriate user
    getEthermineCurrentStats(data.wallet).then((res) => {
      console.log('res.currentHashrate: ', res.currentHashrate)
      console.log('res.activeWorkers: ', res.activeWorkers)
      console.log('data.minHashrate: ', data.minHashrate)
      console.log('data.minActiveWorkers: ', data.minActiveWorkers)

      if (
        res.currentHashrate < data.minHashrate ||
        res.activeWorkers < data.minActiveWorkers
      ) {
        notifications.push({
          to: data.pushToken,
          sound: 'default',
          title: title,
          body: body,
          data: { body }
        })
      }
    })

    //  send notifications based on notifications array
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
}

const getEthermineCurrentStats = async (wallet) => {
  try {
    const res = await axios.get(
      `https://api.ethermine.org/miner/${wallet}/currentStats`
    )
    const data = await res.json()
    return data.data
  } catch (error) {
    console.error(error)
  }
}

const saveData = (data) => {
  let exists = savedData.find((d) => d.token === data.token)
  if (!exists) savedData.push(data)
  else exists = data
}

//  send notification every 30 seconds to all users
setInterval(sendNotifications, 30000)

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
