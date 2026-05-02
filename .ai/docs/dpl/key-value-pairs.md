---
source_url: https://docs.dynatrace.com/docs/platform/grail/dynatrace-pattern-language/log-processing-key-value-pairs
fetched_at: 2026-05-02T00:00:00Z
title: DPL Key-Value Pairs
section: dpl
---

# DPL Key-Value Pairs

## Syntax

The operator takes the form `KVP{ matcher_expr … }`.

## Purpose

This construct processes a set of key and value entries that are unordered and of varying length, using a pattern you supply.

## Required Fields

The pattern must expose:

- a single field called `key`
- one or more fields whose identifiers start with `value`

## Matching Behavior

The engine re-applies the pattern until either a match fails or it hits the upper match limit.

## Pattern Scope

The definition should cover the entire key and value sequence: matchers for the label and data, delimiters between each label and its value, and separators between successive entries. Take care with the final pair, which typically lacks a trailing delimiter.

## Output and Configuration

| Property | Details |
|----------|---------|
| Output type | `variant_object` containing the parsed entries. Keys remain `VARIANT:STRING`, whereas values become the selected conversion variant. |
| Quantifier | Defaults to 128 entries; absolute maximum is 32,768. |
| Charset | Optional. Set with a character-set name in single or double quotes, e.g., `charset="ISO-8859-1"`. |
| Locale | Optional. Provide an IETF BCP 47 language tag in quotes. English is the default. |

## Example

Input lines:

```
a=1 b=2
a=4 b=8
```

Pattern:

```
KVP{
  [a-z]:key
  '='
  INT:value
  ' '?
}:attr
EOL
```

Notice that the last pair lacks a trailing space. Therefore, the inter-pair space must be declared optional. After the final pair is consumed, the following iteration fails because the line feed does not satisfy the key matcher. Consequently, the `KVP` block ends, and parsing proceeds to the `EOL` matcher. The `EOL` token then matches the newline, completing the record.

### Result

The extracted object appears under `attr`:

| attr |
|------|
| `{"a":1,"b":2}` |
| `{"a":4,"b":8}` |

## Related Tags

- Dynatrace Platform
