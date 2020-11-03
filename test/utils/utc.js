import { assert } from 'chai'
import { describe, it } from 'mocha'
import * as utc from '../../src/utils/utc'

describe('utils.utc', () => {
  describe('.fromYMD()', () => {
    it('should convert a year-month-date to UTC date', () => {
      assert.equal(utc.fromYMD(2020, 3, 28).toISOString().substr(0, 10), '2020-04-28')
    })
  })

  describe('.fromISO()', () => {
    it('should convert an ISO date to UTC date', () => {
      assert.equal(utc.fromISO('2020-03-26').toISOString().substr(0, 10), '2020-03-26')
    })
  })
})
