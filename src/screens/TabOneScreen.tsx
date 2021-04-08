import React, { useState, useEffect } from 'react'
import { StyleSheet, TextInput, Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import { Audio } from 'expo-av'

import { Text, View } from '../components/Themed'
import { getCoinGeckoEthereumPrice } from '../api/CoinGeckoAPI'
import {
  getEthermineCurrentStats,
  getEthermineTotalPayout
} from '../api/EthermineAPI'
import { parseHashrate } from '../util/util'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false
  })
})

export default function TabOneScreen() {
  const [wallet, setWallet] = useState<string | null>(null)
  const [EthermineCurrentStats, setEthermineCurrentStats] = useState<any>({})
  const [totalPayout, setTotalPayout] = useState<number>()
  const [totalEthereum, setTotalEthereum] = useState<number>()
  const [currentEthereumPrice, setCurrentEthereumPrice] = useState<number>()
  const [totalUSD, setTotalUSD] = useState<number>()
  const [hashrates, setHashrates] = useState<any>({})
  const [sound, setSound] = useState<Audio.Sound>()
  const [minActiveWorkers, setMinActiveWorkers] = useState<number>(3)
  const [minHashrate, setMinHashrate] = useState<number>(270)
  const [expoPushToken, setExpoPushToken] = useState<string>('')

  const sendPOSTRequest = async (token: any) => {
    console.log('Attempting to send post request with token ', { token })
    const res = await fetch(
      'https://mining-rig-app-backend.herokuapp.com/data',
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token, wallet, minHashrate, minActiveWorkers })
      }
    )
    const content = await res.text()

    console.log(content)
  }

  useEffect(() => {
    registerForPushNotificationsAsync().then((token: any) => {
      setExpoPushToken(token)

      if (wallet && minHashrate && minActiveWorkers) sendPOSTRequest(token)
    })
  }, [wallet, minHashrate, minActiveWorkers])

  useEffect(() => {
    setWallet('53ce4cED03649deeB0588aD4b355d985888df95')

    //  make api calls every 30 seconds
    getAPIData()
    const requestInterval = setInterval(() => {
      getAPIData()
    }, 30000)

    return () => clearInterval(requestInterval)
  }, [])

  useEffect(() => {
    if (Object.keys(EthermineCurrentStats).length > 0 && totalPayout) {
      setTotalEthereum(
        parseFloat(
          (
            EthermineCurrentStats.unpaid * 0.000000000000000001 +
            totalPayout * 0.000000000000000001
          ).toFixed(5)
        )
      )
    }
  }, [EthermineCurrentStats, totalPayout])

  useEffect(() => {
    if (totalEthereum && currentEthereumPrice) {
      setTotalUSD(
        parseFloat(
          (
            Math.round(currentEthereumPrice * totalEthereum * 100) / 100
          ).toFixed(2)
        )
      )
    }
  }, [totalEthereum, currentEthereumPrice])

  useEffect(() => {
    const tempHashrates: any = {}
    for (const key in EthermineCurrentStats) {
      if (key.indexOf('Hashrate') >= 0) {
        tempHashrates[key] = parseHashrate(EthermineCurrentStats[key])
      }
    }
    setHashrates(tempHashrates)
  }, [EthermineCurrentStats])

  //  check if activeWorkers or hashrate drop below threshold
  useEffect(() => {
    if (Object.keys(EthermineCurrentStats).length > 0) {
      if (
        EthermineCurrentStats.activeWorkers < minActiveWorkers ||
        EthermineCurrentStats.reportedHashrate < minHashrate
      ) {
        playAlarm()
      }
    }

    return sound
      ? () => {
          sound.unloadAsync()
        }
      : undefined
  }, [EthermineCurrentStats])

  async function registerForPushNotificationsAsync() {
    let token
    if (Constants.isDevice) {
      const {
        status: existingStatus
      } = await (Notifications as any).getPermissionsAsync()
      let finalStatus = existingStatus
      if (existingStatus !== 'granted') {
        const {
          status
        } = await (Notifications as any).requestPermissionsAsync()
        finalStatus = status
      }
      if (finalStatus !== 'granted') {
        alert('Failed to get push token for push notification!')
        return
      }
      token = (await Notifications.getExpoPushTokenAsync()).data
      console.log(token)
    } else {
      alert('Must use physical device for Push Notifications')
    }

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C'
      })
    }

    return token
  }

  const getAPIData = () => {
    console.log('Making API Request')
    if (wallet) {
      getEthermineCurrentStats(wallet).then((data) => {
        setEthermineCurrentStats(data)
      })

      getEthermineTotalPayout(wallet).then((data) => {
        setTotalPayout(data)
      })

      getCoinGeckoEthereumPrice().then((data) => {
        setCurrentEthereumPrice(data)
      })
    }
  }

  const playAlarm = async () => {
    console.log('playing alarm')
    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/audio/testAlarm.wav')
    )
    setSound(sound)
    await sound.playAsync()
  }

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.title}>{totalEthereum}</Text>
        <Text style={styles.title}>${totalUSD}</Text>
      </View>
      <TextInput style={styles.input} value={'PlaceHolder'} />

      {Object.keys(EthermineCurrentStats).map((key: string, i: number) => {
        return (
          <Text key={i} style={styles.body}>
            {key + ': ' + EthermineCurrentStats[key]}
          </Text>
        )
      })}
      <View style={{ marginTop: 50 }}>
        {Object.keys(hashrates).map((key: string, i: number) => {
          return (
            <Text key={i} style={styles.body}>
              {key + ': ' + hashrates[key] + ' MH/s'}
            </Text>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  body: {
    fontSize: 12
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%'
  },
  input: {
    fontSize: 20,
    fontWeight: 'bold',
    backgroundColor: '#FFFFFF'
  }
})
