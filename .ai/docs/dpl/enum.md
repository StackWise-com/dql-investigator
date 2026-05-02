---
source_url: https://docs.dynatrace.com/docs/platform/grail/dynatrace-pattern-language/log-processing-enum
fetched_at: 2026-05-02T00:00:00Z
title: DPL Enum
section: dpl
---

# DPL Enum

**"ENUM { string=integer , … }"**

This constructor matches input against a fixed set of strings, translating each match into its designated integer. Entries take the form of paired keys and values, separated by commas, within braces.

| Property | Value |
|---|---|
| Output type | integer |
| Quantifier | none |

**Available settings:**

- "**cis**" — When set to `"true"`, this option permits case-insensitive string matching. The default value is `"false"`.
- "**locale**" — Provide an IETF BCP 47 language tag inside single or double quotes. English serves as the default when omitted.
- "**charset**" — Supply a character set name in quotes, for instance `"charset=\"ISO-8859-1\""`.

#### "Example 23"

Assume source data with three fields: username, login result, and comment.

Sample records:

```
"Alice;success;all good"
"Bob;Wrong password;attempts left 2"
"Oscar;tech error;"
"Mallory;;doodaloo"
```

The extraction pattern below assigns integer codes to result strings in a case-insensitive manner:

```
"LD:username ';'"
"ENUM{''=-3, 'success'=0, 'Wrong password'=1, 'tech error'=2}(cis=true):result ';'"
"LD*:comment"
"EOL;"
```

Parsed output:

| "username" | "result" | "comment" |
|---|---|---|
| "`Alice`" | "`0`" | "`all good`" |
| "`Bob`" | "`1`" | "`attempts left 2`" |
| "`Oscar`" | "`2`" | |
| "`Mallory`" | "`-3`" | "`doodaloo`" |
