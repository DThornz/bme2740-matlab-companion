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
