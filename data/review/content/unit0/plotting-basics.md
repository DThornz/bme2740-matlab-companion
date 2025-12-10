---
id: plotting-basics
unit: 0
title: Basic Plotting
kicker: Unit 0 · MATLAB Foundations
summary: Producing a basic 2-D plot, labeling it properly, and the handful of commands that make a plot readable instead of a bare line.
minutes: 9
---
## A Minimal Plot

<code>plot(x, y)</code> draws <code>y</code> against <code>x</code>. Both must be vectors of the same length. On its own it’s a line with no context, which is rarely good enough to hand in.

```matlab run caption="annotated 2-D plot"
t = 0:0.01:10;
y = sin(t);

plot(t, y)
xlabel('Time (s)')
ylabel('Amplitude')
title('Sine Wave')
grid on
```

- <code>xlabel</code> / <code>ylabel</code>: always label your axes, with units.
- <code>title</code>: say what the plot is, not only what variable it came from.
- <code>grid on</code>: makes reading off approximate values much easier.

:::diagram caption="The parts of a labeled plot: title, xlabel, ylabel, the data line, and the legend."
<svg viewBox="0 0 440 230" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Anatomy of a plot: axes box with callouts pointing to the title, xlabel, ylabel, data line, and legend">
  <g font-family="DM Mono, monospace">
    <rect x="100" y="50" width="260" height="120" fill="none" stroke="currentColor" opacity="0.4"/>

    <text x="230" y="44" font-size="13" text-anchor="middle" fill="currentColor">Sine Wave</text>
    <text x="230" y="16" font-size="11" text-anchor="middle" fill="currentColor" opacity="0.6">title</text>
    <line x1="230" y1="20" x2="230" y2="36" stroke="currentColor" opacity="0.4"/>

    <text x="230" y="188" font-size="12" text-anchor="middle" fill="currentColor" opacity="0.85">Time (s)</text>
    <text x="230" y="215" font-size="11" text-anchor="middle" fill="currentColor" opacity="0.6">xlabel</text>
    <line x1="230" y1="196" x2="230" y2="207" stroke="currentColor" opacity="0.4"/>

    <text x="55" y="110" font-size="12" fill="currentColor" opacity="0.85" text-anchor="middle" transform="rotate(-90 55 110)">Amplitude</text>
    <text x="25" y="114" font-size="11" fill="currentColor" opacity="0.6" text-anchor="middle">ylabel</text>
    <line x1="35" y1="110" x2="45" y2="110" stroke="currentColor" opacity="0.4"/>

    <path d="M115,110 C140,65 165,155 190,110 S240,65 265,110 S315,155 340,110" fill="none" stroke="#0b7a6e" stroke-width="2.5"/>
    <text x="400" y="205" font-size="11" text-anchor="middle" fill="#0b7a6e">data line</text>
    <line x1="380" y1="197" x2="330" y2="120" stroke="#0b7a6e" opacity="0.5"/>

    <rect x="300" y="58" width="50" height="24" fill="none" stroke="currentColor" opacity="0.5"/>
    <line x1="305" y1="70" x2="318" y2="70" stroke="currentColor" opacity="0.7"/>
    <text x="322" y="73" font-size="9" fill="currentColor" opacity="0.85">sin(t)</text>
    <text x="405" y="55" font-size="11" text-anchor="middle" fill="currentColor" opacity="0.6">legend</text>
    <line x1="390" y1="58" x2="352" y2="65" stroke="currentColor" opacity="0.4"/>
  </g>
</svg>
:::

## Multiple Curves on One Plot

<code>hold on</code> tells MATLAB “don’t erase the current plot, keep adding to it.” <code>hold off</code> (or a new <code>figure</code>) returns to normal, single-plot behavior.

```matlab run
t = 0:0.01:10;
plot(t, sin(t))
hold on
plot(t, cos(t))
hold off
legend('sin(t)', 'cos(t)')
xlabel('Time (s)')
```

:::callout kind="mistake" title="Common mistake"
A second <code>plot()</code> call without <code>hold on</code> erases the first curve instead of adding to it. If you expected two lines and got one, this is almost always why.
:::

## Markers vs. Lines

Real measured data is usually discrete samples, not a smooth function. Plotting it as isolated markers (rather than a connected line) is often more honest about what you measured.

```matlab run caption="markers only, no connecting line"
sampleTimes = [0 1 2 3 4 5];
heartRate = [72 75 88 91 85 78];

plot(sampleTimes, heartRate, 'o')
xlabel('Time (min)')
ylabel('Heart Rate (bpm)')
title('Discrete HR Samples')
```

Combine a marker with a line style to show both the trend and the actual sample points. <code>'-o'</code> is a solid line with circles at each data point. The full line-style/marker table is in the Unit 1 Plotting & Programming Patterns chapter.

## Plotting Physiological Data

The same commands apply to any signal, real or simulated. The labels make it meaningful:

```matlab run
time = 0:0.01:5;
pressure = 80 + 20*sin(2*pi*1.2*time);   % a rough, simplified BP waveform

plot(time, pressure)
xlabel('Time (s)')
ylabel('Pressure (mmHg)')
title('Simulated Arterial Pressure')
```

:::callout kind="note" title="Note"
This is a simplified sinusoid for illustration, not a physiologically accurate arterial waveform model. Real arterial pressure traces are not pure sine waves. Later units build more realistic physiological models.
:::

## Comparing More Than Two Curves

The <code>hold on</code> pattern from earlier extends to any number of curves. Keep calling <code>plot</code> before turning it off:

```matlab run caption="three curves, one legend"
t = 0:0.01:5;
plot(t, 80 + 20*sin(2*pi*1.2*t))
hold on
plot(t, 75 + 15*sin(2*pi*1.0*t))
plot(t, 90 + 25*sin(2*pi*1.5*t))
hold off
legend('Patient A', 'Patient B', 'Patient C')
xlabel('Time (s)')
ylabel('Simulated Pressure (mmHg)')
```

:::callout kind="remember" title="Remember"
MATLAB cycles through a default color order automatically. You don’t have to specify colors by hand for curves to be distinguishable. To force a specific color, pass it as an extra argument: <code>plot(t, y, 'r')</code>.
:::

## figure: Starting a New Plot Window

Calling <code>figure</code> opens a new, separate plot window instead of drawing into (or replacing) the current one. Combined with <code>close all</code> (see the Environment chapter), this is how you keep plots from piling up or overwriting each other across a script.

## Other Plot Types You’ll See

<code>plot</code> covers most of this course, but MATLAB has other plotting functions that follow the same annotate-immediately pattern:

| Function | Draws |
| --- | --- |
| <code>bar(x)</code> | A bar chart, good for comparing discrete categories, e.g. one bar per patient |
| <code>histogram(x)</code> | A histogram: the distribution of values in a dataset |
| <code>scatter(x,y)</code> | An (x,y) scatter plot with more marker/color control than plain <code>plot(x,y,'o')</code> |

:::callout kind="note" title="Note"
These aren’t exercised as Try-it examples in this Review chapter yet. Try <code>doc bar</code> / <code>doc histogram</code> / <code>doc scatter</code> in real MATLAB.
:::

## Check Your Understanding

:::quickcheck
Q: You call <code>plot(t, sin(t))</code> and then <code>plot(t, cos(t))</code> with no <code>hold on</code> in between. How many curves end up on screen?
A: One, the second <code>plot()</code> call replaces the first entirely. You need <code>hold on</code> before the second call to keep both curves.
:::
