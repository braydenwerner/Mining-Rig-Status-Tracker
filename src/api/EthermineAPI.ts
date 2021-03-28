export const getEthermineCurrentStats = async () => {
  try {
    const res = await fetch(
      'https://api.ethermine.org/miner/53ce4cED03649deeB0588aD4b355d985888df95c/currentStats'
    )
    const data = await res.json()
    return data.data
  } catch (error) {
    console.error(error)
  }
}

export const getEthermineTotalPayout = async () => {
  const res = await fetch(
    'https://api.ethermine.org/miner/53ce4cED03649deeB0588aD4b355d985888df95c/payouts'
  )
  const data = await res.json()

  let totalPayout = 0
  for (const ethObj of data.data) {
    totalPayout += ethObj.amount
  }
  return totalPayout
}
