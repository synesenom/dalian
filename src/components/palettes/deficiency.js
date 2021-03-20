import { rgb } from 'd3'

// TODO Docstring.
const coefficients = {
  protan: {
    cpu: 0.735, cpv: 0.265, am: 1.273463, ayi: -0.073894
  },
  deutan: {
    cpu: 1.14, cpv: -0.14, am: 0.968437, ayi: 0.003331
  },
  tritan: {
    cpu: 0.171, cpv: -0.003, am: 0.062921, ayi: 0.292119
  }
}

// TODO Docstring.
function rgb2xyz (rgb) {
  return {
    x: 0.430574 * rgb.r + 0.341550 * rgb.g + 0.178325 * rgb.b,
    y: 0.222015 * rgb.r + 0.706655 * rgb.g + 0.071330 * rgb.b,
    z: 0.020183 * rgb.r + 0.129553 * rgb.g + 0.939180 * rgb.b
  }
}

// TODO Docstring.
function xyz2rgb (xyz) {
  return {
    r: 3.063218 * xyz.x - 1.393325 * xyz.y - 0.475802 * xyz.z,
    g: -0.969243 * xyz.x + 1.875966 * xyz.y + 0.041555 * xyz.z,
    b: 0.067871 * xyz.x - 0.228834 * xyz.y + 1.069251 * xyz.z
  }
}

// TODO Docstring.
function anomaly (a, b) {
  let v = 1.75
  let d = v + 1

  return rgb((v * b.r + a.r) / d, (v * b.g + a.g) / d, (v * b.b + a.b) / d)
}

// TODO Docstring.
function monochrome (color) {
  let z = Math.round(color.r * 0.299 + color.g * 0.587 + color.b * 0.114)
  return rgb(z, z, z)
}

// TODO Docstring.
function convertColor (color, type) {
  let gamma = 2.2
  let wx = 0.312713
  let wy = 0.329016
  let wz = 0.358271

  let c = {
    r: Math.pow(color.r / 255, gamma),
    g: Math.pow(color.g / 255, gamma),
    b: Math.pow(color.b / 255, gamma)
  }
  c = rgb2xyz(c)

  const sum_xyz = c.x + c.y + c.z
  c.u = 0
  c.v = 0

  if (sum_xyz !== 0) {
    c.u = c.x / sum_xyz
    c.v = c.y / sum_xyz
  }

  let nx = wx * c.y / wy
  let nz = wz * c.y / wy
  let clm
  let d = {}
  d.y = 0

  if (c.u < coefficients[type].cpu) {
    clm = (coefficients[type].cpv - c.v) / (coefficients[type].cpu - c.u)
  } else {
    clm = (c.v - coefficients[type].cpv) / (c.u - coefficients[type].cpu)
  }

  let clyi = c.v - c.u * clm
  d.u = (coefficients[type].ayi - clyi) / (clm - coefficients[type].am)
  d.v = (clm * d.u) + clyi

  let s = {
    x: d.u * c.y / d.v,
    y: c.y,
    z: (1 - (d.u + d.v)) * c.y / d.v
  }

  d.x = nx - s.x
  d.z = nz - s.z
  d = xyz2rgb(d)
  s = xyz2rgb(s)

  const adj = {
    r: d.r ? ((s.r < 0 ? 0 : 1) - s.r) / d.r : 0,
    g: d.g ? ((s.g < 0 ? 0 : 1) - s.g) / d.g : 0,
    b: d.b ? ((s.b < 0 ? 0 : 1) - s.b) / d.b : 0
  }

  const adjust = Math.max(
    ((adj.r > 1 || adj.r < 0) ? 0 : adj.r),
    ((adj.g > 1 || adj.g < 0) ? 0 : adj.g),
    ((adj.b > 1 || adj.b < 0) ? 0 : adj.b))

  s.r = s.r + (adjust * d.r)
  s.g = s.g + (adjust * d.g)
  s.b = s.b + (adjust * d.b)

  const z = v => 255 * (v <= 0 ? 0 : v >= 1 ? 1 : Math.pow(v, 1 / gamma))

  return rgb(
    z(s.r),
    z(s.g),
    z(s.b)
  )
}

// TODO Docstring.
const converters = {
  protanopia: color => convertColor(color, 'protan'),
  protanomaly: color => anomaly(color, convertColor(color, 'protan')),
  deuteranopia: color => convertColor(color, 'deutan'),
  deuteranomaly: color => anomaly(color, convertColor(color, 'deutan')),
  tritanopia: color => convertColor(color, 'tritan'),
  tritanomaly: color => anomaly(color, convertColor(color, 'tritan')),
  achromatopsia: color => monochrome(color),
  achromatomaly: color => anomaly(color, monochrome(color))
}

// TODO Docstring.
export default type => {
  if (typeof converters[type] === 'undefined') {
    return color => color
  } else {
    return color => {
      return converters[type](rgb(color))
    }
  }
}
