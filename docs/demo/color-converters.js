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
};

const converters = {
  normal: v => v,
  protanopia: v => convertColor(v, 'protan'),
  protanomaly: v => anomylize(v, convertColor(v, 'protan')),
  deuteranopia: v => convertColor(v, 'deutan'),
  deuteranomaly: v => anomylize(v, convertColor(v, 'deutan')),
  tritanopia: v => convertColor(v, 'tritan'),
  tritanomaly: v => anomylize(v, convertColor(v, 'tritan')),
  achromatopsia: v => monochrome(v),
  achromatomaly: v => anomylize(v, monochrome(v))
};

const rgb2xyz = c => ({
  x: 0.430574 * c.r + 0.341550 * c.g + 0.178325 * c.b,
  y: 0.222015 * c.r + 0.706655 * c.g + 0.071330 * c.b,
  z: 0.020183 * c.r + 0.129553 * c.g + 0.939180 * c.b
})

const xyz2rgb = c => ({
  r: 3.063218 * c.x - 1.393325 * c.y - 0.475802 * c.z,
  g: -0.969243 * c.x + 1.875966 * c.y + 0.041555 * c.z,
  b: 0.067871 * c.x - 0.228834 * c.y + 1.069251 * c.z
})

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

  let adj = {
    r: d.r ? ((s.r < 0 ? 0 : 1) - s.r) / d.r : 0,
    g: d.g ? ((s.g < 0 ? 0 : 1) - s.g) / d.g : 0,
    b: d.b ? ((s.b < 0 ? 0 : 1) - s.b) / d.b : 0
  }

  let adjust = Math.max(
    ((adj.r > 1 || adj.r < 0) ? 0 : adj.r),
    ((adj.g > 1 || adj.g < 0) ? 0 : adj.g),
    ((adj.b > 1 || adj.b < 0) ? 0 : adj.b))

  s.r = s.r + (adjust * d.r)
  s.g = s.g + (adjust * d.g)
  s.b = s.b + (adjust * d.b)

  const z = v => 255 * (v <= 0 ? 0 : v >= 1 ? 1 : Math.pow(v, 1 / gamma))

  return d3.rgb(z(s.r), z(s.g), z(s.b))
}

function anomylize (a, b) {
  let v = 1.75
  let d = v + 1

  return d3.rgb(
    (v * b.r + a.r) / d,
    (v * b.g + a.g) / d,
    (v * b.b + a.b) / d
  );
}

function monochrome (color) {
  let z = Math.round(color.r * 0.299 + color.g * 0.587 + color.b * 0.114)
  return d3.rgb(z, z, z)
}
