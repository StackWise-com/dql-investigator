export class HUD {
  constructor(state) {
    this.state = state;
    this.el = document.getElementById('hud');
    this.xpFill = document.getElementById('xp-fill');
    this.xpValue = document.getElementById('xp-value');

    // Zone tab clicks
    document.querySelectorAll('.zone-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.zone-tab').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        const zone = tab.dataset.zone;
        // Dispatch zone change event for camera
        window.dispatchEvent(new CustomEvent('zonechange', { detail: { zone } }));
      });
    });

    window.addEventListener('zonechange', (e) => {
      // Camera controller listens to this
    });
  }

  show() {
    this.el.classList.remove('hidden');
  }

  addXP(amount) {
    const oldXp = this.state.xp;
    this.state.xp += amount;

    // Gold flash on XP bar
    this.xpFill.style.background = '#ffeb3b';
    this.xpFill.style.boxShadow = '0 0 12px #ffeb3b';
    setTimeout(() => {
      this.xpFill.style.background = '';
      this.xpFill.style.boxShadow = '';
    }, 600);

    // Animate XP bar width
    const maxXP = 1000; // per level
    const currentLevelXP = this.state.xp % maxXP;
    const pct = (currentLevelXP / maxXP) * 100;
    this.xpFill.style.width = `${pct}%`;

    // Count up number
    const duration = 800;
    const start = oldXp;
    const end = this.state.xp;
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current = Math.round(start + (end - start) * progress);
      this.xpValue.textContent = current;
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }
}
