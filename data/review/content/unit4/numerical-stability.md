---
id: numerical-stability
unit: 4
title: Step Size, Error & Stability
kicker: Unit 4 · Numerical Integration
summary: Why a numerical solution can drift away from the true one even when it "runs without error," what stiffness means, and how step size and stability interact for explicit methods like Forward Euler.
minutes: 10
---
## Local Error vs. Global Error

Every Euler step introduces a small error — the truncation error left over from cutting off the Taylor series after the first-derivative term, <code>O(h)</code> for Forward and Backward Euler. That's the <strong>local</strong> error: the error introduced by one step, assuming the previous step was exact.

In practice, no previous step is exact. Each step's local error carries forward and compounds with the next one, so after many steps the accumulated <strong>global</strong> error is what actually matters. For both Forward and Backward Euler, global error is also <code>O(h)</code> — first-order accurate overall, the same order as one local step, since the errors accumulate roughly proportionally to the number of steps taken.

## Worked Example: Watching Error Compound

Consider approximating <code>ds/dt = e^t(8cos(8t) + sin(8t))</code> with Forward Euler, starting at <code>s(0) = 0</code>. Because the true solution involves <code>e^t</code>, which amplifies whatever it multiplies, any small numerical error made early gets magnified at every later step.

```matlab run caption="watching Forward Euler drift away from the exact solution"
h = 0.02;
t = 0:h:3;
s = zeros(size(t));
s(1) = 0;

for ii = 1:length(t)-1
    s(ii+1) = s(ii) + h*(exp(t(ii))*(8*cos(8*t(ii)) + sin(8*t(ii))));
end

sExact = exp(t).*sin(8*t);   % antiderivative of the right-hand side

subplot(2,1,1); plot(t, s, t, sExact, '--'); legend('Forward Euler', 'Exact')
subplot(2,1,2); plot(t, s - sExact); ylabel('Error')
```

The error doesn't stay flat — it grows over the simulated interval, tracking the same exponential growth that's baked into the underlying solution. Reducing `h` shrinks the error at any single point, roughly linearly (per the `O(h)` global order), but it can't prevent this kind of growth if the underlying system is itself unstable or rapidly changing.

## Stiffness

A problem is <strong>stiff</strong> on some interval if the step size needed to keep an explicit method like Forward Euler *stable* is much smaller than the step size accuracy alone would call for. In plain terms: some part of the system changes very fast, and Forward Euler has to take tiny steps to avoid blowing up in that fast-changing region, even though the rest of the system barely needs that much resolution.

Stiffness isn't about how hard a problem is to solve exactly — a stiff ODE can have a perfectly smooth, well-behaved true solution. It's specifically about what an *explicit* method is forced to do to stay numerically stable while approximating it. Backward Euler (previous chapter) tolerates much larger step sizes on stiff problems, because using the future slope implicitly damps the fast-changing component instead of letting it amplify.

## Breaking Forward Euler: A Nonlinear Growth Model

Logistic growth — population growth that levels off near a carrying capacity <code>K</code> instead of growing forever — is a good way to see instability firsthand:

:::eq label="logistic growth"
\frac{dP}{dt} = rP\left(1 - \frac{P}{K}\right)
:::

```matlab run caption="same ODE, two step sizes — compare the plots"
r = 1.8; K = 10; P0 = 1; tEnd = 10;

h = 0.1;                      % small step: should track the S-curve smoothly
t1 = 0:h:tEnd;  P1 = zeros(size(t1));  P1(1) = P0;
for k = 1:length(t1)-1
    P1(k+1) = P1(k) + h*r*P1(k)*(1 - P1(k)/K);
end

h = 1.3;                      % large step: watch what happens near P = K
t2 = 0:h:tEnd;  P2 = zeros(size(t2));  P2(1) = P0;
for k = 1:length(t2)-1
    P2(k+1) = P2(k) + h*r*P2(k)*(1 - P2(k)/K);
end

plot(t1, P1, '-', t2, P2, 'o-')
legend('h = 0.1', 'h = 1.3', 'Location', 'best')
xlabel('t'); ylabel('Population')
```

With the small step, the population rises smoothly toward the carrying capacity, exactly like the analytical S-curve this equation is known for. With the large step, watch what the curve does once it gets near <code>K</code> — a large step there can overshoot past the carrying capacity, and the next step overcorrects back the other way, producing oscillation that a real biological population obviously can't do. Try a few step sizes between these two and see where the behavior changes. This is the same instability mechanism as the exponential-drift example above, just easier to see because the wrong behavior is visually obvious rather than a subtle numerical drift.

:::callout kind="mistake" title="Common mistake"
An unstable Forward Euler run doesn't throw an error — MATLAB happily computes and plots nonsense. A plot that oscillates, overshoots the carrying capacity, or diverges to <code>Inf</code>/<code>NaN</code> is a stability problem, not a bug in your loop; the fix is usually a smaller step size or an implicit method, not different code.
:::

## Choosing a Step Size and a Method

Three tools, in order of how much they cost:

1. <strong>Shrink h</strong> — the first thing to try, and often enough for a mildly stiff or well-behaved problem. Watch for the round-off floor from the previous chapter if you go too small.
2. <strong>Switch to an implicit method</strong> (Backward Euler, or a purpose-built stiff solver) — costs a root-solve per step, but tolerates much larger step sizes on stiff problems than any amount of step-shrinking on an explicit method can match.
3. <strong>Let MATLAB choose</strong> — built-in solvers like `ode45` (and, for genuinely stiff systems, `ode15s`) adapt their own step size automatically based on estimated local error, which is almost always a better use of time than hand-tuning `h`. That's exactly where the next unit picks up.

## Check Your Understanding

:::quickcheck
Q: A Forward Euler simulation runs without any MATLAB error, but the plot oscillates wildly and eventually shoots off to very large values. What's the most likely cause, and what are two ways to fix it?
A: The step size is too large for the method to stay numerically stable on this problem — a stability failure, not a coding bug. Shrinking the step size <code>h</code>, or switching to an implicit method like Backward Euler, are both standard fixes.
:::

:::quickcheck
Q: What specifically makes a problem "stiff," as opposed to just "hard"?
A: Stiffness is about the gap between the step size an explicit method needs for stability and the step size accuracy alone would require — a stiff problem forces a much smaller step for stability than for accuracy, typically because some part of the system changes much faster than the rest. It's a property of how an explicit method behaves on the problem, not a statement about the true solution being ill-behaved.
:::

## Practice This Topic

:::practice unit=4 topic=numerical-stability
Practice: Step Size, Error & Stability
:::
