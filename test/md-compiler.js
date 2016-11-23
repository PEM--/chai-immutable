'use strict';

const fs = require('fs');

require.extensions['.md'] = function (module, filename) {
  let examples = [];
  let definitions = {};

  const content = fs.readFileSync(filename, 'utf8').split("\n");

  let i = 0;

  while (i < content.length) {
    if ((content[i] === '```js' || content[i] === '```javascript') &&
        (i === 0 || content[i - 1] !== '<!-- skip-test -->')) {

      const defined = content[i - 1].match(/<!-- define ([a-z]+) -->/);

      const usingDefinition = content[i - 1].match(/<!-- use ([a-z]+) -->/);

      ++i;
      let example = [];

      if (usingDefinition) {
        example = definitions[usingDefinition[1]].slice(0);
      }

      while (i < content.length && content[i] !== '```') {
        example.push(content[i]);
        ++i;
      }

      if (defined) {
        definitions[defined[1]] = example;
      }
      examples.push(example.join("\n"));
    }
    ++i;
  }

  var test = `
    const chai = require('chai');
    const assert = chai.assert;
    const expect = chai.expect;

    const Immutable = require('immutable');
    const List = Immutable.List;
    const Map = Immutable.Map;
    const Set = Immutable.Set;
    const Stack = Immutable.Stack;

    chai.use(require('./chai-immutable'));

    describe('Markdown file: ${filename}', () => {
      ${examples.map((example, index) => {
        let preview = example.replace(/'/g, "\\'");
        preview = preview.substr(0, preview.indexOf("\n")) || preview;

        return `it('should run API example #${index + 1}: ${preview}', () => {
          ${example}
        });`;
      }).join("\n")}
    });`;

  return module._compile(test, filename);
};
