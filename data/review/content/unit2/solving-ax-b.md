---
id: solving-ax-b
unit: 2
title: Matrix Operations & Solving Ax = b
kicker: Unit 2 · Linear Systems and Models
summary: Writing a system of linear equations as a single matrix equation, solving it in MATLAB with the backslash operator, and understanding why that’s almost always the right choice over computing an explicit inverse.
minutes: 11
---
## From Equations to a Matrix

Many biomedical models (steady-state flow through a branching network, forces on a rigid structure, parameter fits across several measurements) boil down to a set of linear equations that all have to hold at once. Writing them individually gets unwieldy fast; writing them as one matrix equation does not.

Take a small system of two equations in two unknowns:

:::eq label="(1)"
2x_1 + x_2 = 11
:::

:::eq label="(2)"
x_1 - 3x_2 = -1

Two equations, two unknowns (x₁ and x₂). This system has a unique solution as long as the two equations aren’t redundant or contradictory.
:::

The same system, written as one matrix equation <code>Ax = b</code>:

:::eq label="Ax = b"
\begin{bmatrix}2 & 1\\ 1 & -3\end{bmatrix}\begin{bmatrix}x_1\\ x_2\end{bmatrix}=\begin{bmatrix}11\\ -1\end{bmatrix}
:::

:::diagram caption="A is m equations by n unknowns; x is the n unknowns; b is the m known right-hand-side values."
<svg viewBox="0 0 470 130" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Shape diagram: an m by n matrix A, times an n by 1 vector x, equals an m by 1 vector b">
  <g font-family="DM Mono, monospace" font-size="15" text-anchor="middle">
    <rect x="10" y="20" width="90" height="70" fill="none" stroke="currentColor" opacity="0.4"/>
    <text x="55" y="60" fill="currentColor">A</text>
    <text x="55" y="105" font-size="11" fill="currentColor" opacity="0.6">m × n</text>

    <text x="115" y="60" fill="currentColor" opacity="0.5">×</text>

    <rect x="135" y="20" width="34" height="70" fill="none" stroke="currentColor" opacity="0.4"/>
    <text x="152" y="60" fill="currentColor">x</text>
    <text x="152" y="105" font-size="11" fill="currentColor" opacity="0.6">n × 1</text>

    <text x="190" y="60" fill="currentColor" opacity="0.5">=</text>

    <rect x="215" y="20" width="34" height="70" stroke="#0b7a6e" stroke-width="2.5" fill="rgba(11,122,110,.1)"/>
    <text x="232" y="60" fill="currentColor">b</text>
    <text x="232" y="105" font-size="11" fill="currentColor" opacity="0.6">m × 1</text>

    <text x="460" y="45" font-size="12" text-anchor="end" fill="currentColor" opacity="0.65">known coefficients</text>
    <text x="460" y="65" font-size="12" text-anchor="end" fill="currentColor" opacity="0.65">unknowns to solve for</text>
    <text x="460" y="85" font-size="12" text-anchor="end" fill="currentColor" opacity="0.65">known right-hand side</text>
  </g>
</svg>
:::

Here, <code>A</code> holds the coefficients, <code>x</code> is the vector of unknowns you’re solving for, and <code>b</code> is the known right-hand side. This is what you type into MATLAB, almost unchanged from how you’d write it on paper.

## MATLAB: The Backslash Operator

MATLAB solves <code>Ax = b</code> with a single operator: backslash, <code>\</code>. Read <code>A\b</code> as “A, undone, applied to b.” It’s solving for <code>x</code>, not performing division in the everyday sense.

```matlab run caption="x = A\b, solves the system directly"
A = [2 1; 1 -3];
b = [11; -1];

x = A\b
```

Confirm it by substituting back in: <code>A*x</code> should reproduce <code>b</code> (up to tiny floating-point rounding).

```matlab run
A*x   % should equal b, i.e. [11; -1]
```

## Why Backslash, Not inv(A)*b

It’s mathematically true that <code>x = inv(A)*b</code> gives the same answer as <code>x = A\b</code>, but they are not equally good ways to get there, and BME 2740 expects you to know which to reach for.

| | A\b (backslash) | inv(A)*b |
| --- | --- | --- |
| What it computes | Solves the system directly, using a numerically stable factorization method | Explicitly computes the full inverse matrix first, then multiplies |
| Accuracy | More numerically stable, especially for larger or ill-conditioned systems | Accumulates more floating-point error; computing the inverse is itself an error-prone step, before you’ve even used it |
| Speed | Faster, never forms the inverse | Slower, forming <code>inv(A)</code> is meaningfully more expensive than solving directly |
| When you need the inverse itself | Use <code>inv(A)</code> directly only when you need the inverse matrix as its own result, not only to solve one system | N/A |

:::callout kind="remember" title="Remember"
If your goal is “solve for x,” the answer is almost always <code>A\b</code>. Reach for <code>inv(A)</code> only in the rare case where you need the inverse matrix itself, for example, to reuse it across many different <code>b</code> vectors, or because a formula calls for the inverse as an object, not only as a step toward solving one system.
:::

## When a System Doesn’t Solve Cleanly

- <strong>Determinant</strong> (<code>det(A)</code>): a single number summarizing the matrix. <code>det(A) = 0</code> means <code>A</code> is <strong>singular</strong>: the system either has no solution or infinitely many, and <code>A\b</code> will warn you rather than silently returning nonsense.
- <strong>Rank</strong> (<code>rank(A)</code>): the number of independent equations the matrix encodes. If <code>rank(A)</code> is less than the number of unknowns, your equations don’t pin down a unique answer; you likely have a redundant or missing measurement.
- <strong>Conditioning</strong> (<code>cond(A)</code>): how sensitive the solution is to small errors in <code>A</code> or <code>b</code>. A very large condition number means tiny measurement noise can produce a wildly different solution, worth checking before trusting a fit from noisy experimental data.

```matlab run
A = [1 2; 2 4];   % second row is exactly 2x the first, not independent
det(A)             % 0
rank(A)            % 1, not 2, only one independent equation

b = [3; 6];
x = A\b            % MATLAB solves what it can and issues a warning: matrix is singular
```

:::callout kind="mistake" title="Common mistake"
A singular or near-singular matrix does not always throw a hard error. MATLAB often prints a warning (<code>Matrix is singular to working precision</code>) and returns a result anyway, which may contain <code>Inf</code> or <code>NaN</code>, or be numerically meaningless. Don’t treat “it ran without error” as proof the answer is trustworthy; check the warning text.
:::

## Worked Example: A Two-Resistor Flow Model

Two parallel flow paths (e.g., two vascular branches) share a pressure drop and split a total flow. Modeled with linear resistances $R_1, R_2$, conservation gives two equations in the two branch flows $q_1, q_2$:

:::eq label="(equal pressure drop)"
R_1 q_1 - R_2 q_2 = 0
:::

:::eq label="(flow conservation)"
q_1 + q_2 = Q_{total}
:::

```matlab run caption="set up and solve the 2-branch flow split"
R1 = 4; R2 = 6; Qtotal = 10;

A = [R1 -R2; 1 1];
b = [0; Qtotal];

q = A\b;
fprintf('q1 = %.3f, q2 = %.3f\n', q(1), q(2))
```

The lower-resistance branch should carry more of the total flow: a quick physical sanity check worth running on any model result like this before trusting it.

## Which Tool Should I Use?

| Problem | MATLAB approach |
| --- | --- |
| Solve <code>Ax = b</code> for x | <code>A\b</code> |
| Get the inverse matrix itself | <code>inv(A)</code> |
| Check whether a system has a unique solution | <code>det(A)</code>, <code>rank(A)</code> |
| Check how sensitive a solution is to noisy input data | <code>cond(A)</code> |

## Check Your Understanding

:::quickcheck
Q: Why is <code>A\b</code> generally preferred over <code>inv(A)*b</code> when all you need is x?
A: Backslash solves the system directly using a numerically stable method and is faster; computing <code>inv(A)</code> explicitly is slower and introduces more floating-point error, for a matrix you don’t even need as its own object if all you wanted was x.
:::

:::quickcheck
Q: <code>det(A)</code> comes back as 0. What does that tell you about <code>A\b</code>?
A: <code>A</code> is singular: the system doesn’t have a unique solution. <code>A\b</code> may still run, but will typically print a warning and return a result that shouldn’t be trusted without further checking.
:::

## Practice This Topic

:::practice unit=2 topic=solving-ax-b
Practice: Solving Ax = b
:::
