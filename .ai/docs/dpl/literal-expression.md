---
source_url: https://docs.dynatrace.com/docs/platform/grail/dynatrace-pattern-language/log-processing-literal-expression
fetched_at: 2026-05-02T00:00:00Z
title: DPL Literal Expressions
section: dpl
---

# DPL Literal Expressions

*Published May 18, 2022*

Per the Dynatrace article, literal syntax is written as `"…" or '...'`. These expressions denote strings wrapped in single or double quotes.

**Configuration details:**

The output type is a string with a default quantifier of exactly one match (`{1,1}`). Optional parameters include:

- **charset:** A character set identifier in quotes, such as `"ISO-8859-1"`
- **locale:** An IETF BCP 47 language tag in quotes; English acts as the default

If a value includes a quotation mark, you can `"use the other for enclosing"` or escape it with a backslash.

The guide notes constants generally offer limited analytical value, so they are usually matched without exporting values into queries.

**Example:**

To match one or more `a` characters, apply the pattern `"a"+ EOL`
