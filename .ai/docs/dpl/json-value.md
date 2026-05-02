---
source_url: https://docs.dynatrace.com/docs/platform/grail/dynatrace-pattern-language/log-processing-json-value
fetched_at: 2026-05-02T00:00:00Z
title: DPL JSON Values
section: dpl
---

# DPL JSON Values

## JSON_VALUE

Interprets discrete JSON fragments—for instance, arrays, literals, numeric values, booleans, or null—when they exist without wrapping braces. The underlying standard authorizes this structure.

### Parameters

| Output | Quantifier | Settings |
|--------|-----------|----------|
| `variant` (implied) or a cast target | none | `charset`: a coded character set wrapped in single or double quotes (e.g., `charset="ISO-8859-1"`). |
| | | `locale`: an IETF BCP 47 tag in quotes (see registry link). English applies when omitted. |
| | | `typed`: a boolean flag governing result typing. `"false"` yields `variant`; `"true"` applies the explicit cast. Only matters when a conversion is named. |
| | | `strict`: a boolean flag. `"false"` tolerates non-standard arrays, bare identifiers, and unquoted single-word strings. Defaults to `"true"`. |
| | | `maxlen`: a number setting the byte ceiling for an array. Enables handling of oversized JSON arrays beyond the 128,000-byte default. |

### Example

Two standalone JSON literals appear on consecutive lines—a numeral and a text token.

```text
33

"::1"
```

The first line's numeric value undergoes automatic parsing. The second line's text gets an explicit `ipaddr` conversion.

```text
JSON_VALUE{}:auto EOL JSON_VALUE{IPADDR}:ip
```

Inspect the outcome by opening the resultset row.

| name | value | type |
|------|-------|------|
| `auto` | `33` | `VARIANT<LONG>` |
| `ip` | `::1` | `IPADDR` |

### Related tags

Dynatrace Platform
