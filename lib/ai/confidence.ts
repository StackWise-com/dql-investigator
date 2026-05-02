/**
 * Confidence scoring for DQL queries.
 *
 * Given a DQL query string, tokenize it, extract field references, and
 * compare them against the known-fields list. Returns a confidence score
 * (0.0 - 1.0) and a list of flagged fields that might be incorrect or
 * non-canonical.
 *
 * This runs entirely client-side and is useful immediately for validating
 * user-written queries before submission.
 */

import { findField, canonicalizeField, getKnownFields } from "./context-loader";

export interface FlaggedField {
  /** The field name as it appears in the query. */
  used: string;
  /** Suggested canonical replacement, if any. */
  suggestion: string | null;
  /** Why this field was flagged. */
  reason: string;
}

export interface ConfidenceResult {
  /** Overall confidence in the query (0.0 - 1.0). */
  confidence: number;
  /** Fields that are unknown or non-canonical. */
  flaggedFields: FlaggedField[];
}

/**
 * Simple regex-based field extractor. Looks for bare identifiers that
 * could be field names in typical DQL positions:
 *   - after filter / filterOut conditions
 *   - after summarize by:{...}
 *   - after sort
 *   - after fields / fieldsAdd / fieldsRemove / fieldsRename
 *   - after parse pattern field bindings
 */
function extractFieldReferences(query: string): string[] {
  const fields = new Set<string>();

  // filter / filterOut:  field == "value"  or  field > 10
  const filterRe = /\bfilter(?:Out)?\b[^|]*?\b([a-zA-Z_][a-zA-Z0-9_.]*)\b/g;
  let m: RegExpExecArray | null;
  while ((m = filterRe.exec(query)) !== null) {
    fields.add(m[1]);
  }

  // summarize by:{field}
  const summarizeRe = /by:\{([^}]+)\}/g;
  while ((m = summarizeRe.exec(query)) !== null) {
    m[1].split(/,\s*/).forEach((f) => fields.add(f.trim()));
  }

  // sort field desc
  const sortRe = /\bsort\b\s+([a-zA-Z_][a-zA-Z0-9_.]*)/g;
  while ((m = sortRe.exec(query)) !== null) {
    fields.add(m[1]);
  }

  // fields / fieldsAdd / fieldsRemove / fieldsRename
  const fieldsRe = /\bfields(?:Add|Remove|Rename)?\b\s+([^|]+)/g;
  while ((m = fieldsRe.exec(query)) !== null) {
    m[1].split(/,\s*/).forEach((f) => {
      // fieldsRename attacker_ip = client_ip  → keep both
      f.split(/\s*=\s*/).forEach((part) => fields.add(part.trim()));
    });
  }

  // parse content, "PATTERN:fieldName"
  const parseRe = /\bparse\b[^,]*,\s*"[^"]*:([a-zA-Z_][a-zA-Z0-9_]*)"/g;
  while ((m = parseRe.exec(query)) !== null) {
    fields.add(m[1]);
  }

  return Array.from(fields);
}

/**
 * Score a DQL query for confidence.
 *
 * Rules:
 *   - Every referenced field that is in known-fields.json → +1
 *   - Every referenced field that is a known synonym → +0.5 (flagged with suggestion)
 *   - Every referenced field that is unknown → +0 (flagged)
 *   - Confidence = totalScore / maxPossible
 */
export function scoreQuery(query: string): ConfidenceResult {
  const refs = extractFieldReferences(query);
  const flagged: FlaggedField[] = [];
  let score = 0;

  for (const ref of refs) {
    const canonical = canonicalizeField(ref);
    if (canonical === null) {
      // Unknown field
      const similar = getKnownFields().find(
        (f) =>
          f.canonical.toLowerCase().includes(ref.toLowerCase()) ||
          ref.toLowerCase().includes(f.canonical.toLowerCase())
      );
      flagged.push({
        used: ref,
        suggestion: similar?.canonical ?? null,
        reason: similar
          ? `Unknown field. Did you mean \`${similar.canonical}\`?`
          : "Unknown field. Not found in known-fields list.",
      });
    } else if (canonical !== ref) {
      // Synonym used
      score += 0.5;
      flagged.push({
        used: ref,
        suggestion: canonical,
        reason: `Non-canonical field name. Use \`${canonical}\` for consistency.`,
      });
    } else {
      // Canonical field
      score += 1;
    }
  }

  const maxPossible = Math.max(refs.length, 1);
  const confidence = Math.min(score / maxPossible, 1);

  return { confidence, flaggedFields: flagged };
}

/**
 * Convenience wrapper: given a field name, return a suggestion if it is
 * unknown or a synonym.
 */
export function findFieldOrFlag(name: string): FlaggedField | null {
  const canonical = canonicalizeField(name);
  if (canonical === null) {
    const similar = getKnownFields().find(
      (f) =>
        f.canonical.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(f.canonical.toLowerCase())
    );
    return {
      used: name,
      suggestion: similar?.canonical ?? null,
      reason: similar
        ? `Unknown field. Did you mean \`${similar.canonical}\`?`
        : "Unknown field. Not found in known-fields list.",
    };
  }
  if (canonical !== name) {
    return {
      used: name,
      suggestion: canonical,
      reason: `Non-canonical field name. Use \`${canonical}\` for consistency.`,
    };
  }
  return null;
}
