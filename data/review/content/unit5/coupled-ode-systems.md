---
id: coupled-ode-systems
unit: 5
title: Coupled ODEs & State-Space Models
kicker: Unit 5 · Numerical Integration Extended
summary: Solving multi-variable physiological systems with ode45 by packing them into one state vector — the same three worked models from Unit 4's Euler chapter, done properly this time.
minutes: 11
---
## Same Systems, Better Tool

A system of ODEs is <strong>coupled</strong> when a variable in one equation depends on a variable defined by another — population models, multi-compartment drug distribution, and cascaded physical processes all take this shape. Unit 4's Initial Value Problems & Euler's Method chapter solved three coupled biomedical systems by hand, one Forward Euler step at a time. This chapter solves the exact same three systems with <code>ode45</code>: same equations, same initial conditions, dramatically less code, and a solver that adapts its own step size instead of you choosing one up front.

The pattern is always: write each equation's derivative in terms of the current state, pack the states into one vector <code>s</code>, write <code>odefun</code> so it returns the vector of all the derivatives at once, and hand the whole thing to <code>ode45</code>.

## Worked Example: Rabbit and Fox Population Dynamics

Rabbits grow at 120% per season if undisturbed; foxes decline 80% per season without prey; predation removes rabbits and feeds fox growth in proportion to how often the two populations encounter each other:

:::eq label="(rabbits)"
dP_{rabbit}/dt = 1.2\,P_{rabbit} - 0.6\,P_{rabbit}P_{fox}
:::

:::eq label="(foxes)"
dP_{fox}/dt = -0.8\,P_{fox} + 0.3\,P_{rabbit}P_{fox}
:::

With <code>P_rabbit(0) = 2</code> and <code>P_fox(0) = 1</code> (hundreds of animals), simulated over 20 seasons:

```matlab run caption="predator-prey, solved with ode45 instead of hand-rolled Euler"
odefun = @(t, s) [ 1.2*s(1) - 0.6*s(1)*s(2);
                  -0.8*s(2) + 0.3*s(1)*s(2) ];

[t, s] = ode45(odefun, [0 20], [2; 1]);

plot(t, s(:,1), t, s(:,2))
xlabel('season'); ylabel('population (hundreds)')
legend('rabbits', 'foxes')
```

The oscillation — rabbits recover once foxes decline from starvation, then foxes recover once rabbits are plentiful again — is the same cyclic behavior you'd have seen in the Euler version, just traced with far fewer lines of code and no step-size tuning.

## Worked Example: Lidocaine Two-Compartment Model

Lidocaine, used to treat irregular heartbeat, has to stay above 1.5 mg/L to be effective and below 6 mg/L to stay safe. A two-compartment model tracks the drug amount in the bloodstream (<code>x</code>) and in body tissue (<code>y</code>):

:::eq label="(bloodstream)"
dx/dt = -0.090x(t) + 0.038y(t)
:::

:::eq label="(tissue)"
dy/dt = 0.066x(t) - 0.038y(t)
:::

```matlab run caption="lidocaine distribution over 150 minutes, dose y0 = 15 mg/kg"
odefun = @(t, s) [ -0.090*s(1) + 0.038*s(2);
                    0.066*s(1) - 0.038*s(2) ];

[t, s] = ode45(odefun, [0 150], [0; 15]);

plot(t, s(:,1), t, s(:,2))
xlabel('time (min)'); ylabel('concentration (mg/L)')
legend('bloodstream (x)', 'tissue (y)')
```

Reading the plot the same way a clinician would: the bloodstream curve should rise as drug transfers in from tissue, and both curves settle toward the same equilibrium as the two compartments approach balance.

## Worked Example: Brine Tank Cascade

Three tanks in series, each draining into the next at the same rate, starting at a uniform 50 mg/L salt concentration with fresh water entering tank 1:

:::eq label="(tank 1)"
dx_1/dt = -\tfrac{1}{2}x_1
:::

:::eq label="(tank 2)"
dx_2/dt = \tfrac{1}{2}x_1 - \tfrac{1}{4}x_2
:::

:::eq label="(tank 3)"
dx_3/dt = \tfrac{1}{4}x_2 - \tfrac{1}{6}x_3
:::

```matlab run caption="a 3-tank dilution cascade"
odefun = @(t, s) [ -0.5*s(1);
                    0.5*s(1) - 0.25*s(2);
                    0.25*s(2) - (1/6)*s(3) ];

[t, s] = ode45(odefun, [0 60], [50; 50; 50]);

plot(t, s)
xlabel('time (s)'); ylabel('salt concentration (mg/L)')
legend('tank 1', 'tank 2', 'tank 3')
```

Each tank should peak later and lower than the one before it — tank 1 dilutes immediately, while tank 3 doesn't start dropping until diluted fluid from tank 2 has had time to reach it.

:::callout kind="try" title="Try It"
Lecture posed a direct comparison as a challenge: for this same cascade, how many integration steps does <code>ode45</code> take versus Forward Euler with <code>h = 0.05</code>? Run both and check <code>length(t)</code> for each — it's a concrete way to see what "adaptive" actually buys you.
:::

## Check Your Understanding

:::quickcheck
Q: For all three systems in this chapter, why does <code>odefun</code> return a column vector instead of a single number?
A: Each system has more than one dependent variable (two populations, two drug compartments, three tank concentrations), and <code>ode45</code> expects one derivative value per state variable, returned together as a vector in the same order as the state vector <code>s</code> itself.
:::

:::quickcheck
Q: If you already had working Forward Euler code for these three systems from Unit 4, why switch to <code>ode45</code> at all?
A: <code>ode45</code> adapts its own step size instead of using one fixed value everywhere, which is typically both more accurate and faster, and it removes the need to hand-tune <code>h</code> for each new system.
:::

## Practice This Topic

:::practice unit=5 topic=coupled-ode-systems
Practice: Coupled ODEs & State-Space Models
:::
