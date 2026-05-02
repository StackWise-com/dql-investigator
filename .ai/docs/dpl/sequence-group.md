---
source_url: https://docs.dynatrace.com/docs/platform/grail/dynatrace-pattern-language/log-processing-sequence-group
fetched_at: 2026-05-02T00:00:00Z
title: DPL Sequence Group
section: dpl
---

# DPL Sequence Group

A sequence group connects individual matchers so the entire set must match for the pattern to succeed. The documentation notes that "Sequence group member matching results are not visible outside of the group," meaning surrounding expressions see only the combined outcome rather than individual members.

Configurable properties include quantifiers, output types, field separators, character sets, and locale identifiers.

**Multiline records:** When text blocks are separated by blank lines—two consecutive line feeds—grouping the end-of-line checks ensures the engine stops at the record boundary instead of reading past it.

**Optional fields:** In server logs that list a timestamp, domain, and optional IP address inside parentheses, grouping lets the entire address clause appear conditionally.

**Delimiter-based data:** For formats such as CSV, this construct cleanly isolates individual columns like sequence numbers, usernames, and network addresses.
