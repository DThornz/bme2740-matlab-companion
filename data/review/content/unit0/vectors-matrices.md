---
id: vectors-matrices
unit: 0
title: Vectors, Matrices & Indexing
kicker: Unit 0 · MATLAB Foundations
summary: Building row and column vectors, matrices, indexing into both, and the single most common source of MATLAB bugs: matrix operators vs. element-wise operators.
minutes: 12
---
## Row & Column Vectors

A row vector is a list of values separated by spaces or commas; a column vector uses semicolons (or a transpose).

```matlab run
rowVec = [1 2 3 4 5];
colVec = [1; 2; 3; 4; 5];
colVec2 = rowVec';   % transpose of a row vector is a column vector
```

Two ways to build an evenly-spaced range:

| Expression | Produces | You specify |
| --- | --- | --- |
| <code>0:0.1:10</code> | Values from 0 to 10 in steps of 0.1 | the <strong>step size</strong>: the count of points is whatever that implies |
| <code>linspace(0,10,101)</code> | 101 values evenly spaced from 0 to 10 | the <strong>number of points</strong>: the step size is whatever that implies |

```matlab run
a = 0:0.1:10;
b = linspace(0, 10, 101);
isequal(a, b)   % 1, same 101 points here, but only because 0.1 divides evenly into 10
```

:::callout kind="remember" title="Remember"
Reach for <code>linspace</code> when you know exactly how many points you want (e.g., “101 samples”); reach for the colon operator when you know the exact step size (e.g., “every 0.1 seconds”). They are not always interchangeable. A step that doesn’t divide the range evenly will not match a corresponding <code>linspace</code> call.
:::

## Vector Functions: length, size, numel

| Function | Returns |
| --- | --- |
| <code>length(x)</code> | The size of the largest dimension. For a plain vector, that’s how many elements it has |
| <code>size(x)</code> | A 2-element vector <code>[rows cols]</code>: the full shape |
| <code>numel(x)</code> | The total number of elements, regardless of shape |

```matlab run
x = [1 2 3; 4 5 6];
length(x)   % 3, the larger dimension (2 rows, 3 cols)
size(x)     % [2 3]
numel(x)    % 6
```

:::callout kind="mistake" title="Common mistake"
<code>length</code> on a matrix is rarely what you want. It silently ignores the smaller dimension. Prefer <code>size(x,1)</code> / <code>size(x,2)</code> for matrices, and save <code>length</code> for actual vectors.
:::

## Matrices: Building & Indexing

A matrix is rows of vectors stacked with semicolons. Every row needs the same number of elements.

```matlab run
A = [1 2 3; 4 5 6; 7 8 9];
zeros(2,3)   % 2x3 matrix of zeros
ones(3,1)    % 3x1 column of ones
eye(3)       % 3x3 identity matrix
```

:::diagram caption="MATLAB indexes as A(row, col), always row first."
<svg viewBox="0 0 360 170" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A 3 by 3 matrix with rows and columns labeled, and A(2,3) highlighted">
  <text x="10" y="20" font-family="DM Mono, monospace" font-size="12" fill="currentColor">A(row, col)</text>
  <g font-family="DM Mono, monospace" font-size="13">
    <text x="70" y="45" fill="currentColor" opacity="0.55">col 1</text>
    <text x="140" y="45" fill="currentColor" opacity="0.55">col 2</text>
    <text x="210" y="45" fill="currentColor" opacity="0.55">col 3</text>
    <text x="15" y="80" fill="currentColor" opacity="0.55">row 1</text>
    <text x="15" y="115" fill="currentColor" opacity="0.55">row 2</text>
    <text x="15" y="150" fill="currentColor" opacity="0.55">row 3</text>
  </g>
  <g font-family="DM Mono, monospace" font-size="15" text-anchor="middle">
    <rect x="55" y="60" width="60" height="35" fill="none" stroke="currentColor" opacity="0.25"/>
    <text x="85" y="83" fill="currentColor">1</text>
    <rect x="125" y="60" width="60" height="35" fill="none" stroke="currentColor" opacity="0.25"/>
    <text x="155" y="83" fill="currentColor">2</text>
    <rect x="195" y="60" width="60" height="35" fill="none" stroke="currentColor" opacity="0.25"/>
    <text x="225" y="83" fill="currentColor">3</text>
    <rect x="55" y="95" width="60" height="35" fill="none" stroke="currentColor" opacity="0.25"/>
    <text x="85" y="118" fill="currentColor">4</text>
    <rect x="125" y="95" width="60" height="35" stroke="#0b7a6e" stroke-width="2.5" fill="rgba(11,122,110,.12)"/>
    <text x="155" y="118" fill="currentColor">5</text>
    <rect x="195" y="95" width="60" height="35" fill="none" stroke="currentColor" opacity="0.25"/>
    <text x="225" y="118" fill="currentColor">6</text>
    <rect x="55" y="130" width="60" height="35" fill="none" stroke="currentColor" opacity="0.25"/>
    <text x="85" y="153" fill="currentColor">7</text>
    <rect x="125" y="130" width="60" height="35" fill="none" stroke="currentColor" opacity="0.25"/>
    <text x="155" y="153" fill="currentColor">8</text>
    <rect x="195" y="130" width="60" height="35" fill="none" stroke="currentColor" opacity="0.25"/>
    <text x="225" y="153" fill="currentColor">9</text>
  </g>
  <text x="270" y="112" font-family="DM Mono, monospace" font-size="13" fill="#0b7a6e">A(2,2) = 5</text>
</svg>
:::

```matlab run
A = [1 2 3; 4 5 6; 7 8 9];
A(2,2)     % 5, row 2, column 2
A(:,2)     % entire column 2 → [2;5;8]
A(3,:)     % entire row 3 → [7 8 9]
A(2:3,1:2) % submatrix, rows 2-3 and cols 1-2
A(end,:)   % last row, without knowing how many rows there are
```

:::callout kind="mistake" title="Common mistake"
MATLAB indexing starts at <strong>1</strong>, not 0. <code>A(1,1)</code> is the first element. <code>A(0,1)</code> throws an error rather than wrapping around or silently doing nothing.
:::

## More Indexing Patterns

A few more indexing tricks that come up constantly once you’re past the basics:

```matlab run caption="end and step indexing"
x = [10 20 30 40 50];
x(end)         % 50, last element, without knowing how many there are
x(end-1)       % 40, second to last
x(2:2:end)     % [20 40], every other element, starting at index 2
x(end:-1:1)    % [50 40 30 20 10], the whole vector, reversed
```

You can grow or shrink a vector by indexing past its current end, or assigning <code>[]</code> to an element:

```matlab run caption="growing and shrinking with indexing"
x = [10 20 30];
x(end+1) = 40;   % grow: x is now [10 20 30 40]
x(2) = [];        % shrink: removes element 2, x is now [10 30 40]
disp(x)
```

:::callout kind="remember" title="Remember"
<code>x(end+1) = value</code> is a common, idiomatic way to append one value to a vector, but see the Loops chapter’s preallocation note before doing this thousands of times in a loop.
:::

A matrix can also be indexed with a <strong>single</strong> number. MATLAB counts down column 1 first, then column 2, and so on. This is called linear indexing:

```matlab run caption="linear indexing of a matrix"
A = [1 2 3; 4 5 6; 7 8 9];
A(5)   % 5, the 5th element counting down column 1, then column 2, …
A(2)   % 4, 2nd element, same counting order
```

## Logical Indexing (a preview)

You can index with a logical (true/false) array the same size as your data, to pull out only the elements where the condition is true. This is covered in depth in Unit 1, but it’s worth seeing once here:

```matlab run
bp = [118 145 132 96 151];
high = bp(bp > 130)   % [145 132 151], only the elements over 130
```

## Element-Wise vs. Matrix Operations

This is the single most common source of confusion in early MATLAB code: <code>*</code>, <code>/</code>, and <code>^</code> mean true <strong>matrix</strong> multiplication/division/power (as in linear algebra), while <code>.*</code>, <code>./</code>, and <code>.^</code> mean <strong>element-wise</strong> operations. Pair each element up with the one in the same position.

| Matrix operator | Meaning | Element-wise operator | Meaning |
| --- | --- | --- | --- |
| <code>*</code> | Matrix multiplication (inner dimensions must match) | <code>.*</code> | Multiply each pair of same-position elements |
| <code>/</code> | Matrix right division (solves a linear system) | <code>./</code> | Divide each pair of same-position elements |
| <code>^</code> | Matrix power (repeated matrix multiplication) | <code>.^</code> | Raise each element to a power individually |

```matlab run
x = [1 2 3];
y = x.^2        % [1 4 9], square each element

A = [1 2; 3 4];
A^2              % A*A, real matrix multiplication → [7 10; 15 22]
A.^2             % each entry squared individually → [1 4; 9 16]
```

:::callout kind="mistake" title="Common mistake"
Two same-size vectors, <code>x * y</code> where both are, say, 1×5 row vectors, is <strong>not</strong> valid matrix multiplication (inner dimensions 5 and 1 don’t line up) and throws a dimension-mismatch error. What you almost always want for “multiply these two data vectors together, position by position” is <code>x .* y</code>.
:::

## Check Your Understanding

:::quickcheck
Q: For <code>x = [1 2 3]</code>, what’s the difference between <code>x.^2</code> and <code>x^2</code>?
A: <code>x.^2</code> squares each element → <code>[1 4 9]</code>. <code>x^2</code> attempts real matrix power on a non-square array and throws an error, matrix power only makes sense for a square matrix.
:::
