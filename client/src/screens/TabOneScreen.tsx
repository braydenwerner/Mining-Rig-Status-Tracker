import React, { useState, useEffect } from 'react'
import { StyleSheet, TextInput, Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import { Audio } from 'expo-av'

import { Text, View } from '../components/Themed'
import { Dashboard } from '../components/exports'
import { getCoinGeckoEthereumPrice } from '../api/CoinGeckoAPI'
import {
  getEthermineCurrentStats,
  getEtheremineWorkers,
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

const TabOneScreen: React.FC = () => {
  const [wallet, setWallet] = useState<string | null>(
    '0x53ce4ced03649deeb0588ad4b355d985888df95c'
  )
  const [ethermineCurrentStats, setEthermineCurrentStats] = useState<any>({})
  const [ethermineWorkerStats, setEthermineWorkerStats] = useState<any>([])
  const [ethermineTotalPayout, setEthermineTotalPayout] = useState<any>({})
  const [currentEthereumPrice, setCurrentEthereumPrice] = useState<number>(0)
  const [totalEthereum, setTotalEthereum] = useState<number>(0)
  const [totalUSD, setTotalUSD] = useState<number>(0)
  const [hashrates, setHashrates] = useState<any>({})
  const [sound, setSound] = useState<Audio.Sound>()
  const [minActiveWorkers, setMinActiveWorkers] = useState<number>(3)
  const [minHashrate, setMinHashrate] = useState<number>(155)

  const sendPOSTRequest = async (token: any) => {
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
    if (!wallet || !minHashrate || !minActiveWorkers) return

    registerForPushNotificationsAsync().then((token: any) => {
      sendPOSTRequest(token)
    })
    //  ethermineCurrentStats dependency to continue sending token to server after app is closed
    //  also stops heroku from stopping app due to idling
  }, [wallet, minHashrate, minActiveWorkers, ethermineCurrentStats])

  useEffect(() => {
    setWallet('0x53ce4ced03649deeb0588ad4b355d985888df95c')
    getAPIData()

    //  make api calls every 30 seconds
    const requestInterval = setInterval(() => {
      getAPIData()
    }, 30000)

    return () => clearInterval(requestInterval)
  }, [])

  useEffect(() => {
    if (
      ethermineCurrentStats !== undefined &&
      Object.keys(ethermineCurrentStats).length > 0 &&
      ethermineTotalPayout
    ) {
      setTotalEthereum(
        parseFloat(
          (
            ethermineCurrentStats.unpaid * 0.000000000000000001 +
            ethermineTotalPayout * 0.000000000000000001
          ).toFixed(5)
        )
      )
    }
  }, [ethermineCurrentStats, ethermineTotalPayout])

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
    for (const key in ethermineCurrentStats) {
      if (key.indexOf('Hashrate') >= 0) {
        tempHashrates[key] = parseHashrate(ethermineCurrentStats[key])
      }
    }
    setHashrates(tempHashrates)
  }, [ethermineCurrentStats])

  //  check if activeWorkers or hashrate drop below threshold
  useEffect(() => {
    if (
      ethermineCurrentStats !== undefined &&
      Object.keys(ethermineCurrentStats).length > 0
    ) {
      if (
        ethermineCurrentStats.activeWorkers < minActiveWorkers ||
        parseHashrate(ethermineCurrentStats.reportedHashrate) < minHashrate
      ) {
        playAlarm()
      }
    }

    return sound
      ? () => {
          sound.unloadAsync()
        }
      : undefined
  }, [ethermineCurrentStats])

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
    if (wallet) {
      Promise.all([
        getEthermineCurrentStats(wallet),
        getEthermineTotalPayout(wallet),
        getEtheremineWorkers(wallet),
        getCoinGeckoEthereumPrice()
      ]).then((res) => {
        setEthermineCurrentStats(res[0])
        setEthermineTotalPayout(res[1])
        setEthermineWorkerStats(res[2])
        setCurrentEthereumPrice(res[3])
      })
    }
  }

  const playAlarm = async () => {
    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/audio/testAlarm.wav')
    )
    setSound(sound)
    await sound.playAsync()
  }

  return (
    <View style={styles.container}>
      <Dashboard
        wallet={wallet}
        ethermineCurrentStats={ethermineCurrentStats}
        ethermineWorkerStats={ethermineWorkerStats}
        hashrates={hashrates}
        totalEthereum={totalEthereum}
        totalUSD={totalUSD}
      />
    </View>
  )
}
export default TabOneScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  }
})
