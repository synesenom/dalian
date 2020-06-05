export default (selection, attributes) => {
  for (const name in attributes) {
    if (Object.prototype.hasOwnProperty.call(attributes, name)) {
      selection.attr(name, attributes[name])
    }
  }
  return selection
}
