export class QueryExecutor {
  constructor(logs) {
    this.logs = logs;
  }

  async execute(stages, onStage) {
    let results = [...this.logs];
    let allResults = [];

    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      results = this.runStage(stage, results);
      allResults.push(results);

      if (onStage) {
        await this.delay(400);
        onStage(stage, i, results, allResults);
      }
    }

    return results;
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  runStage(stage, input) {
    switch (stage.op) {
      case 'fetch':
        return this.runFetch(stage, input);
      case 'filter':
        return this.runFilter(stage, input);
      case 'summarize':
        return this.runSummarize(stage, input);
      case 'sort':
        return this.runSort(stage, input);
      case 'limit':
        return this.runLimit(stage, input);
      case 'parse':
        return this.runParse(stage, input);
      case 'fieldsAdd':
        return this.runFieldsAdd(stage, input);
      case 'fieldsRemove':
        return this.runFieldsRemove(stage, input);
      case 'makeTimeseries':
        return this.runMakeTimeseries(stage, input);
      default:
        return input;
    }
  }

  runFetch(stage, input) {
    // In a real system this would fetch from storage
    // Here we just return the input (the mock logs)
    return input;
  }

  runFilter(stage, input) {
    const parsed = stage.parsed;
    if (!parsed) return input;

    switch (parsed.type) {
      case 'eq':
        return input.filter((r) => r[parsed.field] === parsed.value);
      case 'numcmp': {
        const val = parseFloat(parsed.value);
        return input.filter((r) => {
          const fieldVal = parseFloat(r[parsed.field]);
          switch (parsed.op) {
            case '>': return fieldVal > val;
            case '<': return fieldVal < val;
            case '>=': return fieldVal >= val;
            case '<=': return fieldVal <= val;
            default: return true;
          }
        });
      }
      case 'phrase':
        return input.filter((r) => r[parsed.field] && r[parsed.field].includes(parsed.value));
      case 'contains':
        return input.filter((r) => r[parsed.field] && r[parsed.field].includes(parsed.value));
      default:
        return input;
    }
  }

  runSummarize(stage, input) {
    const { groupBy, functions } = stage;
    if (groupBy.length === 0) {
      // Global aggregation
      const result = {};
      for (const fn of functions) {
        result[fn.fn] = this.aggregate(fn.fn, fn.field, input);
      }
      return [result];
    }

    // Group by
    const groups = new Map();
    for (const row of input) {
      const key = groupBy.map((f) => row[f] || 'null').join('|');
      if (!groups.has(key)) {
        groups.set(key, { key, values: [], ...Object.fromEntries(groupBy.map((f) => [f, row[f]])) });
      }
      groups.get(key).values.push(row);
    }

    const results = [];
    for (const [_, group] of groups) {
      const result = { ...group };
      delete result.values;
      delete result.key;
      for (const fn of functions) {
        const colName = fn.field ? `${fn.fn}(${fn.field})` : fn.fn;
        result[colName] = this.aggregate(fn.fn, fn.field, group.values);
      }
      results.push(result);
    }

    return results;
  }

  aggregate(fn, field, rows) {
    switch (fn) {
      case 'count':
        return rows.length;
      case 'avg': {
        const vals = rows.map((r) => parseFloat(r[field]) || 0);
        return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      }
      case 'sum': {
        const vals = rows.map((r) => parseFloat(r[field]) || 0);
        return vals.reduce((a, b) => a + b, 0);
      }
      case 'min': {
        const vals = rows.map((r) => parseFloat(r[field]) || 0);
        return vals.length ? Math.min(...vals) : 0;
      }
      case 'max': {
        const vals = rows.map((r) => parseFloat(r[field]) || 0);
        return vals.length ? Math.max(...vals) : 0;
      }
      default:
        return rows.length;
    }
  }

  runSort(stage, input) {
    const { field, direction } = stage;
    const desc = direction === 'desc';
    return [...input].sort((a, b) => {
      const av = parseFloat(a[field]) || a[field] || '';
      const bv = parseFloat(b[field]) || b[field] || '';
      if (typeof av === 'number' && typeof bv === 'number') {
        return desc ? bv - av : av - bv;
      }
      return desc ? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv));
    });
  }

  runLimit(stage, input) {
    return input.slice(0, stage.n);
  }

  runParse(stage, input) {
    // Simple DPL parse simulation — extract responseTime from content
    const field = stage.field || 'content';
    const pattern = stage.pattern || '';

    return input.map((row) => {
      const newRow = { ...row };
      if (pattern.includes('responseTime:INT') || pattern.includes('responseTime')) {
        const match = row.content.match(/responseTime=(\d+)/);
        if (match) newRow.responseTime = parseInt(match[1]);
      }
      if (pattern.includes('loglevel:WORD') || pattern.includes('loglevel')) {
        newRow.loglevel = row.loglevel;
      }
      return newRow;
    });
  }

  runFieldsAdd(stage, input) {
    const expr = stage.expr;
    // Simple fieldsAdd parser: isSlow = responseTime > 800
    const eqMatch = expr.match(/(\w+)\s*=\s*(.+)/);
    if (!eqMatch) return input;

    const fieldName = eqMatch[1];
    const formula = eqMatch[2];

    return input.map((row) => {
      const newRow = { ...row };
      // Evaluate simple conditions
      if (formula.includes('>')) {
        const [left, right] = formula.split('>').map((s) => s.trim());
        const val = parseFloat(row[left]) || 0;
        newRow[fieldName] = val > parseFloat(right);
      } else if (formula.includes('<')) {
        const [left, right] = formula.split('<').map((s) => s.trim());
        const val = parseFloat(row[left]) || 0;
        newRow[fieldName] = val < parseFloat(right);
      } else if (formula.includes('==')) {
        const [left, right] = formula.split('==').map((s) => s.trim().replace(/"/g, ''));
        newRow[fieldName] = row[left] === right;
      } else {
        newRow[fieldName] = formula;
      }
      return newRow;
    });
  }

  runFieldsRemove(stage, input) {
    const fields = stage.fields || [];
    return input.map((row) => {
      const newRow = { ...row };
      for (const f of fields) delete newRow[f];
      return newRow;
    });
  }

  runMakeTimeseries(stage, input) {
    // Group by time bucket
    const buckets = new Map();
    for (const row of input) {
      const ts = new Date(row.timestamp);
      const bucket = `${ts.getFullYear()}-${String(ts.getMonth() + 1).padStart(2, '0')}-${String(ts.getDate()).padStart(2, '0')} ${String(ts.getHours()).padStart(2, '0')}:00`;
      if (!buckets.has(bucket)) buckets.set(bucket, []);
      buckets.get(bucket).push(row);
    }

    const results = [];
    for (const [time, rows] of buckets) {
      results.push({
        time,
        count: rows.length,
      });
    }
    return results.sort((a, b) => new Date(a.time) - new Date(b.time));
  }
}
