export const parseHashrate = (hashrate: number) => {
  return parseFloat((hashrate * 0.000001).toFixed(2))
}
