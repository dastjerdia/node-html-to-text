import { readFileSync } from 'fs';

import { htmlToMarkdown } from '../packages/html-to-md/src/html-to-md';
import { writeFileSync } from 'fs';


// const { htmlToMarkdown } = require('../packages/html-to-md/lib/html-to-md'); // build it first


console.log('From string:');
const text = htmlToMarkdown(
  '<h1>Hello World</h1>',
  {}
);
console.log(text);
console.log();

console.log('From file:');
const filePath = new URL('test.html', import.meta.url);
const text2 = htmlToMarkdown(readFileSync(filePath, 'utf8'),);
function removeEmptyLines(markdown) {
  // Split the markdown text into an array of lines
  const lines = markdown.split('\n');

  // Filter out lines that only contain whitespace
  const filteredLines = lines.filter(line => {
    return line.trim() !== '';
  });

  // Join the filtered lines back into a single string
  return filteredLines.join('\n');
}

const text3 = removeEmptyLines(text2);
writeFileSync('output.md', text3);
