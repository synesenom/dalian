import { assert } from 'chai'
import { describe, it } from 'mocha'
import unrotate from '../../src/utils/unrotate'

describe('utils.unrotate()', () => {
  it('should rotate the array backwards', () => {
    assert.deepEqual(unrotate([1, 2, 3, 4, 5], 2), [3, 4, 5, 1, 2])
  })
})
