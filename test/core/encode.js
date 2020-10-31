import { assert } from 'chai'
import { describe, it } from 'mocha'
import encode from '../../src/core/encode'

describe('core.encode()', () => {
  it('should encode an empty string as "da"', () => {
    [
      ['', 'da'],
      ['Hello non-unicode! My name is 大连!', 'da-hello_nonU1d-unicodeU11-_my_name_is_Um97-U13uu-U11-']
    ].forEach(([input, output]) => {
      assert.equal(encode(input), output)
    })
  })
})
