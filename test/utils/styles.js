import { assert } from 'chai'
import { beforeEach, describe, it } from 'mocha'
import { addElem, makeDom } from '../test-utils'
import * as d3 from 'd3'
import styles from '../../src/utils/styles'

beforeEach(makeDom)

describe('utils.styles()', () => {
  it('should set multiple styles to a selection', () => {
    addElem()
    styles(d3.select('#el'), {
      color: 'red',
      padding: '10px'
    })
    assert.equal(d3.select('#el').style('color'), 'red')
    assert.equal(d3.select('#el').style('padding'), '10px')
  })
})
