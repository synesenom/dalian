import { assert } from 'chai'
import { beforeEach, describe, it } from 'mocha'
import { makeDom } from '../test-utils'
import * as d3 from 'd3'
import defs from '../../src/utils/defs'

describe('utils.defs()', () => {
  beforeEach(makeDom)

  it('should add an SVG only once to the body', () => {
    defs()
    defs()
    defs()
    assert.equal(d3.select('svg').empty(), false)
    assert.equal(d3.selectAll('svg').size(), 1)
  })
})
