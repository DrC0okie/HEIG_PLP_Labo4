/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, expect, it } from 'vitest';
import { Token, tokenize } from '../tokenizer';
import { fail } from 'node:assert';
import { FakeReporter, SPECIAL_ERROR } from './tokenizer.test';
import { parse, Program } from '../parser';

function parseWorksWithInput(input: string) {
  const reporter = new FakeReporter();
  const tokens = tokenize(input, reporter);
  let result;
  try {
    result = parse(tokens, reporter);
  } catch (e) {
    if (e?.toString().includes(SPECIAL_ERROR)) {
      fail(
        'reporter.error() was called with \n"' +
          reporter.getMsg() +
          '"\non offset ' +
          reporter.getOffset() +
          ' but should have succeed for input \n' +
          input,
      );
    } else {
      throw e;
    }
  }

  expect(
    reporter.getMsg(),
    "reporter.error() was called with '" + reporter.getMsg() + "' for input \n" + input + '\nand tokens: ' + tokens,
  ).toBeNull();
}
function parseWorks(tokens: Token[], output: Program) {
  let result;
  const reporter = new FakeReporter();
  try {
    result = parse(tokens, reporter);
  } catch (e) {
    if (e?.toString().includes(SPECIAL_ERROR)) {
      fail(
        "reporter.error() was called with '" +
          reporter.getMsg() +
          "' for offset " +
          reporter.getOffset() +
          ' but should have returned ' +
          JSON.stringify(output, null, '  '),
      );
    } else {
      throw e;
    }
  }

  expect(result).to.deep.equal(output);
  expect(reporter.getMsg(), "reporter.error() was called with '" + reporter.getMsg() + "'").toBeNull();
}

function parseFails(input: string, expectedError: string | null = null) {
  let tree;
  const reporter = new FakeReporter();
  try {
    const tokens = tokenize(input, reporter);
    tree = parse(tokens, reporter);
  } catch (e) {
    if (!e?.toString().includes(SPECIAL_ERROR)) fail('Got unmanaged error ' + e + '\nwith input \n' + input + '\n');
  }
  expect(
    reporter.getMsg(),
    'reporter.error() was not called, testing input:\n' + input + '\nwith result tree:\n' + JSON.stringify(tree, null, '  '),
  ).not.toBeNull();
  if (expectedError == null) return;
  expect(reporter.getMsg(), "reported error '" + reporter.getMsg() + "' should have contained '" + expectedError + "' on input\n" + input).to.contain(
    expectedError,
  );
}

// TESTS SUITE
describe('Parsing works', () => {
  it('can parse a basic class', () => {
    // 'class C {}',
    parseWorks(
      [
        { offset: 0, type: 'Kw', name: 'class' },
        { offset: 6, type: 'Id', name: 'C' },
        { offset: 8, type: 'Sep', char: '{' },
        { offset: 9, type: 'Sep', char: '}' },
      ],
      {
        type: 'program',
        body: [
          {
            type: 'class',
            id: 'C',
            parent: null,
            members: [],
          },
        ],
      },
    );
  });

  it('can parse a class with only a constructor', () => {
    const reporter = new FakeReporter();
    parseWorks(tokenize('class A { A(){} }', reporter), {
      type: 'program',
      body: [
        {
          type: 'class',
          id: 'A',
          parent: null,
          members: [
            {
              type: 'constructor',
              id: 'A',
              params: [],
              block: { type: 'block', stmts: [] },
            },
          ],
        },
      ],
    });
  });

  it('can parse more complex classes', () => {
    const reporter = new FakeReporter();
    parseWorks(tokenize('class C extends A {\n\tint a = 12;\nboolean h31th3r3; boolean isTrue = true;\n}\n\n\t\n', reporter), {
      type: 'program',
      body: [
        {
          type: 'class',
          id: 'C',
          parent: 'A',
          members: [
            {
              type: 'field',
              t: 'int',
              id: 'a',
              exp: 12,
            },
            {
              type: 'field',
              t: 'boolean',
              id: 'h31th3r3',
              exp: null,
            },
            {
              type: 'field',
              t: 'boolean',
              id: 'isTrue',
              exp: true,
            },
          ],
        },
      ],
    });
  });

  it('can parse multiple classes', () => {
    parseWorksWithInput('class Yo{} class Hey {} class Hoo{int a;}');
    parseWorksWithInput('class Yo extends Hey{} class Hey extends Hey {}');
    parseWorksWithInput('class Yo extends Yoo{ Yo(int age) {super(age);}}');
    parseWorksWithInput('class Yo extends Yoo{ Yo builderYo() {new Yo(age);}}');
    parseWorksWithInput('class Yo { void a() {z.b.c = 2;}}');
  });
  it('can parse flow controls', () => {
    parseWorksWithInput('class A { void b() { if (true) return 2; else { ; } } }');
    parseWorksWithInput('class A { void b() { if (true) age = 2; } }'); // assignment in statement
    parseWorksWithInput('class A { void b() { if (true) return 2; else break; } }');
    parseWorksWithInput('class A { void b() { if (true) return 2;\telse\n{\nboolean a = 2 == 3; return a; }} }');
    parseWorksWithInput('class A { void b(Person person) { if (person.yes) { return person.name; } else break; } }');
    parseWorksWithInput('class A { void b() { if (true) return 2; else { while (false) { int a = true; break; } } } }');
  });
  it('can parse references, arguments list, calls, blocks', () => {
    parseWorksWithInput('class A { void b(int a, void c, boolean d) { return d.a.f(); return false; }}');
    parseWorksWithInput('class Show { void a() { Show b = 2; }}');
    parseWorksWithInput('class Show { void a() { { int b = 2; } } }'); // inner block
    parseWorksWithInput('class Show { void a() { { b = 2; } } }');
    parseWorksWithInput(
      'class Show { Show getIt(int a) {}\nboolean amaze(boolean x, int y) {\n\nShow result = getIt(x.z.soodeep);\nreturn result;\n}}',
    );
    parseWorksWithInput('class B { void ab() { ; ; ; ; }}');
    parseWorksWithInput('class Person { void hello() { hi(hey(call(23, 122)),false); }}');
  });
});

describe('Parsing works with operators', () => {
  it('can parse binary expressions with logical and comparison operators', () => {
    const reporter = new FakeReporter();
    parseWorks(tokenize('class Test {\n\tboolean isValid = 5 > 3 && 4 <= 6;\n}\n', reporter), {
      type: 'program',
      body: [
        {
          type: 'class',
          id: 'Test',
          parent: null,
          members: [
            {
              type: 'field',
              t: 'boolean',
              id: 'isValid',
              exp: {
                type: 'binary',
                operator: '&&',
                left: {
                  type: 'binary',
                  operator: '>',
                  left: 5,
                  right: 3,
                },
                right: {
                  type: 'binary',
                  operator: '<=',
                  left: 4,
                  right: 6,
                },
              },
            },
          ],
        },
      ],
    });
  });

  it('can parse complex logical expressions with || and &&', () => {
    const reporter = new FakeReporter();
    parseWorks(tokenize('class Logic {\n\tboolean result = true || false && 10 == 10;\n}\n', reporter), {
      type: 'program',
      body: [
        {
          type: 'class',
          id: 'Logic',
          parent: null,
          members: [
            {
              type: 'field',
              t: 'boolean',
              id: 'result',
              exp: {
                type: 'binary',
                operator: '||',
                left: true,
                right: {
                  type: 'binary',
                  operator: '&&',
                  left: false,
                  right: {
                    type: 'binary',
                    operator: '==',
                    left: 10,
                    right: 10,
                  },
                },
              },
            },
          ],
        },
      ],
    });
  });

  it('can parse mixed expressions with nested operators', () => {
    const reporter = new FakeReporter();
    parseWorks(tokenize('class Complex {\n\tboolean isMixed = (5 < 10) && (15 >= 5);\n}\n', reporter), {
      type: 'program',
      body: [
        {
          type: 'class',
          id: 'Complex',
          parent: null,
          members: [
            {
              type: 'field',
              t: 'boolean',
              id: 'isMixed',
              exp: {
                type: 'binary',
                operator: '&&',
                left: {
                  type: 'binary',
                  operator: '<',
                  left: 5,
                  right: 10,
                },
                right: {
                  type: 'binary',
                  operator: '>=',
                  left: 15,
                  right: 5,
                },
              },
            },
          ],
        },
      ],
    });
  });
});

describe('Parsing fails when required', () => {
  it('fails on missing or extra comma', () => {
    parseFails('class C{int a}');
    parseFails('class C{int a; void b() {return 2}');
    parseFails('class C{int a; void b() {int b\nreturn 2;}');
    parseFails('class Person { \nboolean speak = true }');
    parseFails('class Person { \nboolean speak = true; void hello() { speak.inside.hey = 2342342 }}');
    parseFails('class A { boolean x = true;; }'); // extra comma in attributes are not authorized
  });
  it('fails on partial structures', () => {
    parseFails('class C{int}');
    parseFails('class C{int ba}');
    parseFails('class C{int ba =}');
    parseFails('class C{int ba = false}');
    parseFails('class C{int ba = false && }');
    parseFails('class C{int ba = false && true <}');
    parseFails('class C{void}');
    parseFails('class C{void hey}');
    parseFails('class C{hey()}');
    parseFails('class C{void hey() {return}');
    parseFails('class C{void hey() {false;}');
  });
  it('fails on unmatched pairs', () => {
    parseFails('class Person { void hello() { return 2342342; }'); // missing closing bracket
    parseFails('class Person { void hello( { return 2342342; }}'); // missing closing parenthesis
    parseFails('class Person { void hello( { return hi()); }}'); // wrong sequence of matching
    parseFails('class Person { void hello() { hi(hey(call(23, 122234)))false)); }}');
    parseFails('class P {');
    parseFails('class P }');
    parseFails('class P {}}');
  });

  it('fails on bad structures', () => {
    parseFails('class Person { void hello(int a int b) { return 2342342; }');
    parseFails('class Person { void hello(int b C hoo) { }');
    parseFails('class Person { void hello() { C a;\n return a.; }');
    parseFails('class Person { void hello() { C a;\n return; }');
  });

  it('fails on non class programs', () => {
    parseFails(''); // no class is not permitted
    parseFails('int a = 23;'); // attribute without class
    parseFails('class');
    parseFails('classA{inta=12;}'); // word boundaries are working
    parseFails('classinta=12;');
    parseFails('class A;');
    parseFails('class A');
    parseFails('class 1123asdf { }'); // tokenizer failure
  });
});
