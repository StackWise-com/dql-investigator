---
source_url: https://docs.dynatrace.com/docs/platform/grail/dynatrace-pattern-language/log-processing-grammar
fetched_at: 2026-05-02T00:00:00Z
title: DPL Grammar Reference
section: dpl
---

# DPL Grammar Reference

*Released May 18, 2022*

| Pattern | Purpose |
|---|---|
| `ENUM{ string=integer, ...}` | Maps predefined text labels to assigned integer values |
| `JSON`, `JSON_OBJECT{ jsonFields ... }` | Parses JSON objects |
| `JSON_ARRAY`, `JSON_ARRAY{jsonValueType}` | Parses JSON arrays |
| `JSON_VALUE`,`JSON_VALUE{jsonValueType}` | Parses individual JSON elements such as strings, numbers, booleans, or nulls that sit outside an object wrapper |
| `KVP{patternExprs}` | Extracts unordered key-value lists using a supplied pattern |
| `ARRAY{patternExprs}` | Collects repeated sequences of variable-length data elements defined by a pattern argument |
| `STRUCTURE{patternExprs}` | Groups data into structured fields |
| `DATA` | Captures data spanning multiple lines |
| `LDATA`, `LD` | Captures a single line of data |
| `(patternExpr \| ...)` | Matches any one of the supplied sub-patterns |
| `(patternExpr, ...)` | Requires every enclosed sub-pattern to match in order |
| `EOL`, `LF` | Detects a line feed |
| `EOLWIN`, `WINEOL` | Detects line feed or carriage return |
| `CR` | Detects a carriage return |
| `UPPER` | Detects uppercase letters |
| `LOWER` | Detects lowercase letters |
| `ALPHA` | Detects letters from a–z or A–Z |
| `DIGIT` | Detects numeric characters |
| `XDIGIT` | Detects hexadecimal digits |
| `ALNUM` | Detects letters or numbers |
| `PUNCT` | Detects punctuation marks and symbols |
| `BLANK` | Detects spaces or tabs |
| `SPACE` | Detects any whitespace |
| `NSPACE` | Detects any non-whitespace character |
| `GRAPH` | Detects printable, visible characters |
| `PRINT` | Detects printable characters |
| `WORD` | Detects word characters |
| `ASCII` | Detects characters in the ASCII set |
| `CNTRL` | Detects control characters |
| `TIME`, `TIMESTAMP` | Detects date and time values |
| `JSONTIMESTAMP` | Recognizes timestamps like `yyyy-MM-ddTHH:mm:ss.SSSZ` |
| `ISO8601` | Recognizes ISO-8601 timestamps such as `yyyy-MM-ddTHH:mm:ssZ` |
| `HTTPDATE` | Recognizes HTTP-style timestamps such as `dd/MMM/yyyy:HH:mm:ss Z` |
| `BOOLEAN`, `BOOL` | Detects `true` or `false`, ignoring case |
| `FLOAT` | Detects float values |
| `CFLOAT` | Detects floats using a comma as the decimal separator |
| `DOUBLE` | Detects double-precision floats |
| `CDOUBLE` | Detects doubles using a comma decimal separator |
| `INT`, `INTEGER` | Detects integers |
| `HEXINT` | Detects integers in hex form |
| `LONG` | Detects long integers |
| `HEXLONG` | Detects long integers in hex form |
| `CREDITCARD` | Recognizes credit card numbers |
| `SMARTSCAPEID` | Extracts a Smartscape identifier |
| `IPADDR` | Detects IPv4 or IPv6 addresses |
| `IPV4`, `IPV4ADDR` | Detects IPv4 addresses |
| `IPV6`, `IPV6ADDR` | Detects IPv6 addresses |
| `STRING` | Captures single- or double-quoted strings and character groups, excluding the first 32 ASCII symbols |
| `SQS` | Captures a single-quoted string |
| `DQS` | Captures a double-quoted string |
| `CSVSQS` | Captures a single-quoted string with CSV escape rules |
| `CSVDQS` | Captures a double-quoted string with CSV escape rules |
| `<<` | Positive lookbehind assertion |
| `>>` | Positive lookahead assertion |
| `!<<` | Negative lookbehind assertion |
| `!>>` | Negative lookahead assertion |

## Related Documentation

- "DPL Enum"
- "DPL JSON Objects"
- "DPL JSON Arrays"
- "DPL JSON Values"
- "DPL Key-Value Pairs"
- "DPL Array"
- "DPL Structure"
- "DPL Lines and Strings"
- "DPL Alternatives Group"
- "DPL Sequence Group"
- "DPL Time and Date"
- "DPL Numeric Data"
- "DPL Credit Card Data"
- "DPL Smartscape ID"
- "DPL Network Data"
- "DPL Modifiers"
