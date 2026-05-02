---
source_url: https://docs.dynatrace.com/docs/platform/grail/dynatrace-pattern-language/log-processing-macros
fetched_at: 2026-05-02T00:00:00Z
title: DPL Macros
section: dpl
---

# DPL Macros: Pattern Expression Syntax

The core syntax for defining a macro is "`$name = matcher_expr …`". Within Dynatrace's pattern language, you can bind a sequence of matcher expressions—known as a subpattern—to a variable that serves as a macro. Once defined, this macro may be reused in later expressions. This technique enables the creation of advanced matching logic without sacrificing readability.

## BSD Syslog Header Example

The documentation demonstrates the concept by parsing a BSD Syslog header. It provides sample input lines, including:

- "Sep  1 02:27:01 c69-76 CRON\[30297\]: pam\_unix(cron:session): session closed for user root"
- "Sep  1 02:37:06 c69-76 sshd\[30365\]: Did not receive identification string from 197.159.170.108"
- "Sep  1 02:39:01 c69-76 CRON\[30376\]: pam\_env(cron:session): Unable to open env file: /etc/default/locale:" "No such file or directory"

The matching rule is written across two statements. The first captures the header, combining a timestamp and a host identifier. The macro is initialized with "`$syslog_hdr = TIMESTAMP('MMM d HH:mm:ss'):ts ' ' LD:host;`". It is then invoked to parse the entire line: "`$syslog_hdr ' ' LD:process ': ' LD:message EOL;`".

## Parsed Output

When the parser runs against the sample data, it extracts four fields: "ts", "host", "process", and "message". Corresponding values from the three records include:

- "2019-09-01 02:27:01.000 +0000", "c69-76", "CRON[30297]", "pam_unix(cron ..."
- "2019-09-01 02:37:06.000 +0000", "c69-76", "sshd[30365]", "Did not receive ..."
- "2019-09-01 02:39:01.000 +0000", "c69-76", "CRON[30376]", "pam_env(cron: ..."

## Export Name Behavior

When an export name is attached to a macro, two outcomes occur. The documentation notes that this causes "exposing exported subpattern expressions in a tuple structure". Additionally, "if there are no exported subpattern expressions, then matched data is exported as string".
