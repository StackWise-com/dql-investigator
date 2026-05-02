---
source_url: https://docs.dynatrace.com/docs/platform/grail/dynatrace-query-language/dql-best-practices
fetched_at: 2026-05-02T00:00:00Z
title: DQL Best Practices
section: guide
---

# DQL Best Practices

## Narrow the Query Time Range

Restricting your analysis window boosts speed when working with the same underlying data. You can use UI timeframe controls or set the interval directly inside the `fetch` command.

Example:
```sql
fetch bizevents, from:-10m
```

## Use Sampling Where Possible

Grail stores sampled versions of ingested data, and the `fetch` command lets you target those partitions. The `samplingRatio` parameter returns roughly `1/<samplingRatio>` of raw events.

Accepted values are `1` (default, no sampling), `10`, `100`, `1000`, and `10000`.

Example:
```sql
fetch spans, samplingRatio:100
| summarize c=count(), by:{ span.kind, code.namespace, code.function }
| fieldsAdd c = c*100
```

## Limit the Data Scanned

Additional `fetch` options help restrict how much data is read:

- Stop after scanning a defined volume:
  ```sql
  fetch logs, scanLimitGBytes:100
  ```
- Target specific Grail buckets:
  ```sql
  fetch logs, bucket:{"default_logs", "logs_365_*"}
  ```

## Recommended Command Order

Following this sequence yields the best performance:

1. **Filter first.** Reduce rows early with `filter` or `search`.
   - Prefer direct field checks over transformations. For instance, filter with `k8s.namespace.name ~ "astro*"` rather than wrapping the field in `lower()` and `matchesValue()`.
   - Use the `~` operator to match words or phrases in text.
   - Favor inclusive conditions; avoid negations such as `not ... ~ ...` when possible.
   - Skip `join` and `lookup` for filtering unless required, and instead filter on already-enriched fields.

2. **Select columns early.** Use `fields`, `fieldsKeep`, or `fieldsRemove` to trim the working set.

3. **Process results.** Apply non-transformative commands like `fieldsAdd`, `parse`, or `append`.

4. **Aggregate last.** Use `summarize` for tables or `maketimeseries` for charts. Avoid placing `limit` before aggregation, unless you truly want a subset.

5. **Sort at the end.** Running `sort` immediately after `fetch` and then adding more commands slows the query. Keep ordering for the final step.

**Blueprint**
```sql
fetch logs, bucket:{"astroshop_log_*"}, from:-1d@d, samplingRatio:10
| filter loglevel=="ERROR" and k8s.namespace.name ~ "astroshop"
| filter content ~ "error"
| summarize c=count(), by:pod.name
| sort c desc
| limit 5
```

You may repeat commands—such as filtering both before and after a `parse`—as long as `sort` and `summarize` stay in their recommended positions.

Example of a poorly ordered query:
```sql
fetch logs
| sort timestamp desc
| filter content ~ "error"
```

Corrected:
```sql
fetch logs
| filter content ~ "error"
| sort timestamp desc
```

## String Comparison Tips

- Apply `==` or `!=` when the full value is known.
- Apply `~` when only a portion is known or you need pattern matching.

Examples:
```sql
fetch logs
| filter k8s.container.name == "coredns"
```
```sql
fetch logs
| filter k8s.container.name ~ "core*"
```

## Reserved Words in Field Names

Avoid using the following terms as field identifiers or dimensions: `true`, `false`, `null`, `mod`, `and`, `or`, `xor`, `not`.

If a field uses one of these names, reference it by surrounding the name with backticks.

Examples:
```sql
| fields x = true        // boolean literal
| fields x = `true`      // custom dimension named true
```
```sql
| sort not desc          // sorts by boolean value of dimension desc
| sort `not` desc        // sorts descending by field named not
```
