---
id: physiological-ode-models
unit: 5
title: Physiological ODE Modeling
kicker: Unit 5 · Numerical Integration Extended
summary: Reducing higher-order equations to state-space form, sweeping model parameters, recognizing stiffness, and reading phase portraits — applied to neuron, circuit, and population models.
minutes: 13
---
## Reducing a Higher-Order Equation to State-Space Form

<code>ode45</code> only understands first-order systems, so a second- (or higher-) order equation has to be rewritten before it can be solved. The state-vector idea from the previous chapter still applies: pick one state variable per derivative order, and rewrite the original equation as the derivative of the last one.

For a general second-order equation in <code>x</code>, define <code>s = [x; dx/dt]</code>. Then <code>s(1)' = s(2)</code> by definition, and <code>s(2)'</code> — the second derivative — comes directly from solving the original equation for it. The same pattern extends to third-, fourth-, or higher-order equations; you just need more state variables, one per order.

## Worked Example: An RLC Circuit as a Damped Oscillator

A series RLC circuit's current is modeled by a classic damped second-order equation — the same mathematical shape that shows up modeling damped physiological oscillations (e.g. an underdamped pressure or flow response settling toward steady state):

:::eq label="(RLC)"
d^2i/dt^2 + 2\alpha\,di/dt + \omega^2 i(t) = 0
:::

With <code>s = [i; di/dt]</code>, this becomes <code>s(1)' = s(2)</code>, <code>s(2)' = -2\alpha s(2) - \omega^2 s(1)</code>:

```matlab run caption="alpha = 0.7, omega = sqrt(2), i(0) = -1, di/dt(0) = 0, over 16 seconds"
alpha = 0.7; omega = sqrt(2);
odefun = @(t, s) [ s(2); -2*alpha*s(2) - omega^2*s(1) ];

[t, s] = ode45(odefun, [0 16], [-1; 0]);

plot(t, s(:,1))
xlabel('t'); ylabel('i(t)')
title('Damped oscillator: d^2i/dt^2 + 2\alpha di/dt + \omega^2 i = 0')
```

The current should oscillate with decaying amplitude, settling toward zero as the damping term dissipates energy — the qualitative signature of any underdamped second-order system, circuit or otherwise.

## Worked Example: The FitzHugh–Nagumo Neuron Model

The FitzHugh–Nagumo model is a simplified description of neuron firing, tracking membrane voltage <code>v</code> and a slower recovery variable <code>w</code>:

:::eq label="(voltage)"
dv/dt = v - v^3/3 - w + I
:::

:::eq label="(recovery)"
dw/dt = c(v + a - bw)
:::

Here <code>a</code>, <code>b</code>, and <code>c</code> govern the neuron's rheobase, membrane conductance, and recovery rate, and <code>I</code> is an applied stimulus current — exactly the kind of parameters a "does this supplement change neuron excitability" study would probe by comparing simulations before and after adjusting them.

```matlab run caption="FitzHugh–Nagumo, a representative parameter set"
a = 0.7; b = 0.8; c = 3; I = 0.5;
odefun = @(t, s) [ s(1) - s(1)^3/3 - s(2) + I;
                    c*(s(1) + a - b*s(2)) ];

[t, s] = ode45(odefun, [0 200], [0; 0]);   % 200 ms, resting initial state

plot(t, s(:,1))
xlabel('t (ms)'); ylabel('v (membrane voltage)')
title('FitzHugh–Nagumo: voltage over 200 ms')
```

Counting the peaks in <code>s(:,1)</code> over the simulated window is exactly how you'd quantify "how much did this parameter change increase firing activity" — <code>findpeaks</code> or a simple sign-change check on the derivative both work.

## Sweeping a Parameter: The van der Pol Equation

Comparing many parameter values side by side is a common modeling task — here, the van der Pol equation swept across 10 values of <code>μ</code>, from near-linear (<code>μ</code> small) to strongly nonlinear (<code>μ</code> large):

:::eq label="(van der Pol)"
d^2x/dt^2 - \mu(1-x^2)\,dx/dt + x = 0
:::

```matlab run caption="mu swept across 10 values from 0.01 to 10"
mus = linspace(0.01, 10, 10);

hold on
for mu = mus
    odefun = @(t, s) [ s(2); mu*(1 - s(1)^2)*s(2) - s(1) ];
    [t, s] = ode45(odefun, [0 10], [2; 0]);
    plot(t, s(:,1))
end
hold off
xlabel('t'); ylabel('x(t)')
title('van der Pol oscillator for \mu from 0.01 to 10')
```

Larger <code>μ</code> should produce a visibly more relaxation-oscillator-like shape (sharp transitions, flatter plateaus) than the near-sinusoidal curve small <code>μ</code> produces — a direct, visual way to see what one parameter controls.

## Recognizing Stiffness

A system is <strong>stiff</strong> when it has components that evolve on very different time scales at once — a fast initial transient alongside slow, gradual change. <code>ode45</code> can still solve a mildly stiff problem, just slowly; a genuinely stiff one may force it to unreasonably small steps or fail to converge in reasonable time.

Consider a coupled glucose/insulin-sensing system, where a polymer sensor's glucose uptake (<code>C_G</code>) and insulin release (<code>C_I</code>) vary with distance <code>z</code> from the blood vessel:

:::eq label="(glucose)"
dC_G/dz = 14C_G - 2C_G^2 - C_G C_I
:::

:::eq label="(insulin)"
dC_I/dz = 16C_I - 2C_I^2 - C_G C_I
:::

```matlab run caption="CG(0) = 2, CI(0) = 1, integrated from z = 0 to 1"
odefun = @(z, s) [ 14*s(1) - 2*s(1)^2 - s(1)*s(2);
                    16*s(2) - 2*s(2)^2 - s(1)*s(2) ];

[z, s] = ode45(odefun, [0 1], [2; 1]);

plot(z, s)
xlabel('z'); ylabel('concentration')
legend('C_G', 'C_I')
```

:::callout kind="try" title="Try It"
A practical way to check for stiffness without deriving anything by hand: solve the same system with both <code>ode45</code> and a stiff solver like <code>ode15s</code>, and compare. If they agree closely, <code>ode45</code> was fine; if <code>ode45</code> needed a huge number of steps (check <code>length(z)</code>) to get there, the system was stiff even though it still produced an answer.
:::

## Phase Portraits

A <strong>phase portrait</strong> plots trajectories of an autonomous system (one whose right-hand side depends only on the state, not on time directly) in state space rather than against time — revealing long-term behavior like stable cycles or equilibria at a glance. The classic example is Lotka–Volterra predator-prey:

:::eq label="(prey)"
dx/dt = \alpha x - \beta xy
:::

:::eq label="(predator)"
dy/dt = \delta xy - \gamma y
:::

Setting both derivatives to zero gives two equilibria: the trivial <code>(0, 0)</code> (both species extinct), and a non-trivial coexistence point at <code>(x*, y*) = (\gamma/\delta,\ \alpha/\beta)</code> where predator and prey populations balance exactly.

Lecture material illustrates the direction field around such equilibria with <code>quiver(X, Y, U, V)</code>, which draws an arrow at each grid point <code>(X,Y)</code> scaled by the local derivatives <code>(U,V)</code>:

```matlab
% conceptual reference — see the sandbox note below before relying on this
[X, Y] = meshgrid(0:0.5:4, 0:0.5:4);
U = 1.1*X - 0.4*X.*Y;
V = 0.1*X.*Y - 0.4*Y;
quiver(X, Y, U, V)
xlabel('prey'); ylabel('predator')
```

:::callout kind="sandbox" title="Sandbox Limitation"
<code>quiver</code> hasn't been verified against this browser sandbox (RunMat) — treat the block above as reference, not something guaranteed to run here. A RunMat-safe way to see the same qualitative picture is to overlay several <code>ode45</code> trajectories from different initial conditions on one <code>plot</code>, which is exactly what the interactive block below does.
:::

```matlab run caption="predator-prey trajectories from several starting populations"
alpha = 1.1; beta = 0.4; gamma = 0.4; delta = 0.1;
odefun = @(t, s) [ alpha*s(1) - beta*s(1)*s(2);
                    delta*s(1)*s(2) - gamma*s(2) ];

hold on
starts = [1 1; 2 3; 4 1; 1 4];
for k = 1:size(starts, 1)
    [t, s] = ode45(odefun, [0 30], starts(k,:)');
    plot(s(:,1), s(:,2))
end
hold off
xlabel('prey'); ylabel('predator')
title('Lotka–Volterra: trajectories in the prey-predator plane')
```

Closed loops around the non-trivial equilibrium are the signature of the cyclic, self-sustaining boom-and-bust dynamics real predator-prey systems show.

## A Note on the Symbolic Math Toolbox

MATLAB's Symbolic Math Toolbox (<code>syms</code> to declare a symbolic variable, <code>dsolve</code> to solve an ODE analytically) can produce an exact closed-form solution for many of the equations in this chapter, when one exists. Every example above uses the numeric path (<code>ode45</code>) instead, for two reasons: it works on equations with no closed form at all (most of the interesting nonlinear ones here, including van der Pol and FitzHugh–Nagumo), and it's the approach this whole course — and this sandbox — is built around.

:::callout kind="sandbox" title="Sandbox Limitation"
The Symbolic Math Toolbox is a large, separate MATLAB component with no confirmed support in this browser sandbox (RunMat) — likely unsupported, though unverified either way. If you want to explore <code>syms</code>/<code>dsolve</code> on these equations, do it in real MATLAB or MATLAB Online; the numeric solutions throughout this chapter don't depend on it.
:::

## Check Your Understanding

:::quickcheck
Q: Why does the RLC circuit equation need 2 state variables instead of 1?
A: It's a second-order equation, and the rule is one state variable per derivative order — here, <code>i</code> itself and <code>di/dt</code>, since the equation involves <code>d²i/dt²</code>.
:::

:::quickcheck
Q: What's a practical way to check whether a system is stiff, without deriving anything analytically?
A: Solve it with both <code>ode45</code> and a stiff solver like <code>ode15s</code> and compare: close agreement means <code>ode45</code> was fine, while <code>ode45</code> needing a very large number of steps to match the stiff solver's answer is a sign the system was stiff.
:::

## Practice This Topic

:::practice unit=5 topic=physiological-ode-models
Practice: Physiological ODE Modeling
:::
