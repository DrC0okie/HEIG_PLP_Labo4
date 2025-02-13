/* eslint-disable @typescript-eslint/no-unused-vars */
import { Reporter } from './reporter';

const validTypes = <const>['int', 'boolean', 'void'];
export type ValidType = (typeof validTypes)[number]; // equivalent to this (without redundance): type ValidType = 'int' | 'boolean' | 'void';

const validSeparators = <const>['.', '{', '(', '}', ')', ',', ';', '='];
export type ValidSeparator = (typeof validSeparators)[number];

const validKeywords = <const>['new', 'class', 'break', 'extends', 'if', 'else', 'while', 'return'];
export type ValidKeyword = (typeof validKeywords)[number];

const validOperators = <const>['&&', '||', '<', '<=', '>', '>=', '=='];
export type validOperators = (typeof validOperators)[number];

export type Token =
  | { offset: number; type: 'Id'; name: string }
  | { offset: number; type: 'Kw'; name: ValidKeyword }
  | { offset: number; type: 'Sep'; char: ValidSeparator }
  | { offset: number; type: 'Lit'; value: boolean | number } // 'true' or 'false' or '2342' are converted to native types
  | { offset: number; type: 'Type'; name: ValidType }
  | { offset: number; type: 'Op'; value: string };

/**
 * Tokenize the input string
 * @param {string} input The input string to tokenize
 * @param {Reporter} reporter The error reporter
 * @returns {Array} An array of tokens
 */
export function tokenize(input: string, reporter: Reporter): Array<Token> {
  const tokens: Token[] = [];
  let position = 0;

  const regex = {
    whitespace: /^\s+/,
    keyword: /^\b(class|if|else|while|return|new|extends|break)\b/,
    type: /^\b(int|boolean|void)\b/,
    identifier: /^\b[a-zA-Z][a-zA-Z0-9]*\b/,
    booleanLiteral: /^\b(true|false)\b/,
    integerLiteral: /^\b\d+\b/,
    separator: /^[{}();.,=]/,
    illegalIdentifier: /^\d+[a-zA-Z]+/,
    operator: /^(<=|>=|==|<|>|&&|\|\|)/,
  };

  function addToken(type: Token['type'], value: any) {
    tokens.push({ offset: position, type, ...value });
  }

  const rules = [
    { regex: regex.whitespace, action: () => {} }, // Skip whitespace
    {
      regex: regex.illegalIdentifier,
      action: (match: string) => reporter.error(`Illegal identifier: '${match}' - Identifiers cannot start with digits`, position),
    },
    { regex: regex.keyword, action: (match: string) => addToken('Kw', { name: match as ValidKeyword }) },
    { regex: regex.type, action: (match: string) => addToken('Type', { name: match as ValidType }) },
    { regex: regex.booleanLiteral, action: (match: string) => addToken('Lit', { value: match === 'true' }) },
    { regex: regex.integerLiteral, action: (match: string) => addToken('Lit', { value: parseInt(match, 10) }) },
    { regex: regex.operator, action: (match: string) => addToken('Op', { value: match }) },
    { regex: regex.separator, action: (match: string) => addToken('Sep', { char: match as ValidSeparator }) },
    { regex: regex.identifier, action: (match: string) => addToken('Id', { name: match }) },
  ];

  function next(m: string) {
    position += m.length;
  }

  while (position < input.length) {
    const substring = input.slice(position);

    // Try all rules
    let matched = false;
    for (const rule of rules) {
      const match = substring.match(rule.regex);
      if (match) {
        rule.action(match[0]);
        next(match[0]);
        matched = true;
        break;
      }
    }

    // If no rules matched, report an error
    if (!matched) {
      reporter.error(`Unexpected token: '${substring[0]}'`, position);
      next(substring[0]);
    }
  }

  return tokens;
}
