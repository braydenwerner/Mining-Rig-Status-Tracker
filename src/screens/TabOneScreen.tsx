import React, { useState, useEffect } from 'react'
import { StyleSheet } from 'react-native'

import { Text, View } from '../components/Themed'
import {
  getEthermineCurrentStats,
  getEthermineTotalPayout
} from '../api/EthermineAPI'
import { getCoinGeckoEthereumPrice } from '../api/CoinGeckoAPI'
import { parseHashrate } from '../util/util'

export default function TabOneScreen() {
  const [EthermineCurrentStats, setEthermineCurrentStats] = useState<any>({})
  const [totalPayout, setTotalPayout] = useState<number>()
  const [totalEthereum, setTotalEthereum] = useState<number>()
  const [currentEthereumPrice, setCurrentEthereumPrice] = useState<number>()
  const [totalUSD, setTotalUSD] = useState<number>()

  const [hashrates, setHashrates] = useState<any>({})

  useEffect(() => {
    //  make api calls every 30 seconds
    const requestInterval = setInterval(() => {
      console.log('Making API Request')
      getEthermineCurrentStats().then((data) => {
        setEthermineCurrentStats(data)
      })

      getEthermineTotalPayout().then((data) => {
        setTotalPayout(data)
      })

      getCoinGeckoEthereumPrice().then((data) => {
        setCurrentEthereumPrice(data)
      })
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
      setTotalUSD(parseFloat((currentEthereumPrice * totalEthereum).toFixed(2)))
    }
  }, [totalEthereum, currentEthereumPrice])

  useEffect(() => {
    if (EthermineCurrentStats) {
      const tempHashrates: any = {}
      for (const key in EthermineCurrentStats) {
        if (key.indexOf('Hashrate') >= 0) {
          tempHashrates[key] = parseHashrate(EthermineCurrentStats[key])
        }
      }
      setHashrates(tempHashrates)
    }
  }, [EthermineCurrentStats])

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.title}>{totalEthereum}</Text>
        <Text style={styles.title}>${totalUSD}</Text>
      </View>
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
  }
})
