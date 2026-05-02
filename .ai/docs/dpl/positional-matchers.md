---
source_url: https://docs.dynatrace.com/docs/platform/grail/dynatrace-pattern-language/log-processing-positional-matchers
fetched_at: 2026-05-01T00:00:00Z
title: DPL Positional Matchers
section: dpl
---

# DPL Positional Matchers

## Beginning of String

**BOS, BOF**

"Matches beginning of string"

| Aspect | Value |
|--------|-------|
| Output type | none |
| Quantifier | none |
| Configuration | none |

### Example

When parsing CSV-formatted data, this matcher extracts the header row:

```
"name";"age"
Homer Simpson;40
Charles Montgomery Burns;104
```

Pattern: `BOF LD:header EOL;`

The header field captures: `'name';'age'`

Lines 2-3 fail to parse since they don't begin at the file's start marker.

---

## Middle of String

**MOS, MOF**

"Matches any bytes in the middle of string"

| Aspect | Value |
|--------|-------|
| Output type | none |
| Quantifier | none |
| Configuration | none |

### Example

To extract data rows excluding the header:

Pattern: `MOF LD:name ';' INT:age EOL`

Results show records 2-3 parsed successfully:

| Field | Values |
|-------|--------|
| name | Homer Simpson, Charles Montgomery Burns |
| age | 40, 104 |

The first line fails since it starts at the beginning marker rather than the middle.

---

## End of String

**EOS, EOF**

"Matches end of string"

| Aspect | Value |
|--------|-------|
| Output type | none |
| Quantifier | none |
| Configuration | none |

### Example

To extract the final summary line:

Pattern: `LD:footer EOS`

The footer field captures: `total:2 persons, average age: 72 years`

Only the last line matches successfully; earlier lines fail since they precede the end-of-string marker.
