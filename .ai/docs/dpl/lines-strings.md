---
source_url: https://docs.dynatrace.com/docs/platform/grail/dynatrace-pattern-language/log-processing-lines-strings
fetched_at: 2026-05-02T00:00:00Z
title: DPL Lines and Strings
section: dpl
---

# DPL Lines and Strings

## Line Breaks

**EOL; LF** — "Matches the single line feed character (ASCII 0xa)." Default quantifier is `{1,1}`.

**CR** — "Matches single carriage return character (ASCII 0xd)." Default quantifier is `{1,1}`.

**EOLWIN** — "Matches two characters: line feed followed by the carriage return (ASCII 0xd 0xa)." Default quantifier is `{2,2}`.

## Line Data

**LD, LDATA** — "Matches any characters until the next non-optional matcher in the scope of a line." A required matcher must come after it. Output type is string, with a default quantifier of `{1,4096}`. Accepts optional `charset` and `locale` settings.

*Example:* Using this matcher with an end-of-line token extracts whole lines from a *NIX text file. Empty lines fail because they fall below the minimum match length.

*Example:* In a CSV, placing this matcher between comma delimiters captures individual fields.

## Multiline Data

**DATA** — "Matches any characters until the next non-optional matcher of pattern expression." It also requires a subsequent mandatory matcher. Output is string, defaulting to `{1,4096}`, with optional `charset` and `locale`.

*Example:* A stack trace spanning multiple lines and ending with a blank line can be captured by pairing this matcher with a double line-break condition.

## Quoted Strings

**SQS** — "Matches string enclosed between single quotes (ASCII 0x27)." Internal quotes must use a backslash escape.

**DQS** — "Matches string enclosed between double-quote characters (ASCII 0x22)." Internal quotes must use a backslash escape.

**CSVSQS** — "Matches string enclosed between single quotes (ASCII 0x27)." Internal quotes must be escaped by doubling them.

**CSVDQS** — "Matches string enclosed between double-quote characters (ASCII 0x22)." Internal quotes must be escaped by doubling them.

All four output strings, default to `{1,4096}`, and support `charset` and `locale`.

## Character Group

**`[ char ... ]`** — "Matches a single character out of several in a defined group." List characters or ranges between brackets; use `^` or `!` for negation, and escape literal brackets with a backslash. The behavior aligns with regex character classes. Default quantifier is `{1,1}`.

*Example:* An expression like `[{*}0-9{*}a-z]{4,15}:username` extracts a username containing 4 to 15 lowercase letters or digits.

## POSIX Character Classes

These "Match one or more character corresponding to any of the characters in its defined group." They output strings with a default quantifier of `{1,1}` and accept `charset` and `locale`. You can use matcher names or POSIX bracket notation.

Available classes include: `ALNUM` (`[:alnum:]`), `ALPHA`, `BLANK`, `CNTRL`, `DIGIT`, `GRAPH`, `LOWER`, `PRINT`, `PUNCT`, `SPACE`, `NSPACE`, `UPPER`, `XDIGIT`, `ASCII`, `WORD`, and `[:any:]`.

*Example:* Applying `LOWER{4,15}:username` captures a username composed solely of 4 to 15 lowercase letters.
