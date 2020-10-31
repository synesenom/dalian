/**
 * Rotates an array backwards.
 *
 * @method unrotate
 * @param {Array} arr Array to un-rotate.
 * @param {number} shift Length of the rotation.
 * @return {Array} The rotated array.
 */
export const unrotate = (arr, shift) => arr.slice(shift).concat(arr.slice(0, shift))
