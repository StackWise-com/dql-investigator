---
source_url: https://docs.dynatrace.com/docs/platform/grail/dynatrace-pattern-language/log-processing-numeric
fetched_at: 2026-05-02T00:00:00Z
title: DPL Numeric Data
section: dpl
---

# DPL Numeric Data

## BOOLEAN

Matches case insensitive strings `true` and `false`

| output type | quantifier | configuration |
|-------------|------------|---------------|
| boolean     | none       | none          |

#### Example

```text
true
FALSE
TrUe
```

```text
BOOLEAN:b EOL
```

Results in all rows parsed to boolean field `b`.

---

## FLOAT

Matches floating point numbers in the form of `[+|-]?[0-9]+[.0-9]*` (dot "." separated) or `[+|-]?[0-9]+[E|e0-9]*` (scientific notation)

| output type | quantifier | configuration |
|-------------|------------|---------------|
| float       | none       | **min** =min_value : the minimum of parsed value. If the value is less then parsing fails and the output is set to NULL. |
|             |            | **max** =max_value : the maximum of parsed value. If the value is greater then parsing fails and the output is set to NULL. |

#### Example

```text
3e0
1
0.1
```

Following pattern enforces parsed float value to be between 1.0 and 3.0. Adding optional_modifier '?' allows empty fields (evaluated to NULL):

```text
FLOAT(min=1, max=3)?:f EOL
```

Parsing results values in rows 1-3 extracted to float field `f`. Value in line 4 fails parsing as it is less than specified minimum:

| f     |
|-------|
| `3.0` |
| `NULL`|
| `1.0` |
| `NULL`|

---

## CFLOAT

Same as FLOAT, but with separator comma "," : `[+|-]?[0-9]+[,0-9]*` or `[+|-]?[0-9]+[E|e0-9]*`

---

## DOUBLE

Matches floating point numbers in the form of `[+|-]?[0-9]+[.0-9]*` (dot "." separated) or `[+|-]?[0-9]+[E|e0-9]*` (scientific notation)

| output type | quantifier | configuration |
|-------------|------------|---------------|
| double      | none       | **min** =min_value : the minimum of parsed value. If the value is less then parsing fails and the output is set to NULL. |
|             |            | **max** =max_value : the maximum of parsed value. If the value is greater then parsing fails and the output is set to NULL. |

---

## CDOUBLE

Same as DOUBLE, but with separator comma: `[+|-]?[0-9]+[,0-9]*` or `[+|-]?[0-9]+[E|e0-9]*`

---

## INT, INTEGER

Matches integral numbers in the range `-2147483648` to `2147483647`

| output type | quantifier | configuration |
|-------------|------------|---------------|
| integer     | none       | **min** =min_value : the minimum of parsed value. If the value is less then parsing fails and the output is set to NULL. |
|             |            | **max** =max_value : the maximum of parsed value. If the value is greater then parsing fails and the output is set to NULL. |

#### Example

```text
1-10+20
```

Pattern:

```text
INT:i
```

Parsing results in extracting three integer values from line 1:

| i     |
|-------|
| `1`   |
| `-10` |
| `20`  |

---

## HEXINT

Matches integral numbers in hexadecimal notation: `[+|-]?0?x?[0-9a-fA-F]+` with values in the range `-2147483648` to `2147483647`

| output type | quantifier | configuration |
|-------------|------------|---------------|
| integer     | none       | **min** =min_value : the minimum of parsed value. If the value is less then parsing fails and the output is set to NULL. |
|             |            | **max** =max_value : the maximum of parsed value. If the value is greater then parsing fails and the output is set to NULL. |

#### Example

```text
0xa01F
-xFE
10fE
```

Pattern:

```text
HEXINT:h EOL;
```

Parsing results values in lines 1-3 parsed into integer field `h`:

| h       |
|---------|
| `40991` |
| `-254`  |
| `4350`  |

---

## LONG

Matches integral numbers in the range `-18446744073709551615` to `18446744073709551614`

| output type | quantifier | configuration |
|-------------|------------|---------------|
| long        | none       | **min** =min_value : the minimum of parsed value. If the value is less then parsing fails and the output is set to NULL. |
|             |            | **max** =max_value : the maximum of parsed value. If the value is greater then parsing fails and the output is set to NULL. |

#### Example

```text
-2000
18446744073709551613
```

Pattern:

```text
LONG:l EOL
```

Parsing results values in lines 1-2 extracted to long field `l`:

| l                       |
|-------------------------|
| `-2000`                 |
| `18446744073709551613`  |

---

## HEXLONG

Matches integral numbers in the hexadecimal notation: `[+|-]?0?x?[0-9a-fA-F]+` with values in the range `-18446744073709551615` to `18446744073709551614`

| output type | quantifier | configuration |
|-------------|------------|---------------|
| long        | none       | **min** =min_value : the minimum of parsed value. If the value is less then parsing fails and the output is set to NULL. |
|             |            | **max** =max_value : the maximum of parsed value. If the value is greater then parsing fails and the output is set to NULL. |

Related tags

- Dynatrace Platform
