[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/55GGcjhs)
# Moka

The purpose of this assignment is to develop your skills in writing descent recursive parsers, understanding context-free grammars, and translating them into code through the implementation of tokenizers and parsers. This includes the intermediate step of defining data types to represent token categories and abstract syntax trees.

## Topic

The topic of the assignment is [Moka](lang/README.md), a statically typed, object-oriented programming language. Moka shares syntactical similarities with Java, making it, in essence, a subset of the Java programming language.

Moka, being an object-oriented programming language, primarily uses classes as its main constructs to structure a program. Each class is composed of members, which, in the context of Moka, are always public as they do not have specified visibility and access levels. These members can be categorized into:

* __Fields__: These are variables associated with an object or class, representing the state or data of the object.
* __Methods__: These are functions tied to an object or class, defining the behavior or actions that can be performed by the object.
* __Constructors__: These are unique methods utilized to initialize an object of a class, setting up initial states or performing any necessary start-up procedures.

In addition to classes and members, Moka incorporates two further programming constructs: _expressions_ and _statements_.

1. __Expressions__: These can take various forms including identifiers, boolean and integer literals, `new` expressions for object instantiation, class member access, method invocations, and assignments.
2. __Statements__: These can be code blocks, `if` statements, `while` loops, `return` statements, `break` clauses, expressions concluded with a semicolon or variable declarations.

While the programming constructs offered by Moka may not facilitate the creation of particularly interesting code, they do enable the crafting of idiomatic object-oriented programming. This is made possible through features such as class definitions, object instantiations, and method invocations, which sufficiently highlight the fundamental principles of object-oriented programming.

## Task

In this assignment, you will be working on a JavaScript project designed to verify the lexical and syntactic correctness of programs written in the Moka language, based on the grammar of the language. In other words, this project involves tokenizing and parsing Moka code.

The project is structured as a command-line Node.js application that accepts a Moka source file as a command-line argument. The existing codebase already lays the groundwork for extracting command-line arguments, reading the input file, and triggering the tokenization and parsing processes.

Your responsibility is to fill in the gaps by implementing the tokenizer and parser. No data types are provided to represent tokens and construct abstract syntax trees due to the dynamic typing of JavaScript. You could introduce classes, but it's more convenient to rely on "typed objects" instead.

Consider the following Moka code:

```java
// C.moka
class C {}
```

Parsing this source file could produce this partial typed JavaScript object:

```
% npm start -- --show-ast C.moka
{
  "type": "Program",
  "body": [
    {
      "type": "ClassDeclaration",
      "id": {
        "type": "Identifier",
        "name": "C"
      },
      "parent": null,
      "body": []
    }
  ]
}
```

Your implementation should also be capable of identifying malformed source files, that is, detecting errors both at the lexical and syntactical levels. While a file might contain multiple syntax violations, for simplicity, it is enough to report only the first error found and terminate the process abruptly.

For instance, parsing the following Moka code:

```java
// D.moka
class D;
```

should result in a parsing error:

```
% npm start -- D.moka
D.moka:2:8: error: Expected '{' after class name
class D;
       ^
```

The current codebase includes a utility class [Reporter](src/reporter.js) that can be used to report lexical and syntactical errors. The reporter prints an error message that includes a detailed description and pinpoints the exact location of the error within the source file, before subsequently terminating the program.

## How-to

Begin by installing Node.js for this project. Node.js allows you to run JavaScript outside of web browsers. Visit https://nodejs.org/, download the LTS version, and follow the installation instructions.

Next, install the project dependencies from the `src` directory in the terminal:

```
% npm install
```

To run the program, use the command `npm start`:

```
% npm start -- -h
Usage: mokac [options] <filename>

A parser for the Moka language

Arguments:
  filename       The source file to parse

Options:
  --show-tokens  Show the tokens (default: false)
  --show-ast     Show the parsed AST (default: false)
  -h, --help     display help for command
```

Given your experience in programming, JavaScript is straightforward as its syntax is inspired by Java. For a quick syntax overview, consult [MDN's guide on JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide).

> You are strictly prohibited from installing additional dependencies except for testing purposes. Exclusively use the JavaScript standard library, and if necessary, implement any functionalities not provided from scratch.

## Grading

The grading of the assignment will be based on the following criteria:

* __Correctness__: The code should compile without errors and perform the task as per the assignment's requirements. It should handle all edge cases and should not crash under any circumstances.
* __Efficiency__: The code should be optimized to run as efficiently as possible. This includes minimizing the time and space complexity of the code. It should not contain unnecessary computation or redundant code.
* __Readability__: The code should be easy to read and understand. This includes proper indentation, the use of meaningful variable and function names, and the inclusion of comments to explain complex parts of the code.
* __Modularity__: The code should be well-structured and divided into functions and modules, each performing a single task. This makes the code easier to read, understand, and maintain.
* __Style__: The code should demonstrate an idiomatic imperative programming style, employing suitable programming constructs to ensure the code is concise, modular, and easy to reason about.

Each criterion contributes a maximum of one point to the overall grade. The assignment grade is then computed using the following formula:

<p align="center">
$G = 1 + C_x + E_x + R_x + M_x + S_x$
</p>

where $C_x$, $E_x$, $R_x$, $M_x$, and $S_x$ represent the evaluation of your code based on each respective criterion.

## Deliverable

The deliverable for this assignment is a Node.js project, with a main file named `mokac.js`. You may structure the program across as many files as necessary. Each file should include a header that identifies the author(s) of the code. The assignment can be completed individually or in pairs. However, it is crucial to ensure that the work submitted is original and not plagiarized. Copying code from the internet or using solutions from other students is strictly prohibited and will be considered a breach of academic integrity.

## Deadline

The deadline for the assignment is **Sunday, December 22, 2024, at 23:55**. Once this deadline passes, the repository will be locked for grading purposes, and late submissions will not be accepted under any circumstances.