/**
 * Creates the composition factory of a base component and several additional components.
 *
 * @method compose
 * @param {Object} baseComponent Object representing the private and public members of the created base object.
 * @param {Function} components Factory functions for the additional components.
 * @returns {{self: Object, api: Object}} Object representing the private and public members of the composition object.
 */
export default (baseComponent, ...components) => {
    let { self, api } = baseComponent
    return components.reduce((obj, component) => {
        let {s, a} = component(obj.self, obj.api)
        return {
            self: Object.assign(self, s),
            api: Object.assign(api, a)
        }
    }, {self, api})
}
