---
source_url: https://docs.dynatrace.com/docs/platform/grail/dynatrace-query-language/dql-guide
fetched_at: 2026-05-02T00:00:00Z
title: Use DQL queries
section: guide
---

# Use DQL queries

Dynatrace Query Language (DQL) is a "read-only request to process data and return results" that employs a pipeline structure. Queries chain together multiple instructions using a pipe (`|`). As the documentation notes, "The data flows or is funneled from one command to the next." Because this sequence is linear, command order influences both output and speed.

## Loading data and timeframes

Use the `fetch` command to pull a dataset such as `logs` or `events`. When no interval is declared, the interface's chosen range applies. You can override this with relative parameters (`from`, `to`) or an absolute `timeframe` string. The default window is two hours.

## Filtering, sorting, and field selection

The `filter` command restricts rows with Boolean logic. The docs recommend: "Use operators like `==` or `!=` to include or exclude fields with specific values." You can choose which columns appear via `fields`, arrange records with `sort`, and cap results using `limit`.

## Aggregation

`summarize` computes summary values such as counts or sums. To produce chartable intervals, `makeTimeseries` groups raw events into time buckets.

## Practice

An interactive "Learn DQL App" provides hands-on tutorials for SaaS users, Community members, and free-trial signups.
