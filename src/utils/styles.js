export default (selection, styles) => {
  for (const name in styles) {
    if (Object.prototype.hasOwnProperty.call(styles, name)) {
      selection.style(name, styles[name])
    }
  }
  return selection
}
