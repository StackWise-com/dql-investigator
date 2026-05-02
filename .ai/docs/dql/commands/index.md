---
source_url: https://docs.dynatrace.com/docs/platform/grail/dynatrace-query-language/commands
fetched_at: 2026-05-02T00:00:00Z
title: DQL Commands
section: commands
---

# DQL commands

This page catalogs DQL commands arranged by category. Click an individual command for more comprehensive details.

## Data source commands

| Name | Description |
|------|-------------|
| `data` | Creates sample information while a query executes. |
| `describe` | Returns schema extraction details upon reading a data object. |
| `fetch` | Retrieves information from a designated source. |
| `load` | Fetches information from a specified asset. Used alongside lookup data. |

## Metric commands

| Name | Description |
|------|-------------|
| `timeseries` | Merges retrieval, filtering, and metric aggregation into time-series output. |
| `metrics` | Fetches metric data points. |

## Filter and search commands

| Name | Description |
|------|-------------|
| `dedup` | Strips duplicate entries from record collections. |
| `filter` | Narrows record lists by keeping items that satisfy a condition. |
| `filterOut` | Excludes records fulfilling a particular condition. |
| `search` | Finds entries matching a provided search criterion. |

## Selection and modification commands

| Name | Description |
|------|-------------|
| `fields` | Retains solely indicated fields. |
| `fieldsAdd` | Computes an expression to add or overwrite a field. |
| `fieldsKeep` | Preserves chosen fields. |
| `fieldsRemove` | Drops fields from output. |
| `fieldsRename` | Alters a field's designation. |

## Extraction and parsing commands

| Name | Description |
|------|-------------|
| `parse` | Analyzes a record attribute and stores output into multiple fields according to the pattern. |

## Ordering commands

| Name | Description |
|------|-------------|
| `limit` | Caps the quantity of returned entries. |
| `sort` | Orders the records. |

## Structuring commands

| Name | Description |
|------|-------------|
| `expand` | Splits an array into distinct entries. |
| `fieldsFlatten` | Pulls out and levels attributes from nested records. |

## Aggregation commands

| Name | Description |
|------|-------------|
| `fieldsSummary` | Determines value cardinality across selected attributes. |
| `makeTimeseries` | Generates time-series from stream information. |
| `summarize` | Groups entries sharing matching attribute values and computes aggregations. |

## Correlation and join commands

| Name | Description |
|------|-------------|
| `append` | Adds records returned by a subquery to an existing list. |
| `join` | Merges all entries from source and subquery when they meet join criteria. |
| `joinNested` | Attaches matching subquery outcomes in a nested record array. |
| `lookup` | Enriches the source with attributes from a subquery by matching fields between tables. |

## Smartscape commands

| Name | Description |
|------|-------------|
| `smartscapeNodes` | Fetches Smartscape nodes using a type pattern (use an asterisk for every type). |
| `smartscapeEdges` | Fetches Smartscape edges via an edge type pattern (apply an asterisk to match all types). |
| `traverse` | Navigates source to target nodes in a defined direction along given edge types. |

## Related topics

- **Use DQL queries** – Learn DQL mechanics and core concepts.
- **DQL language reference** – Syntax guide for Dynatrace Query Language.
- **DQL functions** – Catalog of DQL functions.
- **DQL operators** – Catalog of DQL operators.
- **DQL data types** – Catalog of DQL data types.
- **DQL best practices** – Suggestions for effective DQL usage.

## Related tags

Dynatrace Platform
