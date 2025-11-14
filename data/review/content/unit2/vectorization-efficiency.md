---
id: vectorization-efficiency
unit: 2
title: Vectorization & Efficiency
kicker: Unit 2 · Linear Systems and Models
summary: Measuring MATLAB code with tic/toc, then speeding it up with preallocation, vectorized array operations, logical indexing, and single precision, on the way to a realistic worked optimization.
minutes: 11
---
## Why This Matters

The same loop that finishes instantly on a 10-element array can take minutes on a real dataset (a large image, a long EEG recording, a batch of patient records). MATLAB is built around array and matrix operations, so code written the way you'd write it in a lower-level language (element-by-element, in an explicit loop) is often leaving a large, free speedup on the table. This chapter covers four techniques, in the order you'd normally apply them: measure first, then preallocate, vectorize, and use logical indexing.

## Measuring Time: tic/toc

Before optimizing anything, measure it. <code>tic</code> starts a stopwatch; <code>toc</code> reports the elapsed time since the matching <code>tic</code>.

```matlab run
tic
rand(200);   % do some work
toc
```

Timing a single run is noisy (CPU load, MATLAB's own just-in-time optimization, and other running processes all add variance), so for a real comparison, average over several runs:

```matlab run caption="averaging timing over multiple runs"
numRuns = 20;
t = zeros(1, numRuns);   % preallocate the timing results themselves

for ii = 1:numRuns
    tic;
    rand(200);
    t(ii) = toc;
end

avg_time = mean(t)
```

## Preallocation

When you assign into a variable inside a loop without first sizing it, MATLAB has to grow the array on every iteration: copy the old contents into a newly allocated, larger block of memory, then add the new element. For a loop with $n$ iterations, that's roughly $n$ separate reallocations instead of one.

```
% Without preallocation, MATLAB regrows the array each iteration:
x = [0];             % 1 element
x = [0 1];           % copy + grow
x = [0 1 2];         % copy + grow again
...

% With preallocation, the array is sized once and just gets filled in:
x = [0 0 0 0 0 0];   % allocated once, up front
x = [0 1 0 0 0 0];   % overwrite in place
x = [0 1 2 0 0 0];   % overwrite in place
...
```

```matlab caption="the real course benchmark: n = 1e7"
n = 1e7;

tic
x = 0;                    % starts as a scalar, will be grown every iteration
for ii = 1:n
    x(ii) = ii;
end
t_no_prealloc = toc;

tic
x = zeros(1, n);          % full array allocated once, up front
for ii = 1:n
    x(ii) = ii;
end
t_prealloc = toc;

fprintf('Without preallocation: %.4f sec\n', t_no_prealloc);
fprintf('With preallocation:    %.4f sec\n', t_prealloc);
```

:::callout kind="sandbox" title="Sandbox Limitation"
The block above uses the course's real benchmark size (10 million elements) and is shown read-only for that reason: growing a 10-million-element array one index at a time is exactly the kind of slow, unpreallocated loop this section is warning about, and running it live in the browser's sandbox would take a very long time. Try the shrunk, interactive version below instead to feel the same effect on a scale that finishes instantly.
:::

```matlab run caption="same comparison, shrunk to run instantly in this sandbox"
n = 20000;

tic
x = 0;
for ii = 1:n
    x(ii) = ii;
end
t_no_prealloc = toc;

tic
x = zeros(1, n);
for ii = 1:n
    x(ii) = ii;
end
t_prealloc = toc;

fprintf('Without preallocation: %.4f sec\n', t_no_prealloc);
fprintf('With preallocation:    %.4f sec\n', t_prealloc);
```

## Vectorization

MATLAB's built-in functions (<code>sum</code>, <code>mean</code>, <code>std</code>, <code>cumsum</code>, and many more) operate on an entire array in one call, implemented internally far more efficiently than an equivalent hand-written loop.

```matlab run caption="summing an array: loop vs. built-in"
x = rand(1, 200000);

tic
total_loop = 0;
for ii = 1:length(x)
    total_loop = total_loop + x(ii);
end
t_loop = toc;

tic
total_vec = sum(x);
t_vec = toc;

fprintf('Loop method:    %.4f sec (result = %.4f)\n', t_loop, total_loop);
fprintf('Vectorized sum: %.4f sec (result = %.4f)\n', t_vec, total_vec);
```

The course benchmark for this comparison uses a 10-million-element array, where the gap between the two methods is far more dramatic than what you'll see at this smaller, sandbox-friendly size, but the direction of the effect is the same.

## Logical Indexing

Suppose you need every $x$ value where some function $y(x) \geq 0.5$. A loop with an <code>if</code> check works, but MATLAB can do the same filtering in one vectorized step using a logical (true/false) array as an index.

```matlab run caption="loop-and-if vs. logical indexing"
x_vals = linspace(0, 5, 20000);
y_vals = exp(-x_vals) .* x_vals.^2;

tic
found_loop = [];
for ii = 1:length(x_vals)
    if y_vals(ii) >= 0.15
        found_loop(end+1) = x_vals(ii);
    end
end
t_loop = toc;

tic
mask = (y_vals >= 0.15);   % logical array: true where the condition holds
found_logical = x_vals(mask);
t_logical = toc;

fprintf('Loop method:    %.4f sec, %d points found\n', t_loop, numel(found_loop));
fprintf('Logical method: %.4f sec, %d points found\n', t_logical, numel(found_logical));
```

:::callout kind="mistake" title="Common mistake"
Growing <code>found_loop</code> with <code>found_loop(end+1) = ...</code> inside a loop has the exact same unpreallocated-growth cost as the preallocation section above; it's a second, less obvious place the same problem shows up. Logical indexing sidesteps it entirely: <code>mask</code> is computed once, and <code>x_vals(mask)</code> extracts every matching element in a single operation.
:::

## Single vs. Double Precision

MATLAB uses double precision (8 bytes per number) by default. Single precision (4 bytes) halves the memory footprint and can improve speed on large arrays, at the cost of accuracy.

```matlab run caption="double vs. single: memory and speed tradeoff"
N = 200000;
x_double = rand(N, 1);
x_single = single(x_double);

whos x_double x_single   % compare bytes used

tic; s1 = sum(x_double); t_double = toc;
tic; s2 = sum(x_single); t_single = toc;

maxDiff = max(abs(double(x_single) - x_double));
fprintf('Sum (double): %.5f sec\nSum (single): %.5f sec\nMax representation difference: %.2e\n', t_double, t_single, maxDiff);
```

Single precision is a reasonable default when memory, not accuracy, is your bottleneck (a very large dataset that barely fits in memory as doubles) and your computation doesn't accumulate error over many steps. It's a poor choice for anything numerically sensitive, like a long ODE integration or an ill-conditioned linear solve, where the smaller precision compounds.

## Putting It Together: A Worked Optimization

A common processing task: given a large matrix of random values, build a second matrix where each element is negated if the original was below 0.5, and left as-is otherwise. The naive version is a nested loop that also grows both matrices one element at a time:

```matlab caption="Step 0: naive, no preallocation (real course size: 5000x5000)"
numElements = 5000;
tic
for ii = 1:numElements
    for jj = 1:numElements
        A(ii,jj) = rand;
        if A(ii,jj) > 0.5
            B(ii,jj) = A(ii,jj);
        else
            B(ii,jj) = -A(ii,jj);
        end
    end
end
toc
```

:::callout kind="sandbox" title="Sandbox Limitation"
25 million loop iterations (5000×5000) is far too slow for this browser sandbox and is shown read-only. Each optimization step below is likewise shown read-only at the real course size; a shrunk, interactive version follows after all four steps so you can feel the cumulative effect directly.
:::

```matlab caption="Step 1: + preallocation"
numElements = 5000;
tic
A = zeros(numElements);
B = zeros(numElements);
for ii = 1:numElements
    for jj = 1:numElements
        A(ii,jj) = rand;
        if A(ii,jj) > 0.5
            B(ii,jj) = A(ii,jj);
        else
            B(ii,jj) = -A(ii,jj);
        end
    end
end
toc
```

```matlab caption="Step 2: + vectorized generation (rand() fills the whole matrix in one call)"
numElements = 5000;
tic
A = rand(numElements);   % one call generates all 25 million values at once
B = zeros(numElements);
for ii = 1:numElements
    for jj = 1:numElements
        if A(ii,jj) > 0.5
            B(ii,jj) = A(ii,jj);
        else
            B(ii,jj) = -A(ii,jj);
        end
    end
end
toc
```

```matlab caption="Step 3: + logical indexing (the nested loop is gone entirely)"
numElements = 5000;
tic
A = rand(numElements);
B = zeros(numElements);
idx = A < 0.5;
B(idx) = -A(idx);   % everywhere A < 0.5, negate; everywhere else, B stays 0
toc
```

```matlab caption="Step 4: + single precision"
numElements = 5000;
tic
A = single(rand(numElements));
B = zeros(numElements, 'single');
idx = A < 0.5;
B(idx) = -A(idx);
toc
```

Each step removes one specific cost: Step 1 stops the repeated array-growth penalty, Step 2 replaces 25 million individual <code>rand</code> calls with one, Step 3 removes the nested loop and the <code>if</code>/<code>else</code> branch entirely in favor of a single logical-index assignment, and Step 4 halves the memory footprint. The original course exercise challenge: get the 5000×5000 version under 0.4 seconds total.

```matlab run caption="the same 4-step progression, shrunk so every version runs live"
numElements = 200;   % roughly 40,000 elements, small enough to feel instant either way

tic
A = single(rand(numElements));
B = zeros(numElements, 'single');
idx = A < 0.5;
B(idx) = -A(idx);
toc

fprintf('B is %dx%d, %d elements negated\n', size(B,1), size(B,2), nnz(idx));
```

## Profiling Your Code

<code>tic</code>/<code>toc</code> times a block you've already chosen to measure. MATLAB's <strong>Profiler</strong> goes further: it times every line of a script, including calls to built-in functions, so you can see exactly where time is being spent without guessing.

```matlab caption="enabling the Profiler (desktop MATLAB only)"
profile on;

N = 5000;
points = rand(N, 2);
distances = zeros(N, N);
for i = 1:N
    for j = 1:N
        dx = points(i,1) - points(j,1);
        dy = points(i,2) - points(j,2);
        distances(i,j) = sqrt(dx^2 + dy^2);
    end
end
% A built-in alternative, if the Statistics and Machine Learning Toolbox
% is available: distances = pdist2(points, points);

profile viewer;
```

:::callout kind="sandbox" title="Sandbox Limitation"
The Profiler is a desktop MATLAB GUI tool (<code>profile on</code> starts recording, <code>profile viewer</code> opens an interactive report window); there's no headless or scriptable equivalent, so it can't run in this browser sandbox at all, with any input size. Run it in real MATLAB or MATLAB Online to see it in action: it will show that the nested loop above spends nearly all of its time in the innermost <code>sqrt</code> call, which is exactly the kind of hotspot vectorization (or a built-in like <code>pdist2</code>, when the required toolbox is available) eliminates.
:::

## Check Your Understanding

:::quickcheck
Q: You have a loop that runs quickly for 100 iterations but takes minutes for 100,000. Preallocation is already in place. What should you look at next?
A: Whether the loop body itself can be vectorized (replaced with a single array-wide operation) or the condition inside it turned into logical indexing. Preallocation fixes the cost of the array *growing*; it doesn't remove the cost of doing the same scalar operation 100,000 separate times through the MATLAB interpreter, which vectorized built-ins avoid.
:::

:::quickcheck
Q: Why does Step 2 in the worked optimization (calling <code>rand(numElements)</code> once) help, when the total number of random values generated is exactly the same as Step 1?
A: The values generated are the same, but the number of individual function calls isn't: Step 1 still calls <code>rand</code> 25 million separate times inside the loop, each with its own function-call overhead, while Step 2 makes one call that fills the entire matrix internally. Vectorization is often as much about reducing call overhead and interpreter loop overhead as it is about the arithmetic itself.
:::

## Practice This Topic

:::practice unit=2 topic=vectorization-efficiency
Practice: Vectorization & Efficiency
:::
