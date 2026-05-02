---
source_url: https://docs.dynatrace.com/docs/platform/grail/dynatrace-query-language/operators
fetched_at: 2026-05-02T00:00:00Z
title: DQL operators
section: reference
---

# DQL operators

*Reference — Latest Dynatrace — Updated Oct 28, 2025*

## Operator overview

| Operator | Description |
|----------|-------------|
| `+` | Addition |
| `-` | Subtraction or arithmetic negation |
| `*` | Multiplication |
| `/` | Division |
| `%` | Modulo |
| `<` | Less than |
| `<=` | Less than or equal to |
| `>` | Greater than |
| `>=` | Greater than or equal to |
| `==` | Equals |
| `!=` | Does not equal |
| `not` | Logical NOT |
| `and` | Logical AND |
| `or` | Logical OR |
| `xor` | Logical XOR |
| `in` | Subquery comparison |
| `@` | Time alignment |
| `~` | Search |

## Precedence (strongest to weakest)

1. `-` (arithmetic negation)
2. `*`, `/`, `%`
3. `@`
4. `+`, `-` (subtraction)
5. `~`
6. `==`, `!=`, `>`, `>=`, `<`, `<=`
7. `in`
8. `not`
9. `and`
10. `xor`
11. `or`

## Arithmetic operators

These accept `long` and `double`, and in some cases `timestamp`, `timeframe`, `duration`, and `ip`.

### Type compatibility summary

- **Addition (`+`)**
  - Numeric: `long` ↔ `long`/`double` produces `long`/`double`
  - Time: `timestamp` + `duration` → `timestamp`; `duration` + `duration` → `duration`; `duration` + `timeframe` → `timeframe`
  - Network: `ip` + `long`/`double`/`ip` → `ip`

- **Subtraction (`-`)**
  - Numeric: `long` ↔ `long`/`double` produces `long`/`double`
  - Time: `timestamp` − `timestamp` → `duration`; `timestamp` − `duration` → `timestamp`; `duration` − `duration` → `duration`; `timeframe` − `duration` → `timeframe`
  - Network: `ip` − `long`/`double`/`ip` → `ip`

- **Multiplication (`*`)**
  - Numeric: `long` ↔ `long`/`double` produces `long`/`double`
  - Time: `long`/`double` × `duration` → `duration`; `duration` × `long`/`double` → `duration` (when using `double`, result rounds to whole nanoseconds)

- **Division (`/`)**
  - Dividing `long` by `long` returns `long`; the fraction is truncated. To keep decimals, cast an operand to `double`.
  - Numeric: `double` / `long`/`double` → `double`; `long` / `double` → `double`
  - Time: `duration` / `long`/`double` → `duration` (rounded to nanoseconds); `duration` / `duration` → `double`

- **Modulo (`%`)**
  - Numeric: `long` ↔ `long`/`double` → `long`/`double`; `double` ↔ `long`/`double` → `double`
  - Time: `duration` % `duration` → `duration`

- **Negation (`-`)**
  - Supported for `long`, `double`, and `duration`

## Comparison operators (`<`, `<=`, `>`, `>=`)

These return a boolean when types are comparable and `null` otherwise.

Valid pairings:
- `long` with `long` or `double`
- `double` with `long` or `double`
- `string` with `string`
- `timestamp` with `timestamp`
- `duration` with `duration`
- `ip` with `ip`

## Equality operators (`==`, `!=`)

Equality uses three-valued logic: outcomes are `true`, `false`, or `null`. If either operand is `null`, the result is `null`. Note that `null == null` evaluates to `null`.

Type support is limited to matching types: `long`, `double`, `string`, `boolean`, `timestamp`, `duration`, `timeframe`, `binary`, `ip`, and `uid`.

To include missing or `null` records in filters, use helper functions such as `isTrueOrNull`, `isFalseOrNull`, `isNull`, or `isNotNull`. For example:

```sql
fetch logs
| filter isTrueOrNull(log.source != "logsourcename")
```
