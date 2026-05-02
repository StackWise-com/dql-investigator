---
source_url: https://docs.dynatrace.com/docs/platform/grail/dynatrace-pattern-language/log-processing-structure
fetched_at: 2026-05-02T00:00:00Z
title: DPL Structure
section: dpl
---

# DPL Structure

Dynatrace's matcher uses the form `STRUCTURE { matcher_expr … }`. Per the docs, this enables "capturing any sequence of matchers in tuple data type."

Key properties:

- Output type: tuple
- Quantifier: none
- Configuration: none

The documentation notes: "You must assign an export name to STRUCTURE to make exported members visible for the query layer."

#### Example

Input lines contain a number and text separated by a comma:

```
1,red fox jumps
2,over lazy dog
```

Pattern syntax:

```
STRUCTURE{ INT:i ',' LD:string }:struct EOL;
```

This extracts a tuple named `struct`. Results appear as:

```
{i=1 string='red fox jumps '}
{i=2 string='over lazy dog'}
```
