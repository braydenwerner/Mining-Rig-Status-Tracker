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
  console.log(savedData)
  let notifications = []
  for (let data of savedData) {
    if (!Expo.isExpoPushToken(data.token)) {
      console.error(`Push token ${data.token} is not a valid Expo push token`)
      continue
    }

    //  if hashrate or active workers are below min for this wallet, push to the
    //  appropriate user
    getEthermineCurrentStats(data.wallet).then((res) => {
      const parsedHashrate = parseFloat(
        (res.reportedHashrate * 0.000001).toFixed(2)
      )
      if (
        parsedHashrate < data.minHashrate ||
        res.activeWorkers < data.minActiveWorkers
      ) {
        notifications.push({
          to: data.token,
          sound: 'default',
          title: `Hashrate is low!`,
          body: `Active Rigs: ${res.activeWorkers}`,
          data: {}
        })
      }

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
    })
  }
}

const getEthermineCurrentStats = async (wallet) => {
  const res = await axios.get(
    `https://api.ethermine.org/miner/${wallet}/currentStats`
  )

  return res.data.data
}

const saveData = (data) => {
  let existingIdx = savedData.findIndex((d) => d.token === data.token)
  if (existingIdx === -1) savedData.push(data)
  else savedData[existingIdx] = { ...data }
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
