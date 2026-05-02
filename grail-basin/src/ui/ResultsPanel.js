export class ResultsPanel {
  constructor() {
    this.el = document.getElementById('results-panel');
    this.countEl = document.getElementById('results-count');
    this.tableEl = document.getElementById('results-table');
  }

  show() {
    this.el.classList.remove('hidden');
  }

  showResults(results, stages) {
    if (!results || results.length === 0) {
      this.tableEl.innerHTML = '<p class="no-results">No results</p>';
      this.countEl.textContent = '0 records';
      return;
    }

    this.countEl.textContent = `${results.length.toLocaleString()} records`;

    // Build table
    const keys = Object.keys(results[0]).filter((k) => k !== 'dt');
    const displayKeys = keys.slice(0, 6); // limit columns

    let html = '<table><thead><tr>';
    for (const key of displayKeys) {
      html += `<th>${key}</th>`;
    }
    html += '</tr></thead><tbody>';

    for (const row of results.slice(0, 50)) {
      html += '<tr>';
      for (const key of displayKeys) {
        const val = row[key];
        let display = val;
        if (typeof val === 'boolean') display = val ? 'true' : 'false';
        else if (val == null) display = '';
        else display = String(val).substring(0, 50);
        html += `<td>${display}</td>`;
      }
      html += '</tr>';
    }

    if (results.length > 50) {
      html += `<tr><td colspan="${displayKeys.length}" style="text-align:center;color:var(--text-dim);font-size:0.7rem;">...and ${(results.length - 50).toLocaleString()} more rows</td></tr>`;
    }

    html += '</tbody></table>';
    this.tableEl.innerHTML = html;
  }

  showError(message) {
    this.countEl.textContent = 'Error';
    this.tableEl.innerHTML = `<p class="error" style="color:#f44336;font-size:0.8rem;">${message}</p>`;
  }
}
