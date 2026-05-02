/**
 * AI context loader — loads the `.ai/` knowledge base at build time and
 * exposes it to the app. No live model calls; this is the foundation for
 * a future Anthropic/OpenAI integration.
 */

import knownFieldsJson from "../../.ai/schema/known-fields.json";
import explainersJson from "../../.ai/schema/explainers.json";
import commandsJson from "../../.ai/schema/commands.json";
import functionsJson from "../../.ai/schema/functions.json";
import operatorsJson from "../../.ai/schema/operators.json";
import dataTypesJson from "../../.ai/schema/data-types.json";
import dplMatchersJson from "../../.ai/schema/dpl-matchers.json";
import indexJson from "../../.ai/index.json";

export interface KnownField {
  canonical: string;
  type: string;
  description: string;
  synonyms: string[];
  contexts: string[];
}

export interface Explainer {
  title: string;
  plainEnglish: string;
  analogy: string;
  commonMistake: string;
  tip: string;
}

export interface DqlCommand {
  name: string;
  signature: string;
  category: string;
  description: string;
  example: string;
}

export interface DqlFunction {
  name: string;
  signature: string;
  category: string;
  returnType: string;
  description: string;
  example: string;
}

export interface DqlOperator {
  precedence: number;
  operators: string;
  description: string;
}

export interface DqlDataType {
  type: string;
  description: string;
  examples: string[];
  notes: string;
}

export interface DplMatcherSchema {
  name: string;
  aliases?: string[];
  regex: string;
  resultType: string;
  description: string;
  example: string;
}

export interface DqlContext {
  knownFields: KnownField[];
  explainers: Record<string, Explainer>;
  commands: DqlCommand[];
  functions: DqlFunction[];
  operators: DqlOperator[];
  dataTypes: DqlDataType[];
  dplMatchers: DplMatcherSchema[];
  manifest: typeof indexJson;
}

let _context: DqlContext | null = null;

function loadContext(): DqlContext {
  if (_context) return _context;
  _context = {
    knownFields: knownFieldsJson as KnownField[],
    explainers: explainersJson as Record<string, Explainer>,
    commands: commandsJson as DqlCommand[],
    functions: functionsJson as DqlFunction[],
    operators: operatorsJson as DqlOperator[],
    dataTypes: dataTypesJson as DqlDataType[],
    dplMatchers: dplMatchersJson as DplMatcherSchema[],
    manifest: indexJson,
  };
  return _context;
}

/** Get the full DQL knowledge context. */
export function getDqlContext(): DqlContext {
  return loadContext();
}

/** Get all canonical field definitions. */
export function getKnownFields(): KnownField[] {
  return loadContext().knownFields;
}

/**
 * Look up a field by canonical name or synonym. Returns the canonical
 * definition if found, otherwise undefined.
 */
export function findField(name: string): KnownField | undefined {
  const ctx = loadContext();
  const lower = name.toLowerCase();
  return ctx.knownFields.find(
    (f) =>
      f.canonical.toLowerCase() === lower ||
      f.synonyms.some((s) => s.toLowerCase() === lower)
  );
}

/**
 * Check whether a field name is known. If it is a synonym, return the
 * canonical name. If unknown, return null.
 */
export function canonicalizeField(name: string): string | null {
  const f = findField(name);
  return f ? f.canonical : null;
}

/**
 * Get the plain-English explainer for a DQL command or function.
 */
export function getExplainer(command: string): Explainer | undefined {
  return loadContext().explainers[command];
}

/** Get all DQL commands. */
export function getCommands(): DqlCommand[] {
  return loadContext().commands;
}

/** Get all DQL functions. */
export function getFunctions(): DqlFunction[] {
  return loadContext().functions;
}

/** Get all DQL operators. */
export function getOperators(): DqlOperator[] {
  return loadContext().operators;
}

/** Get all DQL data types. */
export function getDataTypes(): DqlDataType[] {
  return loadContext().dataTypes;
}

/** Get all DPL matchers. */
export function getDplMatchers(): DplMatcherSchema[] {
  return loadContext().dplMatchers;
}
