---
source_url: https://docs.dynatrace.com/docs/platform/grail/dynatrace-pattern-language/log-processing-modifiers
fetched_at: 2026-05-02T00:00:00Z
title: DPL Modifiers
section: dpl
---

# DPL Modifiers

The Dynatrace pattern language provides several modifiers that control how matchers evaluate log data.

## Lookaround Operators

These modifiers let the parser examine adjacent bytes conditionally while keeping the current position fixed. The forward-checking symbols are `>>` for positive lookahead and `!>>` for negative lookahead; the backward-checking symbols are `<<` for positive lookbehind and `!<<` for negative lookbehind. Lookbehind inspection is limited to 64 bytes. The documentation describes this capability as a way to "peek" at data "without moving forward." Parentheses are required when the modifier applies to several matchers.

## Matcher Configuration

Execution parameters can be passed to a matcher as parenthesized key-value pairs. The article gives "TIMESTAMP(timezone='PST')" as an illustration of supplying a default timezone.

## Repetition Quantifiers

When elements recur unpredictably, quantifiers define repetition bounds. Supported forms include explicit ranges, open-ended minimums or maximums, exact counts, and the shorthand `*` and `+` operators. The upper repetition ceiling is 4096 instances.

## Optional Fields

Appending a question mark makes a matcher optional. This handles two kinds of irregularity: a present field with an empty "field value," or a line where both the "field value and following separator" are omitted. A standard quantifier that permits zero matches only addresses the first situation.

## Naming Extracted Values

To expose captured data to queries, attach a colon-led identifier to a matcher or group. Names must begin with a letter and may contain alphanumeric characters; dots require quoting the name. Outputs from alternatives, sequences, and character groups can also be exported.
