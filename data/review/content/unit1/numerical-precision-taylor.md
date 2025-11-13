---
id: numerical-precision-taylor
unit: 1
title: Floating-Point Precision & Taylor Series
kicker: Unit 1 · MATLAB
summary: Why computers can’t store most real numbers exactly, how that round-off error shows up in MATLAB, and how Taylor series let you approximate a complicated function with a simple polynomial while keeping track of the error you introduce.
minutes: 9
---
## Why Computers Don’t Store Real Numbers Exactly

Any number can be written in scientific notation: a sign, a mantissa (the significant digits), and a base raised to an exponent. <code>-8.23 × 10⁴</code> and <code>4.1 × 10⁻²</code> are both just <code>±mantissa × base^exponent</code>. Computers store numbers the same way, just in base 2 instead of base 10, and with a fixed, finite number of bits for the mantissa and exponent.

MATLAB’s default numeric type, <code>double</code>, uses the IEEE-754 64-bit format: 1 sign bit, 11 exponent bits, and 52 mantissa bits. The exponent bits set how large or small a number can get before it overflows or underflows; the mantissa bits set how many significant digits you actually get to keep, no matter how large or small the number is.

- <strong>Overflow</strong>: a number too large to represent (roughly larger than <code>10³⁰⁸</code>) halts or errors.
- <strong>Underflow</strong>: a number too small to represent (roughly smaller than <code>10⁻³⁰⁸</code>) typically rounds to zero.
- <strong>Round-off error</strong>: everything in between is still limited to about 15-17 significant decimal digits, because the mantissa only has 52 bits to work with.

```matlab run
realmax   % largest representable double
realmin   % smallest positive normalized double
eps       % machine epsilon: the gap between 1.0 and the next representable double
```

:::callout kind="note" title="Note"
Computer precision is not the same thing as significant figures. Significant figures describe how accurately you *measured* something; computer precision describes how much of that value your computer can actually *remember*, independent of how accurate the original measurement was.
:::

## Round-Off Error in Practice

Limited precision means some numbers round exactly and others don’t, even at a fixed number of significant digits. With 2 significant digits, <code>130</code> is exactly <code>13 × 10¹</code>, no information lost. But <code>131</code> only has room to become <code>13 × 10¹ = 130</code> — a rounding error, even though the original number was exact.

| Value | 2-sig-fig representation | Exact or rounded? |
| --- | --- | --- |
| 130 | 13 × 10¹ = 130 | Exact |
| −0.041 | −41 × 10⁻³ = −0.041 | Exact |
| 131 | 13 × 10¹ = 130 | Rounded (lost 1) |
| −0.0418 | −42 × 10⁻³ = −0.042 | Rounded |

The same thing happens inside MATLAB, constantly, because most decimal fractions have no exact binary representation, the same way 1/3 has no exact finite decimal representation.

```matlab run
format long
0.1 + 0.2          % not exactly 0.3 — binary can't represent 0.1 or 0.2 exactly
0.1 + 0.2 == 0.3   % false, for exactly this reason
abs((0.1 + 0.2) - 0.3) < eps*10   % the right way to compare: check against a small tolerance, not ==
```

:::callout kind="mistake" title="Common mistake"
Never compare floating-point results with <code>==</code> when either side came from arithmetic (as opposed to being typed in literally and never touched). Round-off error means two mathematically equal expressions can differ in their last bit or two. Compare against a small tolerance instead, as in the third line above.
:::

## Taylor Series: Approximating Functions with Polynomials

Some functions (trig functions, exponentials, roots) are expensive or awkward to evaluate directly. Polynomials, by contrast, are just sums of constants times powers of <code>x</code>: cheap to evaluate, easy to differentiate and integrate. A Taylor series lets you replace a complicated function with a polynomial that matches it, and all of its derivatives, at one specific point:

:::eq label="Taylor series about x = a"
f(x) \approx f(a) + f'(a)(x-a) + \frac{f''(a)}{2!}(x-a)^2 + \frac{f'''(a)}{3!}(x-a)^3 + \cdots
:::

When you center the expansion at <code>a = 0</code>, it’s called a <strong>Maclaurin series</strong> — the same idea, just a specific, common choice of center. This approximation is valid as long as <code>f</code> is continuous on the interval you care about and has enough derivatives at <code>a</code> to build the terms you want.

Every derivative of <code>eˣ</code> is <code>eˣ</code> itself, which makes it a clean worked example. At <code>a = 0</code>, <code>f(a) = f'(a) = f''(a) = ... = 1</code>, so the Maclaurin series is just <code>1 + x + x²/2! + x³/3! + ...</code>

```matlab run caption="a 4-term Maclaurin polynomial for e^x"
x = 0.5;

taylorApprox = 1 + x + x^2/factorial(2) + x^3/factorial(3);
actualValue = exp(x);

fprintf('4-term Taylor approx: %.6f\n', taylorApprox)
fprintf('exp(x):                %.6f\n', actualValue)
fprintf('error:                 %.2e\n', abs(actualValue - taylorApprox))
```

Written as a loop, this generalizes to as many terms as you want:

```matlab run caption="general n-term Maclaurin approximation for e^x"
x = 0.5;
n = 6;   % number of terms

approx = 0;
for k = 0:n-1
    approx = approx + x^k / factorial(k);
end

fprintf('%d-term Taylor approx: %.8f\n', n, approx)
fprintf('exp(x):                %.8f\n', exp(x))
```

## Truncation Error & the Lagrange Remainder

Every term you leave out of a Taylor series is a source of error, called <strong>truncation error</strong> (distinct from round-off error — this one comes from approximating the *method*, not from limited floating-point precision). If you stop after the <code>(n-1)</code>-order term, the error is dominated by the size of the next term you dropped, the <code>n</code>-th order one. The <strong>Lagrange Remainder Theorem</strong> makes this precise: the error after truncating at order <code>n</code> is exactly <code>f⁽ⁿ⁾(ξ)/n! × (x-a)ⁿ</code> for some (generally unknown) <code>ξ</code> between <code>a</code> and <code>x</code>.

In practice this means: adding more terms shrinks the error, but the rate at which it shrinks depends on how far <code>x</code> is from your center <code>a</code>, and on how quickly the function’s higher derivatives grow.

```matlab run caption="how many terms until the error is small?"
x = 1; a = 0;

for n = 1:8
    approx = 0;
    for k = 0:n-1
        approx = approx + (x-a)^k / factorial(k);
    end
    err = abs(exp(x) - approx);
    fprintf('n = %d terms: error = %.2e\n', n, err)
end
```

```matlab run caption="the same convergence, plotted"
x = 1; a = 0;
errors = zeros(1,8);
for n = 1:8
    approx = 0;
    for k = 0:n-1
        approx = approx + (x-a)^k / factorial(k);
    end
    errors(n) = abs(exp(x) - approx);
end

semilogy(1:8, errors, 'o-')
xlabel('Number of terms')
ylabel('Absolute error (log scale)')
title('Taylor series convergence for e^x at x = 1')
```

## Check Your Understanding

:::quickcheck
Q: Why does <code>0.1 + 0.2 == 0.3</code> evaluate to <code>false</code> in MATLAB?
A: 0.1, 0.2, and 0.3 don’t have exact finite binary representations, the same way 1/3 has no exact finite decimal representation. MATLAB stores the closest representable double for each, and their sum doesn’t land exactly on the closest representable double for 0.3. Compare with a small tolerance instead of <code>==</code>.
:::

:::quickcheck
Q: You truncate a Taylor series after the 3rd-order term instead of the 5th-order term. What happens to the approximation error, and why?
A: The error gets larger. Truncation error is dominated by the size of the first term you drop — stopping earlier drops a lower-order (typically larger-magnitude, for |x−a| < 1) term, so more information about the function is lost and the approximation is less accurate.
:::

## Practice This Topic

:::practice unit=1 topic=numerical-precision-taylor
Practice: Floating-Point Precision & Taylor Series
:::
