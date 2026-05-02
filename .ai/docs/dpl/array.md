---
source_url: https://docs.dynatrace.com/docs/platform/grail/dynatrace-pattern-language/log-processing-array
fetched_at: 2026-05-02T00:00:00Z
title: DPL Array
section: dpl
---

# DPL Array

## Syntax

`ARRAY { matcher_expr … }`

## Description

This matcher parses repeating sequences that contain a variable number of data elements, driven by an inner pattern. That pattern runs repeatedly until either "an unmatch occurs" or the "maximum number of matches has been reached."

## Output and Limits

- **Output type:** array
- **Quantifier:** There is "no default value, must be explicitly set." The structure supports at most "32768 elements."
- **locale:** Provide an IETF BCP 47 language tag inside single or double quotes. "The default locale is English."
- **charset:** Provide a character set name inside quotes, for example `charset="ISO-8859-1"`.

Captured exports use the array data type. You "must assign an export name to ARRAY" so exported members become visible for queries.

## Example

Input lines contain integers divided by forward slashes, with "no separator after the last integer." Every line needs 3–5 integers, and entries may be omitted:

```
101/102/103
201//203//205
/302/303/304
```

The pattern defines an ARRAY. It checks for an integer (which can be absent because `*` permits zero matches) and an optional `/` (using `?` so the final element matches). The array quantifier enforces 3–5 elements and assigns the export name. The record ends with an EOL matching a line feed:

```
ARRAY{
    INT*:i
    '/'?
}{3,5}:int_array
EOL;
```

Parsing results: line 1 becomes `[101, 102, 103]`; line 2 becomes `[201, null ,203, null, 205]`; line 3 becomes `[null, 302, 303, 304]`, where missing integers appear as `null`.
