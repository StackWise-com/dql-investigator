---
source_url: https://docs.dynatrace.com/docs/platform/grail/dynatrace-pattern-language/log-processing-smartscape
fetched_at: 2026-05-02T00:00:00Z
title: DPL Smartscape ID
section: dpl
---

# DPL Smartscape ID

The page documents a Dynatrace DPL parsing rule.

**Status:** Reference material for the latest Dynatrace release, published 18 June 2025, in a pre-release state.

**Function:** The rule recognizes character sequences that represent Smartscape identifiers and builds a dedicated parser for them.

**Format:** A valid expression contains:
- "A string from 1 to 255 symbols long. Accepted symbols: `A-Za-z_:0-9`."
- "A dash `-`."
- "A numeric hexadecimal that must be 16 symbols long."

**Behavior:** The matcher emits the category "SMARTSCAPEID", with no multiplicity or additional parameters.

**Demonstration:** When applied to text containing the identifier "CONTAINER-00009B6550330A1F", the directive "LD SMARTSCAPEID:SmartscapeId" populates the field "SmartscapeId" with that value.

**Classification:** Related domain is "Dynatrace Platform".
