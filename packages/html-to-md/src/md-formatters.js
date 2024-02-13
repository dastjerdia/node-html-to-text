
import { get, trimCharacter, trimCharacterEnd } from '@html-to-text/base/src/util';
import { render } from 'dom-serializer';
import { existsOne, innerText } from 'domutils';

import { tableToString } from './table-printer';

// eslint-disable-next-line import/no-unassigned-import
import '@html-to-text/base/src/typedefs';


/**
 * Process a `wbr` tag (word break opportunity).
 *
 * @type { FormatCallback }
 */
function formatWbr(elem, walk, builder, formatOptions) {
  builder.addWordBreakOpportunity();
}

/**
 * Process a preformatted content.
 *
 * @type { FormatCallback }
 */
function formatPre(elem, walk, builder, formatOptions) {
  builder.openBlock({
    isPre: true,
    leadingLineBreaks: formatOptions.leadingLineBreaks || 2,
    reservedLineLength: 2
  });
  walk(elem.children, builder);
  builder.closeBlock({
    trailingLineBreaks: formatOptions.trailingLineBreaks || 2,
    blockTransform: str => str
      .split('\n')
      .map(line => '    ' + line)
      .join('\n')
  });
}

/**
 * Process a heading.
 *
 * @type { FormatCallback }
 */
function formatHeading(elem, walk, builder, formatOptions) {
  builder.openBlock({ leadingLineBreaks: formatOptions.leadingLineBreaks || 2 });
  builder.addLiteral('#'.repeat(formatOptions.level || 1) + ' ');
  walk(elem.children, builder);
  builder.closeBlock({ trailingLineBreaks: formatOptions.trailingLineBreaks || 2 });
}

/**
 * Process a blockquote.
 *
 * @type { FormatCallback }
 */
function formatBlockquote(elem, walk, builder, formatOptions) {
  builder.openBlock({
    leadingLineBreaks: formatOptions.leadingLineBreaks || 2,
    reservedLineLength: 2
  });
  walk(elem.children, builder);
  builder.closeBlock({
    trailingLineBreaks: formatOptions.trailingLineBreaks || 2,
    blockTransform: str => ((formatOptions.trimEmptyLines !== false) ? trimCharacter(str, '\n') : str)
      .split('\n')
      .map(line => '> ' + line)
      .join('\n')
  });
}

/**
 * Render code block.
 *
 * @type { FormatCallback }
 */
function formatCodeBlock(elem, walk, builder, formatOptions) {
  builder.openBlock({ leadingLineBreaks: formatOptions.leadingLineBreaks || 2 });
  builder.addLiteral('```' + (formatOptions.language || '') + '\n');
  walk(elem.children, builder);
  builder.addLiteral('\n```');
  builder.closeBlock({ trailingLineBreaks: formatOptions.trailingLineBreaks || 2 });
}

function pathRewrite(path, rewriter, baseUrl, metadata, elem) {
  const modifiedPath = (typeof rewriter === 'function')
    ? rewriter(path, metadata, elem)
    : path;
  return (modifiedPath[0] === '/' && baseUrl)
    ? trimCharacterEnd(baseUrl, '/') + modifiedPath
    : modifiedPath;
}

/**
 * Process an image.
 *
 * @type { FormatCallback }
 */
function formatImage(elem, walk, builder, formatOptions) {
  const attribs = elem.attribs || {};
  if (attribs.src && attribs.src.startsWith('data:')) {
    builder.startNoWrap();
    builder.addInline(
      render(elem, { decodeEntities: builder.options.decodeEntities }),
      { noWordTransform: true }
    );
    builder.stopNoWrap();
    return;
  }
  const src = (!attribs.src)
    ? ''
    : pathRewrite(attribs.src, formatOptions.pathRewrite, formatOptions.baseUrl, builder.metadata, elem);
  builder.startNoWrap();
  builder.addLiteral(`![`);
  builder.addInline(attribs.alt || '');
  builder.addLiteral(`](`);
  builder.addInline(src, { noWordTransform: true });
  if (attribs.title) {
    builder.addLiteral(` "`);
    builder.addInline(attribs.title);
    builder.addLiteral(`"`);
  }
  builder.addLiteral(`)`);
  builder.stopNoWrap();
}

/**
 * Process a link/anchor.
 *
 * @type { FormatCallback }
 */
function formatAnchor(elem, walk, builder, formatOptions) {
  const attribs = elem.attribs || {};
  if (attribs.name && !attribs.href) {
    builder.startNoWrap();
    builder.addInline(
      render(elem, { decodeEntities: builder.options.decodeEntities }),
      { noWordTransform: true }
    );
    builder.stopNoWrap();
    return;
  }
  const text = innerText(elem);
  builder.startNoWrap();
  walk(elem.children, builder);
  if (attribs.title) {
    builder.addLiteral(` "`);
    builder.addInline(attribs.title);
    builder.addLiteral(`"`);
  }
  builder.stopNoWrap();
}

/**
 * @param { DomNode }           elem               List items with their prefixes.
 * @param { RecursiveCallback } walk               Recursive callback to process child nodes.
 * @param { BlockTextBuilder }  builder            Passed around to accumulate output text.
 * @param { FormatOptions }     formatOptions      Options specific to a formatter.
 * @param { () => string }      nextPrefixCallback Function that returns increasing index each time it is called.
 */
function formatList(elem, walk, builder, formatOptions, nextPrefixCallback) {
  const isNestedList = get(elem, ['parent', 'name']) === 'li';

  // With Roman numbers, index length is not as straightforward as with Arabic numbers or letters,
  // so the dumb length comparison is the most robust way to get the correct value.
  let maxPrefixLength = 0;
  const listItems = (elem.children || [])
    // it might be more accurate to check only for html spaces here, but no significant benefit
    .filter(child => child.type !== 'text' || !/^\s*$/.test(child.data))
    .map(function (child) {
      if (child.name !== 'li') {
        return { node: child, prefix: ' ' };
      }
      const prefix = (isNestedList)
        ? nextPrefixCallback().trimStart()
        : nextPrefixCallback();
      if (prefix.length > maxPrefixLength) { maxPrefixLength = prefix.length; }
      return { node: child, prefix: prefix };
    });
  if (!listItems.length) { return; }

  builder.openList({
    interRowLineBreaks: formatOptions.interRowLineBreaks || 1,
    leadingLineBreaks: isNestedList ? 1 : (formatOptions.leadingLineBreaks || 2),
    maxPrefixLength: maxPrefixLength,
    prefixAlign: 'left'
  });

  for (const { node, prefix } of listItems) {
    builder.openListItem({ prefix: prefix });
    walk([node], builder);
    builder.closeListItem();
  }

  builder.closeList({ trailingLineBreaks: isNestedList ? 1 : (formatOptions.trailingLineBreaks || 2) });
}

/**
 * Process an unordered list.
 *
 * @type { FormatCallback }
 */
function formatUnorderedList(elem, walk, builder, formatOptions) {
  const prefix = (formatOptions.marker || '-') + ' '; // can be any of [-*+]
  return formatList(elem, walk, builder, formatOptions, () => prefix);
}

/**
 * Process an ordered list.
 *
 * @type { FormatCallback }
 */
function formatOrderedList(elem, walk, builder, formatOptions) {
  let nextIndex = Number(formatOptions.start || elem.attribs.start || '1');
  const nextPrefixCallback = () => `${nextIndex++}. `;
  return formatList(elem, walk, builder, formatOptions, nextPrefixCallback);
}

function collectDefinitionGroups(elem) {
  const defItems = [];
  function handleDtDd(el) {
    if (el.name === 'dt' || el.name === 'dd') {
      defItems.push(el);
    }
  }
  for (const child of (elem.children || [])) {
    if (child.name === 'div') {
      (child.children || []).forEach(handleDtDd);
    } else {
      handleDtDd(child);
    }
  }
  const groups = [];
  let group = null;
  for (const item of defItems) {
    if (item.name === 'dt') {
      if (group && group.definitions.length === 0) {
        group.titleItems.push(item);
      } else {
        group = { titleItems: [item], definitions: [] };
        groups.push(group);
      }
    } else { // dd
      group.definitions.push(item);
    }
  }
  return groups;
}

/**
 * Render a definition list in a form supported by some markdown systems
 * (each definition starts with ": ").
 *
 * @type { FormatCallback }
 */
function formatDefinitionList(elem, walk, builder, formatOptions) {
  const groups = collectDefinitionGroups(elem);
  for (const group of groups) {
    builder.openList({
      interRowLineBreaks: 1,
      leadingLineBreaks: formatOptions.leadingLineBreaks || 2,
      maxPrefixLength: 0,
      prefixAlign: 'left'
    });

    for (const titleItem of group.titleItems) {
      builder.openListItem({ prefix: '' });
      walk([titleItem], builder);
      builder.closeListItem();
    }

    for (const definition of group.definitions) {
      builder.openListItem({ prefix: ': ' });
      walk([definition], builder);
      builder.closeListItem();
    }

    builder.closeList({ trailingLineBreaks: formatOptions.trailingLineBreaks || 2 });
  }
}

/**
 * Render a definition list in a compatible form
 * (substitute with bold titles and regular lists).
 *
 * @type { FormatCallback }
 */
function formatDefinitionListCompatible(elem, walk, builder, formatOptions) {
  const definitionPrefix = (formatOptions.marker || '-') + ' '; // can be any of [-*+]
  const groups = collectDefinitionGroups(elem);
  for (const group of groups) {
    builder.openBlock({ leadingLineBreaks: formatOptions.leadingLineBreaks || 2 });

    for (const titleItem of group.titleItems) {
      builder.openBlock({ leadingLineBreaks: formatOptions.leadingLineBreaks || 2 });
      builder.addLiteral('**');
      walk(titleItem.children, builder);
      builder.addLiteral('**');
      builder.closeBlock({ trailingLineBreaks: formatOptions.trailingLineBreaks || 2 });
    }

    builder.openList({
      interRowLineBreaks: formatOptions.interRowLineBreaks || 1,
      leadingLineBreaks: formatOptions.leadingLineBreaks || 2,
      maxPrefixLength: definitionPrefix.length
    });

    for (const definition of group.definitions) {
      builder.openListItem({ prefix: definitionPrefix });
      walk([definition], builder);
      builder.closeListItem();
    }

    builder.closeList({ trailingLineBreaks: formatOptions.trailingLineBreaks || 2 });

    builder.closeBlock({ trailingLineBreaks: formatOptions.trailingLineBreaks || 2 });
  }
}

/**
 * Process a data table.
 *
 * @type { FormatCallback }
 */
function formatDataTable(elem, walk, builder, formatOptions) {
  builder.openTable();
  elem.children.forEach(walkTable);
  const hasHeader = existsOne(
    (el) => el.name === 'thead' || el.name === 'th',
    elem.children
  );
  builder.closeTable({
    tableToString: (rows) => tableToString(rows, hasHeader, formatOptions.spanMode || 'repeat') || render(elem),
    leadingLineBreaks: formatOptions.leadingLineBreaks,
    trailingLineBreaks: formatOptions.trailingLineBreaks,
  });

  function formatCell(cellNode) {
    const colspan = +get(cellNode, ['attribs', 'colspan']) || 1;
    const rowspan = +get(cellNode, ['attribs', 'rowspan']) || 1;
    builder.openTableCell({ maxColumnWidth: formatOptions.maxColumnWidth });
    walk(cellNode.children, builder);
    builder.closeTableCell({ colspan: colspan, rowspan: rowspan });
  }

  function walkTable(elem) {
    if (elem.type !== 'tag') { return; }

    switch (elem.name) {
      case 'thead':
      case 'tbody':
      case 'tfoot':
      case 'center':
        elem.children.forEach(walkTable);
        return;

      case 'tr': {
        builder.openTableRow();
        for (const cellElem of elem.children) {
          if (cellElem.type !== 'tag') { continue; }
          switch (cellElem.name) {
            case 'th':
            case 'td': {
              formatCell(cellElem);
              break;
            }
            default:
            // do nothing
          }
        }
        builder.closeTableRow();
        break;
      }

      default:
      // do nothing
    }
  }
}


export {
  formatAnchor as anchor,
  formatBlockquote as blockquote,
  formatCodeBlock as codeBlock,
  formatDataTable as dataTable,
  formatDefinitionList as definitionList,
  formatDefinitionListCompatible as definitionListCompatible,
  formatHeading as heading,
  formatImage as image,
  formatOrderedList as orderedList,
  formatPre as pre,
  formatUnorderedList as unorderedList,
  formatWbr as wbr,
};
