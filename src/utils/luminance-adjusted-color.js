import luminance from './luminance'

export default function (color) {
  return luminance(color) > 0.179 ? '#000' : '#fff'
}
