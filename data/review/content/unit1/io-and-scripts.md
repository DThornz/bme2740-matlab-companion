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
