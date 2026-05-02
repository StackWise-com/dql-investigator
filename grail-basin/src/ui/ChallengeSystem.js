const CHALLENGES = [
  {
    id: 'fetch_basics',
    level: 1,
    emoji: '📜',
    title: 'Open the Gate',
    concept: 'fetch',
    desc: 'The Grail reservoir holds ALL your logs. Open the sluice gate — fetch the log stream.',
    analogy: "You're a detective. fetch logs is you walking into the evidence archive and saying 'show me everything.'",
    hint: 'Type: fetch logs',
    solution: 'fetch logs',
    check: (q) => q.trim().startsWith('fetch logs'),
    worldEvent: 'GATE_OPEN',
    xp: 100,
    unlock: 'The river channel lights up. 2,000 capsules pour from the Grail.',
    explanation: 'fetch logs opens the data source. In Dynatrace Grail, logs are stored in a massive distributed storage engine.',
  },
  {
    id: 'filter_level',
    level: 2,
    emoji: '🔴',
    title: 'Drop the Sieve',
    concept: 'filter',
    desc: 'The river is flooded with 2,000 capsules. Drop a mesh sieve — let only ERROR capsules through.',
    analogy: "A sieve across the river. Every capsule that doesn't match your condition dissolves on contact.",
    hint: 'Add: | filter loglevel == "ERROR"',
    solution: 'fetch logs\n| filter loglevel == "ERROR"',
    check: (q) => q.includes('filter') && q.toLowerCase().includes('error'),
    worldEvent: 'FILTER_MESH',
    xp: 120,
    unlock: 'The sieve drops. 1,700 capsules dissolve. Only ~280 red ERROR capsules pass.',
    explanation: '| filter is the most used DQL operator. The pipe | passes records from the previous stage into this one.',
  },
  {
    id: 'summarize_count',
    level: 3,
    emoji: '🪣',
    title: 'Fill the Buckets',
    concept: 'summarize + count',
    desc: 'Stop the capsules mid-river. Group them into buckets — one per service. Count what\'s in each.',
    analogy: 'The capsules freeze. They fly into labeled buckets — one per service name. Each bucket shows its total.',
    hint: 'Add: | summarize count(), by:{service}',
    solution: 'fetch logs\n| filter loglevel == "ERROR"\n| summarize count(), by:{service}',
    check: (q) => q.includes('summarize') && q.includes('count()'),
    worldEvent: 'SUMMARIZE_BUCKETS',
    xp: 150,
    unlock: 'The river freezes. Capsules magnetically group into 14 service buckets. Columns rise.',
    explanation: 'summarize is the aggregation operator. count() counts records. by:{field} defines the grouping dimension.',
  },
  {
    id: 'sort',
    level: 4,
    emoji: '📊',
    title: 'Order the Columns',
    concept: 'sort',
    desc: 'The buckets are grouped but random. Slide them into order — worst offender on the left.',
    analogy: 'A conveyor belt rearranges the bucket columns. Tallest (most errors) slides to position 1.',
    hint: 'Add: | sort count desc',
    solution: 'fetch logs\n| filter loglevel == "ERROR"\n| summarize count(), by:{service}\n| sort count desc',
    check: (q) => q.includes('sort') && q.includes('count'),
    worldEvent: 'SORT_BUCKETS',
    xp: 100,
    unlock: 'The conveyor belt activates. Columns slide into order with a satisfying spring motion.',
    explanation: 'sort orders the result set. desc = highest first (descending). asc = lowest first.',
  },
  {
    id: 'limit',
    level: 5,
    emoji: '🚪',
    title: 'Drop the Guillotine',
    concept: 'limit',
    desc: 'You have 14 service columns. You only want the top 5 worst offenders.',
    analogy: 'A guillotine blade drops after position 5. The remaining columns slide off the edge into the void.',
    hint: 'Add: | limit 5',
    solution: 'fetch logs\n| filter loglevel == "ERROR"\n| summarize count(), by:{service}\n| sort count desc\n| limit 5',
    check: (q) => q.includes('limit'),
    worldEvent: 'LIMIT_GATE',
    xp: 80,
    unlock: 'The blade drops. 9 columns fall off the Analysis Bank into darkness. 5 remain.',
    explanation: 'limit caps the number of records returned. Always combine sort + limit for "top N" queries.',
  },
  {
    id: 'parse_dpl',
    level: 6,
    emoji: '🧬',
    title: 'Crack the Capsule',
    concept: 'parse (DPL)',
    desc: 'Log content is raw text. Use DPL to crack it open and extract the responseTime field.',
    analogy: 'A capsule floats into the DPL Cracking Lab. It shatters. Colored fragments fly into labeled slots.',
    hint: 'Use: | parse content, "LD:* responseTime:INT LD:*"',
    solution: 'fetch logs\n| filter loglevel == "WARN"\n| parse content, "LD:* responseTime:INT LD:*"\n| limit 20',
    check: (q) => q.includes('parse'),
    worldEvent: 'DPL_CRACK',
    xp: 200,
    unlock: 'The DPL Lab activates. Capsules crack open. responseTime values fly out as gold fragments.',
    explanation: 'parse uses DPL (Dynatrace Pattern Language) to extract structured fields from unstructured log text.',
  },
  {
    id: 'avg_aggregate',
    level: 7,
    emoji: '📈',
    title: 'Average the Flood',
    concept: 'summarize + avg',
    desc: 'You have extracted responseTime from each capsule. Now calculate the average response time per service.',
    hint: 'Use: | summarize avg(responseTime), by:{service}',
    solution: 'fetch logs\n| filter loglevel == "WARN"\n| parse content, "LD:* responseTime:INT LD:*"\n| summarize avg(responseTime), by:{service}\n| sort avg(responseTime) desc',
    check: (q) => q.includes('avg('),
    worldEvent: 'AVG_BARS',
    xp: 150,
    unlock: 'Capsule columns shrink into single average-value bars. Heights now represent milliseconds.',
    explanation: 'avg() calculates the mean of a numeric field across all records in each group.',
  },
  {
    id: 'fieldsAdd',
    level: 8,
    emoji: '🏷',
    title: 'Stamp the Capsules',
    concept: 'fieldsAdd',
    desc: 'Add a new field "isCritical" that is true when responseTime > 1000. Watch the stamp machine brand each capsule.',
    hint: 'Use: | fieldsAdd isCritical = responseTime > 1000',
    solution: 'fetch logs\n| filter loglevel == "ERROR"\n| fieldsAdd isCritical = responseTime > 1000\n| summarize count(), by:{isCritical, service}\n| sort count desc',
    check: (q) => q.includes('fieldsAdd'),
    worldEvent: 'STAMP_MACHINE',
    xp: 130,
    unlock: 'A mechanical arm stamps each capsule. Red = critical (>1000ms). Green = normal.',
    explanation: 'fieldsAdd creates new calculated fields. You can use arithmetic, comparisons, and if() expressions.',
  },
  {
    id: 'timeseries',
    level: 9,
    emoji: '〰️',
    title: 'Draw the Waveform',
    concept: 'makeTimeseries',
    desc: 'Transform individual capsules into a time-series chart. Watch them self-organize into a waveform.',
    hint: 'Use: | makeTimeseries count(), by:{service}, time:5m',
    solution: 'fetch logs\n| filter loglevel == "ERROR"\n| makeTimeseries count(), by:{service}, time:5m',
    check: (q) => q.includes('makeTimeseries'),
    worldEvent: 'TIMESERIES_WAVE',
    xp: 180,
    unlock: 'Capsules fly into position. A waveform draws itself across the Analysis Bank like an ECG.',
    explanation: 'makeTimeseries is a specialized summarize that groups by time intervals. time:5m = 5-minute buckets.',
  },
  {
    id: 'full_investigation',
    level: 10,
    emoji: '🏆',
    title: 'The Full Investigation',
    concept: 'Complete DQL pipeline',
    desc: 'MASTER CHALLENGE: Find the top 3 slowest services in the last hour that have more than 10 errors.',
    hint: 'Combine: fetch logs, filter by time + level, summarize count() + avg(responseTime), filter groups, sort, limit.',
    solution: `fetch logs\n| filter loglevel == "ERROR"\n| summarize errorCount = count(), avgResponse = avg(responseTime), by:{service}\n| filter errorCount > 10\n| sort avgResponse desc\n| limit 3`,
    check: (q) => q.includes('fetch') && q.includes('filter') && q.includes('summarize') && q.includes('sort') && q.includes('limit'),
    worldEvent: 'FULL_PIPELINE',
    xp: 300,
    unlock: 'GRAIL BASIN MASTERED. The full pipeline runs. Every zone activates simultaneously.',
    explanation: 'This is a real investigation query. Notice the second filter AFTER summarize — it filters on aggregated results.',
  },
];

export class ChallengeSystem {
  constructor(state, onLoadSolution) {
    this.state = state;
    this.onLoadSolution = onLoadSolution;
    this.el = document.getElementById('challenge-panel');
    this.contentEl = document.getElementById('challenge-content');
    this.completed = new Set();
    this.render();
  }

  show() {
    this.el.classList.remove('hidden');
  }

  render() {
    const challenge = CHALLENGES[this.state.currentChallenge];
    if (!challenge) return;

    const isCompleted = this.completed.has(challenge.id);

    let html = `
      <div class="challenge-emoji">${challenge.emoji}</div>
      <div class="challenge-title">${challenge.title}</div>
      <div class="challenge-desc">${challenge.desc}</div>
      <div class="challenge-analogy">${challenge.analogy}</div>
      <div class="challenge-hint">${challenge.hint}</div>
    `;

    if (isCompleted) {
      html += `
        <div style="color:#4caf50;font-size:0.75rem;margin-bottom:0.75rem;">Completed! +${challenge.xp} XP</div>
        <div style="color:var(--text-dim);font-size:0.75rem;line-height:1.5;margin-bottom:0.75rem;">${challenge.explanation}</div>
      `;
      if (this.state.currentChallenge < CHALLENGES.length - 1) {
        html += `<button class="challenge-btn" id="next-challenge">Next Challenge →</button>`;
      }
    } else {
      html += `<button class="challenge-btn" id="try-challenge">Try This Challenge</button>`;
    }

    this.contentEl.innerHTML = html;

    // Bind buttons
    const tryBtn = document.getElementById('try-challenge');
    if (tryBtn) {
      tryBtn.addEventListener('click', () => {
        this.onLoadSolution(challenge.solution);
      });
    }

    const nextBtn = document.getElementById('next-challenge');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.state.currentChallenge++;
        this.render();
      });
    }
  }

  checkSolution(query) {
    const challenge = CHALLENGES[this.state.currentChallenge];
    if (!challenge || this.completed.has(challenge.id)) return null;

    const passes = challenge.check(query);
    if (passes) {
      this.completed.add(challenge.id);
      this.showNotification(`Challenge Complete! +${challenge.xp} XP — ${challenge.unlock}`);

      // Auto advance after delay
      setTimeout(() => {
        if (this.state.currentChallenge < CHALLENGES.length - 1) {
          this.state.currentChallenge++;
          this.render();
        }
      }, 2000);

      return { xp: challenge.xp };
    }
    return null;
  }

  showNotification(text) {
    // Full-screen teal pulse
    const pulse = document.createElement('div');
    pulse.style.cssText = `
      position: fixed; inset: 0; z-index: 999;
      background: radial-gradient(circle at 50% 30%, rgba(0,255,200,0.15) 0%, transparent 70%);
      opacity: 1; pointer-events: none; transition: opacity 1s ease;
    `;
    document.body.appendChild(pulse);
    requestAnimationFrame(() => {
      pulse.style.opacity = '0';
    });
    setTimeout(() => pulse.remove(), 1100);

    // Star burst particles from top
    for (let i = 0; i < 12; i++) {
      const star = document.createElement('div');
      const angle = (i / 12) * Math.PI * 2;
      const dist = 60 + Math.random() * 80;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist;
      star.style.cssText = `
        position: fixed; top: 4rem; left: 50%;
        width: 4px; height: 4px; border-radius: 50%;
        background: #00ffcc; box-shadow: 0 0 8px #00ffcc;
        pointer-events: none; z-index: 1001;
        transform: translate(-50%, -50%);
      `;
      document.body.appendChild(star);
      star.animate([
        { transform: 'translate(-50%, -50%)', opacity: 1 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`, opacity: 0 }
      ], {
        duration: 800 + Math.random() * 400,
        easing: 'ease-out',
      }).onfinish = () => star.remove();
    }

    // Text notification
    const notif = document.createElement('div');
    notif.style.cssText = `
      position: fixed; top: 4rem; left: 50%; transform: translateX(-50%);
      background: rgba(0, 255, 200, 0.1); border: 1px solid rgba(0, 255, 200, 0.3);
      color: #00ffcc; padding: 0.75rem 1.5rem; border-radius: 6px;
      font-family: 'Rajdhani', sans-serif; font-size: 0.85rem; z-index: 1000;
      backdrop-filter: blur(8px); pointer-events: none;
    `;
    notif.textContent = text;
    document.body.appendChild(notif);
    setTimeout(() => {
      notif.style.opacity = '0';
      notif.style.transition = 'opacity 0.5s';
      setTimeout(() => notif.remove(), 500);
    }, 3000);
  }
}
