---
source_url: https://docs.dynatrace.com/docs/platform/grail/dynatrace-pattern-language/log-processing-json-array
fetched_at: 2026-05-02T00:00:00Z
title: DPL JSON Arrays
section: dpl
---

# DPL JSON Arrays

## Overview
The matcher `JSON_ARRAY` accommodates every valid JSON array form, spanning flat primitive lists to deeply nested object collections. Members within a single array may differ in type, and arrays may stand alone without being wrapped inside a JSON object.

## Matcher Properties

| Attribute | Value |
|---|---|
| Default output | `variant_array` (or `array` when `typed` is enabled) |
| Quantifier | none |
| Configuration flags | `charset`, `locale`, `typed`, `strict`, `maxlen` |

### Configuration Flags
- `charset` — supply a character set name inside quotes; for instance, `charset="ISO-8859-1"`.
- `locale` — an IETF BCP 47 language tag in quotes; English is the default.
- `typed` — a boolean that selects the output container: `typed=true` yields `array`, while `typed=false` (the default) yields `variant_array`.
- `strict` — a boolean controlling spec fidelity: `strict=false` allows unquoted names and single-word string values that deviate from standard JSON. The default is `strict=true`.
- `maxlen` — a numeric byte limit for the array; the default cap is 128,000 bytes, and raising it permits larger inputs.

## Basic Operation
When invoked without parameters, the matcher walks every element, translates each into its corresponding log-processing type, and returns a `variant_array`.

### Simple Example
Consider an input that mixes an integer, a null literal, a decimal, a numeric string, and escaped digits: `[5,null,2.2,"17.9","5777772"]`.  
Using the pattern `JSON_ARRAY:array` produces a `variant_array`. The parsed entries map to indices such as `array[0]` with value `5` and type `VARIANT<LONG>`, `array[1]` as a plain `VARIANT` null, `array[2]` as `VARIANT<DOUBLE>`, `array[3]` as `VARIANT<STRING>` containing `17.9`, and `array[4]` as `VARIANT<STRING>` containing the decoded digits.

## Explicit Type Conversion
The form `JSON_ARRAY{ type }` casts every member to the specified type. If a conversion cannot be completed, the whole result is set to `NULL`. Enabling `typed=true` switches the output from `variant_array` to `array`, which lets you reference elements directly in queries without extra casting functions.

### Typed Example
Given a mixed list such as `[223423,-343.8e7,null,"3.14"]`, applying the pattern `JSON_ARRAY{ DOUBLE }(typed=true):double_arr` returns an `array` of `DOUBLE` values. The resulting fields include `double_arr[0]` at `223423.0`, `double_arr[1]` at `-3.438E9`, `double_arr[2]` as `NULL`, and `double_arr[3]` at `3.14D`.

## Parsing Large Object Streams
If a dataset consists of JSON records stored as elements inside a large wrapper array, using `JSON_ARRAY` is discouraged because it emits the entire structure as a single row and will probably exceed capacity even when `maxlen` is increased. The recommended approach processes the content as comma-delimited JSON objects while skipping the surrounding bracket pair. Semantic validation via mandatory top-level members is strongly recommended to prevent incomplete objects near chunk edges.

### Suggested Pattern
An optional opening bracket, expressed as `(BOF '\[')?`, precedes the main extractor: `JSON_OBJECT{INT+:id}(greedy='others'):record ','?`, followed by an optional closing bracket `('\]' EOF)?`.  

The three stages function as follows:
1. Optionally match `[` at the file start so the rule also works mid-stream.
2. Extract each object into the column `record`, followed by an optional comma. The identifier `id` is required to avoid losing data, while additional members are pulled into the `others` field automatically.
3. Optionally match `]` at the file end.

The emitted rows resemble `{id=1 others={'a':[3,6],'b':{'foo':'bar'}}}`, with analogous structures for subsequent records.

### Parallel Ingestion Note
Ingestion pipelines shard data into 64-megabyte segments that are processed concurrently. A rule should align with the smallest indivisible data block inside its upper length bound so that no field is emitted twice. This condition is almost always met automatically, but it can fail when JSON runs in automatic extraction mode—such as parsing `concatenated_json` or a comma-separated list of optional JSON objects—because the rule might then match embedded objects inside a larger object. To guard against this, declare a minimal set of top-level members as mandatory and rely on the `greedy` parameter to capture the remainder automatically.

## Related Tags
Dynatrace Platform
