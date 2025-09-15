// ─────────────────────────────────────────────────────────────
// Review content — Unit 0: MATLAB Overview. One chapter per Unit 0
// topic (see data/units.js) so Review and Practice line up 1:1.
// ─────────────────────────────────────────────────────────────

import { chapter, section, p, list, code, callout, table, eq, quickCheck, diagram } from './blocks.js';

export const UNIT0_CHAPTERS = [

  chapter({
    id: 'environment',
    unit: 0,
    title: 'The MATLAB Environment & Scripts',
    kicker: 'Unit 0 · MATLAB Foundations',
    summary: 'Get oriented in the MATLAB desktop, understand the difference between typing at the command line and writing a script, and learn the three commands that reset your workspace.',
    minutes: 6,
    topics: ['environment'],
    sections: [
      section('The MATLAB Desktop', [
        p('MATLAB’s default layout has three panels you’ll use constantly:'),
        list([
          '<strong>Command Window</strong> — type a line of code and press Enter to run it immediately. Good for quick one-off checks, bad for anything you want to keep or re-run.',
          '<strong>Workspace</strong> — every variable currently defined, with its value, size, and class. If a variable doesn’t appear here, MATLAB doesn’t know about it yet.',
          '<strong>Current Folder</strong> — where MATLAB looks for scripts and data files by default. A script can only call another file by name if that file is in the Current Folder or on MATLAB’s search path.',
        ]),
        callout('note', 'Why this trips people up', 'A large fraction of “undefined variable” and “file not found” errors in Unit 0 come from the Current Folder pointing somewhere unexpected, not from an actual code mistake. If something inexplicably isn’t found, check the Current Folder panel first.'),
      ]),
      section('Scripts vs. the Command Line', [
        p('A <strong>script</strong> is a plain text file ending in <code>.m</code> containing a sequence of commands. Instead of retyping the same lines in the Command Window every time, you save them once and run the whole file.'),
        code('% mysignal.m\nt = 0:0.01:1;\ny = sin(2*pi*5*t);\nplot(t, y)\ntitle(\'5 Hz sine wave\')', { run: true, caption: 'mysignal.m' }),
        p('Run a script by typing its file name (without <code>.m</code>) in the Command Window, or with the Editor’s Run button. Every variable it creates — here, <code>t</code> and <code>y</code> — lands in the Workspace exactly as if you had typed each line by hand.'),
        callout('remember', 'Scripts share the base workspace', 'A script does not get its own private variables — a <strong>function</strong> does (see Unit 1). If a variable named <code>t</code> already exists before the script runs, the script silently overwrites it.'),
      ]),
      section('Clearing State: clear, clc, close all', [
        table(['Command', 'What it actually clears', 'Typical use'], [
          ['<code>clear</code>', 'Every variable in the Workspace', 'Start a script with a clean slate so leftover variables from a previous run can’t sneak in'],
          ['<code>clc</code>', 'Text printed in the Command Window', 'Purely visual — has zero effect on any variable'],
          ['<code>close all</code>', 'Every open figure window', 'Avoid accumulating dozens of plot windows across repeated runs'],
        ]),
        callout('mistake', 'Common mistake', '<code>clc</code> feels like it “resets” everything because the screen goes blank — it does not. Variables from a previous run are still sitting in the Workspace. If your script needs to start from nothing, that’s <code>clear</code>, not <code>clc</code>.'),
      ]),
      section('Live Scripts (.mlx)', [
        p('MATLAB also has <strong>Live Scripts</strong> (<code>.mlx</code> files), which interleave code, formatted text, and inline output/plots in a single document — handy for lab reports and walkthroughs. Everything in this Review section is shown as plain <code>.m</code>-style code, since that’s what the browser-based Sandbox, this practice companion, and version control all work with — the underlying MATLAB syntax is identical either way.'),
      ]),
      section('Check Your Understanding', [
        quickCheck(
          'You run a script twice in a row without calling <code>clear</code> in between. Does the second run start with an empty Workspace?',
          'No — variables created by the first run are still in the Workspace when the second run starts, unless the script itself begins with <code>clear</code>.'
        ),
      ]),
    ],
  }),

  chapter({
    id: 'syntax-operators',
    unit: 0,
    title: 'Variables, Syntax & Operators',
    kicker: 'Unit 0 · MATLAB Foundations',
    summary: 'Assignment, comments, the semicolon, variable-naming rules, and how MATLAB evaluates arithmetic and relational expressions.',
    minutes: 7,
    topics: ['variables-operators'],
    sections: [
      section('Assignment & the Semicolon', [
        p('<code>=</code> is assignment, not mathematical equality — <code>x = 5</code> means “store 5 in <code>x</code>,” not “x equals 5” as a statement of fact. A trailing semicolon suppresses the echoed output; leaving it off prints the result immediately.'),
        code('x = 5;\ny = 3\nz = x^2 + y', { run: true, caption: 'suppressed vs. echoed output' }),
        callout('mistake', 'Common mistake', 'Confusing <code>=</code> (assignment) with <code>==</code> (comparison). <code>if x = 5</code> is a syntax error in MATLAB — you need <code>if x == 5</code> to test equality.'),
      ]),
      section('Comments', [
        p('Anything after <code>%</code> on a line is a comment — ignored by MATLAB, meant for you. <code>%%</code> additionally marks a “cell” break, letting you run one section of a longer script at a time in the Editor.'),
        code('% Compute the mean arterial pressure\nsbp = 120;   % systolic (mmHg)\ndbp = 80;    % diastolic (mmHg)\nmap = dbp + (sbp - dbp)/3'),
      ]),
      section('Variable Naming Rules', [
        list([
          'Must start with a letter (<code>x1</code> is valid, <code>1x</code> is not).',
          'Can contain letters, digits, and underscores only — no spaces or punctuation.',
          'Is <strong>case-sensitive</strong> — <code>Data</code> and <code>data</code> are two different variables.',
          'Cannot be a MATLAB keyword (<code>for</code>, <code>if</code>, <code>end</code>, …), though it <em>can</em> shadow a built-in function name like <code>sum</code> or <code>mean</code> — legal, but risky, since that function becomes unreachable for the rest of the session.',
        ]),
        code('isvarname(\'bp_avg\')   % 1 (true) — valid name\nisvarname(\'2nd_reading\')   % 0 (false) — starts with a digit', { run: true, caption: 'isvarname checks the rules for you' }),
        callout('remember', 'Remember', '<code>isvarname</code> only checks whether a string is a *legal* name — it does not check whether that name is already in use or shadows a built-in. Use <code>which name</code> to check the latter.'),
      ]),
      section('Operator Precedence', [
        p('MATLAB follows standard math precedence: parentheses, then power (<code>^</code>), then unary minus, then multiply/divide, then add/subtract, left to right within a tier.'),
        eq('z = x^2 + y', { label: 'z =', note: 'Evaluates as (x^2) + y, not x^(2+y) — power binds tighter than addition.' }),
        code('x = 3; y = 4;\nz1 = x^2 + y      % 13, not 3^6\nz2 = 2 + 3 * 4    % 14, not 20', { run: true }),
        callout('mistake', 'Common mistake', 'When in doubt, add parentheses. It costs nothing and removes any ambiguity for whoever reads the code next — including you, a week later.'),
      ]),
      section('Relational & Logical Operators', [
        table(['Operator', 'Meaning'], [
          ['<code>==</code>', 'Equal to'],
          ['<code>~=</code>', 'Not equal to'],
          ['<code>&lt;</code>, <code>&gt;</code>', 'Less than, greater than'],
          ['<code>&lt;=</code>, <code>&gt;=</code>', 'Less than or equal, greater than or equal'],
          ['<code>&amp;&amp;</code>, <code>||</code>', 'Logical AND / OR — for two single (scalar) conditions'],
          ['<code>&amp;</code>, <code>|</code>', 'Element-wise AND / OR — for comparing whole arrays element by element'],
        ]),
        callout('mistake', 'Common mistake', 'Using <code>&amp;&amp;</code>/<code>||</code> on arrays throws an error (they require scalar operands). Use <code>&amp;</code>/<code>|</code> when either side is a vector or matrix — see the Control Flow chapter for more.'),
      ]),
      section('Check Your Understanding', [
        quickCheck('What does <code>2 + 3 * 4</code> evaluate to, and why?', '<code>14</code> — multiplication binds tighter than addition, so this is <code>2 + (3*4)</code>, not <code>(2+3)*4</code>.'),
      ]),
    ],
  }),

  chapter({
    id: 'vectors-matrices',
    unit: 0,
    title: 'Vectors, Matrices & Indexing',
    kicker: 'Unit 0 · MATLAB Foundations',
    summary: 'Building row and column vectors, matrices, indexing into both, and the single most common source of MATLAB bugs: matrix operators vs. element-wise operators.',
    minutes: 10,
    topics: ['vectors-matrices'],
    sections: [
      section('Row & Column Vectors', [
        p('A row vector is a list of values separated by spaces or commas; a column vector uses semicolons (or a transpose).'),
        code('rowVec = [1 2 3 4 5];\ncolVec = [1; 2; 3; 4; 5];\ncolVec2 = rowVec\';   % transpose of a row vector is a column vector', { run: true }),
        p('Two ways to build an evenly-spaced range:'),
        table(['Expression', 'Produces', 'You specify'], [
          ['<code>0:0.1:10</code>', 'Values from 0 to 10 in steps of 0.1', 'the <strong>step size</strong> — the count of points is whatever that implies'],
          ['<code>linspace(0,10,101)</code>', '101 values evenly spaced from 0 to 10', 'the <strong>number of points</strong> — the step size is whatever that implies'],
        ]),
        code('a = 0:0.1:10;\nb = linspace(0, 10, 101);\nisequal(a, b)   % 1 — same 101 points here, but only because 0.1 divides evenly into 10', { run: true }),
        callout('remember', 'Remember', 'Reach for <code>linspace</code> when you know exactly how many points you want (e.g., “101 samples”); reach for the colon operator when you know the exact step size (e.g., “every 0.1 seconds”). They are not always interchangeable — a step that doesn’t divide the range evenly will not match a corresponding <code>linspace</code> call.'),
      ]),
      section('Vector Functions: length, size, numel', [
        table(['Function', 'Returns'], [
          ['<code>length(x)</code>', 'The size of the largest dimension — for a plain vector, that’s just how many elements it has'],
          ['<code>size(x)</code>', 'A 2-element vector <code>[rows cols]</code> — the full shape'],
          ['<code>numel(x)</code>', 'The total number of elements, regardless of shape'],
        ]),
        code('x = [1 2 3; 4 5 6];\nlength(x)   % 3 — the larger dimension (2 rows, 3 cols)\nsize(x)     % [2 3]\nnumel(x)    % 6', { run: true }),
        callout('mistake', 'Common mistake', '<code>length</code> on a matrix is rarely what you want — it silently ignores the smaller dimension. Prefer <code>size(x,1)</code> / <code>size(x,2)</code> for matrices, and save <code>length</code> for actual vectors.'),
      ]),
      section('Matrices: Building & Indexing', [
        p('A matrix is rows of vectors stacked with semicolons — every row needs the same number of elements.'),
        code('A = [1 2 3; 4 5 6; 7 8 9];\nzeros(2,3)   % 2x3 matrix of zeros\nones(3,1)    % 3x1 column of ones\neye(3)       % 3x3 identity matrix', { run: true }),
        diagram(
          `<svg viewBox="0 0 360 170" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A 3 by 3 matrix with rows and columns labeled, and A(2,3) highlighted">
            <text x="10" y="20" font-family="DM Mono, monospace" font-size="12" fill="currentColor">A(row, col)</text>
            <g font-family="DM Mono, monospace" font-size="13">
              <text x="70" y="45" fill="currentColor" opacity="0.55">col 1</text>
              <text x="140" y="45" fill="currentColor" opacity="0.55">col 2</text>
              <text x="210" y="45" fill="currentColor" opacity="0.55">col 3</text>
              <text x="15" y="80" fill="currentColor" opacity="0.55">row 1</text>
              <text x="15" y="115" fill="currentColor" opacity="0.55">row 2</text>
              <text x="15" y="150" fill="currentColor" opacity="0.55">row 3</text>
            </g>
            <g font-family="DM Mono, monospace" font-size="15" text-anchor="middle">
              <rect x="55" y="60" width="60" height="35" fill="none" stroke="currentColor" opacity="0.25"/>
              <text x="85" y="83" fill="currentColor">1</text>
              <rect x="125" y="60" width="60" height="35" fill="none" stroke="currentColor" opacity="0.25"/>
              <text x="155" y="83" fill="currentColor">2</text>
              <rect x="195" y="60" width="60" height="35" fill="none" stroke="currentColor" opacity="0.25"/>
              <text x="225" y="83" fill="currentColor">3</text>
              <rect x="55" y="95" width="60" height="35" fill="none" stroke="currentColor" opacity="0.25"/>
              <text x="85" y="118" fill="currentColor">4</text>
              <rect x="125" y="95" width="60" height="35" stroke="#0b7a6e" stroke-width="2.5" fill="rgba(11,122,110,.12)"/>
              <text x="155" y="118" fill="currentColor">5</text>
              <rect x="195" y="95" width="60" height="35" fill="none" stroke="currentColor" opacity="0.25"/>
              <text x="225" y="118" fill="currentColor">6</text>
              <rect x="55" y="130" width="60" height="35" fill="none" stroke="currentColor" opacity="0.25"/>
              <text x="85" y="153" fill="currentColor">7</text>
              <rect x="125" y="130" width="60" height="35" fill="none" stroke="currentColor" opacity="0.25"/>
              <text x="155" y="153" fill="currentColor">8</text>
              <rect x="195" y="130" width="60" height="35" fill="none" stroke="currentColor" opacity="0.25"/>
              <text x="225" y="153" fill="currentColor">9</text>
            </g>
            <text x="270" y="112" font-family="DM Mono, monospace" font-size="13" fill="#0b7a6e">A(2,2) = 5</text>
          </svg>`,
          'MATLAB indexes as A(row, col) — always row first.'
        ),
        code('A = [1 2 3; 4 5 6; 7 8 9];\nA(2,2)     % 5 — row 2, column 2\nA(:,2)     % entire column 2 → [2;5;8]\nA(3,:)     % entire row 3 → [7 8 9]\nA(2:3,1:2) % submatrix, rows 2-3 and cols 1-2\nA(end,:)   % last row, without knowing how many rows there are', { run: true }),
        callout('mistake', 'Common mistake', 'MATLAB indexing starts at <strong>1</strong>, not 0. <code>A(1,1)</code> is the first element — <code>A(0,1)</code> throws an error, it does not wrap around or silently do nothing.'),
      ]),
      section('Logical Indexing (a preview)', [
        p('You can index with a logical (true/false) array the same size as your data, to pull out only the elements where the condition is true. This is covered in depth in Unit 1, but it’s worth seeing once here:'),
        code('bp = [118 145 132 96 151];\nhigh = bp(bp > 130)   % [145 132 151] — only the elements over 130', { run: true }),
      ]),
      section('Element-Wise vs. Matrix Operations', [
        p('This is the single most common source of confusion in early MATLAB code: <code>*</code>, <code>/</code>, and <code>^</code> mean true <strong>matrix</strong> multiplication/division/power (as in linear algebra), while <code>.*</code>, <code>./</code>, and <code>.^</code> mean <strong>element-wise</strong> operations — pair each element up with the one in the same position.'),
        table(['Matrix operator', 'Meaning', 'Element-wise operator', 'Meaning'], [
          ['<code>*</code>', 'Matrix multiplication (inner dimensions must match)', '<code>.*</code>', 'Multiply each pair of same-position elements'],
          ['<code>/</code>', 'Matrix right division (solves a linear system)', '<code>./</code>', 'Divide each pair of same-position elements'],
          ['<code>^</code>', 'Matrix power (repeated matrix multiplication)', '<code>.^</code>', 'Raise each element to a power individually'],
        ]),
        code('x = [1 2 3];\ny = x.^2        % [1 4 9] — square each element\n\nA = [1 2; 3 4];\nA^2              % A*A, real matrix multiplication → [7 10; 15 22]\nA.^2             % each entry squared individually → [1 4; 9 16]', { run: true }),
        callout('mistake', 'Common mistake', 'Two same-size vectors, <code>x * y</code> where both are, say, 1×5 row vectors, is <strong>not</strong> valid matrix multiplication (inner dimensions 5 and 1 don’t line up) and throws a dimension-mismatch error. What you almost always want for “multiply these two data vectors together, position by position” is <code>x .* y</code>.'),
      ]),
      section('Check Your Understanding', [
        quickCheck('For <code>x = [1 2 3]</code>, what’s the difference between <code>x.^2</code> and <code>x^2</code>?', '<code>x.^2</code> squares each element → <code>[1 4 9]</code>. <code>x^2</code> attempts real matrix power on a non-square array and throws an error — matrix power only makes sense for a square matrix.'),
      ]),
    ],
  }),

  chapter({
    id: 'plotting-basics',
    unit: 0,
    title: 'Basic Plotting',
    kicker: 'Unit 0 · MATLAB Foundations',
    summary: 'Producing a basic 2-D plot, labeling it properly, and the handful of commands that make a plot readable instead of a bare line.',
    minutes: 6,
    topics: ['plotting-basics'],
    sections: [
      section('A Minimal Plot', [
        p('<code>plot(x, y)</code> draws <code>y</code> against <code>x</code> — both must be vectors of the same length. On its own it’s just a line with no context, which is rarely good enough to hand in.'),
        code('t = 0:0.01:10;\ny = sin(t);\n\nplot(t, y)\nxlabel(\'Time (s)\')\nylabel(\'Amplitude\')\ntitle(\'Sine Wave\')\ngrid on', { run: true, caption: 'annotated 2-D plot' }),
        list([
          '<code>xlabel</code> / <code>ylabel</code> — always label your axes, with units.',
          '<code>title</code> — say what the plot is, not just what variable it came from.',
          '<code>grid on</code> — makes reading off approximate values much easier.',
        ]),
      ]),
      section('Multiple Curves on One Plot', [
        p('<code>hold on</code> tells MATLAB “don’t erase the current plot — keep adding to it.” <code>hold off</code> (or a new <code>figure</code>) returns to normal, single-plot behavior.'),
        code('t = 0:0.01:10;\nplot(t, sin(t))\nhold on\nplot(t, cos(t))\nhold off\nlegend(\'sin(t)\', \'cos(t)\')\nxlabel(\'Time (s)\')', { run: true }),
        callout('mistake', 'Common mistake', 'Forgetting <code>hold on</code> — a second <code>plot()</code> call without it erases the first curve instead of adding to it. If you expected two lines and got one, this is almost always why.'),
      ]),
      section('Plotting Physiological Data', [
        p('The same commands apply to any signal, real or simulated — the labels are what make it meaningful:'),
        code('time = 0:0.01:5;\npressure = 80 + 20*sin(2*pi*1.2*time);   % a rough, simplified BP waveform\n\nplot(time, pressure)\nxlabel(\'Time (s)\')\nylabel(\'Pressure (mmHg)\')\ntitle(\'Simulated Arterial Pressure\')', { run: true }),
        callout('note', 'Note', 'This is a simplified sinusoid for illustration, not a physiologically accurate arterial waveform model — real arterial pressure traces are not pure sine waves. Later units build more realistic physiological models.'),
      ]),
      section('figure — Starting a New Plot Window', [
        p('Calling <code>figure</code> opens a new, separate plot window instead of drawing into (or replacing) the current one. Combined with <code>close all</code> (see the Environment chapter), this is how you keep plots from piling up or overwriting each other across a script.'),
      ]),
      section('Check Your Understanding', [
        quickCheck('You call <code>plot(t, sin(t))</code> and then <code>plot(t, cos(t))</code> with no <code>hold on</code> in between. How many curves end up on screen?', 'One — the second <code>plot()</code> call replaces the first entirely. You need <code>hold on</code> before the second call to keep both curves.'),
      ]),
    ],
  }),

  chapter({
    id: 'control-flow',
    unit: 0,
    title: 'Logical Expressions & Control Flow',
    kicker: 'Unit 0 · MATLAB Foundations',
    summary: 'Branching with if / elseif / else and switch, and combining conditions with logical operators.',
    minutes: 7,
    topics: ['control-flow'],
    sections: [
      section('if / elseif / else', [
        code('bp = 138;\nif bp > 140\n    disp(\'Stage 2 Hypertension\')\nelseif bp > 130\n    disp(\'Stage 1 Hypertension\')\nelse\n    disp(\'Normal / Elevated\')\nend', { run: true }),
        p('MATLAB checks conditions top to bottom and runs the <strong>first</strong> branch that’s true — later <code>elseif</code> branches are never even evaluated once an earlier one matches. Every <code>if</code> needs a matching <code>end</code>.'),
        callout('mistake', 'Common mistake', 'Forgetting the closing <code>end</code> is the single most common syntax error for beginners — MATLAB’s error message will point at a line far past where the real problem is, because it kept looking for the missing <code>end</code>.'),
      ]),
      section('Combining Conditions', [
        table(['Operator', 'Meaning', 'Use with'], [
          ['<code>&amp;&amp;</code>', 'AND — both must be true', 'two scalar (single-value) conditions'],
          ['<code>||</code>', 'OR — at least one must be true', 'two scalar conditions'],
          ['<code>~</code>', 'NOT — flips true/false', 'a single scalar condition'],
        ]),
        code('age = 45; bp = 138;\nif age > 40 && bp > 130\n    disp(\'Recommend follow-up\')\nend', { run: true }),
        callout('remember', 'Remember', '<code>&amp;&amp;</code> and <code>||</code> <em>short-circuit</em> — they stop evaluating as soon as the answer is known. <code>x ~= 0 && 1/x > 2</code> is safe even when <code>x</code> is 0, because <code>1/x</code> is never evaluated once the first condition is false.'),
      ]),
      section('Nested Conditions', [
        code('if age > 40\n    if bp > 130\n        disp(\'High priority follow-up\')\n    else\n        disp(\'Routine follow-up\')\n    end\nend', { caption: 'nesting works, but gets hard to read fast — prefer && where you can' }),
      ]),
      section('switch / case', [
        p('<code>switch</code> is a cleaner alternative to a long <code>if</code>/<code>elseif</code> chain when you’re comparing one variable against several specific values.'),
        code('stage = 2;\nswitch stage\n    case 1\n        disp(\'Stage 1\')\n    case 2\n        disp(\'Stage 2\')\n    otherwise\n        disp(\'Unknown stage\')\nend', { run: true }),
        callout('note', 'When to use switch vs. if/elseif', 'Reach for <code>switch</code> when you’re testing one variable for equality against a handful of specific values (like a stage number or a string label). Reach for <code>if</code>/<code>elseif</code> when your conditions involve ranges, comparisons, or multiple different variables.'),
      ]),
      section('Check Your Understanding', [
        quickCheck('In an <code>if</code>/<code>elseif</code>/<code>elseif</code>/<code>else</code> chain, if the first <code>elseif</code> condition is true, are the remaining <code>elseif</code> conditions still checked?', 'No — MATLAB runs the first branch whose condition is true and skips every branch after it, without evaluating their conditions at all.'),
      ]),
    ],
  }),

  chapter({
    id: 'loops-debugging',
    unit: 0,
    title: 'Loops, Debugging & Help',
    kicker: 'Unit 0 · MATLAB Foundations',
    summary: 'for and while loops, the preallocation habit that matters once your loops get bigger, and how to actually read a MATLAB error message.',
    minutes: 8,
    topics: ['loops-debugging'],
    sections: [
      section('for Loops', [
        code('total = 0;\nfor i = 1:10\n    total = total + i;\nend\ndisp(total)   % 55', { run: true }),
        p('<code>for i = 1:10</code> runs the loop body once for each value of <code>i</code> from 1 to 10, in order. Inside the loop, <code>i</code> behaves like any other variable — you can use it as an index, in a calculation, anything.'),
        code('x = [10 20 30];\nfor i = 1:length(x)\n    fprintf(\'Element %d is %d\\n\', i, x(i))\nend', { run: true, caption: 'looping over a vector’s indices' }),
      ]),
      section('Preallocation', [
        p('Growing an array one element at a time inside a loop works, but MATLAB has to reallocate memory and copy the whole array on every iteration — for large loops this gets slow fast. Preallocating the array first avoids that entirely.'),
        code('% Slower: grows on every iteration\nresult = [];\nfor i = 1:1000\n    result(i) = i^2;\nend\n\n% Faster: allocate once, fill in\nresult = zeros(1, 1000);\nfor i = 1:1000\n    result(i) = i^2;\nend', { caption: 'both are correct — only the second one scales well' }),
        callout('remember', 'Remember', 'For a handful of iterations the difference is invisible. It matters once you’re looping thousands of times, which starts showing up from Unit 2 onward (see the Review chapter on Vectorization once it’s added).'),
      ]),
      section('while Loops', [
        code('x = 100;\ncount = 0;\nwhile x > 1\n    x = x / 2;\n    count = count + 1;\nend\ndisp(count)', { run: true, caption: 'runs until the condition becomes false' }),
        p('Use <code>while</code> when you don’t know in advance how many iterations you’ll need — convergence loops in later units (root-finding, optimization) are almost always <code>while</code> loops, not <code>for</code> loops.'),
        callout('mistake', 'Common mistake', 'An infinite loop happens when nothing inside the loop body ever makes the condition false — e.g., forgetting to update the loop variable. If MATLAB seems frozen after running a <code>while</code> loop, that’s almost always why; <kbd>Ctrl+C</kbd> in the Command Window stops it.'),
      ]),
      section('Reading a MATLAB Error', [
        p('A MATLAB error message usually tells you three things: <em>what</em> went wrong, <em>where</em> (file and line number), and sometimes <em>why</em>. Read it bottom-to-top-of-stack, and start with the description, not the line number — the line number is where MATLAB noticed the problem, which isn’t always where the actual mistake is (a missing <code>end</code> is the classic example).'),
        table(['You see…', 'It usually means…'], [
          ['<code>Undefined function or variable</code>', 'A typo in a name, or you’re using a variable before it’s ever assigned'],
          ['<code>Matrix dimensions must agree</code>', 'You used <code>+</code>, <code>-</code>, or <code>.*</code>/<code>./</code> on two arrays of incompatible size'],
          ['<code>Index exceeds the number of array elements</code>', 'You indexed past the end of an array — often an off-by-one mistake'],
          ['<code>Error: A ")" or "}" is missing</code>', 'Unbalanced parentheses/brackets — count them carefully'],
        ]),
      ]),
      section('Getting Help', [
        p('<code>doc functionName</code> opens full documentation with examples; <code>help functionName</code> prints a shorter summary right in the Command Window. Both work for any built-in function — try <code>doc linspace</code> right now if you’re unsure what a function does.'),
      ]),
      section('Check Your Understanding', [
        quickCheck('Your script hangs and MATLAB seems frozen after you run a <code>while</code> loop. What’s the most likely cause, and how do you stop it?', 'Most likely, the loop condition never becomes false — probably because something inside the loop that should update the condition variable was forgotten or written wrong. Press <kbd>Ctrl+C</kbd> in the Command Window to interrupt it.'),
      ]),
    ],
  }),

];
