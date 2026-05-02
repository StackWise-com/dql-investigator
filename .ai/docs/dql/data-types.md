---
source_url: https://docs.dynatrace.com/docs/platform/grail/dynatrace-query-language/data-types
fetched_at: 2026-05-02T00:00:00Z
title: DQL Data Types
section: reference
---

## DQL Data Types

DQL "operates with strongly typed data", so functions and operators require declared types. Types are assigned during parsing or through casting, and literals can supply constant values.

### Primitive Types

- **Boolean**: Holds two logical values writable in any letter case. Strings such as `"true"` evaluate to true; numeric zero maps to false, while nonzero numbers map to true. Logical operators include AND, OR, XOR, and NOT.
- **Long**: Signed 64-bit integers ranging from -2^63 to 2^63-1, available in decimal or hexadecimal forms. Casting functions turn strings and expressions into long values.
- **Double**: A 64-bit floating-point number. Literals may appear in decimal or scientific notation, and numeric inputs or formulas can be cast to double.
- **Timestamp**: Marks an exact moment with nanosecond precision, mainly used to define custom query time ranges. Comparisons and arithmetic are supported.
- **Timeframe**: A span defined by a start and end timestamp, each accurate to the nanosecond. Access either endpoint via index syntax.
- **Duration**: Represents elapsed time through an amount and a unit. Units span nanoseconds through years; calendar units work in calculations but cannot be stored in fields. Create durations with `duration()` or `toDuration()`.
- **String**: Text wrapped in double quotes, with optional backslash escaping, or triple quotes for raw content. Any DQL value may be turned into a string.
- **IpAddress**: Stores IPv4 or IPv6 network addresses.
- **UID**: Covers 64-bit and 128-bit identifier formats. Use `uid64()`, `uid128()`, or `toUid()` to create them.

### Complex Types

- **Array**: An ordered list accessed by zero-based index. Direct comparison supports only equality; specialized array functions are also available.
- **Record**: Collections of keys paired with values of any DQL type. Retrieve items through their keys, build them with `record()`, or generate them by parsing JSON, key-value strings, or structure patterns.
