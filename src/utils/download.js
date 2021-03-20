const a = document.createElement('a')

// TODO Docstring.
export default (data, name, format) => {
  // Set content and action.
  a.download = `${name}.${format}`
  a.href = data

  // Add to body, click on it and remove from body.
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
