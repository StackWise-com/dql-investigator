---
source_url: https://docs.dynatrace.com/docs/platform/grail/dynatrace-pattern-language/log-processing-json-object
fetched_at: 2026-05-02T00:00:00Z
title: DPL JSON Objects
section: dpl
---

# DPL JSON Objects

The JSON and JSON_OBJECT matchers ingest object structures per "RFC 8259". They emit a variant_object and accept several configuration flags.

**Available settings include:**
- charset: specifies the encoding via a quoted string (such as "ISO-8859-1")
- locale: an IETF BCP 47 tag in quotes; the preset is English
- greedy: defines a field name that holds any unlisted members
- flat: when active, places named members into resultset columns instead of tuple fields
- maxlen: sets a byte limit for oversized objects (the default is 128000)
- strict: defaults to true; disabling it permits malformed objects, such as keys missing quotation marks and one-word strings

Without parameters, the matcher inspects every entry, converts each value into the appropriate Log processing data type, and returns a variant_object.

## Extracting Specific Members

To pull individual fields, supply a comma-separated list of matcher-name pairs inside curly braces. Names containing spaces must be wrapped in quotation marks and may be given an alternate export label. Assigning the alias "null" excludes the field from results. A "greedy" setting gathers all leftover entries under a chosen name.

## Enforcing Mandatory Fields

Attach a + quantifier to require presence. When a required member is absent, the entire match fails, and tuple values reset to their defaults.

## Handling Non-Standard Syntax

Disabling strict (setting it to false) allows malformed objects, including names without quotes and single-word strings.

## Arrays and Nested Structures

For arrays containing one element type, append square brackets to the conversion type before the member name. Multidimensional collections require additional bracket pairs in the matcher declaration.

To handle nested structures, embed an inner JSON matcher inside the outer definition.
