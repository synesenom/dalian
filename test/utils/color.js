import { assert } from 'chai'
import { describe, it } from 'mocha'
import * as color from '../../src/utils/color'

describe('utils.color', () => {
  describe('.brightness()', () => {
    it('should return the correct brightness value', () => {
      // rgb(65, 105, 225)
      assert.equal(color.brightness('royalblue').toFixed(2), '102.17')
      // rgb(218, 165, 32)
      assert.equal(color.brightness('goldenrod').toFixed(2), '150.42')
      // rgb(154, 205, 50)
      assert.equal(color.brightness('yellowgreen').toFixed(2), '161.30')
    })
  })

  describe('.lighter()', () => {
    it('should return a lighter color', () => {
      assert.equal(color.lighter('royalblue', 0.6).toString(), 'rgb(179, 195, 243)')
      assert.equal(color.lighter('goldenrod', 0.6).toString(), 'rgb(242, 220, 164)')
      assert.equal(color.lighter('yellowgreen', 0.6).toString(), 'rgb(215, 235, 173)')
    })

    it('should return a lighter color with default factor', () => {
      assert.equal(color.lighter('yellowgreen').toString(), 'rgb(194, 225, 132)')
    })
  })

  describe('.backgroundAdjustedColor()', () => {
    it('should return white for dark colors', () => {
      [
        'darkblue',
        'dimgray',
        'royalblue'
      ].forEach(d => {
        assert.equal(color.backgroundAdjustedColor(d), '#fff')
      })
    })

    it('should return black for light colors', () => {
      [
        'mintcream',
        'cornsilk',
        'gainsboro'
      ].forEach(d => {
        assert.equal(color.backgroundAdjustedColor(d), '#000')
      })
    })
  })
})
