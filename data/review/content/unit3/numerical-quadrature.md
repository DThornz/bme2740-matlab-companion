---
id: numerical-quadrature
unit: 3
title: Numerical Quadrature
kicker: Unit 3 · Numerical Quadrature and Interpolation
summary: Approximating a definite integral when there's no closed-form antiderivative, using the trapezoidal and midpoint rules, Simpson's rules, and MATLAB's built-in trapz and integral.
minutes: 12
---
## Why Numerical Integration?

The Fundamental Theorem of Calculus gives you an exact value for $\int_a^b f(x)\,dx$ whenever you can find an antiderivative $F(x)$ of $f$. Plenty of functions that show up in real modeling don't have one in terms of elementary functions: $e^{x^2}$, $\sqrt{\cos(x)}$, and $1/\ln(x)$ all have perfectly well-defined definite integrals with no closed-form formula for them. The same problem shows up when you don't have a function at all, only sampled data, a signal from an instrument or a set of measurements at discrete time points.

Numerical quadrature sidesteps the problem: instead of finding an antiderivative, approximate the area under the curve directly from a finite set of function evaluations or data samples.

## The Trapezoidal Rule

Split the interval $[a,b]$ into $n$ segments of equal width $h = (b-a)/n$, and approximate the curve over each segment with a straight line instead of a rectangle. Each segment becomes a trapezoid; summing their areas and simplifying the repeated terms gives:

:::eq label="Trapezoidal Rule"
\int_a^b f(x)\,dx \approx \frac{h}{2}(y_a + y_b) + h\sum_{k=1}^{n-1} y_k
:::

where $y_a = y(1)$ and $y_b = y(\text{end})$ in MATLAB indexing. MATLAB implements this directly as <code>trapz</code>:

```matlab run caption="trapz on 5 sampled points"
x = [0 0.5 1.0 1.5 2.0];
y = 3 + 1./exp(x);

IntVal = trapz(x, y)
```

:::callout kind="remember" title="Remember"
<code>trapz(x, y)</code> works on any data you already have, sampled points, sensor output, simulation results, not only on a function you can call. That's why it's the default tool when you're integrating real measurements instead of a formula.
:::

## Simpson's Rules: Fitting a Curve Instead of a Line

The trapezoidal rule approximates each segment with a degree-1 polynomial (a line). Fitting a higher-degree polynomial through more points per segment gives a better approximation of curved functions, at the cost of a more involved formula.

**Simpson's 1/3 rule** fits a parabola through 3 points at a time (2 segments), so it needs an even number of segments:

:::eq label="Simpson's 1/3"
\int_a^b f(x)\,dx \approx \frac{h}{3}\Big[f(a) + 4\!\!\sum_{k=1,3,5,\ldots}^{n-1}\!\!f(x_k) + 2\!\!\sum_{k=2,4,6,\ldots}^{n-2}\!\!f(x_k) + f(b)\Big]
:::

**Simpson's 3/8 rule** fits a cubic through 4 points at a time (3 segments), so it needs a segment count that's a multiple of 3. The two rules can be mixed to handle an odd total segment count that neither one alone divides evenly.

| Rule | Fits | Segments needed |
| --- | --- | --- |
| Midpoint | degree-0 (constant) | any |
| Trapezoidal | degree-1 (line) | any |
| Simpson's 1/3 | degree-2 (parabola) | even |
| Simpson's 3/8 | degree-3 (cubic) | multiple of 3 |

This family, evaluating the integrand at equally spaced points and integrating an increasing-degree polynomial through them, is called **Newton-Cotes quadrature**.

```matlab run caption="hand-rolled Simpson's 1/3 rule"
f = @(x) sin(x/pi).^3;
a = 0; b = 10; n = 14;   % n must be even
h = (b - a) / n;
x = a:h:b;
y = f(x);

A = h/3 * (y(1) + 4*sum(y(2:2:end-1)) + 2*sum(y(3:2:end-2)) + y(end))
```

## Step Size, Convergence, and When to Stop

Every one of these rules gets more accurate as $h$ shrinks and $n$ grows, but that accuracy isn't free. Too few segments and the approximation underestimates or overestimates the true area, sometimes badly, on a curve that changes quickly. Too many segments waste computation on regions where the function barely moves. In practice, you don't know the exact answer (that's the whole reason you're approximating), but you can run the same integral at increasing $n$ and watch the estimate converge: once increasing $n$ further stops changing the answer within the precision you need, you've gone far enough.

:::callout kind="mistake" title="Common mistake"
A finer step size is not automatically "more correct." It costs more computation for a shrinking return once you're already near convergence, and an extremely small $h$ can start losing accuracy to floating-point round-off instead of gaining it. Pick a step size by checking convergence, not by reflexively making it as small as possible.
:::

## Adaptive Quadrature: integral()

A function that changes slowly in some regions and rapidly in others is awkward for a fixed step size: small enough to resolve the fast region wastes effort everywhere else, large enough to be efficient elsewhere misses detail where it matters. Adaptive quadrature automatically shrinks the segment size where the function is changing quickly and widens it where the function is smooth, similar to using small brush strokes for detail and broad strokes for flat areas of a painting.

MATLAB's built-in <code>integral</code> function implements adaptive quadrature (Gauss/Lobatto-based) automatically:

```matlab
I = integral(@(x) sin(x/pi).^3, 0, 4)
```

:::callout kind="sandbox" title="Sandbox Limitation"
<code>integral</code> hasn't been verified to work in this browser's MATLAB sandbox (it isn't on the confirmed-working list), so the block above is read-only rather than an interactive Try-it. <code>trapz</code> and the hand-rolled Simpson's rule above are both confirmed to work here if you want to experiment interactively; verify <code>integral</code> in real MATLAB or MATLAB Online.
:::

## Worked Example: Drug Concentration AUC

In pharmacokinetics, a two-compartment model gives a drug's blood concentration over time as a sum of two decaying exponentials:

:::eq label="C(t)"
C(t) = Ae^{-\alpha t} + Be^{-\beta t}
:::

The **area under the curve (AUC)** of $C(t)$ summarizes total drug exposure, a standard quantity in dosing and bioavailability studies. With only sampled concentration measurements (not a clean formula you'd integrate by hand), this is exactly the kind of integral <code>trapz</code> is for:

```matlab run caption="AUC of a two-compartment concentration curve"
A = 8; alpha = 0.4; B = 4; beta = 0.05;
t = 0:0.25:24;                      % sampled every 15 minutes over 24 hours
C = A*exp(-alpha*t) + B*exp(-beta*t);

AUC = trapz(t, C)
```

Other places the same idea shows up in this course's biomedical examples: integrating acceleration from a force plate to get velocity, then integrating velocity to get displacement (biomechanics); and integrating voltage over the QRS complex of an ECG to get an area proportional to ventricular muscle mass (cardiac analysis). All three are "integrate sampled data, not a formula", the same job for the same tool.

## Which Tool Should I Use?

| Situation | MATLAB approach |
| --- | --- |
| You have sampled/measured data, not a function | <code>trapz(x, y)</code> |
| You have a function handle and want an accurate answer fast | <code>integral(f, a, b)</code> (unverified in this sandbox) |
| You want to see the mechanics of the approximation yourself | Hand-rolled midpoint, trapezoidal, or Simpson's rule |

## Check Your Understanding

:::quickcheck
Q: Why can't you just use the Fundamental Theorem of Calculus for every integral you need in an engineering model?
A: It requires a known antiderivative $F(x)$ of $f(x)$. Many functions that arise from real models (or that you only know as sampled data) have no closed-form antiderivative, so you approximate the area under the curve directly instead.
:::

:::quickcheck
Q: You're told to use Simpson's 1/3 rule with 15 segments. What's wrong with that?
A: Simpson's 1/3 rule fits a parabola through 3 points at a time (2 segments per fit), so it needs an even number of segments. 15 is odd; you'd need to either adjust to an even segment count or combine Simpson's 1/3 and 3/8 rules to cover an odd total.
:::

## Practice This Topic

:::practice unit=3 topic=numerical-quadrature
Practice: Numerical Quadrature
:::
