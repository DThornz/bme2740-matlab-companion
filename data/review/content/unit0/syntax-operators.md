---
id: syntax-operators
unit: 0
title: Variables, Syntax & Operators
kicker: Unit 0 · MATLAB Foundations
summary: Assignment, comments, the semicolon, variable-naming rules, and how MATLAB evaluates arithmetic and relational expressions.
minutes: 7
---
## Assignment & the Semicolon

<code>=</code> is assignment, not mathematical equality: <code>x = 5</code> means “store 5 in <code>x</code>,” not “x equals 5” as a statement of fact. A trailing semicolon suppresses the echoed output; leaving it off prints the result immediately.

```matlab run caption="suppressed vs. echoed output"
x = 5;
y = 3
z = x^2 + y
```

:::callout kind="mistake" title="Common mistake"
Confusing <code>=</code> (assignment) with <code>==</code> (comparison). <code>if x = 5</code> is a syntax error in MATLAB. You need <code>if x == 5</code> to test equality.
:::

## Comments

Anything after <code>%</code> on a line is a comment, ignored by MATLAB, meant for you. <code>%%</code> additionally marks a “cell” break, letting you run one section of a longer script at a time in the Editor.

```matlab
% Compute the mean arterial pressure
sbp = 120;   % systolic (mmHg)
dbp = 80;    % diastolic (mmHg)
map = dbp + (sbp - dbp)/3
```

## Variable Naming Rules

- Must start with a letter (<code>x1</code> is valid, <code>1x</code> is not).
- Can contain letters, digits, and underscores only; no spaces or punctuation.
- Is <strong>case-sensitive</strong>: <code>Data</code> and <code>data</code> are two different variables.
- Cannot be a MATLAB keyword (<code>for</code>, <code>if</code>, <code>end</code>, …), though it <em>can</em> shadow a built-in function name like <code>sum</code> or <code>mean</code>. That’s legal, but risky, since that function becomes unreachable for the rest of the session.

```matlab run caption="isvarname checks the rules for you"
isvarname('bp_avg')   % 1 (true), valid name
isvarname('2nd_reading')   % 0 (false), starts with a digit
```

:::callout kind="remember" title="Remember"
<code>isvarname</code> only checks whether a string is a &#42;legal&#42; name. It does not check whether that name is already in use or shadows a built-in. Use <code>which name</code> to check the latter.
:::

## Operator Precedence

MATLAB follows standard math precedence: parentheses, then power (<code>^</code>), then unary minus, then multiply/divide, then add/subtract, left to right within a tier.

:::eq label="z ="
z = x^2 + y

Evaluates as (x^2) + y, not x^(2+y): power binds tighter than addition.
:::

```matlab run
x = 3; y = 4;
z1 = x^2 + y      % 13, not 3^6
z2 = 2 + 3 * 4    % 14, not 20
```

:::callout kind="mistake" title="Common mistake"
When in doubt, add parentheses. It costs nothing and removes any ambiguity for whoever reads the code next, including you, a week later.
:::

## Relational & Logical Operators

| Operator | Meaning |
| --- | --- |
| <code>==</code> | Equal to |
| <code>~=</code> | Not equal to |
| <code>&lt;</code>, <code>&gt;</code> | Less than, greater than |
| <code>&lt;=</code>, <code>&gt;=</code> | Less than or equal, greater than or equal |
| <code>&amp;&amp;</code>, &#124;&#124; | Logical AND / OR, for two single (scalar) conditions |
| <code>&amp;</code>, &#124; | Element-wise AND / OR, for comparing whole arrays element by element |

:::diagram caption="MATLAB's operator precedence, evaluated top to bottom: power, then unary sign, then multiply/divide, then add/subtract, then relational comparisons, then &amp;, then |."
<svg viewBox="0 0 380 210" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Operator precedence ladder, highest precedence at top: power, unary plus/minus, multiply/divide, add/subtract, relational comparisons, element-wise AND, element-wise OR">
  <g font-family="DM Mono, monospace" font-size="12">
    <rect x="25" y="10" width="335" height="22" stroke="#0b7a6e" stroke-width="2.5" fill="rgba(11,122,110,.12)"/>
    <text x="40" y="26" fill="currentColor">^</text>
    <text x="110" y="26" fill="currentColor" opacity="0.85">power</text>

    <rect x="25" y="38" width="335" height="22" fill="none" stroke="currentColor" opacity="0.35"/>
    <text x="40" y="54" fill="currentColor">+x  -x</text>
    <text x="110" y="54" fill="currentColor" opacity="0.7">unary plus / minus</text>

    <rect x="25" y="66" width="335" height="22" fill="none" stroke="currentColor" opacity="0.35"/>
    <text x="40" y="82" fill="currentColor">*  /</text>
    <text x="110" y="82" fill="currentColor" opacity="0.7">multiply / divide, left to right</text>

    <rect x="25" y="94" width="335" height="22" fill="none" stroke="currentColor" opacity="0.35"/>
    <text x="40" y="110" fill="currentColor">+  -</text>
    <text x="110" y="110" fill="currentColor" opacity="0.7">add / subtract, left to right</text>

    <rect x="25" y="122" width="335" height="22" fill="none" stroke="currentColor" opacity="0.35"/>
    <text x="40" y="138" fill="currentColor">&lt; &gt; ==</text>
    <text x="110" y="138" fill="currentColor" opacity="0.7">relational comparisons</text>

    <rect x="25" y="150" width="335" height="22" fill="none" stroke="currentColor" opacity="0.35"/>
    <text x="40" y="166" fill="currentColor">&amp;</text>
    <text x="110" y="166" fill="currentColor" opacity="0.7">element-wise AND</text>

    <rect x="25" y="178" width="335" height="22" fill="none" stroke="currentColor" opacity="0.35"/>
    <text x="40" y="194" fill="currentColor">|</text>
    <text x="110" y="194" fill="currentColor" opacity="0.7">element-wise OR</text>
  </g>
</svg>
:::

:::callout kind="mistake" title="Common mistake"
Using <code>&amp;&amp;</code>/<code>||</code> on arrays throws an error (they require scalar operands). Use <code>&amp;</code>/<code>|</code> when either side is a vector or matrix. See the Control Flow chapter for more.
:::

## Check Your Understanding

:::quickcheck
Q: What does <code>2 + 3 * 4</code> evaluate to, and why?
A: <code>14</code>, multiplication binds tighter than addition, so this is <code>2 + (3*4)</code>, not <code>(2+3)*4</code>.
:::
