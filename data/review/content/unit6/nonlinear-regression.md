---
id: nonlinear-regression
unit: 6
title: Nonlinear Regression & Curve Fitting
kicker: Unit 6 · Nonlinear Equations and Optimization
summary: Fitting nonlinear models to experimental data by minimizing sum-of-squared error with the simplex method and fminsearch, and recognizing this as optimization applied to model-fitting rather than a new idea.
minutes: 10
---
:::callout kind="sandbox" title="fminsearch is not available in this sandbox"
Every worked example in this chapter depends on MATLAB's <code>fminsearch</code>, which is not implemented in the browser-based MATLAB runtime this site's Try-it blocks use (it reports "Undefined function: fminsearch"). None of the code in this chapter is interactive because of that. To actually run any of it, use real MATLAB or <a href="https://www.mathworks.com/products/matlab-online.html">MATLAB Online</a>, both of which support <code>fminsearch</code> normally. The code and expected results below are still worth reading closely, since the concepts (and the exam questions on them) don't depend on running them here.
:::

## When Newton's Method and Gradient Descent Aren't Enough

Unit 2 fit straight lines to data with the normal equations, a closed-form solution: <code>β = (XᵀX)⁻¹Xᵀy</code>. That only works because the model is linear in its parameters. Most models worth fitting in biomedical engineering, dose-response curves, enzyme kinetics, exponential decay with unknown parameters, are nonlinear in their parameters, and there's no equivalent closed form.

Instead of a formula, nonlinear regression reframes fitting as an optimization problem: choose model parameters that minimize the total squared error between the model's predictions and the data.

:::eq label="SSE objective"
SSE = \sum_{i=1}^{m} (y_i - \hat{y}_i)^2
:::

There is typically no differentiable closed form for this expression in terms of the model parameters, so Newton's method and gradient descent (which both need a gradient) usually aren't directly usable here.

:::diagram caption="A smooth nonlinear curve fit through scattered data, with residuals (dashed) from a couple of points to the curve — exactly what fminsearch's SSE objective sums the squares of."
<svg viewBox="0 0 380 180" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Scatter of data points following a curved trend, with a smooth nonlinear best-fit curve through them and dashed residual segments from two points to the curve">
  <g font-family="DM Mono, monospace" font-size="12">
    <line x1="30" y1="150" x2="360" y2="150" stroke="currentColor" opacity="0.35"/>
    <line x1="30" y1="20" x2="30" y2="150" stroke="currentColor" opacity="0.35"/>

    <path d="M30,140 C90,130 110,60 170,40 C230,25 300,20 350,18" fill="none" stroke="#0b7a6e" stroke-width="2.5"/>

    <g fill="currentColor" opacity="0.65">
      <circle cx="50" cy="135" r="3"/>
      <circle cx="80" cy="112" r="3"/>
      <circle cx="100" cy="80" r="3"/>
      <circle cx="130" cy="52" r="3"/>
      <circle cx="160" cy="48" r="3"/>
      <circle cx="190" cy="33" r="3"/>
      <circle cx="220" cy="30" r="3"/>
      <circle cx="260" cy="24" r="3"/>
      <circle cx="300" cy="20" r="3"/>
      <circle cx="330" cy="19" r="3"/>
    </g>

    <line x1="100" y1="80" x2="100" y2="65" stroke="currentColor" opacity="0.5" stroke-dasharray="3 3"/>
    <line x1="190" y1="33" x2="190" y2="27" stroke="currentColor" opacity="0.5" stroke-dasharray="3 3"/>

    <text x="350" y="145" text-anchor="middle" fill="currentColor" opacity="0.55">x</text>
    <text x="20" y="18" text-anchor="end" fill="currentColor" opacity="0.55">y</text>
  </g>
</svg>
:::

## The Simplex (Nelder-Mead) Method

The Nelder-Mead simplex method sidesteps the need for a gradient entirely: it only evaluates the objective function itself, never its derivative. It works with a <strong>simplex</strong>, a set of <code>n+1</code> points in <code>n</code>-dimensional parameter space (a triangle in 2D, a tetrahedron in 3D).

Each iteration evaluates the objective at every simplex vertex, then moves the simplex away from its worst vertex using a few geometric operations:

- <strong>Reflection</strong>: reflect the worst point through the centroid of the others, a step away from the bad point.
- <strong>Expansion</strong>: if reflection is very good, try going further in that direction.
- <strong>Contraction</strong>: if reflection is poor, step only partway toward the centroid instead.
- <strong>Shrink</strong>: if nothing helps, contract the whole simplex toward the best point.

This repeats until the simplex shrinks small enough to call it converged, or a maximum iteration count is reached.

## fminsearch

MATLAB's <code>fminsearch</code> runs the simplex method for you: give it an objective function and a starting guess, and it returns the parameter vector that (locally) minimizes it.

```matlab caption="basic fminsearch usage — not runnable in this sandbox, see the callout above"
f = @(x) (x.^2.*cos(x) - x)/10;
xmin = fminsearch(f, 8)
```

`fminsearch` finds a single vector of values that minimizes a function of possibly several parameters at once, which is exactly what fitting a multi-parameter nonlinear model needs.

:::callout kind="mistake" title="Common mistake"
<code>fminsearch</code> has no guarantee of finding the global minimum, only a local one near wherever the simplex started. A poor initial guess for the model parameters can converge to a fit that looks nothing like the data. Always plot the fitted curve against the actual data afterward as a sanity check, don't trust the returned parameters blindly.
:::

## Worked Example: Dose-Response Curve Fitting

A mutated strain of Macarena Valley Fever (MVF) virus has caused a human outbreak outside Atlanta. As a CDC engineer, you've developed a gold nanoparticle drug delivery treatment, but it's expensive, so you want the minimum effective dose. Your team has 250 dose-response data points to fit against the classic Hill equation:

:::eq label="Hill equation"
R(d) = \frac{r_m - r_0}{1 + (r_{50}/d)^n} + r_0
:::

where <code>r_0</code> is the unaided recovery rate, <code>r_m</code> is the maximum response, <code>r_{50}</code> is the dose giving half the maximum response, and <code>n</code> (the Hill coefficient) controls how sharply the response transitions.

```matlab caption="fit the Hill equation with fminsearch — not runnable in this sandbox, see the callout above"
% dose, response: experimental data vectors, one point per measurement
hillModel = @(p, d) (p(1) - p(2)) ./ (1 + (p(3)./d).^p(4)) + p(2);
% p = [rm, r0, r50, n]

sse = @(p) sum((response - hillModel(p, dose)).^2);

p0 = [1, 0, 5, 1];    % initial guess: [rm, r0, r50, n]
pFit = fminsearch(sse, p0);

rm = pFit(1); r0 = pFit(2); r50 = pFit(3); n = pFit(4);
fprintf('rm=%.3f  r0=%.3f  r50=%.3f  n=%.3f\n', rm, r0, r50, n)
```

## More Nonlinear Models You'll Fit This Way

The same pattern, define the model, build an SSE objective, call <code>fminsearch</code> with a reasonable initial guess, applies to any nonlinear model. A few more that show up in this course:

| Model | Equation | Parameters to fit |
| --- | --- | --- |
| Poiseuille's law (blood flow vs. vessel diameter) | <code>Q(d) = C·d^n</code> | <code>C</code>, <code>n</code> |
| Enzyme substrate inhibition | <code>v([S]) = V_max·[S] / (K_m + [S] + [S]²/K_i)</code> | <code>V_max</code>, <code>K_m</code>, <code>K_i</code> |
| Newton's law of cooling | <code>T(t) = T_env + (T_0 − T_env)e^{−kt}</code> | <code>T_env</code>, <code>T_0</code>, <code>k</code> |

## Checklist: Nonlinear Curve Fitting with fminsearch

- Write the model as a function of a parameter vector <code>p</code> and the independent variable, so <code>fminsearch</code> can search over all parameters at once.
- Build the SSE objective as a function of <code>p</code> alone, capturing the data in a closure over <code>dose</code>/<code>response</code> (or whatever your variables are named).
- Pick an initial guess grounded in the data (a rough visual read of the plot, or known physical bounds) rather than an arbitrary default.
- After fitting, plot the fitted curve over the raw data and confirm it actually tracks the trend, don't trust the returned numbers on faith.

## Check Your Understanding

:::quickcheck
Q: Why can't the normal equations from Unit 2 be used to fit the Hill equation directly?
A: The normal equations solve linear least-squares problems, where the model is linear in its parameters. The Hill equation is nonlinear in <code>r_{50}</code> and <code>n</code> (they appear inside a ratio raised to a power), so there's no closed-form matrix solution, only iterative optimization.
:::

:::quickcheck
Q: What's the main risk of a poorly chosen initial guess when calling <code>fminsearch</code>?
A: <code>fminsearch</code> only finds a local minimum near where it starts, with no guarantee it's the global best fit. A bad initial guess can converge to parameters that fit the data poorly, so the result should always be checked by plotting the fit against the data.
:::

## Practice This Topic

:::practice unit=6 topic=nonlinear-regression
Practice: Nonlinear Regression & Curve Fitting
:::
