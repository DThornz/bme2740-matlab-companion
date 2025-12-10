---
id: loops-debugging
unit: 0
title: Loops, Debugging & Help
kicker: Unit 0 · MATLAB Foundations
summary: for and while loops, the preallocation habit that matters once your loops get bigger, and how to read a MATLAB error message.
minutes: 13
---
## for Loops

```matlab run
total = 0;
for i = 1:10
    total = total + i;
end
disp(total)   % 55
```

<code>for i = 1:10</code> runs the loop body once for each value of <code>i</code> from 1 to 10, in order. Inside the loop, <code>i</code> behaves like any other variable. Use it as an index, in a calculation, or anywhere else you need a number.

```matlab run caption="looping over a vector’s indices"
x = [10 20 30];
for i = 1:length(x)
    fprintf('Element %d is %d\n', i, x(i))
end
```

## Nested Loops: Looping Over a Matrix

A loop inside another loop lets you visit every element of a matrix. The outer loop typically walks rows; the inner loop walks columns.

```matlab run caption="outer loop = rows (patients), inner loop = columns (readings)"
vitals = [118 72; 145 95; 132 84];   % [systolic diastolic], one row per patient

for p = 1:size(vitals,1)
    for reading = 1:size(vitals,2)
        fprintf('Patient %d, reading %d = %d\n', p, reading, vitals(p,reading))
    end
end
```

:::callout kind="remember" title="Remember"
The <strong>outer</strong> loop variable changes slowest. It only advances once the entire inner loop finishes. If the order feels unintuitive, trace it by hand once: everything with <code>p=1</code> happens before <code>p</code> ever becomes 2.
:::

Combining a nested loop with an <code>if</code> (see the Control Flow chapter) is a common pattern: counting how many readings are elevated.

```matlab run caption="nested loops + if, counting elevated readings"
vitals = [118 72; 145 95; 132 84];
highCount = 0;
for p = 1:size(vitals,1)
    for reading = 1:size(vitals,2)
        if vitals(p,reading) > 130
            highCount = highCount + 1;
        end
    end
end
fprintf('%d readings were above 130\n', highCount)
```

## Preallocation

Growing an array one element at a time inside a loop works, but MATLAB has to reallocate memory and copy the whole array on every iteration. For large loops this gets slow fast. Preallocating the array first avoids that entirely.

```matlab caption="both are correct; only the second one scales well"
% Slower: grows on every iteration
result = [];
for i = 1:1000
    result(i) = i^2;
end

% Faster: allocate once, fill in
result = zeros(1, 1000);
for i = 1:1000
    result(i) = i^2;
end
```

:::diagram caption="Growing a vector one element at a time reallocates and copies on every iteration; preallocating with zeros(1,n) allocates once and just fills values in place."
<svg viewBox="0 0 460 190" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Diagram contrasting growing a vector one element at a time, which reallocates and copies on every iteration, against preallocating with zeros and filling in place">
  <g font-family="DM Mono, monospace" font-size="12">
    <text x="10" y="18" fill="currentColor" opacity="0.7">growing (reallocates each time)</text>
    <g text-anchor="middle" font-size="13">
      <rect x="10" y="28" width="28" height="28" fill="none" stroke="currentColor" opacity="0.4"/>
      <text x="24" y="47" fill="currentColor">1</text>
      <text x="55" y="47" fill="currentColor" opacity="0.4">&#8594;</text>
      <rect x="75" y="28" width="28" height="28" fill="none" stroke="currentColor" opacity="0.4"/>
      <text x="89" y="47" fill="currentColor">1</text>
      <rect x="103" y="28" width="28" height="28" fill="none" stroke="currentColor" opacity="0.4"/>
      <text x="117" y="47" fill="currentColor">2</text>
      <text x="148" y="47" fill="currentColor" opacity="0.4">&#8594;</text>
      <rect x="168" y="28" width="28" height="28" fill="none" stroke="currentColor" opacity="0.4"/>
      <text x="182" y="47" fill="currentColor">1</text>
      <rect x="196" y="28" width="28" height="28" fill="none" stroke="currentColor" opacity="0.4"/>
      <text x="210" y="47" fill="currentColor">2</text>
      <rect x="224" y="28" width="28" height="28" fill="none" stroke="currentColor" opacity="0.4"/>
      <text x="238" y="47" fill="currentColor">3</text>
      <text x="270" y="47" fill="currentColor" opacity="0.4">&#8594;</text>
      <text x="285" y="47" fill="currentColor" opacity="0.5">…</text>
    </g>
    <text x="10" y="80" fill="currentColor" opacity="0.55" font-size="11">each step: allocate a new array, copy old values, add one</text>

    <text x="10" y="118" fill="#0b7a6e">preallocated (fills in place)</text>
    <g text-anchor="middle" font-size="13">
      <rect x="10" y="128" width="28" height="28" stroke="#0b7a6e" stroke-width="2.5" fill="rgba(11,122,110,.12)"/>
      <text x="24" y="147" fill="currentColor">0</text>
      <rect x="42" y="128" width="28" height="28" stroke="#0b7a6e" stroke-width="2.5" fill="rgba(11,122,110,.12)"/>
      <text x="56" y="147" fill="currentColor">0</text>
      <rect x="74" y="128" width="28" height="28" stroke="#0b7a6e" stroke-width="2.5" fill="rgba(11,122,110,.12)"/>
      <text x="88" y="147" fill="currentColor">0</text>
      <rect x="106" y="128" width="28" height="28" stroke="#0b7a6e" stroke-width="2.5" fill="rgba(11,122,110,.12)"/>
      <text x="120" y="147" fill="currentColor">0</text>
      <rect x="138" y="128" width="28" height="28" stroke="#0b7a6e" stroke-width="2.5" fill="rgba(11,122,110,.12)"/>
      <text x="152" y="147" fill="currentColor">0</text>
    </g>
    <text x="10" y="180" fill="currentColor" opacity="0.55" font-size="11">zeros(1,n) allocates once; each iteration just writes result(i)</text>
  </g>
</svg>
:::

:::callout kind="remember" title="Remember"
For a handful of iterations the difference is invisible. It matters once you’re looping thousands of times, which starts showing up from Unit 2 onward (see the Review chapter on Vectorization once it’s added).
:::

## When You Don’t Know the Final Size

Preallocation assumes you know the result’s length in advance. When you’re filtering (keeping only some elements), you often don’t know it until the loop finishes. Growing the result as you go is the accepted pattern here, not a shortcut:

```matlab run caption="growing a result whose final size you can’t predict ahead of time"
bp = [118 145 132 96 151 128];
highReadings = [];   % length not known ahead of time
for i = 1:length(bp)
    if bp(i) > 130
        highReadings(end+1) = bp(i);   % grow by one on each match
    end
end
disp(highReadings)
```

:::callout kind="note" title="Note"
This is one of the few cases where growing an array in a loop is the right call. Unit 1’s Review chapter on logical indexing shows a one-line, loop-free way to get the same result: <code>bp(bp > 130)</code>. Worth comparing once you get there.
:::

## while Loops

```matlab run caption="runs until the condition becomes false"
x = 100;
count = 0;
while x > 1
    x = x / 2;
    count = count + 1;
end
disp(count)
```

Use <code>while</code> when you don’t know in advance how many iterations you’ll need. Convergence loops in later units (root-finding, optimization) are almost always <code>while</code> loops, not <code>for</code> loops.

:::callout kind="mistake" title="Common mistake"
An infinite loop happens when nothing inside the loop body ever makes the condition false, e.g., forgetting to update the loop variable. If MATLAB seems frozen after running a <code>while</code> loop, that’s almost always why; <kbd>Ctrl+C</kbd> in the Command Window stops it.
:::

## A Second while Loop: Simulating Decay

A common <code>while</code>-loop pattern in later units: keep stepping forward while some physical quantity stays above (or below) a threshold, for example, a drug concentration halving on a fixed interval. This models discrete halving steps, not true continuous decay, but the loop <em>pattern</em> is the one Unit 4/5 build on with proper continuous-time models.

```matlab run caption="loop while a physical quantity stays above a threshold"
conc = 200;        % initial concentration (arbitrary units)
halfLife = 4;       % hours per halving
hoursElapsed = 0;
while conc > 10
    conc = conc / 2;
    hoursElapsed = hoursElapsed + halfLife;
end
fprintf('Concentration drops below 10 after %d hours\n', hoursElapsed)
```

## Reading a MATLAB Error

A MATLAB error message usually tells you three things: <em>what</em> went wrong, <em>where</em> (file and line number), and sometimes <em>why</em>. Read it bottom-to-top-of-stack, and start with the description, not the line number. The line number is where MATLAB noticed the problem, which isn’t always where the actual mistake is (a missing <code>end</code> is the classic example).

| You see… | It usually means… |
| --- | --- |
| <code>Undefined function or variable</code> | A typo in a name, or you’re using a variable before it’s ever assigned |
| <code>Matrix dimensions must agree</code> | You used <code>+</code>, <code>-</code>, or <code>.*</code>/<code>./</code> on two arrays of incompatible size |
| <code>Index exceeds the number of array elements</code> | You indexed past the end of an array, often an off-by-one mistake |
| <code>Error: A ")" or "}" is missing</code> | Unbalanced parentheses/brackets: count them carefully |

## Getting Help

<code>doc functionName</code> opens full documentation with examples; <code>help functionName</code> prints a shorter summary right in the Command Window. Both work for any built-in function. Try <code>doc linspace</code> if you’re unsure what a function does.

## Check Your Understanding

:::quickcheck
Q: Your script hangs and MATLAB seems frozen after you run a <code>while</code> loop. What’s the most likely cause, and how do you stop it?
A: The loop condition never becomes false, usually because something inside the loop that should update the condition variable was forgotten or written wrong. Press <kbd>Ctrl+C</kbd> in the Command Window to interrupt it.
:::
