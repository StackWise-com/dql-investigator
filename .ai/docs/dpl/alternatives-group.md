---
source_url: https://docs.dynatrace.com/docs/platform/grail/dynatrace-pattern-language/log-processing-alternatives-group
fetched_at: 2026-05-02T00:00:00Z
title: DPL Alternatives Group
section: dpl
---

# DPL Alternatives Group

Dynatrace documentation describes a pattern-matching construct written as "( matcher_expr | matcher_expr | … )". This grouping evaluates multiple expressions in sequence, employing what the documentation calls a "lazy match strategy." Upon encountering the first successful match, processing stops and the corresponding value is extracted if an export name exists. Any additional exported fields receive NULL values.

When the entire group is exported, its output becomes either the matching member's value as a string or an empty value if nothing matches. The resulting data type is always a string, and quantifiers cannot be applied. Optional configurations include "charset" and "locale" parameters.

This approach works well when a single data position might hold different formats. The documentation cites Apache web server logs, where a record might begin with either an IP address or a hostname. The example pattern "(IPADDR:ip | LD:host):alt_grp EOL;" shows how to capture either format into separate fields while populating an overarching group export.
