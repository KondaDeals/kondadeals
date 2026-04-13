/**
 * KondaDeals — Global Currency Formatter
 * Use this everywhere: formatINR(1499) → "₹1,499"
 */

export const formatINR = (amount) => {
  const num = parseFloat(amount) || 0
  return '₹' + num.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

export const formatINRPlain = (amount) => {
  const num = parseFloat(amount) || 0
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}