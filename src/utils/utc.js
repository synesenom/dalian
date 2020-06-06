export const utcFromYMD = (year, month, date) => new Date(Date.UTC(year, month, date))

export const utcFromISO = string => {
  const tokens = string.split('-')
  return utcFromYMD(parseInt(tokens[0]), parseInt(tokens[1]) - 1, parseInt(tokens[2]))
}
