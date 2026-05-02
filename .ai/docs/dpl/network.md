---
source_url: https://docs.dynatrace.com/docs/platform/grail/dynatrace-pattern-language/log-processing-network
fetched_at: 2026-05-02T00:00:00Z
title: DPL Network Data
section: dpl
---

# DPL Network Data

## IPADDR

Use this pattern to detect IPv4 strings in "dot-decimal notation" and IPv6 strings in "hextet notation".

| Parameter | Detail |
|-----------|--------|
| output type | `ipaddr` |
| quantifier | `none` |
| configuration | `none` |

**Example inputs**

"192.168.33.1"

"1080:0:0:0:8:800:200C:417A"

**Pattern**

```
IPADDR:ip EOL;
```

**Extraction output** for lines 1–2 stored in a column of type `ipaddr` labeled `ip`:

| `ip` |
|------|
| `192.168.33.1` |
| `1080:0:0:0:8:800:200C:417A` |

## IPV4, IPV4ADDR

These variants match IPv4 strings in "dot-decimal notation".

| Parameter | Detail |
|-----------|--------|
| output type | `ipaddr` |
| quantifier | `none` |
| configuration | `none` |

## IPV6, IPV6ADDR

These variants match IPv6 strings in "hextet notation".

| Parameter | Detail |
|-----------|--------|
| output type | `ipaddr` |
| quantifier | `none` |
| configuration | `none` |

**Example inputs**

"fe80:0:0:0:8e1:734c:9cca:6bc3"

"::1"

"2a00:1450:4010:c05::69"

**Pattern**

```
IPV6:ip EOL;
```

**Extraction output** for lines 1–3 stored in a column of type `ipaddr` labeled `ip`:

| `ip` |
|------|
| `fe80::8e1:734c:9cca:6bc3` |
| `::1` |
| `2a00:1450:4010:c05::69` |

---

Related tags: "Dynatrace Platform"
