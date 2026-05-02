---
source_url: https://docs.dynatrace.com/docs/platform/grail/dynatrace-query-language/dql-comparison
fetched_at: 2026-05-02T00:00:00Z
title: DQL compared to SQL and more
section: guide
---

# DQL compared to SQL and more

The article explains how Dynatrace Query Language handles common data operations alongside SQL, Splunk SPL, and Kusto KQL.

## Fetching data

To retrieve records, DQL uses "fetch events", whereas SQL employs "SELECT * FROM events", SPL uses "sourcetype = event*", and KQL simply uses "events".

## Applying filters

Narrowing records relies on predicates in each language. For example, DQL adds "| filter event.type == \"travel.funnel.booking-payment\"". SQL places criteria in a "WHERE" clause, SPL pipes to "where", and KQL also uses "where". Multiple conditions can be combined with "and" to refine searches further.

## Choosing specific fields

Instead of retrieving all columns, DQL lets users specify relevant data mid-pipeline with "fields". SQL lists columns after "SELECT", SPL uses "fields", and KQL adopts "project".

## Computed columns and ordering

Transforming data and sorting are pipeline steps in DQL: "fieldsAdd" creates new values and "sort" arranges them. SQL calculates expressions in the "SELECT" list and uses "ORDER BY". SPL leverages "eval" and "sort", while KQL computes within "project" before sorting.

## Grouping records

Isolating unique keys uses "summarize" paired with "by:event.type" in DQL. Equivalent methods include SQL's "DISTINCT" keyword, SPL's "stats count by", and KQL's "summarize by".

## Aggregating data

Summarizing grouped data—such as totaling an amount by agency—follows similar patterns. DQL uses "summarize sum = sum(amount), by:travelAgency". SQL aggregates via "GROUP BY", SPL via "stats sum(amount) as total_amount by travelAgency", and KQL via "summarize". DQL also supports adding derived boolean fields after aggregation.

## Related resources

The documentation links to the DQL language reference, command and function lists, data types, and best-practice guides.
