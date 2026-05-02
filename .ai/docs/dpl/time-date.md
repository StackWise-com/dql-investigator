---
source_url: https://docs.dynatrace.com/docs/platform/grail/dynatrace-pattern-language/log-processing-time-date
fetched_at: 2026-05-02T00:00:00Z
title: DPL Time and Date
section: dpl
---

# DPL Time and Date

Dynatrace's DPL documentation outlines techniques for extracting timestamps from log entries via predefined matchers and user-defined format strings.

Three built-in parsers are available. "ISO8601" handles strings matching "yyyy-MM-ddTHH:mm:ssZ". "HTTPDATE" recognizes formats such as "dd/MMM/yyyy:HH:mm:ss Z". "JSONTIMESTAMP" parses variants like "yyyy-MM-ddTHH:mm:ss.SSSZ". Each yields a timestamp output requiring no quantifier or additional configuration.

For arbitrary formats, the "TIMESTAMP" and "TIME" matchers accept a format argument along with optional parameters for "timezone", "locale", and "charset". If omitted, the format defaults to "yyyy-MM-dd HH:mm:ss".

Epoch-based values are supported as well. Patterns such as "'s'" parse Unix seconds, while "'S'" reads millisecond counts. Combined forms like "'s.S'" or "'s.SSSSSS'" interpret fractional epoch timestamps.

The documentation defines numerous pattern symbols for date and time components. For instance, "y" maps to year, "M" to month, "d" to day-of-month, "E" to weekday name, "H" to hour, "m" to minute, "s" to second, "S" to milliseconds, "f" to fractional seconds, and "z" or "Z" to timezone offsets.

Parsing behavior changes according to symbol repetition. For textual elements like months or weekdays, four or more letters instruct the parser to look for the full word, whereas fewer letters trigger abbreviated-name matching. Numeric fields follow a different rule: a single letter permits any digit count, two to four letters enforce an exact fixed width, and five or more letters again allow flexible digit counts.

Year handling has special logic. The "yy" pattern treats values as relative to the twentieth century with a cutoff of thirty-two; "yyyy" demands exactly four digits; and "yyy" reads the supplied year literally without century adjustment. Month parsing distinguishes numeric from textual forms: one or two letters trigger numeric matching, three letters expect a short name such as "Jul", and four or more letters expect the full name.

Millisecond parsing via "S" accepts numeric strings up to nine digits long. Values above nine hundred ninety-nine are divided by powers of ten according to their length, and the overflow carries into the main timestamp. Fractional-second parsing via "f" also supports nine digits, but the standard "TIMESTAMP" matcher applies only the three highest-order digits, while "TIMESTAMP_NANO" keeps every digit to represent nanoseconds.

The guide provides multiple examples demonstrating conversion from zones such as "PST", "CET", and "EST" into UTC, along with locale-aware parsing for non-English month abbreviations.
