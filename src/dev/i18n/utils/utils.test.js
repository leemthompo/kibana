/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { parse } from '@babel/parser';
import { isExpressionStatement, isObjectExpression, isObjectProperty } from '@babel/types';

import {
  isI18nTranslateFunction,
  isPropertyWithKey,
  traverseNodes,
  formatJSString,
  checkValuesProperty,
  createParserErrorMessage,
  normalizePath,
  extractMessageValueFromNode,
  extractValueReferencesFromMessage,
} from './utils';

const i18nTranslateSources = ['i18n', 'i18n.translate'].map(
  (callee) => `
${callee}('plugin_1.id_1', {
  values: {
    key: 'value',
  },
  defaultMessage: 'Message text',
  description: 'Message description'
});
`
);

const objectPropertySource = `
const object = {
  id: 'value',
};
`;

describe('i18n utils', () => {
  test('should remove escaped linebreak', () => {
    expect(formatJSString('Test\\\n str\\\ning')).toEqual('Test string');
  });

  test('should not escape linebreaks', () => {
    expect(
      formatJSString(`Text\n with
   line-breaks
`)
    ).toMatchSnapshot();
  });

  test('should detect i18n translate function call', () => {
    let source = i18nTranslateSources[0];
    let expressionStatementNode = [...traverseNodes(parse(source).program.body)].find((node) =>
      isExpressionStatement(node)
    );

    expect(isI18nTranslateFunction(expressionStatementNode.expression)).toBe(true);

    source = i18nTranslateSources[1];
    expressionStatementNode = [...traverseNodes(parse(source).program.body)].find((node) =>
      isExpressionStatement(node)
    );

    expect(isI18nTranslateFunction(expressionStatementNode.expression)).toBe(true);
  });

  test('should detect object property with defined key', () => {
    const objectExpresssionNode = [...traverseNodes(parse(objectPropertySource).program.body)].find(
      (node) => isObjectExpression(node)
    );
    const [objectExpresssionProperty] = objectExpresssionNode.properties;

    expect(isPropertyWithKey(objectExpresssionProperty, 'id')).toBe(true);
    expect(isPropertyWithKey(objectExpresssionProperty, 'not_id')).toBe(false);
  });

  test('should create verbose parser error message', () => {
    expect.assertions(1);

    const content = `function testFunction() {
  const object = {
    object: 'with',
    semicolon: '->';
  };

  return object;
}
`;

    try {
      parse(content);
    } catch (error) {
      expect(createParserErrorMessage(content, error)).toMatchSnapshot();
    }
  });

  test('should normalizePath', () => {
    expect(normalizePath(__dirname)).toMatchSnapshot();
  });

  test('should validate conformity of "values" and "defaultMessage"', () => {
    const valuesKeys = ['url', 'username', 'password'];
    const defaultMessage = 'Test message with {username}, {password} and [markdown link]({url}).';
    const messageId = 'namespace.message.id';

    expect(() => checkValuesProperty(valuesKeys, defaultMessage, messageId)).not.toThrow();
  });

  // TODO: fix in i18n tooling upgrade https://github.com/elastic/kibana/pull/180617
  test.skip('should throw if "values" has a value that is unused in the message', () => {
    const valuesKeys = ['username', 'url', 'password'];
    const defaultMessage = 'Test message with {username} and {password}.';
    const messageId = 'namespace.message.id';

    expect(() =>
      checkValuesProperty(valuesKeys, defaultMessage, messageId)
    ).toThrowErrorMatchingSnapshot();
  });

  // TODO: fix in i18n tooling upgrade https://github.com/elastic/kibana/pull/180617
  test.skip('should throw if some key is missing in "values"', () => {
    const valuesKeys = ['url', 'username'];
    const defaultMessage = 'Test message with {username}, {password} and [markdown link]({url}).';
    const messageId = 'namespace.message.id';

    expect(() =>
      checkValuesProperty(valuesKeys, defaultMessage, messageId)
    ).toThrowErrorMatchingSnapshot();
  });

  // TODO: fix in i18n tooling upgrade https://github.com/elastic/kibana/pull/180617
  test.skip('should throw if "values" property is not provided and defaultMessage requires it', () => {
    const valuesKeys = [];
    const defaultMessage = 'Test message with {username}, {password} and [markdown link]({url}).';
    const messageId = 'namespace.message.id';

    expect(() =>
      checkValuesProperty(valuesKeys, defaultMessage, messageId)
    ).toThrowErrorMatchingSnapshot();
  });

  // TODO: fix in i18n tooling upgrade https://github.com/elastic/kibana/pull/180617
  test.skip(`should throw if "values" property is provided and defaultMessage doesn't include any references`, () => {
    const valuesKeys = ['url', 'username'];
    const defaultMessage = 'Test message';
    const messageId = 'namespace.message.id';

    expect(() =>
      checkValuesProperty(valuesKeys, defaultMessage, messageId)
    ).toThrowErrorMatchingSnapshot();
  });

  test('should parse nested ICU message', () => {
    const valuesKeys = ['first', 'second', 'third'];
    const defaultMessage = 'Test message {first, plural, one {{second}} other {{third}}}';
    const messageId = 'namespace.message.id';

    expect(() => checkValuesProperty(valuesKeys, defaultMessage, messageId)).not.toThrow();
  });

  // TODO: fix in i18n tooling upgrade https://github.com/elastic/kibana/pull/180617
  test.skip(`should throw on wrong nested ICU message`, () => {
    const valuesKeys = ['first', 'second', 'third'];
    const defaultMessage = 'Test message {first, plural, one {{second}} other {other}}';
    const messageId = 'namespace.message.id';

    expect(() =>
      checkValuesProperty(valuesKeys, defaultMessage, messageId)
    ).toThrowErrorMatchingSnapshot();
  });

  test(`should parse string concatenation`, () => {
    const source = `
i18n('namespace.id', {
  defaultMessage: 'Very ' + 'long ' + 'concatenated ' + 'string',
});`;
    const objectProperty = [...traverseNodes(parse(source).program.body)].find((node) =>
      isObjectProperty(node)
    );

    expect(extractMessageValueFromNode(objectProperty.value)).toMatchSnapshot();
  });

  test(`should parse html required variables`, () => {
    const valuesKeys = ['a'];
    const defaultMessage = 'Click here to go to <a>homepage</a>';
    const messageId = 'namespace.message.id';

    const result = extractValueReferencesFromMessage(defaultMessage, messageId);
    expect(result).toEqual(valuesKeys);
  });
});
