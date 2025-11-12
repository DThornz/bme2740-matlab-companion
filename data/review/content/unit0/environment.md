---
id: environment
unit: 0
title: The MATLAB Environment & Scripts
kicker: Unit 0 · MATLAB Foundations
summary: Get oriented in the MATLAB desktop, understand the difference between typing at the command line and writing a script, and learn the three commands that reset your workspace.
minutes: 6
---
## The MATLAB Desktop

MATLAB’s default layout has three panels you’ll use constantly:

- <strong>Command Window</strong>: type a line of code and press Enter to run it immediately. Good for quick one-off checks, bad for anything you want to keep or re-run.
- <strong>Workspace</strong>: every variable currently defined, with its value, size, and class. If a variable doesn’t appear here, MATLAB doesn’t know about it yet.
- <strong>Current Folder</strong>: where MATLAB looks for scripts and data files by default. A script can only call another file by name if that file is in the Current Folder or on MATLAB’s search path.

:::callout kind="note" title="Why this trips people up"
A large fraction of “undefined variable” and “file not found” errors in Unit 0 come from the Current Folder pointing somewhere unexpected, not from an actual code mistake. If something inexplicably isn’t found, check the Current Folder panel first.
:::

## Scripts vs. the Command Line

A <strong>script</strong> is a plain text file ending in <code>.m</code> containing a sequence of commands. Instead of retyping the same lines in the Command Window every time, you save them once and run the whole file.

```matlab run caption="mysignal.m"
% mysignal.m
t = 0:0.01:1;
y = sin(2*pi*5*t);
plot(t, y)
title('5 Hz sine wave')
```

Run a script by typing its file name (without <code>.m</code>) in the Command Window, or with the Editor’s Run button. Every variable it creates (here, <code>t</code> and <code>y</code>) lands in the Workspace exactly as if you had typed each line by hand.

:::callout kind="remember" title="Scripts share the base workspace"
A script does not get its own private variables. A <strong>function</strong> does (see Unit 1). If a variable named <code>t</code> already exists before the script runs, the script overwrites it.
:::

## Clearing State: clear, clc, close all

| Command | What it clears | Typical use |
| --- | --- | --- |
| <code>clear</code> | Every variable in the Workspace | Start a script with a clean slate so leftover variables from a previous run can’t sneak in |
| <code>clc</code> | Text printed in the Command Window | Purely visual: no effect on any variable |
| <code>close all</code> | Every open figure window | Avoid accumulating dozens of plot windows across repeated runs |

:::callout kind="mistake" title="Common mistake"
<code>clc</code> feels like it “resets” everything because the screen goes blank. It does not. Variables from a previous run are still sitting in the Workspace. If your script needs to start from nothing, that’s <code>clear</code>, not <code>clc</code>.
:::

## Live Scripts (.mlx)

MATLAB also has <strong>Live Scripts</strong> (<code>.mlx</code> files), which interleave code, formatted text, and inline output/plots in a single document, handy for lab reports and walkthroughs. Everything in this Review section is shown as plain <code>.m</code>-style code, since that’s what the browser-based Sandbox, this practice companion, and version control all work with. The underlying MATLAB syntax is identical either way.

## Check Your Understanding

:::quickcheck
Q: You run a script twice in a row without calling <code>clear</code> in between. Does the second run start with an empty Workspace?
A: No, variables created by the first run are still in the Workspace when the second run starts, unless the script itself begins with <code>clear</code>.
:::
