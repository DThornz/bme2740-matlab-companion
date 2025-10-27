// ─────────────────────────────────────────────────────────────
// Review content, Unit 1: MATLAB (deeper pass). One chapter per
// Unit 1 topic (see data/units.js).
// ─────────────────────────────────────────────────────────────

import { chapter, section, p, list, code, callout, table, quickCheck } from './blocks.js';

export const UNIT1_CHAPTERS = [

  chapter({
    id: 'fundamentals-review',
    unit: 1,
    title: 'Variables, Arrays & Indexing Review',
    kicker: 'Unit 1 · MATLAB',
    summary: 'A deeper pass through logical indexing and element-wise operations, the two Unit 0 ideas that come up in almost every piece of real MATLAB code from here on.',
    minutes: 10,
    topics: ['fundamentals-review'],
    sections: [
      section('Logical Indexing, Properly', [
        p('Unit 0 previewed logical indexing; this section covers the full picture. Comparing an array to a value produces a <strong>logical array</strong> (all <code>true</code>/<code>false</code>) the same size as the original. Using that logical array as an index keeps only the elements where it’s <code>true</code>.'),
        code('bp = [118 145 132 96 151 128];\nmask = bp > 130          % logical array: [0 1 1 0 1 0]\nhigh = bp(mask)           % [145 132 151]\n\n% Usually written in one line:\nhigh = bp(bp > 130);', { run: true }),
        p('You can also use a logical mask to <em>modify</em> elements in place, without a loop:'),
        code('bp = [118 145 132 96 151 128];\nbp(bp > 140) = 140;   % cap any reading above 140 at exactly 140\ndisp(bp)', { run: true, caption: 'clamp values with logical indexing, no loop needed' }),
      ]),
      section('find', [
        p('<code>find</code> returns the <strong>indices</strong> where a condition is true, rather than the values themselves. That’s useful when you need to know <em>where</em> something happened, not only what the values were.'),
        code('bp = [118 145 132 96 151 128];\nidx = find(bp > 140)   % [2 5], positions, not values\nbp(idx)                 % [145 151], same result as bp(bp>140), via the indices', { run: true }),
        table(['Expression', 'Returns'], [
          ['<code>bp &gt; 140</code>', 'A logical array the same size as <code>bp</code>'],
          ['<code>bp(bp &gt; 140)</code>', 'The actual values greater than 140'],
          ['<code>find(bp &gt; 140)</code>', 'The index positions where the condition holds'],
        ]),
      ]),
      section('Combining Conditions & Matrix Logical Indexing', [
        p('Combine multiple conditions with the element-wise <code>&amp;</code> (AND) / <code>|</code> (OR) from Unit 0, not <code>&amp;&amp;</code>/<code>||</code>, which only accept single (scalar) values:'),
        code('bp = [118 145 132 96 151 128];\nborderline = bp(bp > 120 & bp < 140)   % [132 128], both conditions must hold', { run: true }),
        p('This closes the loop on the Unit 0 Review chapter’s nested-loop example, which flagged elevated readings across a matrix by hand. Same data, same idea, one line, no loop:'),
        code('vitals = [118 72; 145 95; 132 84];   % [systolic diastolic], one row per patient\n\nhighSystolic = vitals(:,1) > 140;     % logical column, one entry per patient\nvitals(highSystolic, :)                % every column, only for flagged patients', { run: true, caption: 'a logical mask in the row position selects whole rows' }),
        p('<code>any</code> and <code>all</code> collapse a logical array down to a single true/false, “did at least one hold” vs. “did every one hold”:'),
        code('vitals = [118 72; 145 95; 132 84];\nany(vitals(:,1) > 140)   % 1, at least one patient’s systolic is over 140\nall(vitals(:,1) > 140)   % 0, not every patient’s is', { run: true }),
        callout('remember', 'Remember', 'A condition on one column gives one true/false per <em>row</em>. Put that mask in the row position (<code>vitals(mask, :)</code>) to pull the full row for every match, not only the single value that triggered it.'),
      ]),
      section('Element-Wise Operations, Revisited', [
        p('The <code>.*</code> / <code>./</code> / <code>.^</code> vs. <code>*</code> / <code>/</code> / <code>^</code> distinction from Unit 0 becomes unavoidable once you start combining two full data vectors, e.g., computing flow from pressure and resistance across many samples at once, instead of one pair of numbers at a time.'),
        code('pressure = [90 95 100 105];   % mmHg\nresistance = [2 2 2.5 3];      % arbitrary units\n\nflow = pressure ./ resistance   % element-wise: one flow value per sample', { run: true }),
        callout('mistake', 'Common mistake', 'Writing <code>pressure / resistance</code> here (matrix right division) does not error. Both are row vectors of matching length, so MATLAB happily computes a matrix operation, but it is a totally different, much less useful number than the intended per-sample <code>flow</code>. This is the kind of bug that produces a plausible-looking wrong answer instead of a clean crash, which is exactly why it’s worth double-checking which operator you meant.'),
      ]),
      section('Check Your Understanding', [
        quickCheck('For a vector <code>x</code>, what’s the difference between <code>x(x&gt;0)</code> and <code>find(x&gt;0)</code>?', '<code>x(x&gt;0)</code> returns the actual positive <em>values</em> in <code>x</code>. <code>find(x&gt;0)</code> returns the index <em>positions</em> where <code>x</code> is positive, not the values themselves.'),
      ]),
    ],
  }),

  chapter({
    id: 'io-and-scripts',
    unit: 1,
    title: 'Functions, Input/Output & Scripts',
    kicker: 'Unit 1 · MATLAB',
    summary: 'Writing your own functions with inputs and outputs, understanding variable scope, and organizing a project across more than one file.',
    minutes: 9,
    topics: ['io-and-scripts'],
    sections: [
      section('Built-In Functions, as a Pattern', [
        p('You’ve already been calling functions, such as <code>sin</code>, <code>mean</code>, and <code>size</code>. You haven’t written one yet. Every function follows the same shape: it takes some inputs, does something, and returns some outputs.'),
        code('y = sin(x);          % one input, one output\nm = mean(x);          % one input, one output\n[r, c] = size(A);     % one input, TWO outputs', { caption: 'multiple outputs are a comma-separated list on the left' }),
      ]),
      section('Writing Your Own Function', [
        code('function y = squareMinus4(x)\n    y = x.^2 - 4;\nend', { caption: 'squareMinus4.m' }),
        list([
          'The file name must match the function name exactly: this function must live in a file called <code>squareMinus4.m</code>.',
          '<code>function y = squareMinus4(x)</code> is the signature: one output (<code>y</code>), one input (<code>x</code>).',
          'Everything between this line and the matching <code>end</code> only runs when the function is called. Unlike a script, nothing here executes merely by having the file open.',
        ]),
        code('result = squareMinus4(5)   % calling it, if squareMinus4.m is on the path\n% result = 21', { caption: 'calling a function you wrote' }),
      ]),
      section('Multiple Inputs & Outputs', [
        code('function [avgVal, rangeVal] = summarizeData(x)\n    avgVal = mean(x);\n    rangeVal = max(x) - min(x);\nend', { caption: 'summarizeData.m, two outputs' }),
        code('[a, r] = summarizeData([120 118 135 140]);\ndisp(a)   % average\ndisp(r)   % range', { caption: 'you can also take only the first output: a = summarizeData(...)' }),
      ]),
      section('A Second Worked Example', [
        p('Functions commonly take more than one input. A simple weight-based dosing calculator:'),
        code('function doseMg = weightBasedDose(weightKg, mgPerKg)\n    doseMg = weightKg * mgPerKg;\nend', { caption: 'weightBasedDose.m' }),
        code('doseMg = weightBasedDose(70, 2.5)   % 175', { caption: 'calling it, needs weightBasedDose.m on the path to run' }),
        callout('note', 'Note', 'Try-it blocks in this Review section run one self-contained snippet. They can’t define a separate <code>function ... end</code> file the way MATLAB’s Editor does, which is why these two blocks aren’t interactive here. Save the function in its own <code>.m</code> file (matching its name) to run it, in the Sandbox or the MATLAB desktop.'),
      ]),
      section('Scope: Why Functions Are Different from Scripts', [
        p('A function has its own private workspace. Variables created inside it, including its inputs, disappear the moment it finishes, and it cannot see or accidentally overwrite variables from wherever it was called. This is the opposite of a script, which shares the base workspace with everything around it (see the Unit 0 Environment chapter).'),
        callout('remember', 'Remember', 'This is exactly why functions are safer to reuse: calling <code>squareMinus4</code> can never accidentally clobber a variable you happen to also have named <code>y</code> in the Command Window. A script with the same body could.'),
      ]),
      section('Organizing Multi-File Projects', [
        p('As a script grows, it’s common to split repeated logic out into its own function file. The rule is simple: any function file you call must be either in the Current Folder or on MATLAB’s search path (<code>addpath</code>), otherwise you get an “Undefined function” error even though the file clearly exists on your computer somewhere.'),
      ]),
      section('Check Your Understanding', [
        quickCheck('You define <code>x = 10</code> inside a function, then call that function from a script. After the call returns, does the script’s own <code>x</code> (if it has one) get overwritten?', 'No, the function’s <code>x</code> lives in its own private workspace and is discarded when the function returns. It never touches the caller’s variables unless they’re explicitly returned as an output.'),
      ]),
    ],
  }),

  chapter({
    id: 'plotting-patterns',
    unit: 1,
    title: 'Plotting & Programming Patterns',
    kicker: 'Unit 1 · MATLAB',
    summary: 'Common, reusable plotting recipes, multiple subplots, line styles, and markers, plus a few idiomatic MATLAB patterns worth recognizing on sight.',
    minutes: 8,
    topics: ['plotting-patterns'],
    sections: [
      section('subplot: Multiple Plots, One Figure', [
        code('t = 0:0.01:10;\n\nsubplot(2,1,1)\nplot(t, sin(t))\ntitle(\'sin(t)\')\n\nsubplot(2,1,2)\nplot(t, cos(t))\ntitle(\'cos(t)\')', { run: true, caption: '2 rows, 1 column, this is panel 1 / panel 2' }),
        p('<code>subplot(rows, cols, index)</code> divides the figure into a grid and selects one cell to draw into next. The index counts left-to-right, top-to-bottom, like reading text.'),
      ]),
      section('More subplot Variety', [
        p('Subplots don’t have to be a simple 2×1 stack. Looping over the panel index avoids writing <code>subplot</code> three separate times by hand, the same instinct that motivated <code>for</code> loops in the first place:'),
        code('t = 0:0.01:5;\nsignals = {80 + 20*sin(2*pi*1.2*t), 75 + 15*sin(2*pi*1.0*t), 90 + 25*sin(2*pi*1.5*t)};\nlabels = {\'Patient A\', \'Patient B\', \'Patient C\'};\n\nfor i = 1:3\n    subplot(3,1,i)\n    plot(t, signals{i})\n    title(labels{i})\n    ylabel(\'mmHg\')\nend', { run: true, caption: '3 stacked panels, built with a loop over a cell array' }),
        callout('remember', 'Remember', '<code>{ }</code> creates a <strong>cell array</strong>. Unlike a normal array, its elements don’t need to be the same size or type. <code>signals{i}</code> (curly braces) pulls the actual vector back out; <code>signals(i)</code> (parentheses) would give you a 1×1 cell containing that vector instead, not the vector itself.'),
      ]),
      section('Line Styles & Markers', [
        table(['Code', 'Meaning'], [
          ['<code>\'-\'</code>', 'Solid line (default)'],
          ['<code>\'--\'</code>', 'Dashed line'],
          ['<code>\':\'</code>', 'Dotted line'],
          ['<code>\'o\'</code>', 'Circle markers, no line'],
          ['<code>\'r--o\'</code>', 'Red dashed line with circle markers, combine color/style/marker in one string'],
        ]),
        code('t = 0:0.5:10;\nplot(t, sin(t), \'r--o\')\nxlabel(\'t\')\nylabel(\'sin(t)\')', { run: true }),
      ]),
      section('A Reusable Pattern: Plot, Then Annotate', [
        p('Most well-formed plotting code in this course follows the same order: build the data, call <code>plot</code>, then immediately label it, before moving on to anything else. Keeping that order makes it much harder to accidentally ship an unlabeled plot.'),
        code('x = linspace(0, 2*pi, 200);\ny = sin(x) .* exp(-x/5);\n\nplot(x, y)\nxlabel(\'x\')\nylabel(\'y\')\ntitle(\'Damped Sine\')\ngrid on', { run: true }),
      ]),
      section('Check Your Understanding', [
        quickCheck('What does <code>subplot(2,2,3)</code> select?', 'The third cell in a 2×2 grid, counting left-to-right then top-to-bottom. That’s the bottom-left panel.'),
      ]),
    ],
  }),

  chapter({
    id: 'reading-output',
    unit: 1,
    title: 'Reading Code, Errors & Output',
    kicker: 'Unit 1 · MATLAB',
    summary: 'Practice at the skill quizzes in this topic test: reading a short piece of MATLAB code and predicting exactly what it prints or does, including when it errors.',
    minutes: 9,
    topics: ['reading-output'],
    sections: [
      section('Tracing Code by Hand', [
        p('The most reliable way to predict output is the least clever one: go line by line, and write down the value of every variable as it changes, the same way you’d hand-trace any program.'),
        code('x = 3;\ny = x + 2;\nx = x * 2;\ndisp(y)', { run: true, caption: 'what prints? trace it before running' }),
        p('Trace: <code>x = 3</code>. Then <code>y = x + 2 = 5</code>. <code>y</code> is computed from <code>x</code>’s value <em>at that moment</em> (3), not whatever <code>x</code> becomes later. Then <code>x</code> is reassigned to 6; this does not retroactively change <code>y</code>. <code>disp(y)</code> prints <code>5</code>.'),
        callout('mistake', 'Common mistake', 'Assuming a variable is “live” like a spreadsheet formula, automatically updating when something it was computed from changes. It isn’t. Every assignment in MATLAB computes a value once, at that moment, from whatever the right-hand side evaluates to right then.'),
      ]),
      section('Predicting Suppressed vs. Printed Output', [
        code('a = 4;        % no output, semicolon\nb = a + 1      % prints: b = 5\nc = b * 2;     % no output, semicolon', { caption: 'check every line for a trailing semicolon before deciding what prints' }),
      ]),
      section('Tracing a Loop', [
        p('The same line-by-line approach works for loops. Repeat it once per iteration, updating a small table of variable values as you go, the way you would on a whiteboard.'),
        code('total = 0;\nfor i = 1:4\n    total = total + i;\nend\ndisp(total)', { run: true, caption: 'trace: what is total after each iteration?' }),
        p('Trace: <code>i=1</code> → total = 0+1 = 1. <code>i=2</code> → total = 1+2 = 3. <code>i=3</code> → total = 3+3 = 6. <code>i=4</code> → total = 6+4 = 10. <code>disp(total)</code> prints <code>10</code>.'),
      ]),
      section('Tracing a Function Call', [
        p('When a line calls a function, jump into the function body, trace it using the argument’s <em>value</em> (not its name back in the caller), then jump back with whatever it returned.'),
        code('function y = doubleIt(x)\n    y = x * 2;\nend', { caption: 'doubleIt.m, defined separately, referenced by the script below' }),
        code('a = 5;\nb = doubleIt(a);\na = 100;\ndisp(b)', { caption: 'trace: what does this print?' }),
        p('Trace: <code>a=5</code>. <code>doubleIt(a)</code> runs with <code>x=5</code> inside the function’s own private workspace (see the Functions chapter on scope) and returns <code>10</code>, so <code>b=10</code>. Reassigning <code>a=100</code> afterward has no effect on <code>b</code>; it was already computed and returned. <code>disp(b)</code> prints <code>10</code>.'),
      ]),
      section('Common Errors, Revisited', [
        p('The error-message table from the Unit 0 debugging chapter applies here too. Reading-output questions often show you the error MATLAB would throw, and ask you to identify why, rather than showing correct code.'),
        code('x = [1 2 3];\ny = [1 2];\nz = x + y;   % Matrix dimensions must agree', { caption: 'a size mismatch, not a syntax error' }),
        code('result = total + 1;   % Undefined function or variable \'total\'', { caption: '\'total\' was never assigned before this line' }),
      ]),
      section('Check Your Understanding', [
        quickCheck('<code>a = 2; b = a; a = 10;</code>, after this, what is <code>b</code>?', '<code>2</code>. <code>b = a</code> copies <code>a</code>’s value at that moment (2); reassigning <code>a</code> afterward has no effect on <code>b</code>.'),
      ]),
    ],
  }),

];
