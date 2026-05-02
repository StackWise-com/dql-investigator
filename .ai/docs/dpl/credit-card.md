---
source_url: https://docs.dynatrace.com/docs/platform/grail/dynatrace-pattern-language/log-processing-credit-card
fetched_at: 2026-05-02T00:00:00Z
title: DPL Credit Card Data
section: dpl
---

# DPL Credit Card Data

The Dynatrace "DPL Credit Card Data" reference page describes a matcher that "Matches valid credit card numbers (i.e with valid Luhn checksum)". It accommodates differing digit counts based on the payment network, along with uninterrupted or space-separated strings and percent-encoded web-request payloads.

The operator yields a `long` result, applies no quantifier, and needs no configuration. An example declaration, `CREDITCARD:cc EOL;`, extracts the first, second, and fourth sample rows into a column named `cc`. Legitimate samples include `"378282246310005"`, `"3782 822463 10005"`, and a decoded entry equal to `"4917610000000000003"`. The input `"38520000023236"` produces `NULL` owing to an "invalid Luhn check digit".

The page is tagged under the "Dynatrace Platform" and carries a publication date of "May 18, 2022".
