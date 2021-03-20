const a = document.createElement('a')

/**
 * Downloads some data.
 *
 * @method download
 * @param {string} data Data to download in string format.
 * @param {string} name file name to download under.
 * @param {string} format File format.
 */
export default (data, name, format) => {
  // Set content and action.
  a.download = `${name}.${format}`
  a.href = data

  // Add to body, click on it and remove from body.
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
