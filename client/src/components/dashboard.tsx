import React from 'react'
import { Text, View } from '../components/Themed'
import { StyleSheet, TextInput, Platform } from 'react-native'

import { parseHashrate } from '../util/util'

interface Props {
  wallet: string | null
  ethermineCurrentStats: any
  ethermineWorkerStats: any
  hashrates: any
  totalEthereum: number
  totalUSD: number
}

const Dashboard: React.FC<Props> = ({
  wallet,
  ethermineCurrentStats,
  ethermineWorkerStats,
  hashrates,
  totalEthereum,
  totalUSD
}) => {
  return (
    <>
      <View>
        <Text style={styles.subtitle}>{wallet}</Text>
        <Text style={styles.title}>{totalEthereum}</Text>
        <Text style={styles.title}>${totalUSD}</Text>
      </View>
      {ethermineWorkerStats !== undefined &&
        ethermineWorkerStats.map((worker: any, i: number) => {
          return (
            <Text key={i} style={styles.body}>
              {`Worker #${i + 1} reported hashrate: ` +
                parseHashrate(worker.reportedHashrate)}
            </Text>
          )
        })}
      {ethermineCurrentStats !== undefined &&
        Object.keys(ethermineCurrentStats).map((key: string, i: number) => {
          return (
            <Text key={i} style={styles.body}>
              {key + ': ' + ethermineCurrentStats[key]}
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
    </>
  )
}
export default Dashboard

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
  subtitle: {
    fontSize: 16,
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
