import {JSDOM} from 'jsdom'
import * as d3 from 'd3'

export function addElem () {
  d3.select('body').append('div')
    .attr('id', 'el')
}

export function makeDom () {
  // Create DOM.
  const dom = new JSDOM('<html><body></body></html>')
  global['window'] = dom.window
  global['document'] = dom.window.document
}

export function cleanDom () {
  document.head.innerHTML = ''
  document.body.innerHTML = ''
}