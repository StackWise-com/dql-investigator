---
source_url: https://docs.dynatrace.com/docs/platform/grail/dynatrace-query-language/commands/aggregation-commands
fetched_at: 2026-05-01T17:33:22Z
title: DQL aggregation commands
section: commands
---

# DQL aggregation commands

## fieldsSummary

The `fieldsSummary` command calculates the cardinality of field values that the specified fields have.

### Syntax

```
fieldsSummary field, … [, topValues] [, extrapolateSamples]
```

### Parameters

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| field | field identifier | A field identifier. | Required |
| topValues | positive long | The number of top N values to be returned. Default is `20`. | Optional |
| extrapolateSamples | boolean | Flag indicating if cardinality shall be multiplied with sampling rate. | Optional |

### Basic example

**Simple fields summary**

The following example shows the cardinality of values for the field `host`.

```
data record(host = "host-a"),
     record(host = "host-a"),
     record(host = "host-b")

| fieldsSummary host
```

Query result:

| field | rawCount | count | values |
|-------|----------|-------|--------|
| `host` | `3` | `3` | [**value:** `host-a` **count:** `2`, **value:** `host-b` **count:** `1`] |

### Practical example

**Log count by host**

This example fetches logs with a sampling ratio of 10,000 and calculates cardinality for the `dt.entity.host` field, providing the 10 top values when extrapolating by the sampling ratio.

```
fetch logs, samplingRatio: 10000

| fieldsSummary dt.entity.host, topValues: 10, extrapolateSamples: true
```

---

## makeTimeseries

Creates timeseries from the data in the stream. The `makeTimeseries` command provides a convenient way to chart raw non-metric data (such as events or logs) over time.

### Syntax

```
makeTimeseries [by: { [expression, …] }] [, interval] [, bins] [, from] [, to] [, timeframe] 
[, time ,] [, spread ,] [, nonempty ,] [, scalar:] aggregation, …
```

### Parameters

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| aggregation | aggregation function | The aggregation function for creating the series. Input values must be numeric. | Required |
| time | expression | Expression providing the timestamp for a record assigned to a series bucket. Defaults to `timestamp`, with secondary default `start_time`. | Optional |
| from | timestamp, duration | The start timestamp of the series. Adjusted by series alignment. | Optional |
| to | timestamp, duration | The end timestamp of the series. Adjusted by series alignment. | Optional |
| timeframe | timeframe | The timeframe of the series. Adjusted by series alignment. Default is query timeframe. | Optional |
| bins | positive integer | The number of buckets to create. Range: 12-1,500. Default is `120`. Mutually exclusive with `interval`. | Optional |
| interval | positive duration | The length of a bucket. Mutually exclusive with `bins`. Automatically calculated based on bins. | Optional |
| by | list of expressions | Expressions for splitting the series. | Optional |
| spread | timeframe | Timeframe for bucket calculation. Can only replace `time` with `count` or `countIf`. | Optional |
| nonempty | boolean | Produces empty series when there is no data. | Optional |
| scalar | boolean | Flag for calculating single scalar value spanning whole timeframe. Works with any function except `start` and `end`. | Optional |

### Basic example

**Count records**

The following example counts the number of records per time interval.

```
data record(timestamp = toTimestamp("2019-08-01T09:30:00.000-0400")),
     record(timestamp = toTimestamp("2019-08-01T09:31:00.000-0400")),
     record(timestamp = toTimestamp("2019-08-01T09:31:30.000-0400")),
     record(timestamp = toTimestamp("2019-08-01T09:32:00.000-0400"))

| makeTimeseries count(),
    from: toTimestamp("2019-08-01T09:30:00.000-0400"),
    to: toTimestamp("2019-08-01T09:33:00.000-0400")
```

Query result:

| timeframe | interval | count() |
|-----------|----------|---------|
| **start**: `2019-08-01T13:30:00.000Z` **end**: `2019-08-01T13:33:00.000Z` | `1 min` | `[1, 2, 1]` |

### Practical examples

**Example 1: Error logs for host**

```
fetch logs

| filter dt.entity.host == "HOST-15FE58391F97B7AA" and loglevel == "ERROR"

| makeTimeseries count()
```

**Example 2: Buy activity for account**

The following example shows buy activity for a specific account over the last 24 hours. The `interval` parameter sets the time interval to 30 minutes, creating 48 bins. A bin with no activity has value `0` due to the `default` parameter.

```
fetch bizevents, from: now() - 24h

| filter accountId == 7

| filter in(event.category, array("/broker-service/v1/trade/long/buy", "/v1/trade/buy"))

| makeTimeseries count(default: 0), interval: 30m
```

**Example 3: Transaction statistics**

This advanced example analyzes sell transactions from the last seven days, charting total transactions and high-volume transactions using conditional counting and maximum price by `accountId`, with fixed 1-day resolution.

```
fetch bizevents, from: now() - 7d

| filter in(event.type, array("com.easytrade.long-sell", "com.easytrade.quick-sell"))

| makeTimeseries {
      count(),
      high_volume = countIf(amount >= 100 and amount <= 10000),
      max(price)
    },
    by: { accountId },
    interval: 1d
```

**Example 4: Chart response time percentiles for a specific endpoint**

The `timestamp` field doesn't exist on spans, so `makeTimeseries` uses the `start_time` field instead.

```
fetch spans

| filter request.is_root_span == true

| filter endpoint.name == "GET /api/cart"

| makeTimeseries {
    avg = avg(duration),
    p50 = median(duration),
    p90 = percentile(duration, 90)
  }
```

**Example 5: Distinct hosts sorted by k8s cluster name**

```
fetch logs

| makeTimeseries countDistinct(dt.entity.host, scalar: true),
by:{k8s.cluster.name}
```

### Bins parameter

The `interval` and `bins` parameters are mutually exclusive and both optional. When specified, `bins` (range: 12-1,500) calculates an equivalent nominal time interval.

The nominal time interval is adjusted so that:
- The time interval matches a well-known interval (1 minute, 5 minutes, 10 minutes, 15 minutes, 30 minutes, or 1 hour)
- The time interval does not exceed the maximum of 1,500 elements per series

### Default value for empty time slots

The `makeTimeseries` command produces homogenous time series with identical start/end timestamps, intervals, and element counts. Missing data fills with `null` by default. Specifying a `default` parameter fills empty slots with that value instead.

#### Nonempty parameter

When no records are processed by `makeTimeseries`, an empty result is returned. Using `nonempty: true` combined with `default: 0` produces a chart with 0 values.

**Example 1**

```
fetch logs

| filter status >= 500

| makeTimeseries count = count(default: 0), interval: 30m
```

Query result: No records

**Example 2**

```
fetch logs

| filter status >= 500

| makeTimeseries count = count(default: 0), interval: 30m, nonempty: true
```

Query result:

| timeframe | interval | count |
|-----------|----------|-------|
| **start**: `2019-08-01T13:00:00.000Z` **end**: `2019-08-01T15:30:00.000Z` | `30 min` | `[0, 0, 0, 0, 0]` |

### Aggregation functions

Available aggregation functions for `makeTimeseries`:
- `sum`
- `avg`
- `min`
- `max`
- `median`
- `percentile`
- `percentileFromSamples`
- `percentRank`
- `count`
- `countIf`
- `countDistinctExact`
- `countDistinctApprox`

The `start` and `end` functions can be used together with another aggregation function.

#### Syntax

```
sum(expression [, default] [, rate])
avg(expression [, default] [, rate])
min(expression [, default] [, rate])
max(expression [, default] [, rate])
median(expression [, weight] [, default] [, rate])
percentile(expression, percentile [, weight] [, default] [, rate])
percentileFromSamples(expression, percentile [, originalCount] [, default] [, rate])
percentRank(expression, value [, default] [, rate])
count([default] [, rate])
countIf(expression [, default] [, rate])
countDistinctExact(expression [, default] [, rate])
countDistinctApprox(expression [, precision] [, default] [, rate])
start()
end()
```

#### Parameters

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| expression | expression | The expression for creating the series. | Required |
| default | number | The default value for filling gaps/empty bins. Default is null. | Optional |
| rate | duration | Duration for adjusting bin values using: (binValue / interval) * rate. | Optional |
| percentile | double, long | The nth-percentile between `0` and `100`. | Required |
| precision | long | Precision level for estimation. Range: 3-16. Default is `14`. | Optional |
| weight | double, long | Weight of the expression. Minimum: `0`. Default: `1`. | Optional |
| originalCount | double, long | Original element count of array expression. Minimum: `0`. | Optional |
| value | double, long | The value for retrieving the percentile. | Required |

---

## summarize

Groups together records with the same values for a given field and aggregates them.

### Syntax

```
summarize [field =] aggregation, ... [, by: {[field =] expression, ...}]
```

### Parameters

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| expression | array, boolean, counter, double, duration, ip, long, record, string, timeframe, timestamp | An expression to group by. | Required |
| aggregation | array, boolean, counter, double, duration, ip, long, record, string, timeframe, timestamp | An aggregation function. | Required |

### Aggregation functions

Various aggregation functions are available with `summarize`. See the complete list of aggregation functions.

### Basic examples

**Example 1: Sum field**

This example uses `summarize` with the `sum` aggregation function to sum the field `value`.

```
data record(value = 2),
     record(value = 3),
     record(value = 7),
     record(value = 7),
     record(value = 1)

| summarize sum(value)
```

Query result:

| sum(value) |
|-----------|
| `20` |

**Example 2: Summarize by category**

This example calculates the sum of `value` split by the field `cat`. The aggregation field receives alias `sum` and grouping field alias `category`.

```
data record(value = 2, cat = "a"),
     record(value = 3, cat = "b"),
     record(value = 7, cat = "a"),
     record(value = 7, cat = "b"),
     record(value = 1, cat = "b")

| summarize sum = sum(value),
    by: { category = cat }
```

Query result:

| category | sum |
|----------|-----|
| `a` | `9` |
| `b` | `11` |

**Example 3: Empty aggregation result**

When `summarize` has no input records and no `by` clause, it returns a single record.

```
data record(value = 2),
     record(value = 3),
     record(value = 7),
     record(value = 7),
     record(value = 1)

| filter value > 7

| summarize count(), sum(value), collectArray(value), takeAny(value)
```

Query result:

| count() | sum(value) | collectArray(value) | takeAny(value) |
|---------|-----------|-------------------|----------------|
| `0` | _null_ | _null_ | _null_ |

**Example 4: Group by field doesn't exist for every record**

When the grouped field doesn't exist for every record, `summarize` adds a `null` group.

```
data record(value = 2),
     record(value = 3, category = "b"),
     record(value = 7, category = "a"),
     record(value = 7, category = "b"),
     record(value = 1)

| summarize sum(value),
    by: { category }
```

Query result:

| category | sum(value) |
|----------|-----------|
| `a` | `7` |
| `b` | `10` |
| _null_ | `3` |

**Example 5: Using summarize instead of join**

Use `summarize` instead of `join` when joining on the same table. With input records of different types, set the common field as `by` parameter. Use `takeAny` for single-value fields and `collectArray` for duplicate keys, then expand collected arrays.

```
data record(key = "a", value = 1),
     record(key = "b", value = 2),
     record(key = "c", value = 4),
     record(key = "b", amount = 10),
     record(key = "c", amount = 20),
     record(key = "c", amount = 40),
     record(key = "d", amount = 50)

| summarize {
      value = takeAny(value),
      amount = arrayRemoveNulls(collectArray(amount))
    },
    by: { key }

| expand amount
```

Query result:

| key | value | amount |
|-----|-------|--------|
| `b` | `2` | `10` |
| `c` | `4` | `20` |
| `c` | `4` | `40` |
| `d` | _null_ | `50` |

**Example 6: Element-wise aggregation**

This example uses `summarize` with an iterative expression in the `sum` aggregation function to calculate element-wise sums of arrays.

```
data record(a = array(2, 2)),
     record(a = array(7, 1))

| summarize sum(a[])
```

Query result:

| sum(a[]) |
|----------|
| `[9, 3]` |

### Practical example

**Count selected log levels**

This example counts selected log levels grouped by `dt.entity.host` and `dy.entity.process_group`.

```
fetch logs

| summarize {
      errors = countIf(loglevel == "ERROR"),
      warnings = countIf(loglevel == "WARN"),
      severe = countIf(loglevel == "DEBUG")
    },
    by: {
      dt.entity.host,
      dt.entity.process_group
    }
```
