# Field Uncertainty Rules

When generating DQL, **every field reference** must be checked against `schema/known-fields.json`. This file lists canonical Dynatrace field names with their synonyms, contexts, and the data sources where they appear.

## Algorithm

For each field `f` you want to reference in your DQL:

1. **Exact match** — `f` is a key in `known-fields.json`. ✅ Use it as-is. No flag.
2. **Synonym match** — `f` appears in the `synonyms[]` of some canonical field `F`. ⚠️ Replace `f` with `F` in the DQL and add a flag: `{ used: f, suggestion: F, reason: "synonym for canonical field" }`.
3. **Near match** — Levenshtein distance ≤ 2 to some canonical `F` (e.g., `host` → `host.name`). ⚠️ Use `F` in the DQL with a flag: `{ used: f, suggestion: F, reason: "close match — please confirm" }`.
4. **No match, but plausible** — looks like a Dynatrace-style namespaced field (`dt.*`, `host.*`, `service.*`, `k8s.*`). ⚠️ Keep `f` but flag it: `{ used: f, suggestion: null, reason: "plausible Dynatrace field but not in known-fields catalog" }`.
5. **No match, doesn't fit pattern** — looks invented (e.g., `userIp`, `httpStatus`). 🚫 Do NOT use it. Either flag heavily and ask the user, or pick a canonical close-fit (`client.ip`, `http.response.status_code`) and flag the substitution.

## Common ambiguities to always flag

| User says | Likely canonical | Why flag |
|---|---|---|
| `host` | `dt.entity.host` (entity ID) **or** `host.name` (string) | Both exist; depends on intent |
| `user` | `user.id`, `user.name`, `user.email` | Multiple plausible fields |
| `status` | `http.response.status_code`, `event.status` | Context-dependent |
| `error` | `event.outcome == "error"` (filter), `log.level == "ERROR"` | Dimension vs. filter |
| `latency` | `duration`, `request.duration_ms` | Multiple representations |
| `service` | `dt.entity.service` (id), `service.name` (string) | Entity vs. attribute |

## Confidence math

Start at `1.0`. Subtract:
- `0.10` per synonym/near-match flag
- `0.20` per plausible-but-unverified flag
- `0.30` per no-match flag
- `0.15` if the user's question is ambiguous about time range
- `0.10` if the user's question is ambiguous about data source (logs vs. spans vs. events)

Floor at `0.1`. Never report `0.0` — that means you should refuse to answer instead.
