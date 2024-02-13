/* eslint-disable max-len */

import { compile as compile_ } from '@html-to-text/base';
import * as genericFormatters from '@html-to-text/base/src/generic-formatters';
import { mergeDuplicatesPreferLast } from '@html-to-text/base/src/util';
import merge from 'deepmerge'; // default

import * as markdownFormatters from './md-formatters';

// eslint-disable-next-line import/no-unassigned-import
import '@html-to-text/base/src/typedefs';


/**
 * Default options.
 *
 * @constant
 * @type { Options }
 * @default
 * @private
 */
const DEFAULT_OPTIONS = {
  baseElements: {
    selectors: ['body'],
    orderBy: 'selectors', // 'selectors' | 'occurrence'
    returnDomByDefault: true
  },
  decodeEntities: false,
  encodeCharacters: {

  },
  formatters: {},
  limits: {
    ellipsis: '...',
    maxBaseElements: undefined,
    maxChildNodes: undefined,
    maxDepth: undefined,
  },
  selectors: [
    { selector: '*', format: 'inline', options: { ignoreHref: true, noAnchorUrl: true, linkBrackets: false, suffix: ' ', prefix: 'poop' } },
    { selector: 'a', format: 'anchor', options: { ignoreHref: true, noAnchorUrl: true, linkBrackets: false, suffix: ' ' } },
    { selector: 'article', format: 'block', options: { ignoreHref: true, noAnchorUrl: true, linkBrackets: false, suffix: ' ' } },
    { selector: 'aside', format: 'block', options: { ignoreHref: true, noAnchorUrl: true, linkBrackets: false, suffix: ' ' } },
    { selector: 'b', format: 'inlineSurround', options: { ignoreHref: true, prefix: '**', suffix: '**', linkBrackets: false, noAnchorUrl: true, suffix: ' ' } },
    { selector: 'blockquote', format: 'blockquote', options: { trimEmptyLines: true, ignoreHref: true, linkBrackets: false, noAnchorUrl: true, suffix: ' ' } },
    { selector: 'br', format: 'inlineString', options: { string: '<br>', ignoreHref: true, linkBrackets: false, noAnchorUrl: true, suffix: ' ' } },
    { selector: 'code', format: 'inlineSurround', options: { prefix: '`', suffix: '`', ignoreHref: true, linkBrackets: false, noAnchorUrl: true, suffix: ' ' } },
    { selector: 'del', format: 'inlineSurround', options: { prefix: '~~', suffix: '~~', ignoreHref: true, linkBrackets: false, noAnchorUrl: true, suffix: ' ' } },
    { selector: 'div', format: 'block', options: { ignoreHref: true, linkBrackets: false, noAnchorUrl: true } },
    { selector: 'div.aria-label', format: 'heading' },
    { selector: 'dl', format: 'definitionList', options: { ignoreHref: true, linkBrackets: false, noAnchorUrl: true, suffix: ' ' } },
    { selector: 'em', format: 'inlineSurround', options: { prefix: '*', suffix: '*', ignoreHref: true, linkBrackets: false, noAnchorUrl: true, suffix: ' ' } },
    { selector: 'figure', format: 'block', options: { ignoreHref: true, linkBrackets: false, noAnchorUrl: true, suffix: ' ' } },
    { selector: 'figcaption', format: 'block', options: { ignoreHref: true, linkBrackets: false, noAnchorUrl: true, suffix: ' ' } },
    { selector: 'footer', format: 'block', options: { ignoreHref: true, linkBrackets: false, noAnchorUrl: true, suffix: ' ' } },
    { selector: 'form', format: 'block', options: { ignoreHref: true, linkBrackets: false, noAnchorUrl: true, suffix: ' ' } },
    { selector: 'h1', format: 'heading', options: { level: 1, ignoreHref: true, linkBrackets: false, noAnchorUrl: true, suffix: ' ' } },
    { selector: 'h2', format: 'heading', options: { level: 2, ignoreHref: true, linkBrackets: false, noAnchorUrl: true, suffix: ' ' } },
    { selector: 'h3', format: 'heading', options: { level: 3, ignoreHref: true, linkBrackets: false, noAnchorUrl: true, suffix: ' ' } },
    { selector: 'h4', format: 'heading', options: { level: 4, ignoreHref: true, linkBrackets: false, noAnchorUrl: true, suffix: ' ' } },
    { selector: 'h5', format: 'heading', options: { level: 5, ignoreHref: true, linkBrackets: false, noAnchorUrl: true, suffix: ' ' } },
    { selector: 'h6', format: 'heading', options: { level: 6, ignoreHref: true, linkBrackets: false, noAnchorUrl: true, suffix: ' ' } },
    { selector: 'header', format: 'block', options: { ignoreHref: true, linkBrackets: false, noAnchorUrl: true, suffix: ' ' } },
    { selector: 'hr', format: 'blockString', options: { string: '----' }, ignoreHref: true, linkBrackets: false, noAnchorUrl: true, suffix: ' ' },
    { selector: 'i', format: 'inlineSurround', options: { prefix: '*', suffix: '*', ignoreHref: true, linkBrackets: false, noAnchorUrl: true, suffix: ' ' } },
    { selector: 'img', format: 'skip', options: { ignoreHref: true, linkBrackets: false, noAnchorUrl: true, suffix: ' ' } },
    { selector: 'kbd', format: 'inlineTag', options: { ignoreHref: true, linkBrackets: false, noAnchorUrl: true, suffix: ' ' } },
    { selector: 'main', format: 'block', options: { ignoreHref: true, linkBrackets: false, noAnchorUrl: true, suffix: ' ' } },
    { selector: 'nav', format: 'block', options: { ignoreHref: true, linkBrackets: false, noAnchorUrl: true, suffix: ' ' } },
    { selector: 'ol', format: 'orderedList', options: { interRowLineBreaks: 1, ignoreHref: true, linkBrackets: false, noAnchorUrl: true, suffix: ' ' } },
    { selector: 'p', format: 'block', options: { ignoreHref: true, linkBrackets: false, noAnchorUrl: true, suffix: ' ' } },
    { selector: 'picture', format: 'inline', options: { ignoreHref: true, linkBrackets: false, noAnchorUrl: true, suffix: ' ' } },
    { selector: 'pre', format: 'pre', options: { ignoreHref: true, linkBrackets: false, noAnchorUrl: true, suffix: ' ' } },
    { selector: 's', format: 'inlineSurround', options: { prefix: '~~', suffix: '~~', ignoreHref: true, linkBrackets: false, noAnchorUrl: true, suffix: ' ' } },
    { selector: 'section', format: 'block', options: { ignoreHref: true, linkBrackets: false, noAnchorUrl: true, suffix: ' ' } },
    { selector: 'source', format: 'skip', options: { ignoreHref: true, linkBrackets: false, noAnchorUrl: true, suffix: ' ' } },
    { selector: 'strong', format: 'inlineSurround', options: { prefix: '**', suffix: '**', ignoreHref: true, linkBrackets: false, noAnchorUrl: true, suffix: ' ' } },
    { selector: 'sub', format: 'inlineTag', options: { ignoreHref: true, linkBrackets: false, noAnchorUrl: true, suffix: ' ' } },
    { selector: 'sup', format: 'inlineTag', options: { ignoreHref: true, linkBrackets: false, noAnchorUrl: true, suffix: ' ' } },
    { selector: 'table', format: 'dataTable', options: { ignoreHref: true, linkBrackets: false, noAnchorUrl: true, suffix: ' ' } },
    { selector: 'ul', format: 'unorderedList', options: { marker: '-', interRowLineBreaks: 1, ignoreHref: true, linkBrackets: false, noAnchorUrl: true, suffix: ' ' } },
    { selector: 'wbr', format: 'wbr', options: { ignoreHref: true, linkBrackets: false, noAnchorUrl: true, suffix: ' ' } },
  ],
  whitespaceCharacters: ' \t\r\n\f\u200b',
  wordwrap: 80
};


const concatMerge = (acc, src, options) => [...acc, ...src];
const overwriteMerge = (acc, src, options) => [...src];
const selectorsMerge = (acc, src, options) => (
  (acc.some(s => typeof s === 'object'))
    ? concatMerge(acc, src, options) // selectors
    : overwriteMerge(acc, src, options) // baseElements.selectors
);

/**
 * Preprocess options, compile selectors into a decision tree,
 * return a function intended for batch processing.
 *
 * @param   { Options } [options = {}]   HtmlToText options.
 * @returns { (html: string, metadata?: any) => string } Pre-configured converter function.
 * @static
 */
function compile(options = {}) {
  options = merge(
    DEFAULT_OPTIONS,
    options,
    {
      arrayMerge: overwriteMerge,
      customMerge: (key) => ((key === 'selectors') ? selectorsMerge : undefined)
    }
  );
  options.formatters = Object.assign({}, genericFormatters, markdownFormatters, options.formatters);
  options.selectors = mergeDuplicatesPreferLast(options.selectors, (s => s.selector));
  return compile_(options);
}

/**
 * Convert given HTML content to a markdown string.
 *
 * @param   { string }  html           HTML content to convert.
 * @param   { Options } [options = {}] HtmlToText options.
 * @param   { any }     [metadata]     Optional metadata for HTML document, for use in formatters.
 * @returns { string }                 Plain text string.
 * @static
 *
 * @example
 * const { convert } = require('html-to-text');
 * const text = convert('<h1>Hello World</h1>', {});
 * console.log(text); // # Hello World
 */
function convert(html, options = {}, metadata = undefined) {
  return compile(options)(html, metadata);
}

export {
  compile,
  convert,
  convert as htmlToMarkdown
};
