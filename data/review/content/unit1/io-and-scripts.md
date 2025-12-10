---
id: io-and-scripts
unit: 1
title: Functions, Input/Output & Scripts
kicker: Unit 1 · MATLAB
summary: Writing your own functions with inputs and outputs, understanding variable scope, and organizing a project across more than one file.
minutes: 9
---
## Built-In Functions, as a Pattern

You’ve already been calling functions, such as <code>sin</code>, <code>mean</code>, and <code>size</code>. You haven’t written one yet. Every function follows the same shape: it takes some inputs, does something, and returns some outputs.

```matlab caption="multiple outputs are a comma-separated list on the left"
y = sin(x);          % one input, one output
m = mean(x);          % one input, one output
[r, c] = size(A);     % one input, TWO outputs
```

## Writing Your Own Function

```matlab caption="squareMinus4.m"
function y = squareMinus4(x)
    y = x.^2 - 4;
end
```

- The file name must match the function name exactly: this function must live in a file called <code>squareMinus4.m</code>.
- <code>function y = squareMinus4(x)</code> is the signature: one output (<code>y</code>), one input (<code>x</code>).
- Everything between this line and the matching <code>end</code> only runs when the function is called. Unlike a script, nothing here executes merely by having the file open.

```matlab caption="calling a function you wrote"
result = squareMinus4(5)   % calling it, if squareMinus4.m is on the path
% result = 21
```

## Multiple Inputs & Outputs

```matlab caption="summarizeData.m, two outputs"
function [avgVal, rangeVal] = summarizeData(x)
    avgVal = mean(x);
    rangeVal = max(x) - min(x);
end
```

```matlab caption="you can also take only the first output: a = summarizeData(...)"
[a, r] = summarizeData([120 118 135 140]);
disp(a)   % average
disp(r)   % range
```

## A Second Worked Example

Functions commonly take more than one input. A simple weight-based dosing calculator:

```matlab caption="weightBasedDose.m"
function doseMg = weightBasedDose(weightKg, mgPerKg)
    doseMg = weightKg * mgPerKg;
end
```

```matlab caption="calling it, needs weightBasedDose.m on the path to run"
doseMg = weightBasedDose(70, 2.5)   % 175
```

:::callout kind="note" title="Note"
Try-it blocks in this Review section run one self-contained snippet. They can’t define a separate <code>function ... end</code> file the way MATLAB’s Editor does, which is why these two blocks aren’t interactive here. Save the function in its own <code>.m</code> file (matching its name) to run it, in the Sandbox or the MATLAB desktop.
:::

## Scope: Why Functions Are Different from Scripts

A function has its own private workspace. Variables created inside it, including its inputs, disappear the moment it finishes, and it cannot see or accidentally overwrite variables from wherever it was called. This is the opposite of a script, which shares the base workspace with everything around it (see the Unit 0 Environment chapter).

:::diagram caption="A function's workspace is private: inputs flow in, outputs flow out, but nothing else crosses the boundary."
<svg viewBox="0 0 420 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A base workspace box and a separate function workspace box, connected by an input arrow going in and an output arrow coming out; variables inside each are invisible to the other">
  <text x="15" y="20" font-family="DM Mono, monospace" font-size="12" fill="currentColor" opacity="0.55">base workspace</text>
  <rect x="10" y="30" width="400" height="130" rx="4" fill="none" stroke="currentColor" opacity="0.25"/>
  <text x="95" y="80" font-family="DM Mono, monospace" font-size="13" fill="currentColor">a = 5</text>
  <text x="95" y="130" font-family="DM Mono, monospace" font-size="13" fill="currentColor">b = 10</text>
  <rect x="235" y="55" width="150" height="80" rx="4" fill="rgba(11,122,110,.12)" stroke="#0b7a6e" stroke-width="2.5"/>
  <text x="310" y="75" font-family="DM Mono, monospace" font-size="13" fill="#0b7a6e" text-anchor="middle">function workspace</text>
  <text x="310" y="105" font-family="DM Mono, monospace" font-size="13" fill="currentColor" text-anchor="middle">x (local)</text>
  <defs>
    <marker id="ioArrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L6,3 L0,6 z" fill="currentColor" opacity="0.6"/>
    </marker>
  </defs>
  <line x1="140" y1="75" x2="230" y2="75" stroke="currentColor" opacity="0.6" stroke-width="1.5" marker-end="url(#ioArrow)"/>
  <text x="185" y="65" font-family="DM Mono, monospace" font-size="11" fill="currentColor" opacity="0.6" text-anchor="middle">input</text>
  <line x1="230" y1="120" x2="140" y2="120" stroke="currentColor" opacity="0.6" stroke-width="1.5" marker-end="url(#ioArrow)"/>
  <text x="185" y="112" font-family="DM Mono, monospace" font-size="11" fill="currentColor" opacity="0.6" text-anchor="middle">output</text>
  <text x="210" y="175" font-family="DM Mono, monospace" font-size="11" fill="currentColor" opacity="0.5" text-anchor="middle">the function box can't see the base workspace's variables</text>
  <text x="210" y="190" font-family="DM Mono, monospace" font-size="11" fill="currentColor" opacity="0.5" text-anchor="middle">and the base workspace can't see the function's</text>
</svg>
:::

:::callout kind="remember" title="Remember"
This is exactly why functions are safer to reuse: calling <code>squareMinus4</code> can never accidentally clobber a variable you happen to also have named <code>y</code> in the Command Window. A script with the same body could.
:::

## Organizing Multi-File Projects

As a script grows, it’s common to split repeated logic out into its own function file. The rule is simple: any function file you call must be either in the Current Folder or on MATLAB’s search path (<code>addpath</code>), otherwise you get an “Undefined function” error even though the file clearly exists on your computer somewhere.

## Check Your Understanding

:::quickcheck
Q: You define <code>x = 10</code> inside a function, then call that function from a script. After the call returns, does the script’s own <code>x</code> (if it has one) get overwritten?
A: No, the function’s <code>x</code> lives in its own private workspace and is discarded when the function returns. It never touches the caller’s variables unless they’re explicitly returned as an output.
:::
