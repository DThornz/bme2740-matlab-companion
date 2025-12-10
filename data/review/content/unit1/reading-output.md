---
id: reading-output
unit: 1
title: Reading Code, Errors & Output
kicker: Unit 1 · MATLAB
summary: Practice at the skill quizzes in this topic test: reading a short piece of MATLAB code and predicting exactly what it prints or does, including when it errors.
minutes: 9
---
## Tracing Code by Hand

The most reliable way to predict output is the least clever one: go line by line, and write down the value of every variable as it changes, the same way you’d hand-trace any program.

```matlab run caption="what prints? trace it before running"
x = 3;
y = x + 2;
x = x * 2;
disp(y)
```

Trace: <code>x = 3</code>. Then <code>y = x + 2 = 5</code>. <code>y</code> is computed from <code>x</code>’s value <em>at that moment</em> (3), not whatever <code>x</code> becomes later. Then <code>x</code> is reassigned to 6; this does not retroactively change <code>y</code>. <code>disp(y)</code> prints <code>5</code>.

:::diagram caption="Tracing code line by line: write down every variable's value as each line executes."
<svg viewBox="0 0 480 195" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Four lines of code on the left, with a table on the right showing how x and y change after each line runs; the final y value of 5 is highlighted as what disp(y) prints">
  <g font-family="DM Mono, monospace" font-size="13" fill="currentColor" opacity="0.85">
    <text x="5" y="40" font-size="11" opacity="0.4">1</text>
    <text x="20" y="40">x = 3;</text>
    <text x="5" y="65" font-size="11" opacity="0.4">2</text>
    <text x="20" y="65">y = x + 2;</text>
    <text x="5" y="90" font-size="11" opacity="0.4">3</text>
    <text x="20" y="90">x = x * 2;</text>
    <text x="5" y="115" font-size="11" opacity="0.4">4</text>
    <text x="20" y="115">disp(y)</text>
  </g>
  <g font-family="DM Mono, monospace" text-anchor="middle">
    <text x="305" y="25" font-size="12" fill="currentColor" opacity="0.55">x</text>
    <text x="385" y="25" font-size="12" fill="currentColor" opacity="0.55">y</text>
    <line x1="260" y1="32" x2="430" y2="32" stroke="currentColor" opacity="0.25"/>
    <rect x="270" y="40" width="70" height="24" fill="none" stroke="currentColor" opacity="0.2"/>
    <text x="305" y="57" font-size="13" fill="currentColor">3</text>
    <rect x="350" y="40" width="70" height="24" fill="none" stroke="currentColor" opacity="0.2"/>
    <text x="385" y="57" font-size="13" fill="currentColor" opacity="0.4">—</text>
    <rect x="270" y="68" width="70" height="24" fill="none" stroke="currentColor" opacity="0.2"/>
    <text x="305" y="85" font-size="13" fill="currentColor">3</text>
    <rect x="350" y="68" width="70" height="24" fill="none" stroke="currentColor" opacity="0.2"/>
    <text x="385" y="85" font-size="13" fill="currentColor">5</text>
    <rect x="270" y="96" width="70" height="24" fill="none" stroke="currentColor" opacity="0.2"/>
    <text x="305" y="113" font-size="13" fill="currentColor">6</text>
    <rect x="350" y="96" width="70" height="24" fill="none" stroke="currentColor" opacity="0.2"/>
    <text x="385" y="113" font-size="13" fill="currentColor" opacity="0.6">5</text>
    <rect x="270" y="124" width="70" height="24" fill="none" stroke="currentColor" opacity="0.2"/>
    <text x="305" y="141" font-size="13" fill="currentColor" opacity="0.5">6</text>
    <rect x="350" y="124" width="70" height="24" fill="rgba(11,122,110,.12)" stroke="#0b7a6e" stroke-width="2.5"/>
    <text x="385" y="141" font-size="13" fill="#0b7a6e">5</text>
  </g>
  <defs>
    <marker id="traceArrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L6,3 L0,6 z" fill="#0b7a6e" opacity="0.8"/>
    </marker>
  </defs>
  <path d="M100,112 C 220,112 260,136 348,136" fill="none" stroke="#0b7a6e" stroke-width="1.5" opacity="0.7" marker-end="url(#traceArrow)"/>
  <text x="240" y="175" font-family="DM Mono, monospace" font-size="11" fill="currentColor" opacity="0.6" text-anchor="middle">disp(y) prints the table's final y value: 5</text>
</svg>
:::

:::callout kind="mistake" title="Common mistake"
Assuming a variable is “live” like a spreadsheet formula, automatically updating when something it was computed from changes. It isn’t. Every assignment in MATLAB computes a value once, at that moment, from whatever the right-hand side evaluates to right then.
:::

## Predicting Suppressed vs. Printed Output

```matlab caption="check every line for a trailing semicolon before deciding what prints"
a = 4;        % no output, semicolon
b = a + 1      % prints: b = 5
c = b * 2;     % no output, semicolon
```

## Tracing a Loop

The same line-by-line approach works for loops. Repeat it once per iteration, updating a small table of variable values as you go, the way you would on a whiteboard.

```matlab run caption="trace: what is total after each iteration?"
total = 0;
for i = 1:4
    total = total + i;
end
disp(total)
```

Trace: <code>i=1</code> → total = 0+1 = 1. <code>i=2</code> → total = 1+2 = 3. <code>i=3</code> → total = 3+3 = 6. <code>i=4</code> → total = 6+4 = 10. <code>disp(total)</code> prints <code>10</code>.

## Tracing a Function Call

When a line calls a function, jump into the function body, trace it using the argument’s <em>value</em> (not its name back in the caller), then jump back with whatever it returned.

```matlab caption="doubleIt.m, defined separately, referenced by the script below"
function y = doubleIt(x)
    y = x * 2;
end
```

```matlab caption="trace: what does this print?"
a = 5;
b = doubleIt(a);
a = 100;
disp(b)
```

Trace: <code>a=5</code>. <code>doubleIt(a)</code> runs with <code>x=5</code> inside the function’s own private workspace (see the Functions chapter on scope) and returns <code>10</code>, so <code>b=10</code>. Reassigning <code>a=100</code> afterward has no effect on <code>b</code>; it was already computed and returned. <code>disp(b)</code> prints <code>10</code>.

## Common Errors, Revisited

The error-message table from the Unit 0 debugging chapter applies here too. Reading-output questions often show you the error MATLAB would throw, and ask you to identify why, rather than showing correct code.

```matlab caption="a size mismatch, not a syntax error"
x = [1 2 3];
y = [1 2];
z = x + y;   % Matrix dimensions must agree
```

```matlab caption="'total' was never assigned before this line"
result = total + 1;   % Undefined function or variable 'total'
```

## Check Your Understanding

:::quickcheck
Q: <code>a = 2; b = a; a = 10;</code>, after this, what is <code>b</code>?
A: <code>2</code>. <code>b = a</code> copies <code>a</code>’s value at that moment (2); reassigning <code>a</code> afterward has no effect on <code>b</code>.
:::
