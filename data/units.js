// ─────────────────────────────────────────────────────────────
// Course structure for BME 2740 — Biomedical Engineering
// Modeling and Simulation (FIU).
//
// This file defines ONLY metadata (units + topics). Actual
// question content lives in /data/questions/unitN.js and is
// wired up in js/bank.js. A unit/topic with no question module
// yet simply renders as "coming soon" — nothing here needs to
// change when new units are drafted; see README.md § "Adding a
// new unit".
// ─────────────────────────────────────────────────────────────

export const DIFFICULTIES = ['beginner', 'intermediate', 'advanced', 'expert'];

export const DIFFICULTY_META = {
  beginner:     { label: 'Beginner',     short: 'BEG', cognitive: 'Remember · Understand' },
  intermediate: { label: 'Intermediate', short: 'INT', cognitive: 'Apply · Analyze' },
  advanced:     { label: 'Advanced',     short: 'ADV', cognitive: 'Analyze · Evaluate' },
  expert:       { label: 'Expert',       short: 'XPT', cognitive: 'Evaluate · Create' },
};

export const UNITS = [
  {
    id: 0,
    slug: 'unit0',
    title: 'MATLAB Overview',
    short: 'MATLAB Overview',
    description: 'Get oriented in the MATLAB environment and write your first scripts — the Command Window, Workspace, variables, vectors and matrices, plotting, control flow, and basic debugging.',
    objectives: [
      'Navigate the MATLAB desktop (Command Window, Workspace, Editor) and understand scripts vs. the command line.',
      'Create and manipulate variables, vectors, and matrices, including indexing and the colon operator.',
      'Produce a basic annotated 2-D plot.',
      'Write conditional logic (if/elseif/else, switch) and loops (for, while).',
      'Use basic debugging strategies and MATLAB’s built-in documentation.',
    ],
    materials: ['MATLAB On-Ramp', 'Introduction Module', 'Lecture 1', 'Lecture 2', 'MATLAB Example Presentation', 'If/Else/Switch/While/Loops Lab', 'MATLAB Tutorial', 'MATLAB Short Tutorial'],
    hasContent: true,
    topics: [
      { id: 'environment',        title: 'MATLAB Environment & Scripts',        description: 'The Command Window, Workspace, Editor, script files, and how MATLAB finds your code.' },
      { id: 'variables-operators', title: 'Variables, Syntax & Operators',       description: 'Assignment, comments, arithmetic and relational operators, and output formatting.' },
      { id: 'vectors-matrices',   title: 'Vectors, Matrices & Indexing',        description: 'Building vectors and matrices, indexing, and the colon operator.' },
      { id: 'plotting-basics',    title: 'Basic Plotting',                      description: 'Creating and annotating simple 2-D plots.' },
      { id: 'control-flow',       title: 'Logical Expressions & Control Flow',  description: 'if / elseif / else, switch, and combining logical conditions.' },
      { id: 'loops-debugging',    title: 'Loops, Debugging & Help',             description: 'for and while loops, basic debugging, and using MATLAB’s documentation.' },
    ],
  },
  {
    id: 1,
    slug: 'unit1',
    title: 'MATLAB',
    short: 'MATLAB',
    description: 'A deeper pass through MATLAB fundamentals: functions, I/O, logical indexing, plotting patterns, and reading/predicting the output of existing code.',
    objectives: [
      'Write and call MATLAB functions with multiple inputs/outputs.',
      'Use logical indexing to select and modify array elements.',
      'Predict the output of short MATLAB programs.',
      'Recognize and interpret common MATLAB errors.',
    ],
    materials: ['Lecture 3', 'Lecture 4', 'Assignment 1', 'Quiz 1', 'Numerical Computation Lab', 'Plotting Examples', 'App Designer Examples'],
    hasContent: false,
    topics: [
      { id: 'fundamentals-review', title: 'Variables, Arrays & Indexing Review', description: 'Consolidating Unit 0 fundamentals with logical indexing and element-wise operations.' },
      { id: 'io-and-scripts',      title: 'Functions, Input/Output & Scripts',   description: 'Writing functions, reading input, and organizing multi-file MATLAB projects.' },
      { id: 'plotting-patterns',   title: 'Plotting & Programming Patterns',     description: 'Common plotting recipes and idiomatic MATLAB programming patterns.' },
      { id: 'reading-output',      title: 'Reading Code, Errors & Output',       description: 'Interpreting MATLAB error messages and predicting program output.' },
    ],
  },
  {
    id: 2,
    slug: 'unit2',
    title: 'Linear Systems and Models',
    short: 'Linear Systems',
    description: 'Matrix representations of linear systems, solving Ax = b, least-squares regression, and writing efficient vectorized MATLAB code.',
    objectives: [
      'Represent systems of linear equations in matrix form.',
      'Solve Ax = b using the backslash operator and interpret when it fails or is ill-conditioned.',
      'Derive and apply the normal equations for least-squares regression.',
      'Replace loops with vectorized operations and use the Profiler to measure the gain.',
    ],
    materials: ['Lecture 5', 'Lecture 6', 'Lecture 7', 'Optimizing Code Lecture', 'Profiler Tutorial', 'Fibonacci Example', 'Random Grid Optimization Examples'],
    hasContent: false,
    topics: [
      { id: 'linear-systems-basics', title: 'Linear Systems & Matrix Representation', description: 'Writing systems of equations as Ax = b.' },
      { id: 'solving-ax-b',          title: 'Solving Ax = b',                         description: 'The backslash operator, matrix inverse, rank, and conditioning.' },
      { id: 'least-squares-regression', title: 'Least Squares & Regression',          description: 'Normal equations, R², and fitting linear models to data.' },
      { id: 'vectorization-efficiency', title: 'Vectorization & Efficiency',          description: 'Preallocation, vectorized code, and profiling.' },
    ],
  },
  {
    id: 3,
    slug: 'unit3',
    title: 'Numerical Quadrature and Interpolation',
    short: 'Quadrature & Interpolation',
    description: 'Approximating integrals from discrete data and estimating values between known data points.',
    objectives: [
      'Apply the trapezoidal and midpoint rules to estimate definite integrals.',
      'Relate step size to accuracy and error in numerical quadrature.',
      'Perform polynomial and Lagrange interpolation.',
      'Distinguish interpolation from extrapolation and reason about interpolation error.',
    ],
    materials: ['Lecture 8', 'Lecture 9', 'Lecture 10', 'Lagrange Polynomial Material', 'Quadrature Lab'],
    hasContent: false,
    topics: [
      { id: 'numerical-quadrature', title: 'Numerical Quadrature', description: 'Trapezoidal and midpoint rules, step size, and convergence.' },
      { id: 'interpolation',        title: 'Interpolation',        description: 'Polynomial and Lagrange interpolation, and interpolation error.' },
    ],
  },
  {
    id: 4,
    slug: 'unit4',
    title: 'Numerical Integration',
    short: 'Numerical Integration',
    description: 'Solving initial value problems numerically, starting with Euler’s method, and reasoning about local vs. global error.',
    objectives: [
      'Formulate an initial value problem from a physiological description.',
      'Implement Euler’s method by hand and in MATLAB.',
      'Explain the tradeoff between step size, accuracy, and numerical stability.',
    ],
    materials: ['Lecture 11', 'Lecture 12', 'Lecture 13', 'Euler Methods for Solving ODEs Lab'],
    hasContent: false,
    topics: [
      { id: 'ivp-euler',          title: 'Initial Value Problems & Euler’s Method', description: 'State variables, initial conditions, and forward Euler time-stepping.' },
      { id: 'numerical-stability', title: 'Step Size, Error & Stability',                description: 'Local vs. global error and numerical stability.' },
    ],
  },
  {
    id: 5,
    slug: 'unit5',
    title: 'Numerical Integration Extended',
    short: 'ODE Modeling',
    description: 'Solving ODEs with MATLAB’s built-in solvers, formulating coupled systems, and applying them to physiological models.',
    objectives: [
      'Use ode45 to solve first-order and systems of ODEs.',
      'Formulate coupled ODEs in state-space form.',
      'Interpret solver output and compare numerical vs. analytical solutions.',
      'Explore how model parameters change physiological model behavior.',
    ],
    materials: ['Lecture 14', 'Lecture 15', 'Lecture 16', 'MATLAB ODE Solving Lab'],
    hasContent: false,
    topics: [
      { id: 'ode45-solving',           title: 'Solving ODEs with ode45',              description: 'Setting up and calling ode45, tolerances, and time spans.' },
      { id: 'coupled-ode-systems',     title: 'Coupled ODEs & State-Space Models',    description: 'Formulating multi-variable systems for numerical solvers.' },
      { id: 'physiological-ode-models', title: 'Physiological ODE Modeling',          description: 'Applying ODE solvers to physiological and biological systems.' },
    ],
  },
  {
    id: 6,
    slug: 'unit6',
    title: 'Nonlinear Equations and Optimization',
    short: 'Nonlinear & Optimization',
    description: 'Finding roots of nonlinear equations and minimizing/maximizing objective functions in MATLAB.',
    objectives: [
      'Locate roots of nonlinear equations graphically and with fzero.',
      'Explain how initial guesses affect convergence.',
      'Formulate and solve one-dimensional optimization problems with fminbnd / fminsearch.',
      'Apply root-finding and optimization to physiological modeling problems.',
    ],
    materials: ['Lecture 17', 'Lecture 18', 'Assignment 6', 'Quiz 6'],
    hasContent: false,
    topics: [
      { id: 'nonlinear-roots',    title: 'Nonlinear Equations & Root Finding', description: 'Graphical root finding, fzero, and convergence.' },
      { id: 'optimization-basics', title: 'Optimization Fundamentals',        description: 'Objective functions, local vs. global extrema, fminbnd, fminsearch.' },
    ],
  },
  {
    id: 'future-nn',
    slug: 'future-nn',
    title: 'Introduction to Neural Networks',
    short: 'Neural Networks',
    description: 'A forward-looking unit identified on the official course schedule. The question bank for this unit has not been written yet.',
    objectives: [],
    materials: [],
    hasContent: false,
    comingSoon: true,
    topics: [],
  },
];

export function getUnit(unitId) {
  const idStr = String(unitId);
  return UNITS.find(u => String(u.id) === idStr) || null;
}

export function getTopic(unitId, topicId) {
  const unit = getUnit(unitId);
  if (!unit) return null;
  return unit.topics.find(t => t.id === topicId) || null;
}
