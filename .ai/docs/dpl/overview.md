---
source_url: https://docs.dynatrace.com/docs/platform/grail/dynatrace-pattern-language
fetched_at: 2026-05-02T00:00:00Z
title: Dynatrace Pattern Language
section: dpl
---

# Dynatrace Pattern Language

Dynatrace Pattern Language (DPL) enables describing data formats through what the docs call "a matcher is a mini-pattern that matches a certain type of data." Built-in identifiers such as `INTEGER` and `IPADDR` recognize common data types.

You can apply DPL via the DQL `parse` command or within log-processing workflows. The DPL Architect utility delivers real-time guidance on pattern effectiveness.

A pattern processes from left to right, skipping unnecessary whitespace and comments. Whether written as a single line or an annotated block, the logic remains identical.

The docs note that "All matchers in a defined pattern must match, but only a subset of them may also extract (parse) data." Only matchers given an export name become visible query fields; delimiters and terminators typically remain hidden.

Expression categories include literals, character groups, built-in type matchers, and references to reusable subpatterns. Grouping constructs encompass sequences, alternatives, arrays, structures, enums, and JSON objects.

Optional modifiers appear in a strict sequence around each matcher: an optional lookaround, configuration parentheses, a quantifier, an optional flag, and finally an export name. The docs warn that rearranging these triggers a syntax error.

Operators include format configuration, repetition quantifiers, optional markers that cause the engine to "outputs NULL to the resultset and continues with the next matcher," plus lookaround conditions for branching decisions.

The accompanying walkthrough parses a simple CSV-style log of order IDs, usernames, and IPv4 addresses. The engine steps through bytes, completes each matcher, resets for the next record, and skips unmatched bytes until data aligns or the stream ends.

**Related documentation paths:**

- `/docs/platform/grail/dynatrace-pattern-language/dpl-architect`
- `/docs/platform/grail/dynatrace-pattern-language/dpl-architect#preset-patterns`
- `/docs/platform/grail/dynatrace-pattern-language/log-processing-modifiers`
- `/docs/platform/grail/dynatrace-pattern-language/log-processing-literal-expression`
- `/docs/platform/grail/dynatrace-pattern-language/log-processing-lines-strings`
- `/docs/platform/grail/dynatrace-pattern-language/log-processing-macros`
- `/docs/platform/grail/dynatrace-pattern-language/log-processing-sequence-group`
- `/docs/platform/grail/dynatrace-pattern-language/log-processing-alternatives-group`
- `/docs/platform/grail/dynatrace-pattern-language/log-processing-array`
- `/docs/platform/grail/dynatrace-pattern-language/log-processing-structure`
- `/docs/platform/grail/dynatrace-pattern-language/log-processing-enum`
- `/docs/platform/grail/dynatrace-pattern-language/log-processing-json-object`
- `/docs/platform/grail/dynatrace-pattern-language/log-processing-grammar"
