# `.ai/` — DQL Detective AI Knowledge Base

This folder is the canonical source of Dynatrace Query Language (DQL) and Dynatrace Pattern Language (DPL) knowledge used by the app, by future AI integrations, and by the human authors of learning content.

## Purpose

1. **Today** — the JSON schemas in `schema/` power the in-app `ExplainerCard`s in the Codex and the local `lib/ai/confidence.ts` field-uncertainty checker (used to suggest "did you mean `dt.entity.host`?" when a user writes `host`).
2. **Tomorrow** — a future PR plugs an Anthropic/OpenAI client into `lib/ai/`. That client loads `prompts/system-dql-author.md` + the `schema/*.json` files + retrieved snippets from `docs/` to translate natural-language questions into DQL with a confidence score. If a field name it wants to use isn't in `schema/known-fields.json`, it must flag the uncertainty rather than guess.

## Layout

```
.ai/
├── README.md                       (this file)
├── prompts/                        — System prompts and behavioral rules for the future AI
│   ├── system-dql-author.md
│   └── field-uncertainty-rules.md
├── schema/                         — Structured, machine-readable knowledge
│   ├── commands.json               DQL commands: name, signature, params, examples
│   ├── functions.json              DQL functions: category, signature, return type, examples
│   ├── operators.json              DQL operators
│   ├── data-types.json             DQL data types
│   ├── dpl-matchers.json           DPL TYPE matchers, modifiers, groupings
│   ├── known-fields.json           Canonical field names + synonyms (the "use these or flag" list)
│   └── explainers.json             Plain-English deep explanations per command/function
├── docs/                           — Per-page mirror of docs.dynatrace.com
│   ├── dql/                        28 pages from the DQL tree
│   └── dpl/                        24 pages from the DPL tree
├── examples/
│   ├── dql-cookbook.jsonl          {nl_question, dql, confidence, fields_used, caveats}
│   └── dpl-cookbook.jsonl
└── index.json                      Manifest: every file, tags, source URL, last-fetched
```

## How to use this with a future model

1. Load `prompts/system-dql-author.md` as the system prompt.
2. Append `schema/commands.json`, `schema/functions.json`, `schema/known-fields.json`, `schema/dpl-matchers.json` (these together are small; cache them).
3. For the user's question, retrieve the 3–5 most relevant docs from `docs/` (BM25 over titles + tags in `index.json`).
4. Generate a candidate DQL.
5. Run `lib/ai/confidence.ts#scoreQuery()` against the candidate — it returns `{ confidence: 0..1, flaggedFields: [{ used, suggestion, reason }] }`.
6. If `flaggedFields` is non-empty, the model **must** surface the uncertainty in its reply ("I used `host` — but the canonical field is `dt.entity.host`; please confirm").

## Source

All docs sourced from https://docs.dynatrace.com/docs/platform/grail/. See each file's `source_url` frontmatter and `index.json` for last-fetched timestamps.
