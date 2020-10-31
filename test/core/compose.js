import { assert } from 'chai'
import { describe, it } from 'mocha'
import compose from '../../src/core/compose'

describe('core.compose()', () => {
  it('should compose mixin from components', () => {
    assert.deepEqual(compose({
        self: {
          foo: 2
        },
        api: {
          bar: 'hello'
        }
    }, (self, api) => {
        self.foo2 = 3
        api.bar2 = 'world'
        return {self, api}
    }, (self, api) => {
        self.foo3 = 4
        api.bar3 = '!'
        return {self, api}
    }), {
      self: {
        foo: 2,
        foo2: 3,
        foo3: 4
      },
      api: {
        bar: 'hello',
        bar2: 'world',
        bar3: '!'
      }
    })
  })
})
