import { Reporter } from './reporter';
import { Token, ValidSeparator } from './tokenizer';

// Here are the main types used to define the AST based on the EBNF syntax. The AST always starts with a Program node.

// <program>           ::= <class>+
export type Program = { type: 'program'; body: Class[] };
// <class>             ::= "class" <identifier> ("extends" <identifier>)? "{" <member>* "}"
export type Class = { type: 'class'; id: Identifier; parent: Identifier | null; members: Member[] };
// <member>            ::= <field>
//                       | <method>
//                       | <constructor>
export type Member = Field | Method | Constructor;

// <field>             ::= <type> <identifier> ("=" <expression>)? ";"
export type Field = { type: 'field'; t: Type; id: Identifier; exp: Expression | null };
// <method>            ::= <type> <identifier> "(" <parameter-list> ")" <block>
export type Method = { type: 'method'; returnType: Type; id: Identifier; params: Param[]; block: Block };
// <constructor>       ::= <identifier> "(" <parameter-list> ")" <block>
export type Constructor = { type: 'constructor'; id: Identifier; params: Param[]; block: Block };
// <parameter-list>    ::= (<parameter> ("," <parameter>)*)?
// <parameter>         ::= <type> <identifier>
export type Param = { type: 'param'; t: Type; id: Identifier };
// <type>              ::= "int" | "boolean" | "void" | <identifier>
export type Type = Identifier; // no more constraint here because the tokenize already did the job

// <statement>         ::= <block>
//                       | <if>
//                       | <while>
//                       | <return>
//                       | <break>
//                       | <declaration>
//                       | <expression> ";"
//                       | ";"
export type Statement = Block | If | While | Return | Break | Declaration | Expression | null;
// <block>             ::= "{" <statement>* "}"
export type Block = { type: 'block'; stmts: Statement[] };
// <if>                ::= "if" "(" <expression> ")" <statement> ("else" <statement>)?
export type If = { type: 'if'; cond: Expression; then: Statement; else: Statement | null };
// <while>             ::= "while" "(" <expression> ")" <statement>
export type While = { type: 'while'; cond: Expression; body: Statement };
// <return>            ::= "return" <expression>? ";"
export type Return = { type: 'return'; exp: Expression };
// <break>             ::= "break" ";"
export type Break = { type: 'break' };
// <declaration>       ::= <type> <identifier> ("=" <expression>)? ";"
export type Declaration = { type: 'declaration'; t: Type; id: Identifier; exp: Expression | null };
// <argument-list>     ::= (<expression> ("," <expression>)*)?
export type Args = Expression[];

// <expression>        ::= <literal>
//                         | <reference>
//                         | <new>
//                         | <call>
//                         | <assignment>
//                         | <binary-expression>
export type Expression = Literal | Reference | New | Call | Assignment | BinaryExpression;
// <literal>           ::= <integer> | <boolean>
export type Literal = Integer | Boolean;

// <reference>         ::= <identifier> ("." <identifier>)*
export type Reference = Identifier[];
// <new>               ::= "new" <identifier> "(" <argument-list> ")"
export type New = { type: 'new'; id: Identifier; args: Args };
// <call>              ::= <reference> "(" <argument-list> ")"
export type Call = { type: 'call'; ref: Reference; args: Args };
// <assignment>        ::= <reference> "=" <expression>
export type Assignment = { type: 'assignment'; ref: Reference; exp: Expression };
// <identifier>        ::= <letter> (<letter> | <digit>)*
// <letter>            ::= "a" | "b" | "c" | ... | "z" | "A" | "B" | "C" | ... | "Z"
// <digit>             ::= "0" | "1" | "2" | ... | "9"
export type Identifier = string;
// <integer>           ::= <digit>+
export type Integer = number;
// <boolean>           ::= "true" | "false"
export type Boolean = boolean;

export type BinaryExpression = { type: 'binary'; operator: string; left: Expression; right: Expression };

/**
 * Parses an array of tokens into an AST
 * @param {Array} tokens An array of tokens
 * @param {Reporter} reporter The error reporter
 * @returns {Program} The parsed AST
 */
export function parse(tokens: Array<Token>, reporter: Reporter): Program {
  let currentIndex = 0;

  /*Utility Functions*/

  // Returns the current token without advancing.
  function currentToken(): Token {
    return tokens[currentIndex];
  }

  // Peeks at a token `offset` positions ahead without advancing.
  function peekToken(offset = 0): Token | null {
    return tokens[currentIndex + offset] || null;
  }

  // Checks if the current token matches a given type and optional value
  function matchToken(type: Token['type'], value?: string): boolean {
    const token = currentToken();
    if (!token) return false; // No token to match
    if (token.type !== type) return false; // Token type mismatch

    // Handle value comparison based on token type
    if (value) {
      if (type === 'Sep') {
        return 'char' in token && token.char === value; // Match separator's char
      }
      return 'name' in token && token.name === value; // Match name for other types
    }

    return true; // Type matches, and no specific value is required
  }

  // Consumes the current token if it matches the type and value
  function expectToken<T extends Token['type']>(type: T, value?: string): Extract<Token, { type: T }> {
    const token = currentToken();

    if (matchToken(type, value)) {
      advanceToken();
      return token as Extract<Token, { type: T }>;
    }

    const errorStart = `Expected token of type '${type}'${value ? ` with value '${value}'` : ''}`;
    if (isEndOfTokens()) {
      reporter.error(`${errorStart}, but reached end of tokens`, tokens[tokens.length - 1].offset);
    }

    reporter.error(`${errorStart}, but found ${tokenToString(currentToken())}`, token.offset);
    throw new Error('Unreachable');
  }

  // Advances to the next token
  function advanceToken(): void {
    currentIndex++;
  }

  // Returns true if there are no more tokens to process
  function isEndOfTokens(): boolean {
    return currentIndex >= tokens.length;
  }

  // Consumes a series of tokens
  function consumeTokens(...tokens: [Token['type'], string?][]): void {
    for (const [type, value] of tokens) {
      expectToken(type, value);
    }
  }

  // Consumes the current token if it matches
  function consumeIfMatch(type: Token['type'], value?: string): boolean {
    if (matchToken(type, value)) {
      advanceToken();
      return true;
    }
    return false;
  }

  // Parse a single element inside given start+end separators
  function parseOneElement<T>(startSeparator: ValidSeparator, parseFn: () => T, endSeparator: ValidSeparator): T {
    expectToken('Sep', startSeparator);
    const result: T = parseFn();
    expectToken('Sep', endSeparator);
    return result;
  }

  // Parse a single element inside given start+end separators
  function parseBetween<T>([startType, startValue]: [Token['type'], string?], parseFn: () => T, [endType, endValue]: [Token['type'], string?]): T {
    expectToken(startType, startValue);
    const result: T = parseFn();
    expectToken(endType, endValue);
    return result;
  }

  // Parse a list with a given separator between each element
  // An optional ending separator must be provided. If the minimum number of elements to parse is 0, the endSep must be provided !
  function parseListWithSeparator<T>(parseFn: () => T, sep: ValidSeparator, min: number, endSep: ValidSeparator | null = null): T[] {
    const result: T[] = [];
    let elementsCount = 0;
    if (endSep === null) {
      if (min < 1) throw new Error('Programming error: min must be >= 1 when endSep is null');
      do {
        result.push(parseFn());
        elementsCount++;
      } while (consumeIfMatch('Sep', sep));
      if (elementsCount < min) {
        reporter.error(
          'Expected to find ' + min + ' elements separated by ' + sep + ' but only found ' + elementsCount + ' ones',
          currentToken().offset,
        );
      }
    } else {
      // we know when to stop
      while (!matchToken('Sep', endSep) || elementsCount < min) {
        result.push(parseFn());
        elementsCount++;
        consumeIfMatch('Sep', sep);
      }
    }
    return result;
  }

  // Just expect a comma separator, made for ease of use
  function expectComma() {
    expectToken('Sep', ';');
  }

  // Does the current token match a type of Moka (an Id or a Type) as the tokenizer cannot detect that
  function matchMokaType(token: Token) {
    return token.type === 'Type' || token.type === 'Id';
  }

  // Create a string representation of a token to simplify errors generation
  function tokenToString(token: Token | null) {
    if (token == null) return '<no token>';
    const value = 'name' in token ? token.name : 'value' in token ? token.value : 'char' in token ? token.char : '??';
    return 'token of type ' + token?.type + " with value '" + value + "'";
  }

  // Parse a list of elements inside given start+end separators
  function parseList<T>(startSeparator: ValidSeparator, parseFn: () => T, endSeparator: ValidSeparator): T[] {
    expectToken('Sep', startSeparator);
    const result: T[] = [];
    while (!matchToken('Sep', endSeparator) && !isEndOfTokens()) {
      result.push(parseFn());
    }

    expectToken('Sep', endSeparator);
    return result;
  }

  /*Parser Functions*/

  // Entry point: parses the whole program
  // <program>           ::= <class>+
  function parseProgram(): Program {
    const body: Class[] = [];
    while (!isEndOfTokens()) {
      body.push(parseClass());
    }
    if (body.length == 0) reporter.error('Need at least one class', 0);
    return { type: 'program', body };
  }

  // Parses a class definition
  // <class>             ::= "class" <identifier> ("extends" <identifier>)? "{" <member>* "}"
  function parseClass(): Class {
    consumeTokens(['Kw', 'class']);
    const id = parseIdentifier();
    const parent: Identifier | null = consumeIfMatch('Kw', 'extends') ? expectToken('Id').name : null;
    const members = parseList('{', parseMember, '}');
    return { type: 'class', id, parent, members };
  }

  // Parses a class member (field, method, or constructor)
  // Detect start of one the 3 options
  // <field>             ::= <type> <identifier> ("=" <expression>)? ";"
  // <method>            ::= <type> <identifier> "(" <parameter-list> ")" <block>
  // <constructor>       ::= <identifier> "(" <parameter-list> ")" <block>
  function parseMember(): Member {
    const next = peekToken(1); // Peek at the token after the type
    const afterNext = peekToken(2); // Peek at the token after the identifier
    // Type then identifier -> method or field
    if (matchMokaType(currentToken()) && next?.type === 'Id') {
      if (afterNext?.type === 'Sep' && afterNext.char === '(') return parseMethod(); // It's a method
      if (afterNext?.type === 'Sep' && (afterNext.char === '=' || afterNext.char === ';')) return parseField(); // It's a field
      reporter.error('Unexpected ' + tokenToString(afterNext) + ' in class member, should have been ( or = or ;', afterNext?.offset ?? 0);
    }

    // Check if it's a constructor (starts with an identifier)
    if (matchToken('Id')) {
      if (next?.type === 'Sep' && next.char === '(') {
        return parseConstructor(); // It's a constructor
      }
    }

    // If none of the above matched, this is not a valid member
    reporter.error('Unexpected token in class member', currentToken().offset);
    throw new Error('Unreachable'); // To make the TypeScript compiler happy
  }

  // <field> ::= <type> <identifier> ("=" <expression>)? ";"
  function parseField(): Field {
    const t = parseType();
    const id = parseIdentifier();

    const exp: Expression | null = consumeIfMatch('Sep', '=') ? parseExpression() : null;
    expectComma();

    return { type: 'field', t, id, exp };
  }

  // <method>            ::= <type> <identifier> "(" <parameter-list> ")" <block>
  function parseMethod(): Method {
    const returnType = parseType();
    const { id, params, block } = parseConstructor();
    return { type: 'method', returnType, id, params, block };
  }

  // <constructor>       ::= <identifier> "(" <parameter-list> ")" <block>
  function parseConstructor(): Constructor {
    const id = parseIdentifier();
    const params = parseOneElement('(', parseParameterList, ')');
    const block = parseBlock();
    return { type: 'constructor', id, params, block };
  }

  // <parameter-list>    ::= (<parameter> ("," <parameter>)*)?
  // <parameter>         ::= <type> <identifier>
  // Parses a parameter list (for methods or constructors)
  function parseParameterList(): Param[] {
    return parseListWithSeparator(
      () => {
        const t = parseType();
        const id = parseIdentifier();
        return { type: 'param', t, id };
      },
      ',',
      0, // minimum 0 parameter
      ')',
    );
  }

  // <type>              ::= "int" | "boolean" | "void" | <identifier>
  function parseType(): Type {
    const token = currentToken();
    if (matchMokaType(token)) {
      advanceToken();
      return token.name; // Return the predefined type name or class name directly
    }

    reporter.error(`Expected a type but found '${tokenToString(token)}'`, token.offset);
    throw new Error('Unreachable');
  }

  // Parses a block of statements
  // <block>             ::= "{" <statement>* "}"
  function parseBlock(): Block {
    const stmts: Statement[] = parseList('{', parseStatement, '}');
    return { type: 'block', stmts };
  }

  // <statement>         ::= <block>
  //                       | <if>
  //                       | <while>
  //                       | <return>
  //                       | <break>
  //                       | <declaration>
  //                       | <expression> ";"
  //                       | ";"
  const statementParsers: Record<string, () => Statement> = {
    if: parseIf,
    while: parseWhile,
    return: parseReturn,
    break: parseBreak,
  };

  function parseStatement(): Statement {
    const token = currentToken();

    // One of the statementParsers keywords
    if (token.type === 'Kw' && token.name in statementParsers) {
      return statementParsers[token.name]();
    }

    // This could be a declaration, we have to check before parsing expressions
    const next = peekToken(1); // Peek at the token after the type
    const afterNext = peekToken(2); // Peek at the token after the identifier
    // <declaration>       ::= <type> <identifier> ("=" <expression>)? ";"
    if (matchMokaType(token) && next?.type === 'Id') {
      if (afterNext?.type === 'Sep' && (afterNext.char === '=' || afterNext.char === ';')) return parseDeclaration();
    }

    // Empty statement, just skip it
    if (matchToken('Sep', ';')) {
      advanceToken();
      return null;
    }

    // Statement can be subblocks !

    if (matchToken('Sep', '{')) {
      return parseBlock();
    }

    const exp = parseExpression();
    expectComma();
    return exp;
  }

  // <if>                ::= "if" "(" <expression> ")" <statement> ("else" <statement>)?
  function parseIf(): If {
    consumeTokens(['Kw', 'if']);
    const cond = parseOneElement('(', parseExpression, ')');
    const then = parseStatement();
    const elseStmt: Statement | null = consumeIfMatch('Kw', 'else') ? parseStatement() : null;
    return { type: 'if', cond, then, else: elseStmt };
  }

  // <while>             ::= "while" "(" <expression> ")" <statement>
  function parseWhile(): While {
    consumeTokens(['Kw', 'while']);
    const cond = parseOneElement('(', parseExpression, ')');
    const body = parseStatement();
    return { type: 'while', cond, body };
  }

  // <return>            ::= "return" <expression>? ";"
  function parseReturn(): Return {
    const exp = parseBetween(['Kw', 'return'], parseExpression, ['Sep', ';']);
    return { type: 'return', exp };
  }

  // <break>             ::= "break" ";"
  function parseBreak(): Break {
    consumeTokens(['Kw', 'break']);
    return { type: 'break' };
  }

  // <declaration>       ::= <type> <identifier> ("=" <expression>)? ";"
  function parseDeclaration(): Declaration {
    const t = parseType();
    const id = parseIdentifier();
    const expr: Expression | null = consumeIfMatch('Sep', '=') ? parseExpression() : null;
    expectComma();
    return { type: 'declaration', t, id, exp: expr };
  }

  // <argument-list>     ::= (<expression> ("," <expression>)*)?
  function parseArgumentList(): Args {
    return parseListWithSeparator(parseExpression, ',', 0, ')');
  }

  // Parse simple expression or binary expressions recursively
  // <expression>        ::= <literal>
  //                       | <reference>
  //                       | <new>
  //                       | <call>
  //                       | <assignment>
  //                       | <binary-expression>
  // <binary-expression> ::= ("(")? <expression> <binary-operator> <expression> (")")?
  function parseExpression(precedence = 0): Expression {
    let left = parseSimpleExpression(); // Start with a primary expression

    while (true) {
      const token = currentToken();
      if (token.type !== 'Op') break; // If not an operator, exit the loop

      const operatorPrecedence = getPrecedence(token.value);
      if (operatorPrecedence < precedence) break; // Respect operator precedence

      const operator = token.value;
      advanceToken(); // Consume the operator

      const right = parseExpression(operatorPrecedence + 1); // Parse the right-hand side
      left = { type: 'binary', operator, left, right }; // Build the binary expression
    }

    return left;
  }

  // Get the precedence of an operator
  function getPrecedence(op: string): number {
    const precedences: Record<string, number> = {
      '||': 1,
      '&&': 2,
      '<': 3,
      '<=': 3,
      '>': 3,
      '>=': 3,
      '==': 3,
    };
    return precedences[op] || 0; // Default precedence is 0 for unknown operators
  }

  // Parse primary expressions (literals, references, calls, etc.)
  function parseSimpleExpression(): Expression {
    const token = currentToken();

    if (consumeIfMatch('Sep', '(')) {
      const expr = parseExpression(); // Parse the expression inside parenthesis
      expectToken('Sep', ')'); // Ensure it ends with ')'
      return expr;
    }

    if (token.type === 'Lit') {
      advanceToken();
      return token.value; // Return literal value
    }

    if (token.type === 'Id') {
      const ref = parseReference();
      const next = currentToken();
      if (next?.type == 'Sep' && next.char == '=') return parseAssignment(ref);
      if (matchToken('Sep', '(')) return parseCall(ref); // Handle function calls
      return ref; // Otherwise, it's a plain reference
    }

    if (matchToken('Kw', 'new')) return parseNew();

    reporter.error(`Unexpected ${tokenToString(token)} in expression`, token.offset);
    throw new Error('Unreachable');
  }

  function parseReference(): Reference {
    return parseListWithSeparator(parseIdentifier, '.', 1); // with at least 1 element
  }

  // <call>              ::= <reference> "(" <argument-list> ")"
  function parseCall(ref: Reference): Call {
    const args = parseOneElement('(', parseArgumentList, ')');
    return { type: 'call', ref, args };
  }
  // <assignment>        ::= <reference> "=" <expression>
  function parseAssignment(ref: Reference): Assignment {
    expectToken('Sep', '=');
    const exp = parseExpression();
    return { type: 'assignment', ref, exp };
  }
  // <new>               ::= "new" <identifier> "(" <argument-list> ")"
  function parseNew(): New {
    expectToken('Kw', 'new');
    const id = parseIdentifier();
    const args = parseOneElement('(', parseArgumentList, ')');
    return { type: 'new', id, args };
  }

  // <identifier>        ::= <letter> (<letter> | <digit>)*
  function parseIdentifier(): Identifier {
    return expectToken('Id').name;
  }

  return parseProgram();
}
