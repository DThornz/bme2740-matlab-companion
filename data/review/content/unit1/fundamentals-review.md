---
id: fundamentals-review
unit: 1
title: Variables, Arrays & Indexing Review
kicker: Unit 1 · MATLAB
summary: A deeper pass through logical indexing and element-wise operations, the two Unit 0 ideas that come up in almost every piece of real MATLAB code from here on.
minutes: 10
---
## Logical Indexing, Properly

Unit 0 previewed logical indexing; this section covers the full picture. Comparing an array to a value produces a <strong>logical array</strong> (all <code>true</code>/<code>false</code>) the same size as the original. Using that logical array as an index keeps only the elements where it’s <code>true</code>.

```matlab run
bp = [118 145 132 96 151 128];
mask = bp > 130          % logical array: [0 1 1 0 1 0]
high = bp(mask)           % [145 132 151]

% Usually written in one line:
high = bp(bp > 130);
```

You can also use a logical mask to <em>modify</em> elements in place, without a loop:

```matlab run caption="clamp values with logical indexing, no loop needed"
bp = [118 145 132 96 151 128];
bp(bp > 140) = 140;   % cap any reading above 140 at exactly 140
disp(bp)
```

## find

<code>find</code> returns the <strong>indices</strong> where a condition is true, rather than the values themselves. That’s useful when you need to know <em>where</em> something happened, not only what the values were.

```matlab run
bp = [118 145 132 96 151 128];
idx = find(bp > 140)   % [2 5], positions, not values
bp(idx)                 % [145 151], same result as bp(bp>140), via the indices
```

| Expression | Returns |
| --- | --- |
| <code>bp &gt; 140</code> | A logical array the same size as <code>bp</code> |
| <code>bp(bp &gt; 140)</code> | The actual values greater than 140 |
| <code>find(bp &gt; 140)</code> | The index positions where the condition holds |

## Combining Conditions & Matrix Logical Indexing

Combine multiple conditions with the element-wise <code>&amp;</code> (AND) / <code>|</code> (OR) from Unit 0, not <code>&amp;&amp;</code>/<code>||</code>, which only accept single (scalar) values:

```matlab run
bp = [118 145 132 96 151 128];
borderline = bp(bp > 120 & bp < 140)   % [132 128], both conditions must hold
```

This closes the loop on the Unit 0 Review chapter’s nested-loop example, which flagged elevated readings across a matrix by hand. Same data, same idea, one line, no loop:

```matlab run caption="a logical mask in the row position selects whole rows"
vitals = [118 72; 145 95; 132 84];   % [systolic diastolic], one row per patient

highSystolic = vitals(:,1) > 140;     % logical column, one entry per patient
vitals(highSystolic, :)                % every column, only for flagged patients
```

<code>any</code> and <code>all</code> collapse a logical array down to a single true/false, “did at least one hold” vs. “did every one hold”:

```matlab run
vitals = [118 72; 145 95; 132 84];
any(vitals(:,1) > 140)   % 1, at least one patient’s systolic is over 140
all(vitals(:,1) > 140)   % 0, not every patient’s is
```

:::callout kind="remember" title="Remember"
A condition on one column gives one true/false per <em>row</em>. Put that mask in the row position (<code>vitals(mask, :)</code>) to pull the full row for every match, not only the single value that triggered it.
:::

## Element-Wise Operations, Revisited

The <code>.*</code> / <code>./</code> / <code>.^</code> vs. <code>*</code> / <code>/</code> / <code>^</code> distinction from Unit 0 becomes unavoidable once you start combining two full data vectors, e.g., computing flow from pressure and resistance across many samples at once, instead of one pair of numbers at a time.

```matlab run
pressure = [90 95 100 105];   % mmHg
resistance = [2 2 2.5 3];      % arbitrary units

flow = pressure ./ resistance   % element-wise: one flow value per sample
```

:::callout kind="mistake" title="Common mistake"
Writing <code>pressure / resistance</code> here (matrix right division) does not error. Both are row vectors of matching length, so MATLAB happily computes a matrix operation, but it is a totally different, much less useful number than the intended per-sample <code>flow</code>. This is the kind of bug that produces a plausible-looking wrong answer instead of a clean crash, which is exactly why it’s worth double-checking which operator you meant.
:::

## Check Your Understanding

:::quickcheck
Q: For a vector <code>x</code>, what’s the difference between <code>x(x&gt;0)</code> and <code>find(x&gt;0)</code>?
A: <code>x(x&gt;0)</code> returns the actual positive <em>values</em> in <code>x</code>. <code>find(x&gt;0)</code> returns the index <em>positions</em> where <code>x</code> is positive, not the values themselves.
:::
