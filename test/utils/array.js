import { assert } from 'chai'
import { describe, it } from 'mocha'
import * as array from '../../src/utils/array'

describe('utils.array', () => {
  describe('.unrotate()', () => {
    it('should rotate the array backwards', () => {
      assert.deepEqual(array.unrotate([1, 2, 3, 4, 5], 2), [3, 4, 5, 1, 2])
    })
  })
})
