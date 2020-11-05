import { assert } from 'chai'
import { beforeEach, describe, it } from 'mocha'
import { makeDom } from '../test-utils'
import * as d3 from 'd3'
import Patterns from '../../src/utils/patterns'
import Defs from '../../src/utils/defs'

describe('utils.Patterns', () => {
  beforeEach(makeDom)

  describe('.get()', () => {
    it('should return null for empty or solid pattern', () => {
      assert.equal(Patterns.get(), null)
      assert.equal(Patterns.get('solid'), null)
    })

    it('should create dashed mask only once', () => {
      Patterns.__test__._reset()
      Patterns.get('dashed')
      Patterns.get('dashed')
      assert.equal(document.getElementById(Patterns.__test__.TAGS.dashed.mask).innerHTML, `<rect x="-50%" y="-50%" width="100%" height="100%" fill="url(#${Patterns.__test__.TAGS.dashed.pattern})"></rect>`)
      assert.equal(d3.selectAll('#' + Patterns.__test__.TAGS.dashed.mask).size(), 1)
    })

    it('should create dashed pattern only once', () => {
      Patterns.__test__._reset()
      Patterns.get('dashed')
      assert.equal(document.getElementById(Patterns.__test__.TAGS.dashed.pattern).innerHTML, `<path d="m 0 0 h 4" stroke="#fff" stroke-width="4"></path>`)
      assert.equal(d3.selectAll('#' + Patterns.__test__.TAGS.dashed.pattern).size(), 1)
    })

    it('should create dotted mask only once', () => {
      Patterns.__test__._reset()
      Patterns.get('dotted')
      Patterns.get('dotted')
      assert.equal(document.getElementById(Patterns.__test__.TAGS.dotted.mask).innerHTML, `<rect x="-50%" y="-50%" width="100%" height="100%" fill="url(#${Patterns.__test__.TAGS.dotted.pattern})"></rect>`)
      assert.equal(d3.selectAll('#' + Patterns.__test__.TAGS.dotted.mask).size(), 1)
    })

    it('should create dotted pattern only once', () => {
      Patterns.__test__._reset()
      Patterns.get('dotted')
      assert.equal(document.getElementById(Patterns.__test__.TAGS.dotted.pattern).innerHTML, `<circle cx="2" cy="2" r="1.5" fill="#fff"></circle>`)
      assert.equal(d3.selectAll('#' + Patterns.__test__.TAGS.dotted.pattern).size(), 1)
    })
  })
})
