export const unrotate = (arr, shift) => arr.slice(shift).concat(arr.slice(0, shift))
