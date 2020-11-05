import { assert } from 'chai'
import { before, beforeEach, describe, it } from 'mocha'
import { makeDom } from '../test-utils'
import * as d3 from 'd3'
import StyleInjector from '../../src/utils/style-injector'

describe('utils.StyleInjector', () => {
  before(makeDom)
  beforeEach(() => {
    document.head.innerHTML = ''
  })

  describe('.getContainer()', () => {
    it('should add style to head', () => {
      StyleInjector.__test__._reset()
      StyleInjector.__test__.getContainer()
      StyleInjector.__test__.getContainer()
      assert(document.getElementById(StyleInjector.__test__.TAG) !== null)
      assert.equal(d3.selectAll('#' + StyleInjector.__test__.TAG).size(), 1)
    })
  })

  describe('.getMarker()', () => {
    it('should return the right marker', () => {
      assert.equal(StyleInjector.__test__.getMarker(), '.')
      assert.equal(StyleInjector.__test__.getMarker('class'), '.')
      assert.equal(StyleInjector.__test__.getMarker('id'), '#')
    })
  })

  describe('.buildEntry()', () => {
    it('should build a class entry', () => {
      assert.equal(StyleInjector.__test__.buildEntry('.foo', {color: 'red', 'background-color': 'orange'}), '.foo{color:red;background-color:orange}')
    })

    it('should build an identifier entry', () => {
      assert.equal(StyleInjector.__test__.buildEntry('#foo', {color: 'red', 'background-color': 'orange'}), '#foo{color:red;background-color:orange}')
    })
  })

  describe('.addStyle()', () => {
    it('should append class entry to styles if type is not specified', () => {
      StyleInjector.__test__._reset()
      StyleInjector.__test__.addStyle('foo', {color: 'red', 'background-color': 'orange'})
      assert.equal(document.getElementById(StyleInjector.__test__.TAG).textContent, '.foo{color:red;background-color:orange}')
    })

    it('should do nothing if style is added', () => {
      StyleInjector.__test__._reset()
      StyleInjector.__test__.addStyle('foo', {color: 'red', 'background-color': 'orange'})
      StyleInjector.__test__.addStyle('foo', {color: 'green', 'background-color': 'blue'})
      assert.equal(document.getElementById(StyleInjector.__test__.TAG).textContent, '.foo{color:red;background-color:orange}')
    })
  })

  describe('.updateStyle()', () => {
    it('should do nothing if selector does not exist', () => {
      StyleInjector.__test__._reset()
      StyleInjector.__test__.addStyle('foo', {color: 'red', 'background-color': 'orange'})
      StyleInjector.__test__.updateStyle('bar', {color: 'green', 'background-color': 'blue'})
      assert.equal(document.getElementById(StyleInjector.__test__.TAG).textContent, '.foo{color:red;background-color:orange}')
    })

    it('should update existing style', () => {
      StyleInjector.__test__._reset()
      StyleInjector.__test__.addStyle('foo', {color: 'red', 'background-color': 'orange'})
      StyleInjector.__test__.updateStyle('foo', {color: 'green', 'background-color': 'blue'})
      assert.equal(document.getElementById(StyleInjector.__test__.TAG).textContent, '.foo{color:green;background-color:blue}')
    })
  })

  describe('.addClass()', () => {
    it('should add class', () => {
      StyleInjector.__test__._reset()
      StyleInjector.addClass('foo', {
        color: 'red',
        'background-color': 'orange'
      })
      StyleInjector.addClass('bar', {
        color: 'green',
        'background-color': 'blue'
      })
      assert.equal(document.getElementById(StyleInjector.__test__.TAG).textContent, '.foo{color:red;background-color:orange}.bar{color:green;background-color:blue}')
    })
  })

  describe('.updateClass()', () => {
    it('should update class', () => {
      StyleInjector.__test__._reset()
      StyleInjector.addClass('foo', {
        color: 'red',
        'background-color': 'orange'
      })
      StyleInjector.updateClass('foo', {
        color: 'green',
        'background-color': 'blue'
      })
      assert.equal(document.getElementById(StyleInjector.__test__.TAG).textContent, '.foo{color:green;background-color:blue}')
    })
  })

  describe('.addId()', () => {
    it('should add identifier', () => {
      StyleInjector.__test__._reset()
      StyleInjector.addId('foo', {
        color: 'red',
        'background-color': 'orange'
      })
      StyleInjector.addId('bar', {
        color: 'green',
        'background-color': 'blue'
      })
      assert.equal(document.getElementById(StyleInjector.__test__.TAG).textContent, '#foo{color:red;background-color:orange}#bar{color:green;background-color:blue}')
    })
  })

  describe('.updateId()', () => {
    it('should update identifier', () => {
      StyleInjector.__test__._reset()
      StyleInjector.addId('foo', {
        color: 'red',
        'background-color': 'orange'
      })
      StyleInjector.updateId('foo', {
        color: 'green',
        'background-color': 'blue'
      })
      assert.equal(document.getElementById(StyleInjector.__test__.TAG).textContent, '#foo{color:green;background-color:blue}')
    })
  })
})
