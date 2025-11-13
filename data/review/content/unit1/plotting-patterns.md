---
id: plotting-patterns
unit: 1
title: Plotting & Programming Patterns
kicker: Unit 1 · MATLAB
summary: Common, reusable plotting recipes, multiple subplots, line styles, and markers, plus a few idiomatic MATLAB patterns worth recognizing on sight.
minutes: 8
---
## subplot: Multiple Plots, One Figure

```matlab run caption="2 rows, 1 column, this is panel 1 / panel 2"
t = 0:0.01:10;

subplot(2,1,1)
plot(t, sin(t))
title('sin(t)')

subplot(2,1,2)
plot(t, cos(t))
title('cos(t)')
```

<code>subplot(rows, cols, index)</code> divides the figure into a grid and selects one cell to draw into next. The index counts left-to-right, top-to-bottom, like reading text.

## More subplot Variety

Subplots don’t have to be a simple 2×1 stack. Looping over the panel index avoids writing <code>subplot</code> three separate times by hand, the same instinct that motivated <code>for</code> loops in the first place:

```matlab run caption="3 stacked panels, built with a loop over a cell array"
t = 0:0.01:5;
signals = {80 + 20*sin(2*pi*1.2*t), 75 + 15*sin(2*pi*1.0*t), 90 + 25*sin(2*pi*1.5*t)};
labels = {'Patient A', 'Patient B', 'Patient C'};

for i = 1:3
    subplot(3,1,i)
    plot(t, signals{i})
    title(labels{i})
    ylabel('mmHg')
end
```

:::callout kind="remember" title="Remember"
<code>{ }</code> creates a <strong>cell array</strong>. Unlike a normal array, its elements don’t need to be the same size or type. <code>signals{i}</code> (curly braces) pulls the actual vector back out; <code>signals(i)</code> (parentheses) would give you a 1×1 cell containing that vector instead, not the vector itself.
:::

## Line Styles & Markers

| Code | Meaning |
| --- | --- |
| <code>'-'</code> | Solid line (default) |
| <code>'--'</code> | Dashed line |
| <code>':'</code> | Dotted line |
| <code>'o'</code> | Circle markers, no line |
| <code>'r--o'</code> | Red dashed line with circle markers, combine color/style/marker in one string |

```matlab run
t = 0:0.5:10;
plot(t, sin(t), 'r--o')
xlabel('t')
ylabel('sin(t)')
```

## A Reusable Pattern: Plot, Then Annotate

Most well-formed plotting code in this course follows the same order: build the data, call <code>plot</code>, then immediately label it, before moving on to anything else. Keeping that order makes it much harder to accidentally ship an unlabeled plot.

```matlab run
x = linspace(0, 2*pi, 200);
y = sin(x) .* exp(-x/5);

plot(x, y)
xlabel('x')
ylabel('y')
title('Damped Sine')
grid on
```

## Check Your Understanding

:::quickcheck
Q: What does <code>subplot(2,2,3)</code> select?
A: The third cell in a 2×2 grid, counting left-to-right then top-to-bottom. That’s the bottom-left panel.
:::
