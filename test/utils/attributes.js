import { assert } from 'chai'
import { beforeEach, describe, it } from 'mocha'
import { addElem, makeDom } from '../test-utils'
import * as d3 from 'd3'
import attributes from '../../src/utils/attributes'

beforeEach(makeDom)

describe('utils.attributes()', () => {
  it('should set multiple attributes to a selection', () => {
    addElem()
    attributes(d3.select('#el'), {
      lang: 'fr',
      title: 'Foo'
    })
    assert.equal(d3.select('#el').attr('lang'), 'fr')
    assert.equal(d3.select('#el').attr('title'), 'Foo')
  })
})
