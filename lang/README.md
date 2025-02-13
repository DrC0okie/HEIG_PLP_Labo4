# The Moka Programming Language

The formal syntax of Moka is specified using a variant of Backus-Naur Form (BNF), as detailed below:

Note: we added support for binary expressions surrounded by optionnal parenthesis in Moka.

```ebnf
<program>           ::= <class>+

<class>             ::= "class" <identifier> ("extends" <identifier>)? "{" <member>* "}"

<member>            ::= <field>
                      | <method>
                      | <constructor>

<field>             ::= <type> <identifier> ("=" <expression>)? ";"

<method>            ::= <type> <identifier> "(" <parameter-list> ")" <block>

<constructor>       ::= <identifier> "(" <parameter-list> ")" <block>

<parameter-list>    ::= (<parameter> ("," <parameter>)*)?

<parameter>         ::= <type> <identifier>

<type>              ::= "int" | "boolean" | "void" | <identifier>

<statement>         ::= <block>
                      | <if>
                      | <while>
                      | <return>
                      | <break>
                      | <declaration>
                      | <expression> ";"
                      | ";"

<block>             ::= "{" <statement>* "}"

<if>                ::= "if" "(" <expression> ")" <statement> ("else" <statement>)?

<while>             ::= "while" "(" <expression> ")" <statement>

<return>            ::= "return" <expression>? ";"

<break>             ::= "break" ";"

<declaration>       ::= <type> <identifier> ("=" <expression>)? ";"

<argument-list>     ::= (<expression> ("," <expression>)*)?

<expression>        ::= <literal>
                      | <reference>
                      | <new>
                      | <call>
                      | <assignment>
                      | <binary-expression>

<binary-expression> ::= ("(")? <expression> <binary-operator> <expression> (")")?

<binary-operator>   ::= "&&" | "||" | "<" | "<=" | ">" | ">=" | "=="

<literal>           ::= <integer> | <boolean>

<reference>         ::= <identifier> ("." <identifier>)*

<new>               ::= "new" <identifier> "(" <argument-list> ")"

<call>              ::= <reference> "(" <argument-list> ")"

<assignment>        ::= <reference> "=" <expression>

<identifier>        ::= <letter> (<letter> | <digit>)*

<letter>            ::= "a" | "b" | "c" | ... | "z" | "A" | "B" | "C" | ... | "Z"

<digit>             ::= "0" | "1" | "2" | ... | "9"

<integer>           ::= <digit>+

<boolean>           ::= "true" | "false"
```
