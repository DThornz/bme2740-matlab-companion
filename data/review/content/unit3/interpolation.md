---
id: interpolation
unit: 3
title: Interpolation
kicker: Unit 3 · Numerical Quadrature and Interpolation
summary: Estimating a value between known data points with linear, polynomial, and Lagrange interpolation, why an ill-conditioned polynomial fit is a real risk, and why interpolation and extrapolation are not the same kind of guess.
minutes: 11
---
## Why Interpolate?

Say you're on a team designing a miniaturized microphone for a cochlear implant, and you've sampled the microphone's resolution at a handful of single-tone frequencies. You need the resolution at a frequency you didn't test. **Interpolation** builds a function that passes exactly through your known data points and uses it to estimate values in between. It's a different problem from curve fitting: a least-squares fit (see the Unit 2 chapter on that) accepts some error at every point in exchange for a simpler model; interpolation insists on passing through every point you give it.

## Linear Interpolation

The simplest approach connects each pair of adjacent points with a straight line, using the point-slope formula:

:::eq label="Point-Slope"
y = \left(\frac{y_2 - y_1}{x_2 - x_1}\right)(x - x_1) + y_1
:::

- Simple to implement and fast: only basic arithmetic.
- Exact at the nodes, and reliable when the underlying data really is linear between samples.
- **Local**: each interpolated value depends only on its two nearest neighbors, so an error in one region doesn't propagate across the whole dataset.
- Cannot capture curvature, and produces visible "kinks" (discontinuous slope) at every node, which matters if you need a smooth result or its derivative.

## Polynomial Interpolation

Instead of one line per segment, fit a single polynomial $p(x)$ through *all* the data points at once:

:::eq label="Polynomial fit"
f(x) = \beta_0 + \beta_1 x + \beta_2 x^2 + \beta_3 x^3 + \ldots
:::

```matlab run caption="polyfit + polyval through sampled microphone data"
freq = [100 500 1000 2000 5000 8000];       % Hz
resolution = [0.82 0.91 0.95 0.93 0.85 0.7]; % arbitrary sensitivity units

p = polyfit(freq, resolution, 3);            % cubic fit
freq_query = 3000;
est = polyval(p, freq_query)
```

A polynomial interpolant is exact at every node, and once you have it, it's trivial to differentiate or integrate analytically. It comes with two real risks, though:

:::callout kind="mistake" title="Common mistake"
Forcing a polynomial through <em>every</em> data point, including noisy measurements, is not automatically a better model. As the polynomial's degree approaches (number of points − 1), the fit becomes numerically ill-conditioned (the same "determinant near zero" problem from Unit 2's <code>solving-ax-b</code> chapter) and starts oscillating wildly between the nodes even while it looks perfect exactly at them. Getting closer to a perfect fit at the nodes does not mean the curve is a better model of what's actually happening in between.
:::

That oscillation between nodes, worse near the edges of the data, is known as **Runge's phenomenon**. It's a strong reason to prefer a low-degree polynomial, or to switch strategies to Lagrange or spline interpolation below, rather than to keep raising the degree.

## The Lagrange Polynomial: Avoiding an Ill-Conditioned Fit

Fitting a polynomial by solving $A\vec\beta = \vec y$ directly can fail for exactly the reason Unit 2 warns about: if $A$ is ill-conditioned, that solve amplifies numerical error. The Lagrange polynomial sidesteps the matrix solve entirely.

For each data point $x_i$, construct a basis polynomial $l_i(x)$ that equals 1 at $x_i$ and 0 at every other node:

:::eq label="Lagrange basis"
l_i(x) = \prod_{j=0,\,j\neq i}^{n} \frac{x - x_j}{x_i - x_j}
:::

Then the interpolant is just a weighted sum of these basis polynomials, one term per data point:

:::eq label="Lagrange interpolant"
L(x) = \sum_{i=0}^{n} f(x_i)\, l_i(x)
:::

No matrix inversion, no normal equations, just a product and a sum. Working through it for the 4 points $(0,0), (1,1), (2,4), (3,3)$:

```matlab run caption="Lagrange interpolation through 4 points"
x = [0 1 2 3];
y = [0 1 4 3];
xq = linspace(0, 3, 100);

L = zeros(size(xq));
for i = 1:length(x)
    li = ones(size(xq));
    for j = 1:length(x)
        if j ~= i
            li = li .* (xq - x(j)) / (x(i) - x(j));
        end
    end
    L = L + y(i) * li;
end

plot(x, y, 'o', xq, L, '-')
```

The outer loop sums the $n+1$ weighted basis polynomials; the inner loop builds each basis polynomial as a running product over every node except its own.

## Piecewise (Spline) Interpolation

A single high-degree polynomial through a large dataset is exactly the ill-conditioned, oscillation-prone situation the previous section warns about. The usual fix is to stop using one polynomial for the whole dataset and instead fit several low-order polynomials, each valid over just one small interval between points. This is **piecewise**, or **spline**, interpolation. A cubic spline (degree-3 pieces) is the common choice because it's the lowest degree that lets both the curve and its slope stay continuous at every join.

```matlab
ys = spline(x, y, xx);   % xx: query points, ys: interpolated values
```

:::callout kind="sandbox" title="Sandbox Limitation"
<code>spline</code>/<code>ppval</code> haven't been verified to work in this browser's MATLAB sandbox, so this block is read-only. The Lagrange example above and <code>polyfit</code>/<code>polyval</code> are both confirmed to work here if you want an interactive alternative; verify <code>spline</code> in real MATLAB or MATLAB Online.
:::

## Interpolation vs. Extrapolation

Every method on this page is only trustworthy **between** your known data points. The moment you evaluate a fit outside the range spanned by your nodes, real interpolation, you're extrapolating, and none of the guarantees above apply: a polynomial that fits beautifully inside your data range can shoot off in a completely different direction just past its edge, especially once Runge's phenomenon is already in play.

:::callout kind="remember" title="Remember"
Before trusting any interpolated value, check whether your query point actually falls inside your data's range. If it doesn't, you're extrapolating, and the error bounds that make interpolation trustworthy no longer apply.
:::

## Which Tool Should I Use?

| Situation | MATLAB approach |
| --- | --- |
| Quick estimate between two nearby points | Linear interpolation (point-slope, or <code>interp1</code>) |
| Small dataset, need an analytic polynomial you can differentiate/integrate | <code>polyfit</code> / <code>polyval</code> |
| Want to avoid solving an ill-conditioned system directly | Lagrange polynomial |
| Larger dataset, need a smooth curve without high-degree oscillation | <code>spline</code> / <code>ppval</code> (unverified in this sandbox) |

## Check Your Understanding

:::quickcheck
Q: You fit a degree-9 polynomial through 10 noisy data points and it passes through every one exactly. Is this a good model?
A: Not necessarily. As the polynomial's degree approaches the number of points minus one, the fit becomes ill-conditioned and prone to Runge's phenomenon, wild oscillation between the nodes, even though it looks perfect exactly at the sampled points. A lower-degree fit, or a piecewise/spline approach, is usually more trustworthy for noisy data.
:::

:::quickcheck
Q: Why does the Lagrange polynomial avoid the numerical-conditioning problems that plague solving $A\vec\beta=\vec y$ directly for the polynomial coefficients?
A: It never sets up or solves that matrix system at all. Each basis polynomial $l_i(x)$ is built directly from products of $(x - x_j)$ terms, and the interpolant is just a weighted sum of those, so there's no ill-conditioned matrix to invert.
:::

## Practice This Topic

:::practice unit=3 topic=interpolation
Practice: Interpolation
:::
