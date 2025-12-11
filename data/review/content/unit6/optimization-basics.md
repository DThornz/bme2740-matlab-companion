---
id: optimization-basics
unit: 6
title: Optimization Fundamentals
kicker: Unit 6 · Nonlinear Equations and Optimization
summary: Locating local maxima and minima with a second-derivative Newton step and with gradient descent, understanding the tradeoffs between them, and reaching for MATLAB's built-in fminbnd once you understand what it's doing.
minutes: 10
---
## From Roots to Extrema

Root-finding answers "where does this function cross zero?" Optimization asks a different question: "where is this function highest or lowest?" The two are related, since the peaks and valleys of a function occur exactly where its derivative <code>f'(x)</code> crosses zero, so most of Unit 6's optimization tools reuse root-finding machinery on <code>f'</code> instead of <code>f</code>.

An important caveat: with linear algebra or root-finding, you can always verify how well you did. With nonlinear optimization, in general, there's no way to guarantee you've found the <strong>global</strong> best answer instead of just a good local one.

## The Second-Derivative Test

A point <code>x*</code> where <code>f'(x*) = 0</code> is called a <strong>critical point</strong>, since the function is momentarily flat there. Three cases distinguish what kind of critical point it is:

- <code>f''(x*) > 0</code>: a local minimum.
- <code>f''(x*) < 0</code>: a local maximum.
- <code>f''(x*) = 0</code>: inconclusive from the second derivative alone, could be an inflection point or an extreme point.

Newton's method applies here too, just aimed at the derivative instead of the function itself:

:::eq label="Newton's method for optimization"
x_{k+1} = x_k - \frac{f'(x_k)}{f''(x_k)}
:::

This requires <code>f</code> to be twice differentiable near <code>x_0</code>, and it runs into the same kind of trouble as ordinary Newton's method if <code>f''(x_k)</code> is zero or nearly zero near the critical point.

```matlab run caption="Newton's method for optimization: local extremum of f(x) = (x²cos(x) − x)/10 near x = 5"
f   = @(x) (x.^2.*cos(x) - x)/10;
fp  = @(x) (2*x.*cos(x) - x.^2.*sin(x) - 1)/10;
fpp = @(x) (2*cos(x) - 4*x.*sin(x) - x.^2.*cos(x))/10;

x0 = 5;
tol = 0.01;
maxIter = 100;

for k = 1:maxIter
    x1 = x0 - fp(x0)/fpp(x0);
    if abs(x1 - x0) < tol
        break
    end
    x0 = x1;
end

if fpp(x1) > 0
    disp('Local Minimum')
else
    disp('Local Maximum')
end
fprintf('at x = %.4f, f(x) = %.4f\n', x1, f(x1))
```

## Gradient Descent

Gradient descent takes a different approach: instead of requiring the second derivative, it repeatedly takes a step in the direction of steepest descent, with a step size you control directly instead of letting the derivative dictate it.

:::eq label="gradient descent update"
x_{k+1} = x_k - \alpha \nabla f(x_k)
:::

<code>α</code> (the <strong>learning rate</strong>) is the size of each step. Too large and the iteration overshoots and never settles; too small and it takes forever to converge.

- Select an initial guess <code>x_0</code>.
- Evaluate the gradient (derivative) <code>∇f(x_k)</code> at the current point.
- Take a step of size <code>α</code> against the gradient: <code>x_{k+1} = x_k − α∇f(x_k)</code>.
- Repeat until <code>x_k</code> stops changing by more than your tolerance.

:::diagram caption="Gradient descent steps down the slope toward the minimum, taking smaller steps as the gradient flattens near the bottom."
<svg viewBox="0 0 340 180" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A bowl-shaped curve with a series of dots stepping down the slope toward the minimum, each step smaller than the last, with the minimum highlighted">
  <g font-family="DM Mono, monospace" font-size="12">
    <path d="M40,20 C90,110 130,145 170,150 C210,145 250,110 300,20" fill="none" stroke="currentColor" opacity="0.5" stroke-width="1.5"/>

    <polyline points="60,57 100,112 130,138 150,147 160,149 170,150" fill="none" stroke="currentColor" opacity="0.35" stroke-dasharray="3 3"/>
    <g fill="currentColor">
      <circle cx="60" cy="57" r="4"/>
      <circle cx="100" cy="112" r="3.5"/>
      <circle cx="130" cy="138" r="3"/>
      <circle cx="150" cy="147" r="2.5"/>
      <circle cx="160" cy="149" r="2"/>
    </g>

    <text x="60" y="45" text-anchor="middle" fill="currentColor" opacity="0.6">x0</text>

    <circle cx="170" cy="150" r="5" stroke="#0b7a6e" stroke-width="2.5" fill="rgba(11,122,110,.12)"/>
    <text x="170" y="170" text-anchor="middle" fill="#0b7a6e">minimum</text>
  </g>
</svg>
:::

```matlab run caption="gradient descent on the same function, near the same starting point"
f  = @(x) (x.^2.*cos(x) - x)/10;
fp = @(x) (2*x.*cos(x) - x.^2.*sin(x) - 1)/10;

x0 = 5;
alpha = 0.2;
tol = 0.01;
maxIter = 500;

for k = 1:maxIter
    x1 = x0 - alpha*fp(x0);
    if abs(x1 - x0) < tol
        break
    end
    x0 = x1;
end

fprintf('Converged near x = %.4f after %d steps\n', x1, k)
```

The worked example above steps down a 1-D curve, but the same idea scales to a multivariable surface: each step still follows the (now vector-valued) gradient downhill, curving around the contours of the surface toward the minimum.

<figure class="review-photo">
  <div class="review-photo-card"><img src="assets/img/gradient-descent.svg" alt="Contour lines of a two-variable surface, with a path of gradient-descent steps curving downhill toward the surface's minimum." loading="lazy"></div>
  <figcaption>Gradient descent on a two-variable surface: the path bends to stay perpendicular to each contour line.<span class="review-photo-credit">Gradient descent, Zerodamage (after Oleg Alexandrov), public domain, via <a href="https://commons.wikimedia.org/wiki/File:Gradient_descent.svg" target="_blank" rel="noopener">Wikimedia Commons</a></span></figcaption>
</figure>

:::callout kind="note" title="Minimum or maximum?"
Flip the sign of the gradient step (<code>x_{k+1} = x_k + α∇f(x_k)</code>) to climb toward a maximum instead of descending toward a minimum. Since the method only searches for a flat point, it's still worth checking the second derivative afterward to confirm which kind of critical point you landed on, and that it isn't a saddle point.
:::

## Newton's Method vs. Gradient Descent

| | Newton's method (2nd-derivative) | Gradient descent |
| --- | --- | --- |
| What it needs | <code>f'</code> and <code>f''</code> | Just <code>f'</code> |
| Convergence speed | Fast, when it works | Slower, tunable via <code>α</code> |
| Sensitivity to starting point | Can fail badly with a poor initial guess or where <code>f''≈0</code> | More forgiving of a rough initial guess |
| Tuning required | None beyond the initial guess | Learning rate <code>α</code> must be chosen carefully |

## fminbnd: MATLAB's Built-in Bounded Optimizer

For everyday single-variable optimization over a known interval, MATLAB's <code>fminbnd</code> does this search for you without hand-writing either loop above.

```matlab run caption="fminbnd searches an interval directly"
f = @(x) (x.^2.*cos(x) - x)/10;
[xmin, fmin] = fminbnd(f, -12, 12)
```

`fminbnd` only finds minima directly; to find a maximum, minimize the negated function (`@(x) -f(x)`) and negate the result back.

## Check Your Understanding

:::quickcheck
Q: At a critical point, <code>f''(x*)</code> comes back as exactly 0. What does that tell you?
A: The second-derivative test is inconclusive at that point: it could be an inflection point or an extreme point, and you'd need to check higher-order derivatives to tell which. It does not mean the point isn't a valid critical point, only that this particular test can't classify it.
:::

:::quickcheck
Q: Your gradient descent run overshoots and oscillates without settling. What's the most likely fix?
A: The learning rate <code>α</code> is too large. Reducing it (at the cost of needing more iterations to converge) is the usual fix; an <code>α</code> that's too small instead makes convergence very slow but rarely causes oscillation.
:::

## Practice This Topic

:::practice unit=6 topic=optimization-basics
Practice: Optimization Fundamentals
:::
