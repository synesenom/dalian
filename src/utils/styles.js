export default (selection, styles) => {
  for (let name in styles) {
    if (styles.hasOwnProperty(name)) {
      selection.style(name, styles[name])
    }
  }
  return selection
}
