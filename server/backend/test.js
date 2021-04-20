const axios = require('axios')

const getEthermineCurrentStats = async (wallet) => {
  const res = await axios.get(
    `https://api.ethermine.org/miner/${wallet}/currentStats`
  )

  return res.data.data
}

console.log(
  getEthermineCurrentStats('0x53ce4ced03649deeb0588ad4b355d985888df95c').then(
    (res) => {
      console.log(res.currentHashrate)
    }
  )
)
