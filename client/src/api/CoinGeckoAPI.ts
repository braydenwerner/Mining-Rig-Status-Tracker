export const getCoinGeckoEthereumPrice = async () => {
  const res = await fetch(
    'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=ethereum'
  )
  const data = await res.json()
  return data[0]['current_price']
}
