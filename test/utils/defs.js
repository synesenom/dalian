import { assert } from 'chai'
import { beforeEach, describe, it } from 'mocha'
import { makeDom } from '../test-utils'
import * as d3 from 'd3'
import Defs from '../../src/utils/defs'

describe('utils.Defs', () => {
  beforeEach(makeDom)

  describe('.getDefs()', () => {
    it('should add defs only once', () => {
      Defs.__test__._reset()
      Defs.__test__.getDefs()
      Defs.__test__.getDefs()
      assert(document.getElementById(Defs.__test__.TAG) !== null)
      assert.equal(d3.selectAll('#' + Defs.__test__.TAG).size(), 1)
    })
  })

  describe('.addMask()', () => {
    it('should add mask', () => {
      Defs.__test__._reset()
      Defs.addMask('foo', {x: 0, y: 0}, {width: 8, height: 8})
      assert.equal(document.querySelector('svg defs').innerHTML, '<mask id="foo" x="0" y="0" width="8" height="8"></mask>')
    })

    it('should return mask selection', () => {
      Defs.__test__._reset()
      assert.deepEqual(Defs.addMask('foo', {x: 0, y: 0}, {width: 8, height: 8}), d3.select('svg defs mask'))
    })
  })

  describe('.addPattern()', () => {
    it('should add pattern', () => {
      Defs.__test__._reset()
      Defs.addPattern('foo', {x: 0, y: 0}, {width: 8, height: 8})
      assert.equal(document.querySelector('svg defs').innerHTML, '<pattern id="foo" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"></pattern>')
    })

    it('should return pattern selection', () => {
      Defs.__test__._reset()
      assert.deepEqual(Defs.addPattern('foo', {x: 0, y: 0}, {width: 8, height: 8}), d3.select('svg defs pattern'))
    })
  })
})
