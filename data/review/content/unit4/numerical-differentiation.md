---
id: numerical-differentiation
unit: 4
title: Numerical Differentiation
kicker: Unit 4 · Numerical Integration
summary: Approximating a function’s derivative when you don’t have, or don’t trust, a closed-form expression — forward, backward, and central finite differences, and how their error shrinks as the step size h shrinks.
minutes: 9
---
## Why Approximate a Derivative?

Mathematical models of physical systems fall into two broad classes. A <strong>static</strong> model asks for an unknown number given an input, like the roots of <code>x^3 - 7x^2 + 41 = 0</code>. A <strong>dynamic</strong> model asks for an unknown function given an input, like <code>dx/dt = 2xt</code>. Most physiological phenomena are dynamic: heart rate, drug concentration, and population growth are all described by how they change, not by a fixed number.

Working with dynamic models means working with derivatives, and MATLAB can’t symbolically differentiate a function you don’t have a closed form for. Three situations come up constantly in practice:

- The derivative genuinely has no closed form, or the closed form is too painful to derive by hand.
- You’re simulating a system on a computer, one discrete time step at a time, with no continuous function to differentiate in the first place.
- The function is raw experimental data (a biomarker reading, a sensor trace) with no formula behind it at all.

In every one of these, you approximate the derivative from nearby function values instead of computing it exactly. That’s what a <strong>finite difference</strong> is.

## Three Finite-Difference Schemes

All three schemes approximate <code>f'(x)</code> using two nearby evaluations of <code>f</code>, separated by a small step size <code>h</code>.

:::eq label="forward"
f'(x) \cong \frac{f(x+h) - f(x)}{h}
:::

:::eq label="backward"
f'(x) \cong \frac{f(x) - f(x-h)}{h}
:::

:::eq label="centered"
f'(x) \cong \frac{f(x+h) - f(x-h)}{2h}
:::

- <strong>Forward difference</strong>: uses the current point and one step ahead. Natural when you only have data up to the current point and nothing beyond it yet.
- <strong>Backward difference</strong>: uses the current point and one step behind. Natural at the end of a data series, where there’s no “ahead” to look at.
- <strong>Centered difference</strong>: uses one step ahead and one step behind, skipping the current point entirely. More accurate than either one-sided scheme, at the cost of needing data on both sides.

:::diagram caption="Forward, backward, and central difference secant lines through the same point; the central difference spans both sides and most closely tracks the true tangent."
<svg viewBox="0 0 400 185" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A curve with forward, backward, and central difference secant lines drawn through a point of interest, with the central difference highlighted as the closest match to the true tangent">
  <path d="M40,155 C70,145 90,138 100,130 C115,122 128,116 140,110 C160,100 180,90 200,80 C220,70 245,62 260,55 C285,45 305,40 320,38 C335,36 350,33 360,30" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.6"/>
  <line x1="160" y1="98.3" x2="240" y2="61.7" stroke="currentColor" stroke-width="1" stroke-dasharray="3,3" opacity="0.3"/>
  <line x1="200" y1="80" x2="260" y2="55" stroke="currentColor" stroke-width="1.5" opacity="0.6"/>
  <line x1="140" y1="110" x2="200" y2="80" stroke="currentColor" stroke-width="1.5" opacity="0.6"/>
  <line x1="140" y1="110" x2="260" y2="55" stroke="#0b7a6e" stroke-width="2.5"/>
  <circle cx="140" cy="110" r="3" fill="currentColor"/>
  <circle cx="200" cy="80" r="3.5" fill="currentColor"/>
  <circle cx="260" cy="55" r="3" fill="currentColor"/>
  <line x1="140" y1="110" x2="140" y2="165" stroke="currentColor" opacity="0.2" stroke-dasharray="2,3"/>
  <line x1="200" y1="80" x2="200" y2="165" stroke="currentColor" opacity="0.2" stroke-dasharray="2,3"/>
  <line x1="260" y1="55" x2="260" y2="165" stroke="currentColor" opacity="0.2" stroke-dasharray="2,3"/>
  <g font-family="DM Mono, monospace" font-size="11" text-anchor="middle">
    <text x="140" y="178" fill="currentColor" opacity="0.6">x-h</text>
    <text x="200" y="178" fill="currentColor" opacity="0.6">x</text>
    <text x="260" y="178" fill="currentColor" opacity="0.6">x+h</text>
    <text x="230" y="52" fill="currentColor" opacity="0.6">forward</text>
    <text x="170" y="98" fill="currentColor" opacity="0.6">backward</text>
  </g>
  <text x="392" y="98" font-family="DM Mono, monospace" font-size="11" text-anchor="end" fill="#0b7a6e">central (best)</text>
</svg>
:::

## Deriving Forward Difference from the Taylor Series

Unit 1 introduced the Taylor series as a way to approximate a function near a point. The same expansion, rearranged, is where the forward difference formula actually comes from:

:::eq label="(1)"
f(x) = f(a) + \frac{f^{(1)}(a)(x-a)}{1!} + \frac{f^{(2)}(a)(x-a)^2}{2!} + \frac{f^{(3)}(a)(x-a)^3}{3!} + \cdots
:::

Solve this for the first-derivative term <code>f⁽¹⁾(a)</code>, then substitute <code>h = x − a</code>:

:::eq label="(2)"
f^{(1)}(a) \cong \frac{f(a+h) - f(a)}{h} + O(h)

This is exactly the forward-difference formula, with an explicit error term attached. <code>O(h)</code> (“big-O of h”) describes how the leftover, neglected terms shrink as h shrinks: the error scales linearly with h, so making h 10× smaller makes the error roughly 10× smaller.
:::

## Centered Difference Is More Accurate

Write the Taylor expansion twice, once for the forward point and once for the backward point:

:::eq label="forward point"
f(a+h) = f(a) + f^{(1)}(a)h + \frac{f^{(2)}(a)h^2}{2!} + \frac{f^{(3)}(a)h^3}{3!} + \cdots
:::

:::eq label="backward point"
f(a-h) = f(a) - f^{(1)}(a)h + \frac{f^{(2)}(a)h^2}{2!} - \frac{f^{(3)}(a)h^3}{3!} + \cdots
:::

Subtracting the second from the first cancels every even-order term, including the <code>f''(a)</code> term that dominates the one-sided schemes’ error:

:::eq label="(3)"
f(a+h) - f(a-h) = 2h f^{(1)}(a) + O(h^2)
:::

:::eq label="(4)"
f^{(1)}(a) = \frac{f(a+h) - f(a-h)}{2h} + O(h^2)
:::

The centered scheme’s error is <code>O(h²)</code> instead of <code>O(h)</code>: halving <code>h</code> quarters the error, not just halves it. That’s the whole reason to prefer it whenever you have data on both sides of the point you care about.

:::callout kind="note" title="Note"
<code>gradient(y)</code> assumes equally spaced x-values and uses one-sided differences at the endpoints, centered differences everywhere in between — it’s doing exactly this scheme automatically. <code>diff(x)</code> approximates the spacing itself (<code>diff(x) ≈ h</code>) when you’re not sure your x-values are perfectly uniform.
:::

## Worked Example: Estimating a Rate from Noisy Data

Suppose a stress-biomarker index was sampled once every 30 minutes after a drug was administered, and the readings are noisy the way real biomarker data usually is. The rate of change per hour is what a clinician actually needs, not the raw index itself.

```matlab run caption="centered-difference rate of change from sampled data"
t = 0:0.5:8;                          % hours since drug administration
noise = 0.15*sin(11*t) + 0.05*randn(size(t));
biomarkerIndex = 4 - 0.6*t + 0.9*exp(-0.3*t) + noise;

rate = gradient(biomarkerIndex, t);   % centered difference, per-hour rate
plot(t, rate)
xlabel('Hours since drug administration'); ylabel('d(Index)/dt (per hour)')
```

Taking the derivative of the raw noisy signal directly (say, with a plain forward difference on unsmoothed data) amplifies every bit of that noise, since each derivative estimate is a difference divided by a small `h`. In practice you’d smooth the signal first (a moving average, `smoothdata`) and *then* differentiate — differentiating noisy data is one of the more common ways to accidentally manufacture a result that looks meaningful but is mostly noise.

## Choosing a Step Size h

Smaller `h` should mean a more accurate approximation, and it does — down to a point. Two competing error sources are in tension:

- <strong>Truncation error</strong> — the <code>O(h)</code> or <code>O(h²)</code> term from the Taylor series we dropped. This *shrinks* as h shrinks.
- <strong>Round-off error</strong> — floating-point subtraction of two very close numbers (<code>f(x+h) − f(x)</code>, when h is tiny) loses precision. This *grows* as h shrinks.

Total error is the sum of both, so it has a minimum somewhere in the middle, not at the smallest h you can type. Plotting error against h on a log-log scale (`loglog`, or `semilogx`/`semilogy` for one axis at a time) is the standard way to see both regimes and find where they cross.

## Check Your Understanding

:::quickcheck
Q: Why is the centered difference generally preferred over the forward or backward difference, when you have the option to use it?
A: Its error is <code>O(h²)</code> instead of <code>O(h)</code> — halving h quarters the centered scheme’s error but only halves a one-sided scheme’s error, so it converges to the true derivative much faster as h shrinks.
:::

:::quickcheck
Q: You keep shrinking h to reduce the error in a finite-difference derivative, but past a certain point the error starts getting *worse* again. What’s happening?
A: Floating-point round-off error is taking over. <code>f(x+h) − f(x)</code> becomes a subtraction of two nearly-identical numbers once h is small enough, which loses precision — that round-off error grows as h shrinks, eventually outweighing the shrinking truncation error.
:::

## Practice This Topic

:::practice unit=4 topic=numerical-differentiation
Practice: Numerical Differentiation
:::
