import { assert } from 'chai'
import { describe, it } from 'mocha'
import extend from '../../src/core/extend'

describe('core.extend()', () => {
  it('should add callback after original method', () => {
    let a = 3
    extend(x => {
      a *= x
    }, x => {
      a += x
    })(2)
    assert.equal(a, 8)
  })

  it('should add callback before original method', () => {
    let a = 3
    extend(x => {
      a *= x
    }, x => {
      a += x
    }, true)(2)
    assert.equal(a, 10)
  })
})
