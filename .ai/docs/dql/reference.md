---
source_url: https://docs.dynatrace.com/docs/platform/grail/dynatrace-query-language/dql-reference
fetched_at: 2026-05-02T00:00:00Z
title: DQL language reference
section: reference
---

# DQL language reference

Dynatrace Query Language (DQL) processes data through a series of piped stages. Each stage yields a table of rows and columns, streamed via `|` into the next operation.

## Syntax

A query follows this general shape:

`command parameter,… [, optionalparameter],… | command …`

Commands accept comma-delimited arguments. For instance, `fetch bizevents | summarize count()` is valid. The `summarize` stage requires an aggregation function. You may optionally rename results with `=` and define groups through `by:`.

## Field naming rules

Identifiers support Unicode. Wrap a name in backticks when it:
- contains characters outside letters, digits, underscores, or dots
- begins with anything other than a letter or underscore

Escape backticks and backslashes with `\`.

## Parameters

Separate arguments with commas. Named arguments are optional; mandatory ones are positional. Accepted forms include literal values, expressions such as `now()-1h`, execution blocks like `[fetch logs]`, and parameter groups enclosed in curly braces (`{}`). Groups labeled with `by:` cannot include DQL operators.

## Sequential data processing

A typical log-analysis pipeline uses seven stages:

1. **fetch** — Retrieve raw events and optionally bound the time range with `from:`.
2. **filter** — Discard rows that fail a predicate, such as a filename suffix check.
3. **parse** — Extract typed fields from raw text.
4. **summarize** — Compute aggregates (for example, sums or conditional counts) across chosen dimensions.
5. **fieldsAdd** — Derive new columns using expressions.
6. **fields** — Project only the required columns.
7. **sort** — Order the final table in ascending or descending order.

## Key building blocks

- **Commands** — Drive execution.
- **Functions** — Evaluate computations on fields.
- **Data types** — Strict typing governs all values; parse or cast data to the expected type.
- **Operators** — Apply logical, arithmetic, or comparative logic.

## Related topics

- DQL guide and core concepts
- Comparisons to SQL
- References for commands, functions, operators, and data types
- Best practices
