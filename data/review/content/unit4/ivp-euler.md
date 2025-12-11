---
id: ivp-euler
unit: 4
title: Initial Value Problems & Euler’s Method
kicker: Unit 4 · Numerical Integration
summary: Turning a differential equation into a step-by-step algebra problem — forward and backward Euler, why the backward version needs a root solver, and extending both to systems of coupled equations.
minutes: 12
---
## From Derivative Approximation to Time-Stepping

An <strong>initial value problem</strong> (IVP) gives you a differential equation, <code>dy/dt = f(t, y)</code>, plus a known starting value <code>y(0) = y₀</code>, and asks for the function <code>y(t)</code> itself. Most real IVPs have no closed-form solution, so instead of solving for a formula, you solve for a sequence of points that approximate the true curve.

The forward-difference formula from the previous chapter is the starting point. Rearranged to solve for the *next* value instead of the derivative:

:::eq label="forward difference"
f^{(1)}(a) \cong \frac{f(a+h) - f(a)}{h}
:::

If <code>f</code> is itself the right-hand side of the ODE — a function of the current time and current state, <code>f(tₖ, yₖ)</code> — this rearranges into a rule for stepping forward by <code>h</code>:

:::eq label="forward Euler"
y_{k+1} = y_k + f(t_k, y_k)\,h
:::

That’s the entire method. Set the initial condition, assume the derivative is roughly constant over one small step <code>h</code>, and iterate: know <code>y_k</code>, compute <code>y_{k+1}</code>, then treat that as the new <code>y_k</code> and repeat. A differential equation has been turned into an algebra problem you can loop over.

:::diagram caption="Forward Euler follows straight tangent-line steps of size h; each step's straight segment diverges slightly from the true solution curve."
<svg viewBox="0 0 400 195" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A faint true solution curve with a highlighted jagged path of four Forward Euler steps of size h approximating it, gradually diverging from the true curve">
  <line x1="40" y1="160" x2="360" y2="160" stroke="currentColor" opacity="0.25"/>
  <path d="M40,140 C80,120 100,105 120,100 C150,93 170,80 200,70 C230,62 250,55 280,50 C310,46 330,42 360,40" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4,4" opacity="0.4"/>
  <polyline points="40,140 120,115 200,85 280,60 360,45" fill="none" stroke="#0b7a6e" stroke-width="2.5"/>
  <circle cx="40" cy="140" r="3" fill="#0b7a6e"/>
  <circle cx="120" cy="115" r="3" fill="#0b7a6e"/>
  <circle cx="200" cy="85" r="3" fill="#0b7a6e"/>
  <circle cx="280" cy="60" r="3" fill="#0b7a6e"/>
  <circle cx="360" cy="45" r="3" fill="#0b7a6e"/>
  <line x1="40" y1="160" x2="40" y2="175" stroke="currentColor" opacity="0.35"/>
  <line x1="120" y1="160" x2="120" y2="175" stroke="currentColor" opacity="0.35"/>
  <line x1="40" y1="175" x2="120" y2="175" stroke="currentColor" opacity="0.5"/>
  <text x="80" y="188" font-family="DM Mono, monospace" font-size="11" text-anchor="middle" fill="currentColor" opacity="0.7">h</text>
  <text x="300" y="30" font-family="DM Mono, monospace" font-size="11" text-anchor="middle" fill="currentColor" opacity="0.5">true solution</text>
  <text x="150" y="128" font-family="DM Mono, monospace" font-size="11" text-anchor="middle" fill="#0b7a6e">Euler steps</text>
</svg>
:::

<figure class="review-photo">
  <div class="review-photo-card"><img src="assets/img/euler-method.svg" alt="A smooth true solution curve with a straight-line Euler approximation stepping alongside it, the gap between the two growing with each step." loading="lazy"></div>
  <figcaption>The same idea, the textbook rendering: the straight-line approximation drifts a little farther from the true curve with each step.<span class="review-photo-credit">Euler method, Oleg Alexandrov, public domain, via <a href="https://commons.wikimedia.org/wiki/File:Euler_method.svg" target="_blank" rel="noopener">Wikimedia Commons</a></span></figcaption>
</figure>

## Worked Example: Population Growth

Unconstrained population growth follows <code>dP/dt = rP</code>. This one has a closed form (<code>P(t) = Ce^{rt}</code>), which makes it a good first check: solve it exactly, then confirm Forward Euler tracks it.

With <code>P(0) = 1000</code> and <code>P(1) = 2000</code>, the exact solution works out to <code>r = ln(2)</code> and <code>P(t) = 1000·2^t</code>.

```matlab run caption="Forward Euler vs. the exact solution, P(0)=1000"
r = log(2);
h = 0.5;
t = 0:h:5;

P = zeros(size(t));
P(1) = 1000;
for k = 1:length(t)-1
    P(k+1) = P(k) + r*P(k)*h;      % forward Euler: y_{k+1} = y_k + f(t_k,y_k)*h
end

Pexact = 1000 * 2.^t;

plot(t, P, 'o-', t, Pexact, '--')
legend('Forward Euler', 'Exact', 'Location', 'northwest')
xlabel('t'); ylabel('Population')
```

Shrinking `h` brings the Euler curve closer to the exact one — the same truncation-error tradeoff from finite differences applies here, since Forward Euler *is* a finite difference applied one step at a time.

## Backward (Implicit) Euler

Forward Euler uses the slope at the *current* point to step forward. Backward Euler uses the slope at the point it’s stepping *to*:

:::eq label="backward Euler"
y_{k+1} = y_k + f(t_{k+1}, y_{k+1})\,h
:::

This is called an <strong>implicit</strong> method because the unknown, <code>y_{k+1}</code>, appears on both sides — it's needed to evaluate <code>f</code> before you've solved for it. The fix is to treat the equation as a root-finding problem instead of a direct formula:

:::eq label="root-finding form"
y_k + f(t_{k+1}, y_{k+1})\,h - y_{k+1} = 0
:::

Everything in that equation is known except <code>y_{k+1}</code>. Adjusting it until the left side hits zero *is* solving for the next step — exactly what `fzero` does.

```matlab run caption="Backward Euler using fzero to solve the implicit step"
h = 0.25;
t = 0:h:2;
x = zeros(size(t));
x(1) = 1;                          % initial condition

for ii = 1:length(t)-1
    x(ii+1) = fzero(@(X) h*(1/(3*sin(X))) + x(ii) - X, x(ii));
end

plot(t, x)
xlabel('t'); ylabel('x(t)')
```

Each call to `fzero` needs a starting guess; the previous step’s value, `x(ii)`, is almost always a good one, since the true solution can’t jump far in one small step `h`.

## Why Bother With the Implicit Version?

Backward Euler costs more per step (a root solve instead of one arithmetic line), so it isn’t the default choice. It earns its keep on <strong>stiff</strong> problems — systems that change very rapidly in one part of the solution and slowly elsewhere. Forward Euler needs an uncomfortably small `h` to stay stable on a stiff problem; Backward Euler tolerates much larger steps because it implicitly uses the *future* slope, which damps oscillations instead of amplifying them. The next chapter digs into exactly what “unstable” looks like and why it happens.

:::callout kind="remember" title="Remember"
Both Forward and Backward Euler are first-order accurate (global error <code>O(h)</code>) — Backward Euler isn’t more *accurate*, it’s more <strong>stable</strong>. Reach for it when a system is stiff, not when you simply want a better answer at the same step size.
:::

## Systems of Coupled ODEs

Real physiological models rarely involve just one state variable. A system of <code>n</code> coupled first-order ODEs looks like:

:::eq label="ODE system"
\frac{dy_1}{dt} = f_1(t, y_1, y_2, \ldots, y_n), \quad \frac{dy_2}{dt} = f_2(t, y_1, y_2, \ldots, y_n), \quad \ldots
:::

Forward Euler extends directly: stack the state variables into a vector, and step the whole vector forward together using the same rule as before. A higher-order ODE (one with second or higher derivatives) is handled the same way after first rewriting it as a system of first-order equations — one new state variable per derivative order.

## Worked Example: Lidocaine in the Bloodstream

Lidocaine, used to treat irregular heartbeat, has to stay above 1.5 mg/L to be effective and below 6 mg/L to stay safe. A two-compartment model tracks the drug in the bloodstream (<code>x</code>) and in body tissue (<code>y</code>):

:::eq label="(1)"
\frac{dx}{dt} = -0.090\,x(t) + 0.038\,y(t)
:::

:::eq label="(2)"
\frac{dy}{dt} = 0.066\,x(t) - 0.038\,y(t)
:::

```matlab run caption="two-compartment lidocaine model, forward Euler on a vector state"
h = 1;                        % minutes
t = 0:h:150;
x = zeros(size(t));  y = zeros(size(t));
x(1) = 0;  y(1) = 15;          % injection dose in tissue, y0 = 15 mg/kg

for k = 1:length(t)-1
    xk = x(k);  yk = y(k);
    x(k+1) = xk + h*(-0.090*xk + 0.038*yk);
    y(k+1) = yk + h*( 0.066*xk - 0.038*yk);
end

plot(t, x, t, y)
legend('Bloodstream (x)', 'Tissue (y)')
xlabel('Minutes'); ylabel('mg/L')
```

Both state variables step forward together, one time index at a time — the same loop structure as the single-variable case, just carrying two values through it instead of one.

## Check Your Understanding

:::quickcheck
Q: Why does Backward Euler require `fzero` (or another root solver) inside the loop, while Forward Euler doesn’t?
A: Backward Euler evaluates the derivative function at the *unknown* next step, <code>f(t_{k+1}, y_{k+1})</code>, so <code>y_{k+1}</code> appears on both sides of the update equation. There’s no direct formula to solve for it, so the equation is rearranged into "find the root of this expression" and handed to <code>fzero</code>. Forward Euler only ever evaluates <code>f</code> at the already-known current step, so it can compute <code>y_{k+1}</code> directly.
:::

:::quickcheck
Q: A coupled system has two state variables instead of one. What changes about the Forward Euler loop?
A: Almost nothing — each state variable gets its own update line using the same <code>yₖ₊₁ = yₖ + f(tₖ,yₖ)·h</code> rule, and both are stepped forward together inside the same loop using the *previous* step's values for both variables (not the just-updated one), since the equations are coupled.
:::

## Practice This Topic

:::practice unit=4 topic=ivp-euler
Practice: Initial Value Problems & Euler’s Method
:::
