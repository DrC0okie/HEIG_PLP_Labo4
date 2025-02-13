/* eslint-disable no-empty */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, expect, it } from 'vitest';
import { Token, tokenize } from '../tokenizer';
import { Reporter } from '../reporter';
import { fail } from 'node:assert';

export const SPECIAL_ERROR = 'just to stop the execution without exit()...';
export class FakeReporter extends Reporter {
  #msg: string | null;
  #offset: number;

  constructor() {
    super('filenam', 'useless');
    this.#msg = null;
    this.#offset = 0;
  }
  error(message: string, offset: number): void {
    this.#msg = message;
    this.#offset = offset;
    throw new Error(SPECIAL_ERROR);
  }
  getMsg() {
    return this.#msg;
  }
  getOffset() {
    return this.#offset;
  }
}

function tokenizeWorks(input: string, output: Token[]) {
  let result;
  const reporter = new FakeReporter();
  try {
    result = tokenize(input, reporter);
  } catch (e) {
    if (e?.toString().includes(SPECIAL_ERROR)) {
      fail("reporter.error() was called with '" + reporter.getMsg() + "' but should have returned " + output);
    } else {
      expect(null, "Got an unmanaged error '" + e + "'").containSubset(output);
    }
  }

  expect(result).to.deep.equal(output);
  expect(reporter.getMsg(), "reporter.error() was called with '" + reporter.getMsg() + "'").toBeNull();
}

function tokenizeFails(input: string, expectedError: string) {
  const reporter = new FakeReporter();
  it(input, () => {
    try {
      tokenize(input, reporter);
    } catch (e) {}
    expect(reporter.getMsg(), "reporter.error() was not called with '" + input + "' on input:\n" + input + '\n').not.toBeNull();
    expect(
      reporter.getMsg(),
      "reported error '" + reporter.getMsg() + "' should have contained '" + expectedError + "' on input\n" + input,
    ).to.contain(expectedError);
  });
}

describe('Tokenization works', () => {
  // TESTS SUITE
  it('can tokenize a basic class', () => {
    tokenizeWorks('int x = 3;', [
      { offset: 0, type: 'Type', name: 'int' },
      { offset: 4, type: 'Id', name: 'x' },
      { offset: 6, type: 'Sep', char: '=' },
      { offset: 8, type: 'Lit', value: 3 },
      { offset: 9, type: 'Sep', char: ';' },
    ]);

    tokenizeWorks('class C {};', [
      { offset: 0, type: 'Kw', name: 'class' },
      { offset: 6, type: 'Id', name: 'C' },
      { offset: 8, type: 'Sep', char: '{' },
      { offset: 9, type: 'Sep', char: '}' },
      { offset: 10, type: 'Sep', char: ';' },
    ]);
    tokenizeWorks('class A { A() {}}', [
      { offset: 0, type: 'Kw', name: 'class' },
      { offset: 6, type: 'Id', name: 'A' },
      { offset: 8, type: 'Sep', char: '{' },
      { offset: 10, type: 'Id', name: 'A' },
      { offset: 11, type: 'Sep', char: '(' },
      { offset: 12, type: 'Sep', char: ')' },
      { offset: 14, type: 'Sep', char: '{' },
      { offset: 15, type: 'Sep', char: '}' },
      { offset: 16, type: 'Sep', char: '}' },
    ]);

    tokenizeWorks('void calc(int a, int b) { return a; }', [
      { offset: 0, type: 'Type', name: 'void' },
      { offset: 5, type: 'Id', name: 'calc' },
      { offset: 9, type: 'Sep', char: '(' },
      { offset: 10, type: 'Type', name: 'int' },
      { offset: 14, type: 'Id', name: 'a' },
      { offset: 15, type: 'Sep', char: ',' },
      { offset: 17, type: 'Type', name: 'int' },
      { offset: 21, type: 'Id', name: 'b' },
      { offset: 22, type: 'Sep', char: ')' },
      { offset: 24, type: 'Sep', char: '{' },
      { offset: 26, type: 'Kw', name: 'return' },
      { offset: 33, type: 'Id', name: 'a' },
      { offset: 34, type: 'Sep', char: ';' },
      { offset: 36, type: 'Sep', char: '}' },
    ]);
    tokenizeWorks('while (false) { if (a.b.c) {\nbreak; \n}\nelse {return new C(2,4);}', [
      { offset: 0, type: 'Kw', name: 'while' },
      { offset: 6, type: 'Sep', char: '(' },
      { offset: 7, type: 'Lit', value: false },
      { offset: 12, type: 'Sep', char: ')' },
      { offset: 14, type: 'Sep', char: '{' },
      { offset: 16, type: 'Kw', name: 'if' },
      { offset: 19, type: 'Sep', char: '(' },
      { offset: 20, type: 'Id', name: 'a' },
      { offset: 21, type: 'Sep', char: '.' },
      { offset: 22, type: 'Id', name: 'b' },
      { offset: 23, type: 'Sep', char: '.' },
      { offset: 24, type: 'Id', name: 'c' },
      { offset: 25, type: 'Sep', char: ')' },
      { offset: 27, type: 'Sep', char: '{' },
      { offset: 29, type: 'Kw', name: 'break' },
      { offset: 34, type: 'Sep', char: ';' },
      { offset: 37, type: 'Sep', char: '}' },
      { offset: 39, type: 'Kw', name: 'else' },
      { offset: 44, type: 'Sep', char: '{' },
      { offset: 45, type: 'Kw', name: 'return' },
      { offset: 52, type: 'Kw', name: 'new' },
      { offset: 56, type: 'Id', name: 'C' },
      { offset: 57, type: 'Sep', char: '(' },
      { offset: 58, type: 'Lit', value: 2 },
      { offset: 59, type: 'Sep', char: ',' },
      { offset: 60, type: 'Lit', value: 4 },
      { offset: 61, type: 'Sep', char: ')' },
      { offset: 62, type: 'Sep', char: ';' },
      { offset: 63, type: 'Sep', char: '}' },
    ]);

    tokenizeWorks('class C {};', [
      { offset: 0, type: 'Kw', name: 'class' },
      { offset: 6, type: 'Id', name: 'C' },
      { offset: 8, type: 'Sep', char: '{' },
      { offset: 9, type: 'Sep', char: '}' },
      { offset: 10, type: 'Sep', char: ';' },
    ]);
  });

  it('Classes tokens correctly', () => {
    tokenizeWorks('intboolean', [{ offset: 0, type: 'Id', name: 'intboolean' }]);
    tokenizeWorks('elseclass', [{ offset: 0, type: 'Id', name: 'elseclass' }]);
    tokenizeWorks('test123', [{ offset: 0, type: 'Id', name: 'test123' }]);
    tokenizeWorks('classintifbooleanelsevoidwhiletruereturnfalsenew123extendsbreak', [
      { offset: 0, type: 'Id', name: 'classintifbooleanelsevoidwhiletruereturnfalsenew123extendsbreak' },
    ]);
    tokenizeWorks('test(int)', [
      { offset: 0, type: 'Id', name: 'test' },
      { offset: 4, type: 'Sep', char: '(' },
      { offset: 5, type: 'Type', name: 'int' },
      { offset: 8, type: 'Sep', char: ')' },
    ]);

    tokenizeWorks('class C extends A {\n\tint a = 12;\nboolean h31th3r3; boolean isTrue = true;\n}\n\n\t\n', [
      { offset: 0, type: 'Kw', name: 'class' },
      { offset: 6, type: 'Id', name: 'C' },
      { offset: 8, type: 'Kw', name: 'extends' },
      { offset: 16, type: 'Id', name: 'A' },
      { offset: 18, type: 'Sep', char: '{' },
      { offset: 21, type: 'Type', name: 'int' },
      { offset: 25, type: 'Id', name: 'a' },
      { offset: 27, type: 'Sep', char: '=' },
      { offset: 29, type: 'Lit', value: 12 },
      { offset: 31, type: 'Sep', char: ';' },
      { offset: 33, type: 'Type', name: 'boolean' },
      { offset: 41, type: 'Id', name: 'h31th3r3' },
      { offset: 49, type: 'Sep', char: ';' },
      { offset: 51, type: 'Type', name: 'boolean' },
      { offset: 59, type: 'Id', name: 'isTrue' },
      { offset: 66, type: 'Sep', char: '=' },
      { offset: 68, type: 'Lit', value: true },
      { offset: 72, type: 'Sep', char: ';' },
      { offset: 74, type: 'Sep', char: '}' },
    ]);
  });

  it('can tokenize operators', () => {
    tokenizeWorks('( x < 10 && y > 5 || z == 3)', [
      { offset: 0, type: 'Sep', char: '(' },
      { offset: 2, type: 'Id', name: 'x' },
      { offset: 4, type: 'Op', value: '<' },
      { offset: 6, type: 'Lit', value: 10 },
      { offset: 9, type: 'Op', value: '&&' },
      { offset: 12, type: 'Id', name: 'y' },
      { offset: 14, type: 'Op', value: '>' },
      { offset: 16, type: 'Lit', value: 5 },
      { offset: 18, type: 'Op', value: '||' },
      { offset: 21, type: 'Id', name: 'z' },
      { offset: 23, type: 'Op', value: '==' },
      { offset: 26, type: 'Lit', value: 3 },
      { offset: 27, type: 'Sep', char: ')' },
    ]);

    tokenizeWorks('a <= b >= c == d', [
      { offset: 0, type: 'Id', name: 'a' },
      { offset: 2, type: 'Op', value: '<=' },
      { offset: 5, type: 'Id', name: 'b' },
      { offset: 7, type: 'Op', value: '>=' },
      { offset: 10, type: 'Id', name: 'c' },
      { offset: 12, type: 'Op', value: '==' },
      { offset: 15, type: 'Id', name: 'd' },
    ]);
    tokenizeWorks('class Test {\n\n\tboolean isValid = 5 > 3 && 4 <= 6;\n}\n', [
      { offset: 0, type: 'Kw', name: 'class' },
      { offset: 6, type: 'Id', name: 'Test' },
      { offset: 11, type: 'Sep', char: '{' },
      { offset: 15, type: 'Type', name: 'boolean' },
      { offset: 23, type: 'Id', name: 'isValid' },
      { offset: 31, type: 'Sep', char: '=' },
      { offset: 33, type: 'Lit', value: 5 },
      { offset: 35, type: 'Op', value: '>' },
      { offset: 37, type: 'Lit', value: 3 },
      { offset: 39, type: 'Op', value: '&&' },
      { offset: 42, type: 'Lit', value: 4 },
      { offset: 44, type: 'Op', value: '<=' },
      { offset: 47, type: 'Lit', value: 6 },
      { offset: 48, type: 'Sep', char: ';' },
      { offset: 50, type: 'Sep', char: '}' },
    ]);
    tokenizeWorks('class Logic {\n\n\tboolean result = true || false && 10 == 10;\n}\n', [
      { offset: 0, type: 'Kw', name: 'class' },
      { offset: 6, type: 'Id', name: 'Logic' },
      { offset: 12, type: 'Sep', char: '{' },
      { offset: 16, type: 'Type', name: 'boolean' },
      { offset: 24, type: 'Id', name: 'result' },
      { offset: 31, type: 'Sep', char: '=' },
      { offset: 33, type: 'Lit', value: true },
      { offset: 38, type: 'Op', value: '||' },
      { offset: 41, type: 'Lit', value: false },
      { offset: 47, type: 'Op', value: '&&' },
      { offset: 50, type: 'Lit', value: 10 },
      { offset: 53, type: 'Op', value: '==' },
      { offset: 56, type: 'Lit', value: 10 },
      { offset: 58, type: 'Sep', char: ';' },
      { offset: 60, type: 'Sep', char: '}' },
    ]);

    tokenizeWorks('class Complex {\n\n\tboolean isMixed = (5 < 10) && (15 >= 5);\n}\n', [
      { offset: 0, type: 'Kw', name: 'class' },
      { offset: 6, type: 'Id', name: 'Complex' },
      { offset: 14, type: 'Sep', char: '{' },
      { offset: 18, type: 'Type', name: 'boolean' },
      { offset: 26, type: 'Id', name: 'isMixed' },
      { offset: 34, type: 'Sep', char: '=' },
      { offset: 36, type: 'Sep', char: '(' },
      { offset: 37, type: 'Lit', value: 5 },
      { offset: 39, type: 'Op', value: '<' },
      { offset: 41, type: 'Lit', value: 10 },
      { offset: 43, type: 'Sep', char: ')' },
      { offset: 45, type: 'Op', value: '&&' },
      { offset: 48, type: 'Sep', char: '(' },
      { offset: 49, type: 'Lit', value: 15 },
      { offset: 52, type: 'Op', value: '>=' },
      { offset: 55, type: 'Lit', value: 5 },
      { offset: 56, type: 'Sep', char: ')' },
      { offset: 57, type: 'Sep', char: ';' },
      { offset: 59, type: 'Sep', char: '}' },
    ]);
  });
});

describe('Tokenization detect errors', () => {
  describe('fails on invalid characters', () => {
    tokenizeFails('$hello', 'Unexpected token:');
    tokenizeFails('hell#o', 'Unexpected token:');
    tokenizeFails('S@lut', 'Unexpected token:');
    tokenizeFails('Salut!', 'Unexpected token:');
    tokenizeFails('?Salut', 'Unexpected token:');
    tokenizeFails('-123', 'Unexpected token:');
    tokenizeFails('int 123abc;', "Illegal identifier: '123abc' - Identifiers cannot start with digits");
    tokenizeFails('int 123if;', "Illegal identifier: '123if' - Identifiers cannot start with digits");
    tokenizeFails('int 123int;', "Illegal identifier: '123int' - Identifiers cannot start with digits");
    tokenizeFails('int 123true;', "Illegal identifier: '123true' - Identifiers cannot start with digits");
  });
});
