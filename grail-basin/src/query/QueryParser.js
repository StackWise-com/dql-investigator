export class QueryParser {
  parse(rawQuery) {
    const lines = rawQuery
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('//'));

    const stages = [];
    for (const line of lines) {
      const clean = line.startsWith('|') ? line.slice(1).trim() : line;
      stages.push(this.parseStage(clean));
    }
    return stages;
  }

  parseStage(line) {
    // fetch logs
    if (line.startsWith('fetch')) {
      const source = line.match(/fetch\s+(\w+)/)?.[1] || 'logs';
      const timeframe = line.match(/timeframe\s+(\S+)/)?.[1] || null;
      return { op: 'fetch', source, timeframe };
    }

    // filter
    if (line.startsWith('filter')) {
      const expr = line.replace(/^filter\s+/, '');
      return { op: 'filter', expr, parsed: this.parseFilterExpr(expr) };
    }

    // summarize
    if (line.startsWith('summarize')) {
      const byMatch = line.match(/by:\{([^}]+)\}/);
      const fields = byMatch ? byMatch[1].split(',').map((s) => s.trim()) : [];
      const fns = [...line.matchAll(/(count|avg|sum|min|max)\(([^)]*)\)/g)]
        .map((m) => ({ fn: m[1], field: m[2] || null }));
      return { op: 'summarize', functions: fns, groupBy: fields };
    }

    // sort
    if (line.startsWith('sort')) {
      const m = line.match(/sort\s+(\w+)\s*(asc|desc)?/i);
      return { op: 'sort', field: m?.[1] || 'count', direction: m?.[2] || 'desc' };
    }

    // limit
    if (line.startsWith('limit')) {
      return { op: 'limit', n: parseInt(line.match(/\d+/)?.[0] || '10') };
    }

    // parse (DPL)
    if (line.startsWith('parse')) {
      const m = line.match(/parse\s+(\w+),\s*"([^"]+)"/);
      return { op: 'parse', field: m?.[1], pattern: m?.[2] };
    }

    // fieldsAdd
    if (line.startsWith('fieldsAdd')) {
      const expr = line.replace(/^fieldsAdd\s+/, '');
      return { op: 'fieldsAdd', expr };
    }

    // fieldsRemove
    if (line.startsWith('fieldsRemove')) {
      const fields = line.replace(/^fieldsRemove\s+/, '').split(',').map((s) => s.trim());
      return { op: 'fieldsRemove', fields };
    }

    // makeTimeseries
    if (line.startsWith('makeTimeseries')) {
      return { op: 'makeTimeseries', raw: line };
    }

    // lookup
    if (line.startsWith('lookup')) {
      return { op: 'lookup', raw: line };
    }

    return { op: 'unknown', raw: line };
  }

  parseFilterExpr(expr) {
    // loglevel == "ERROR"
    const eqStr = expr.match(/(\w+)\s*==\s*"([^"]+)"/);
    if (eqStr) return { type: 'eq', field: eqStr[1], value: eqStr[2] };

    // responseTime > 500
    const numCmp = expr.match(/(\w+)\s*(>|<|>=|<=)\s*(\d+)/);
    if (numCmp) return { type: 'numcmp', field: numCmp[1], op: numCmp[2], value: parseInt(numCmp[3]) };

    // matchesPhrase(content, "timeout")
    const phrase = expr.match(/matchesPhrase\((\w+),\s*"([^"]+)"\)/);
    if (phrase) return { type: 'phrase', field: phrase[1], value: phrase[2] };

    // contains(content, "error")
    const contains = expr.match(/contains\((\w+),\s*"([^"]+)"\)/);
    if (contains) return { type: 'contains', field: contains[1], value: contains[2] };

    return { type: 'raw', expr };
  }
}
