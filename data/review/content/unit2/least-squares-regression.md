---
id: least-squares-regression
unit: 2
title: Least Squares & Regression
kicker: Unit 2 · Linear Systems and Models
summary: What to do when a system has more equations than unknowns and no exact solution exists, deriving the normal equations, and fitting lines, polynomials, and multi-variable models to data with MATLAB's backslash and polyfit.
minutes: 12
---
## When There's No Exact Solution

So far, every system had as many equations as unknowns. Real data rarely cooperates that way. Suppose three separate measurements give you three lines that should, in theory, all describe the same relationship:

:::eq label="over-determined"
y = -2x - 1 \qquad y = 3x - 2 \qquad y = x + 1
:::

No single point lies on all three lines at once. This is an <strong>over-determined system</strong>: more equations than unknowns, and generally no exact solution. Depending on which two equations you solve and which you ignore, you get a different answer. So what does "the" solution even mean here?

## A Regression Scenario

Suppose you're studying biocompatible artificial corneas and have data relating material porosity ($\varphi$) to how much a patient's vision improves after implantation ($\upsilon$). You want the linear relationship $\upsilon \approx \varphi\beta$ that best summarizes the data. Each measurement gives one equation:

:::eq label="design"
\begin{bmatrix}\varphi_1\\ \varphi_2\\ \vdots\\ \varphi_n\end{bmatrix}\beta = \begin{bmatrix}\upsilon_1\\ \upsilon_2\\ \vdots\\ \upsilon_n\end{bmatrix}
:::

With more data points than parameters, $\varphi$ is an $n \times 1$ column, not a square matrix, so it has no ordinary inverse. Unless every point happens to sit exactly on the same line (it won't, real measurements have noise), there's no single $\beta$ that satisfies every equation exactly.

## The Normal Equations

To "solve" a system $A\beta = y$ when $A$ isn't square, first make it square by multiplying both sides by $A^T$. The result is the <strong>normal equation</strong>:

:::eq label="normal equation"
A^T A \, \beta = A^T y \quad\Longrightarrow\quad \beta = (A^T A)^{-1} A^T y
:::

This is not the same kind of "solve" as direct inversion for a square system. It doesn't satisfy every equation exactly; it finds the $\beta$ that minimizes the Mean Squared Error between the model's predictions and the actual data, the closest possible fit in that specific sense. (The full geometric derivation, projecting the data onto the column space of $A$ and applying the Pythagorean theorem, takes more space than fits here; the short version is that the residual, the leftover error, ends up perpendicular to everything $A$ can represent, and that's exactly the condition $A^T A \beta = A^T y$ encodes.)

```matlab run caption="two equivalent ways to fit the same line"
phi = [0.12; 0.18; 0.25; 0.31; 0.40];
v   = [1.1; 1.6; 2.0; 2.4; 3.1];

% Explicit normal equation
beta_explicit = (phi'*phi)^-1 * phi'*v

% Idiomatic: MATLAB's backslash detects a non-square A and solves the
% least-squares problem automatically, using a more numerically stable
% method than explicitly forming (A'*A)^-1
beta_backslash = phi\v
```

:::callout kind="remember" title="Remember"
The same lesson from the previous chapter applies here: prefer <code>A\y</code> over explicitly forming <code>(A'*A)^-1*A'*y</code>. Backslash recognizes a rectangular <code>A</code> and solves the least-squares problem directly, without the extra floating-point error that comes from explicitly computing and inverting <code>A'*A</code>.
:::

## Adding an Intercept, and Higher-Order Fits

A single column of $\varphi$ values only gives you a slope through the origin. A real line needs an intercept too, which means adding a column of ones to the design matrix, one parameter per column you want to solve for:

:::eq label="line with intercept"
\begin{bmatrix}\varphi_1 & 1\\ \varphi_2 & 1\\ \vdots & \vdots\\ \varphi_n & 1\end{bmatrix}\begin{bmatrix}\beta_1\\ \beta_2\end{bmatrix} = \begin{bmatrix}\upsilon_1\\ \upsilon_2\\ \vdots\\ \upsilon_n\end{bmatrix}
:::

The same trick extends to any polynomial, or in fact any linear combination of functions of your input; only the design matrix's columns change, the solve step is identical. A quadratic fit just adds a $\varphi^2$ column:

```matlab run caption="building a design matrix with an intercept column"
phi = [0.12; 0.18; 0.25; 0.31; 0.40];
v   = [1.1; 1.6; 2.0; 2.4; 3.1];

A = [phi, ones(size(phi))];   % column of 1s adds the intercept term
beta = A\v;

fprintf('slope = %.3f, intercept = %.3f\n', beta(1), beta(2))
```

:::callout kind="note" title="What counts as 'linear' here"
Linear regression only requires the model to be linear <em>in the parameters</em> $\beta$, not in the input. You can use $x^2$, $\sin(x)$, $e^x$, or any other transform of your regressor as a design-matrix column, and it's still a linear least-squares problem as far as MATLAB is concerned.
:::

## Quantifying the Fit: SSE, MSE, and R²

Once you have a fit, you need a number that says how good it is. Start with the residuals, the gap between each data point and what the model predicts:

:::eq label="SSE / MSE"
\text{SSE} = \sum_{k=1}^n r_k^2 \qquad \text{MSE}(\beta) = \frac{1}{n}\sum_{i=1}^n \left(y_i - f_\beta(A)\right)^2
:::

Lower is better, but SSE and MSE alone don't say how good "good" is, since their scale depends on the units of your data. The <strong>coefficient of determination</strong>, $R^2$, fixes that by comparing your model's error to the error of the simplest possible model (just predicting the mean of $y$ every time):

:::eq label="R-squared"
R^2 = 1 - \frac{\text{SSE}}{\text{TSS}} = 1 - \frac{\sum_{k=1}^n r_k^2}{\sum_{k=1}^n (y_k - \mu_y)^2}
:::

$R^2$ close to 1 means your model explains most of the variation in the data; close to 0 means it's barely better than guessing the mean every time. A model relating blood glucose to insulin dose with $R^2 = 0.95$ explains 95% of the variability in the data, a genuinely strong fit for noisy biological measurements.

```matlab run caption="computing R^2 for a fit"
phi = [0.12; 0.18; 0.25; 0.31; 0.40];
v   = [1.1; 1.6; 2.0; 2.4; 3.1];

A = [phi, ones(size(phi))];
beta = A\v;
v_pred = A*beta;

SSE = sum((v - v_pred).^2);
TSS = sum((v - mean(v)).^2);
R2 = 1 - SSE/TSS
```

## polyfit: MATLAB's Built-In Shortcut

Building the design matrix by hand is worth doing once so you understand what's happening underneath, but for an ordinary polynomial fit MATLAB's <code>polyfit</code> does exactly this for you:

```matlab run caption="polyfit vs. a hand-built design matrix, same result"
x = [0.1 0.3 0.5 0.7 0.9];
y = [2.1 3.4 5.2 7.5 10.1];

p = polyfit(x, y, 2);   % degree-2 (quadratic) fit, returns [b3 b2 b1]
y_fit = polyval(p, x);

R2 = 1 - sum((y - y_fit).^2) / sum((y - mean(y)).^2)
```

A residual plot (data minus fit, plotted against $x$) is worth checking on every fit: a real curved pattern left in the residuals means your model is missing something (often, that the true relationship isn't linear in the regressor you chose, and a transform or higher-order term is needed). Residuals scattered randomly around zero, with no visible pattern, are the sign of a well-specified model.

You aren't limited to one regressor either. Multi-linear regression uses several predictors at once ($\upsilon = \beta_1\varphi + \beta_2\rho + \beta_3\,\text{BI} + \beta_4$, say, combining porosity, material hardness, and a biocompatibility index) by adding one design-matrix column per predictor. The solve step, <code>A\y</code>, doesn't change at all.

## Check Your Understanding

:::quickcheck
Q: Why can't you just use <code>inv(phi)</code> to solve for beta when <code>phi</code> is an n×1 column of measurements?
A: Only square matrices have an ordinary inverse. A design matrix with more rows (measurements) than columns (parameters) is rectangular, so there's no exact solution to invert to. That's exactly the situation the normal equations, and MATLAB's backslash on a non-square matrix, are built to handle: finding the closest fit instead of an exact one.
:::

:::quickcheck
Q: Your fitted model has R² = 0.31. What does that tell you, and what would you check next?
A: The model explains only about 31% of the variation in the data, a weak fit. Worth checking: a residual plot for a leftover pattern (a sign the true relationship isn't linear in your current regressor and needs a transform or extra predictor), whether you're missing an intercept term, and whether additional regressors (multi-linear regression) would help.
:::

## Practice This Topic

:::practice unit=2 topic=least-squares-regression
Practice: Least Squares & Regression
:::
