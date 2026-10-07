---
id: ode45-solving
unit: 5
title: Solving ODEs with ode45
kicker: Unit 5 · Numerical Integration Extended
summary: Moving from hand-rolled Euler stepping to MATLAB's adaptive-step-size solver, ode45, and the state-vector convention every solver call depends on.
minutes: 10
---
## Why Adaptive Step Size?

Every Euler-family method in Unit 4 used a fixed step size <code>h</code> you chose ahead of time. That's a real tradeoff: shrink <code>h</code> and accuracy improves, but so does runtime, and testing a model across many parameter combinations multiplies that cost fast. If you wanted to sweep 100 values each of 3 different parameters, a fixed step small enough to be accurate everywhere is small enough to be slow everywhere, even during the long stretches where the solution barely changes.

An <strong>adaptive step size</strong> solver fixes this by not committing to one <code>h</code> at all. At every iteration it estimates the largest step it can take without exceeding an error tolerance; when the solution is changing slowly, it takes long steps, and when the solution is changing rapidly, it automatically shrinks the step to keep up. Most of MATLAB's numerical ODE solvers work this way, and <code>ode45</code> is the one you'll reach for first.

:::diagram caption="ode45 samples densely where the curve changes quickly and sparsely where it's nearly flat, instead of stepping with one fixed h."
<svg viewBox="0 0 420 175" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A solution curve with sample points spaced closely together where the curve is steep and spaced far apart where the curve is flat">
  <g font-family="DM Mono, monospace" font-size="12">
    <path d="M20,120 Q90,108 140,108 C155,60 180,35 205,35 C230,35 255,60 270,108 Q330,115 400,112" fill="none" stroke="currentColor" opacity="0.5" stroke-width="1.5"/>

    <g fill="currentColor" opacity="0.6">
      <circle cx="20" cy="120" r="2.5"/>
      <circle cx="70" cy="113" r="2.5"/>
      <circle cx="120" cy="109" r="2.5"/>
      <circle cx="280" cy="109" r="2.5"/>
      <circle cx="330" cy="113" r="2.5"/>
      <circle cx="380" cy="112" r="2.5"/>
    </g>

    <g fill="#0b7a6e">
      <circle cx="145" cy="97" r="2.5"/>
      <circle cx="157" cy="75" r="2.5"/>
      <circle cx="169" cy="57" r="2.5"/>
      <circle cx="181" cy="45" r="2.5"/>
      <circle cx="193" cy="38" r="2.5"/>
      <circle cx="205" cy="35" r="2.5"/>
      <circle cx="217" cy="38" r="2.5"/>
      <circle cx="229" cy="45" r="2.5"/>
      <circle cx="241" cy="57" r="2.5"/>
      <circle cx="253" cy="75" r="2.5"/>
      <circle cx="265" cy="97" r="2.5"/>
    </g>

    <text x="205" y="20" text-anchor="middle" fill="#0b7a6e">small steps here</text>
    <text x="70" y="145" text-anchor="middle" fill="currentColor" opacity="0.55">large steps here</text>
    <text x="330" y="145" text-anchor="middle" fill="currentColor" opacity="0.55">large steps here</text>
  </g>
</svg>
:::

## Basic ode45 Syntax

<code>ode45</code> integrates a first-order ODE (or system) from an initial condition across a time span:

```matlab
[t, y] = ode45(odefun, tspan, y0)
```

- <code>odefun</code> is a function handle for the right-hand side, <code>@(t,y) ...</code>, matching the “derivative in terms of time and current state” form every ODE needs to be in.
- <code>tspan</code> is <code>[t0 tf]</code>, the start and end of the interval.
- <code>y0</code> is the initial condition.
- The solver returns a column vector <code>t</code> of the (unevenly spaced) time points it actually used, and <code>y</code>, with one row per entry in <code>t</code>.

```matlab run caption="a single first-order ODE, solved with ode45"
odefun = @(t, s) exp(t) .* (8*cos(8*t) + sin(8*t));

[t, s] = ode45(odefun, [5 8], 0);   % s(5) = 0, integrate to t = 8

plot(t, s)
xlabel('t'); ylabel('s(t)')
title('ds/dt = e^t (8cos(8t) + sin(8t)), s(5) = 0')

s_at_7 = interp1(t, s, 7)   % ode45's own time points won't land exactly on t=7
```

:::callout kind="note" title="Note"
<code>ode45</code>'s time points are chosen by the solver, not by you, so a specific value like <code>s(7)</code> almost never falls exactly on one of them. <code>interp1</code> (linear interpolation between the nearest returned points) is the standard way to read off a value at an arbitrary time — see the Unit 3 Interpolation chapter for more on how it works.
:::

## The State-Vector Convention

<code>ode45</code> only ever solves first-order systems: <code>ds/dt = f(t, s)</code>, where <code>s</code> can be a column vector, not just a scalar. To solve anything with more than one dependent variable, or with derivatives higher than first order, you first repackage it as a vector <code>s</code> of state variables and hand <code>odefun</code> the derivative of that whole vector, <code>s'</code>, at once.

The rule: you need as many state variables as the highest derivative order in the system. A single second-order equation needs 2 state variables; a system of two coupled first-order equations also needs 2 (one per equation), just arranged differently. <code>odefun</code> always returns a column vector the same size as <code>s</code>, one row per state variable's derivative.

```matlab
odefun = @(t, s) [ s(2);                    % ds1/dt = s2
                   f_of(t, s(1), s(2)) ];    % ds2/dt = whatever your equation says it is
```

The next two chapters put this into practice on real coupled systems and a real higher-order equation.

## Choosing a Solver: When ode45 Isn't Enough

An ODE is called <strong>stiff</strong> when its solution has components that change on very different time scales at once — think a fast initial transient followed by slow, gradual settling. <code>ode45</code> (a “nonstiff” solver) handles most course material fine, but on a genuinely stiff problem it either grinds to a crawl or refuses to converge, because it has to take tiny steps to keep the fast component stable even while nothing interesting is happening.

The practical rule of thumb from lecture, in order:

1. Try <code>ode45</code> first.
2. If it's too slow, switch to <code>ode15s</code>.
3. Still too slow? Try <code>ode23s</code>.
4. Still too slow? Try <code>ode23tb</code>.
5. Still too slow after that — you likely have an unusually difficult problem worth asking about directly, not a solver-shopping problem.

```matlab
% same call shape as ode45, different solver for stiff problems
[t, y] = ode15s(odefun, tspan, y0);
```

:::callout kind="sandbox" title="Sandbox Limitation"
<code>ode15s</code>, <code>ode23s</code>, and <code>ode23tb</code> aren't supported in this browser sandbox (RunMat). <code>ode45</code> itself works correctly and is safe to run here. If a problem in this course is genuinely stiff, treat the stiff-solver code as read reference material and run it in real MATLAB or MATLAB Online rather than expecting it to run in this page's Try-it blocks.
:::

## Check Your Understanding

:::quickcheck
Q: Why does <code>ode45</code> return unevenly spaced time points instead of the evenly spaced ones you'd get from a fixed-step Euler method?
A: It's an adaptive step-size solver: it takes larger steps where the solution changes slowly and smaller steps where it changes quickly, to hold error below a tolerance efficiently instead of using one fixed step size everywhere.
:::

:::quickcheck
Q: You need to solve a single third-order ODE with <code>ode45</code>. How many state variables does your state vector <code>s</code> need, and why?
A: 3 — the rule is one state variable per order of the highest derivative in the equation, so a third-order equation needs 3 state variables (the function itself and its first two derivatives), with the third derivative supplied by rearranging the original equation.
:::

## Practice This Topic

:::practice unit=5 topic=ode45-solving
Practice: Solving ODEs with ode45
:::
