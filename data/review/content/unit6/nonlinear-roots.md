---
id: nonlinear-roots
unit: 6
title: Nonlinear Equations & Root Finding
kicker: Unit 6 · Nonlinear Equations and Optimization
summary: Finding the zero-crossings of a nonlinear function by hand with Newton's method, understanding when the method fails to converge, and reaching for MATLAB's built-in fzero once you understand what it's doing.
minutes: 10
---
## Why Root-Finding?

Most functions worth modeling are nonlinear, which means the linear-algebra tools from Units 2 and earlier (backslash, the normal equations) no longer guarantee an exact answer. When a function can't be solved directly, its <strong>roots</strong>, the input values where it crosses zero, are often the first place to look, since they show up constantly in biomedical modeling:

- <strong>Electrophysiology and ion-channel modeling</strong>: when does the current change from inflow to outflow?
- <strong>Cardiovascular modeling</strong>: when does pressure cross from positive (valve open) to negative (valve closing)?
- <strong>Pharmacokinetics</strong>: at what time is a drug fully consumed by the body (concentration reaches zero)?
- <strong>Biomechanics of motion and balance</strong>: when does a patient's acceleration turn negative, indicating a fall?

Formally, a root <code>x_r</code> of <code>f</code> is an input where <code>f(x_r) = 0</code>.

## Newton's Method

Newton's method is the classic root-finding technique, derived from the Taylor series. It requires <code>f(x)</code> and <code>f'(x)</code> to be continuous and differentiable, but in exchange it converges very fast.

Expanding <code>f</code> around a guess <code>x_0</code> and setting the result to zero (since we want the root) gives an update rule for a better guess:

:::eq label="Newton's update"
x_{i+1} = x_i - \frac{f(x_i)}{f'(x_i)}
:::

In words: at each guess, follow the tangent line until it crosses zero, and let that crossing be the next guess.

<figure class="review-photo">
  <div class="review-photo-card"><img src="assets/img/newton-iteration.svg" alt="A curve with a tangent line drawn at an initial guess x1, crossing the x-axis at x2, which becomes the next guess and repeats toward the root." loading="lazy"></div>
  <figcaption>The textbook picture of Newton's method: each tangent line's crossing becomes the next guess.<span class="review-photo-credit">Newton iteration, Olegalexandrov / Pbroks13, public domain, via <a href="https://commons.wikimedia.org/wiki/File:Newton_iteration.svg" target="_blank" rel="noopener">Wikimedia Commons</a></span></figcaption>
</figure>

- Select an initial guess <code>x_0</code>, ideally read off a quick plot of the function so it's already close to the suspected root.
- Follow the tangent line at <code>f(x_i)</code> until it crosses <code>y = 0</code>.
- Let <code>x_{i+1}</code> be that crossing point.
- Repeat until <code>x_{i+1}</code> and <code>x_i</code> are close enough (within your chosen tolerance).

:::diagram caption="Newton's method follows the tangent line at each guess down to the x-axis to produce the next, closer guess."
<svg viewBox="0 0 380 190" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A curve crossing the x-axis at the root, with a tangent line from an initial guess x0 down to x1, and a second tangent from the curve at x1 down to x2, converging toward the root">
  <g font-family="DM Mono, monospace" font-size="12">
    <line x1="20" y1="150" x2="360" y2="150" stroke="currentColor" opacity="0.4"/>
    <text x="368" y="154" fill="currentColor" opacity="0.6">x</text>

    <path d="M40,20 C100,25 150,40 200,70 C240,95 270,120 290,140 C300,146 310,152 330,165" fill="none" stroke="currentColor" opacity="0.55" stroke-width="1.5"/>
    <text x="45" y="14" fill="currentColor" opacity="0.6">f(x)</text>

    <circle cx="90" cy="33" r="3" fill="currentColor"/>
    <text x="90" y="20" text-anchor="middle" fill="currentColor">x0</text>

    <line x1="90" y1="33" x2="180" y2="150" stroke="currentColor" opacity="0.5"/>
    <circle cx="180" cy="150" r="3" fill="currentColor"/>
    <text x="180" y="168" text-anchor="middle" fill="currentColor">x1</text>

    <line x1="180" y1="150" x2="180" y2="66" stroke="currentColor" opacity="0.3" stroke-dasharray="2 3"/>
    <circle cx="180" cy="66" r="3" fill="currentColor"/>

    <line x1="180" y1="66" x2="250" y2="150" stroke="currentColor" opacity="0.5"/>
    <circle cx="250" cy="150" r="3" fill="currentColor"/>
    <text x="250" y="168" text-anchor="middle" fill="currentColor">x2</text>

    <circle cx="300" cy="150" r="4.5" stroke="#0b7a6e" stroke-width="2.5" fill="rgba(11,122,110,.12)"/>
    <text x="300" y="168" text-anchor="middle" fill="#0b7a6e">root</text>
  </g>
</svg>
:::

```matlab run caption="Newton's method by hand, root of f(x) = x² − 22x − 230"
f  = @(x) x.^2 - 22*x - 230;
fp = @(x) 2*x - 22;

x0 = -9;
tol = 0.01;
maxIter = 100;

for i = 1:maxIter
    x1 = x0 - f(x0)/fp(x0);
    if abs(x1 - x0) < tol
        break
    end
    x0 = x1;
end

fprintf('Root found at x = %.4f after %d iterations\n', x1, i)
```

## When Newton's Method Fails

Newton's method is fast and stable for well-behaved functions, but a handful of situations can break it:

- The slope at your current guess points <strong>away</strong> from the root and back toward where you started, so the iteration bounces back and forth without ever converging.
- The chosen <code>x_0</code> happens to land exactly where the tangent line loops back to <code>x_0</code> itself, a feedback loop with no way out except picking a different starting guess.
- The derivative <code>f'(x_i)</code> is zero or very close to zero at some iterate, which makes the update divide by (nearly) zero and send the next guess flying off.

:::callout kind="mistake" title="Common mistake"
A bad initial guess doesn't always announce itself with an error. The loop may simply run to <code>maxIter</code> without ever converging, or oscillate between two values. Always sanity-check a Newton's-method result against a quick plot of the function near the reported root.
:::

## fzero: MATLAB's Built-in Root Finder

Doing this by hand is worth understanding once, but MATLAB has a built-in function, <code>fzero</code>, that runs the same kind of iteration for you: give it a function handle and an initial guess, and it reports the root.

## Worked Example: Heart Valve Pressure Rating

As an FDA reviewer, you're evaluating an artificial heart valve. Its elastic modulus means it can withstand up to 110 mmHg of pressure for up to 0.12 seconds before failing. The governing pressure equation during the cardiac cycle is:

:::eq label="P(t)"
P(t) = 1300t - 3000t^2
:::

The valve should be rejected if pressure reaches 110 mmHg before <code>t = 0.12</code> s.

```matlab run caption="find when the valve first reaches 110 mmHg"
P = @(t) 1300*t - 3000*t.^2;
f = @(t) P(t) - 110;   % root of this f is where P(t) = 110

t_cross = fzero(f, 0.1)

if t_cross < 0.12
    disp('The valve is NOT suitable for use. It fails under normal heart conditions.')
else
    disp('The valve is suitable for use. It can withstand normal heart pressures.')
end
```

## Hand-Rolled Newton vs. fzero

| | Hand-rolled Newton's method | fzero |
| --- | --- | --- |
| What you supply | <code>f</code> and its derivative <code>f'</code>, written out by hand | Just <code>f</code> — no derivative needed |
| When to use it | Learning the method, or when you specifically need to see/control each iteration | Everyday root-finding once you understand what's happening underneath |
| Failure mode | Silent non-convergence if the derivative misbehaves near a guess | Reports an error or a warning rather than looping forever |

## Check Your Understanding

:::quickcheck
Q: Why does Newton's method require <code>f'(x)</code> in addition to <code>f(x)</code>?
A: Each iteration follows the tangent line at the current guess to find where it crosses zero, and the tangent line's slope is exactly <code>f'(x)</code>. Without it, there's no way to know which direction, or how far, to step.
:::

:::quickcheck
Q: Your Newton's-method loop runs to <code>maxIter</code> without converging. What are two possible causes?
A: The tangent line at some guess points away from the true root (bouncing the iteration back and forth), or the initial guess landed on a point where the derivative is zero or near-zero, sending the next guess far away. A poor initial guess not close enough to the actual root is the usual underlying cause of both.
:::

## Practice This Topic

:::practice unit=6 topic=nonlinear-roots
Practice: Nonlinear Equations & Root Finding
:::
