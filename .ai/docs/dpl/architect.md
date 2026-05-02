---
source_url: https://docs.dynatrace.com/docs/platform/grail/dynatrace-pattern-language/dpl-architect
fetched_at: 2026-05-02T00:00:00Z
title: DPL Architect
section: dpl
---

# DPL Architect

The DPL Architect tool enables you to extract fields from records and develop DPL patterns efficiently. It offers immediate feedback on pattern effectiveness, allows saving and reusing expressions, and includes built-in presets for common technologies.

## How it works

DPL Architect evaluates expressions so you do not have to rerun the DQL query. Feedback appears in two contexts: the base dataset and the match preview dataset.

### Base dataset

This dataset derives from your original Notebook query. It indicates the count of result rows that fit your pattern.

### Match preview dataset

This panel shows the record from which you launched field extraction. You may pull extra lines out of the base dataset or build custom records by hand. Matched segments are highlighted.

## Access DPL Architect

You can open DPL Architect from **Notebooks** or **Investigations**.

### Notebooks

1. Within Notebooks, choose the Add menu, then **Logs** > **Fetch logs**.
2. Execute the query.
3. Pick a cell in the results, then choose the **"Extract fields"** option.

### Investigations

See the [Extract fields](/docs/secure/investigations/extract-fields) documentation for available entry points.

## Use DPL Architect

After opening the tool, you can:

- Enter a schema pattern
- Review matching records
- Preview syntax highlighting
- Inspect extracted fields
- Receive visual feedback on pattern quality
- Test multiple patterns in parallel
- Apply the final pattern to your query

### Enter a schema pattern

Type into the expression editor and accept autocomplete suggestions.

- If syntax is correct, the message **"Pattern is valid"** appears.
- If syntax contains errors, **"Pattern error: …"** indicates the line and position.

### View matching records

The base dataset panel shows how many result rows fit your pattern.

### Preview with highlighted syntax

In the match preview pane, the segment of the record that fits your expression is highlighted. Use **"Add log record"** to insert a custom row for validation.

### View extracted fields

The Results pane renders extracted values as new columns when you tag extracted values with a name following a colon, such as `IPADDR:client_ip`.

### Get visual feedback about your pattern quality

Click **"Add to preview"** (located beside the base dataset) to:

- Pull records from the query result into the match preview.
- Identify which original rows match.
- Include unmatched records to refine the pattern.

### Experiment with multiple patterns

Open several DPL patterns in separate tabs to reuse fragments, compare scenarios, and evaluate performance.

Commands:

- **"New"** — create a pattern.
- **"Save"** — store the current pattern.
- **"Saved patterns"** — toggle the list of stored patterns.

Unsaved drafts remain after exiting DPL Architect; closing their tabs manually deletes them.

### Apply your pattern to the query

- Click **"Insert pattern"** to attach the expression to the `parse` command at the end of the source query.
- Click **"Close"** to go back to the query area, then execute it again to view the extracted fields.

## Preset patterns

DPL Architect includes ready-made patterns for widely-used platforms including AWS, Microsoft, and Google Cloud. Use them directly or modify them as needed.

### Access preset patterns

Navigate to **"Saved patterns"** > **"Dynatrace patterns"**. Presets are organized into folders for quicker access.

### List of preset patterns

| Pattern | Description |
|---|---|
| `apache/access` | Pattern for Apache HTTP server access logs. |
| `apache/error-default` | Pattern for Apache HTTP server error logs. |
| `aws/cloudfront` | Pattern for AWS CloudFront default logs. |
| `aws/cloudtrail` | Pulls every field from AWS CloudTrail JSON logs. |
| `aws/elb` | Pulls every field from AWS Elastic Load Balancer logs. |
| `aws/route53-query` | Pulls every field from JSON AWS Route53 resolver query logs. |
| `aws/s3-server-access` | Pulls every field from AWS S3 server access logs. |
| `aws/vpc-flow-default` | Pulls every field from AWS VPC Flow logs in default format. |
| `aws/vpc-flow-default` | Pulls fields from AWS VPC Flow logs custom format when all fields are added in default order. |
| `gcp/scc` | Pulls relevant fields from GCP Security Command Center records. |
| `haproxy/http` | Pulls every field from HAProxy HTTP default logs. |
| `iis/default` | Pulls every field from Microsoft IIS access logs. |
| `k8s/audit` | Pulls every field from JSON Kubernetes apiserver audit logs. |
| `k8s/coredns-query` | Pulls every field from CoreDNS default query logs. |

## Use case

### Investigate security incidents in Kubernetes clusters

With **Investigations**, you can study unauthorized requests inside Kubernetes audit logs. DPL Architect delivers precise field extraction from complex events and instant feedback on pattern coverage, removing the need to rerun queries. This helps locate the origin of unauthorized requests and obtain accurate event details.

## Related topics

- [Notebooks](/docs/analyze-explore-automate/dashboards-and-notebooks/notebooks)
- [Dynatrace Pattern Language](/docs/platform/grail/dynatrace-pattern-language)
- [Investigations](/docs/secure/investigations)
- [Threat hunting and forensics](/docs/secure/use-cases/threat-hunting)

## Related tags

- Dynatrace Platform
