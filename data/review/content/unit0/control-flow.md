---
id: control-flow
unit: 0
title: Logical Expressions & Control Flow
kicker: Unit 0 · MATLAB Foundations
summary: Branching with if / elseif / else and switch, and combining conditions with logical operators.
minutes: 7
---
## if / elseif / else

```matlab run
bp = 138;
if bp > 140
    disp('Stage 2 Hypertension')
elseif bp > 130
    disp('Stage 1 Hypertension')
else
    disp('Normal / Elevated')
end
```

MATLAB checks conditions top to bottom and runs the <strong>first</strong> branch that’s true. Later <code>elseif</code> branches are never evaluated once an earlier one matches. Every <code>if</code> needs a matching <code>end</code>.

:::callout kind="mistake" title="Common mistake"
Forgetting the closing <code>end</code> is the single most common syntax error for beginners. MATLAB’s error message points at a line far past where the real problem is, because it kept looking for the missing <code>end</code>.
:::

## Combining Conditions

| Operator | Meaning | Use with |
| --- | --- | --- |
| <code>&amp;&amp;</code> | AND, both must be true | two scalar (single-value) conditions |
| &#124;&#124; | OR, at least one must be true | two scalar conditions |
| <code>~</code> | NOT, flips true/false | a single scalar condition |

```matlab run
age = 45; bp = 138;
if age > 40 && bp > 130
    disp('Recommend follow-up')
end
```

:::callout kind="remember" title="Remember"
<code>&amp;&amp;</code> and <code>||</code> <em>short-circuit</em>. They stop evaluating as soon as the answer is known. <code>x ~= 0 && 1/x > 2</code> is safe even when <code>x</code> is 0, because <code>1/x</code> is never evaluated once the first condition is false.
:::

## Nested Conditions

```matlab caption="nesting works, but gets hard to read fast; prefer && where you can"
if age > 40
    if bp > 130
        disp('High priority follow-up')
    else
        disp('Routine follow-up')
    end
end
```

## switch / case

<code>switch</code> is a cleaner alternative to a long <code>if</code>/<code>elseif</code> chain when you’re comparing one variable against several specific values.

```matlab run
stage = 2;
switch stage
    case 1
        disp('Stage 1')
    case 2
        disp('Stage 2')
    otherwise
        disp('Unknown stage')
end
```

:::callout kind="note" title="When to use switch vs. if/elseif"
Reach for <code>switch</code> when you’re testing one variable for equality against a handful of specific values (like a stage number or a string label). Reach for <code>if</code>/<code>elseif</code> when your conditions involve ranges, comparisons, or multiple different variables.
:::

## Check Your Understanding

:::quickcheck
Q: In an <code>if</code>/<code>elseif</code>/<code>elseif</code>/<code>else</code> chain, if the first <code>elseif</code> condition is true, are the remaining <code>elseif</code> conditions still checked?
A: No, MATLAB runs the first branch whose condition is true and skips every branch after it, without evaluating their conditions at all.
:::
