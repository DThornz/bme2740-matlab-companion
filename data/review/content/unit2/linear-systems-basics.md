---
id: linear-systems-basics
unit: 2
title: Linear Systems & Matrix Representation
kicker: Unit 2 · Linear Systems and Models
summary: Turning a word problem into a system of equations, then into a single matrix equation, and building the vocabulary and basic operations (addition, scalar multiplication, transpose, multiplication) needed to work with matrices in MATLAB.
minutes: 9
---
## From a Word Problem to a System of Equations

Suppose you work for a genetic engineering firm studying two proteins, X and Y, hypothesized to contribute to wing size in fruit flies. The simplest relationship you can propose is a linear one:

:::eq label="model"
\text{WingSize} = m_x p_x + m_y p_y
:::

Two experiments give you two equations relating the unknown coefficients $p_x$ and $p_y$:

:::eq label="(1)"
4p_x + p_y = 1
:::

:::eq label="(2)"
p_x + 3p_y = 2
:::

You could solve this by hand with substitution ($p_x = 2 - 3p_y$ from Eq. 2, plug into Eq. 1, solve for $p_y = 7/11$, back-substitute for $p_x = 1/11$), but that approach falls apart the moment the firm asks you to repeat the analysis with 20 proteins instead of 2. Twenty equations in twenty unknowns is not something you solve by substitution. What scales is writing the whole system as one matrix equation instead.

## Coefficient & Augmented Matrices

Take the coefficients of each unknown, in the order they appear, and place them in a matrix:

:::eq label="A"
A = \begin{bmatrix} 4 & 1 \\ 1 & 3 \end{bmatrix}
:::

Appending the right-hand-side values as an extra column gives the <strong>augmented matrix</strong> $\bar{A}$, a compact way to write the whole system in one object:

:::eq label="augmented"
\bar{A} = \begin{bmatrix} 4 & 1 & 1 \\ 1 & 3 & 2 \end{bmatrix}
:::

In general, a matrix $A$ has $m$ rows and $n$ columns, and $a_{ij}$ refers to the element in row $i$, column $j$ (row always comes first). When $m = n$, $A$ is a <strong>square matrix</strong>; otherwise it's <strong>rectangular</strong>.

```matlab run
A = [4 1; 1 3];
b = [1; 2];
size(A)   % [2 2]: a square matrix
```

## Basic Matrix Operations

A few operations you'll use constantly, all supported directly by MATLAB's array syntax:

- <strong>Scalar multiplication</strong>: multiply every element by the scalar. $5\bar{A}$ scales each entry of $\bar{A}$ by 5.
- <strong>Addition and subtraction</strong>: matrices must be the <em>same size</em>. Add/subtract element-by-element.
- <strong>Transpose</strong>: rows become columns and columns become rows, written $A^T$.

```matlab run
A = [2 1; -3 0];
B = [3 -5; 2 1];

5*A        % scalar multiplication
A + B      % element-wise addition
A - B      % element-wise subtraction
A.'        % transpose (rows <-> columns)
```

A few properties fall out directly from these definitions: addition is commutative ($A+B=B+A$) and associative, adding the all-zeros matrix changes nothing ($A + \bar{0} = A$), and scalar multiplication distributes over addition ($c(A+B) = cA + cB$).

## Matrix Multiplication

Matrix multiplication is not element-by-element. $A \cdot B$ is only defined when the number of <em>columns</em> of $A$ equals the number of <em>rows</em> of $B$, and the result has as many rows as $A$ and as many columns as $B$. Order matters: $A \cdot B \neq B \cdot A$ in general.

```matlab run
A = [2 1 4; -3 0 2];   % 2x3
B = [3 5; 2 -1; 4 2];  % 3x2

A*B   % valid: A is 2x3, B is 3x2 -> result is 2x2
```

:::callout kind="mistake" title="Common mistake"
<code>A*B</code> and <code>A.*B</code> are different operations. <code>A*B</code> is matrix multiplication (dimension rule above). <code>A.*B</code> is element-wise multiplication and requires <code>A</code> and <code>B</code> to be the <em>same size</em>. Mixing these up is one of the most common sources of a <code>Matrix dimensions must agree</code> error, or worse, a result that runs without error but is mathematically wrong.
:::

## Linear Dependence & Where Determinants Come From

Two vectors are <strong>linearly dependent</strong> if one can be written as a scaled combination of the other; otherwise they're <strong>linearly independent</strong>. For a 2×2 matrix, you can spot dependence by checking whether the columns (or rows) are proportional:

```matlab run
A = [3 9; 7 21];   % second column is exactly 3x the first
A(:,2) ./ A(:,1)   % [3; 3] -- constant ratio means linearly dependent
```

For a general $2\times2$ matrix $\begin{bmatrix}a & b\\ c & d\end{bmatrix}$, the columns are dependent exactly when $a/c = b/d$, i.e. $ad - bc = 0$. Dividing risks a divide-by-zero, so instead of comparing ratios directly, MATLAB (and the rest of linear algebra) works with the equivalent product form $ad - bc$. That quantity is exactly the <strong>determinant</strong> of a 2×2 matrix, and whether it's zero or not tells you whether the system has a unique solution at all. The next chapter, <em>Matrix Operations & Solving Ax = b</em>, picks up from here: how MATLAB actually solves a system once you've built it, what the determinant, rank, and condition number tell you about it, and why <code>A\b</code> is almost always the right tool.

## Check Your Understanding

:::quickcheck
Q: Why does the augmented-matrix representation matter for a 20-protein version of the wing-size problem, when substitution worked fine for 2 proteins?
A: Substitution scales terribly: each new unknown roughly doubles the algebra needed to eliminate it by hand. Writing the system as one matrix equation <code>Ax = b</code> doesn't get more complicated to *write* as the number of unknowns grows, it's the same three symbols, and it's the form MATLAB (and every numerical linear algebra tool) is built to solve directly.
:::

:::quickcheck
Q: You compute <code>A*B</code> and MATLAB throws an "inner matrix dimensions must agree" error. What does that tell you, and what should you check?
A: The number of columns in <code>A</code> doesn't match the number of rows in <code>B</code>, which matrix multiplication requires. Check <code>size(A)</code> and <code>size(B)</code>; you may have meant element-wise multiplication (<code>A.*B</code>, which instead requires <code>A</code> and <code>B</code> to be the same size), or you may need to transpose one of them.
:::

## Practice This Topic

:::practice unit=2 topic=linear-systems-basics
Practice: Linear Systems & Matrix Representation
:::
