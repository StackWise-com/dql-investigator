const STAGE_ICONS = {
  fetch: `<svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 1v4M5 3h6M6 7l-3 4h10l-3-4M4 14h8"/></svg>`,
  filter: `<svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 2h14l-5 6v6l-4-2V8z"/></svg>`,
  summarize: `<svg viewBox="0 0 16 16" width="10" height="10" fill="currentColor"><rect x="1" y="10" width="4" height="5" rx="1"/><rect x="6" y="6" width="4" height="9" rx="1"/><rect x="11" y="1" width="4" height="14" rx="1"/></svg>`,
  sort: `<svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 11V1M1 8l3 3 3-3M12 5v10M9 2l3-3 3 3"/></svg>`,
  limit: `<svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="12" height="12" rx="1"/><path d="M2 6h12"/></svg>`,
  parse: `<svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 1l2 4 4 1-3 3 1 4-4-2-4 2 1-4-3-3 4-1z"/></svg>`,
  fieldsAdd: `<svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 5v6M5 8h6"/></svg>`,
  fieldsRemove: `<svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6"/><path d="M5 8h6"/></svg>`,
  makeTimeseries: `<svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 12l3-4 3 2 4-6 4 3"/></svg>`,
  lookup: `<svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="7" cy="7" r="5"/><path d="M11 11l4 4"/></svg>`,
};

export class PipelineVis {
  constructor() {
    this.el = document.getElementById('pipeline-vis');
    this.pillsEl = document.getElementById('stage-pills');
    this.countsEl = document.getElementById('stage-counts');
  }

  show() {
    this.el.classList.remove('hidden');
  }

  setStages(stages) {
    this.pillsEl.innerHTML = '';
    this.countsEl.innerHTML = '';

    stages.forEach((stage, i) => {
      const pill = document.createElement('span');
      pill.className = `stage-pill ${stage.op}`;
      const icon = STAGE_ICONS[stage.op] || '';
      pill.innerHTML = `${icon}<span>${stage.op}</span>`;
      this.pillsEl.appendChild(pill);

      if (i < stages.length - 1) {
        const arrow = document.createElement('span');
        arrow.className = 'stage-arrow';
        arrow.textContent = '→';
        this.pillsEl.appendChild(arrow);
      }

      const count = document.createElement('span');
      count.className = 'stage-count';
      count.textContent = '...';
      count.dataset.index = i;
      this.countsEl.appendChild(count);
    });
  }

  updateCount(index, value) {
    const countEls = this.countsEl.querySelectorAll('.stage-count');
    if (countEls[index]) {
      countEls[index].textContent = typeof value === 'number' ? value.toLocaleString() : String(value);
    }
  }
}
