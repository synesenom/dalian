export default (selection, attributes) => {
  for (let name in attributes) {
    if (attributes.hasOwnProperty(name)) {
      selection.attr(name, attributes[name])
    }
  }
  return selection
}
