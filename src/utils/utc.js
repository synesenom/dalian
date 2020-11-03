/**
 * Returns the UTC date for a specific year, month and date.
 *
 * @method fromYMD
 * @param {number} year Year.
 * @param {number} month Month.
 * @param {number} date Day of month.
 * @return {Date} The date in UTC.
 */
export function fromYMD (year, month, date) {
  return new Date(Date.UTC(year, month, date))
}

/**
 * Returns the UTC date for a specific ISO yyyy-MM-dd string.
 *
 * @method fromISO
 * @param {string} string String in yyyy-MM-dd representing the date to convert.
 * @return {Date} The date in UTC.
 */
export function fromISO (string) {
  const tokens = string.split('-')
  return fromYMD(parseInt(tokens[0]), parseInt(tokens[1]) - 1, parseInt(tokens[2]))
}
