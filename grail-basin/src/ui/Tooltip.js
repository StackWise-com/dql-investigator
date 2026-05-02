export class Tooltip {
  constructor() {
    this.el = document.getElementById('tooltip');
    this.target = null;
  }

  show(text, x, y) {
    this.el.textContent = text;
    this.el.classList.remove('hidden');
    this.el.style.left = `${x + 12}px`;
    this.el.style.top = `${y + 12}px`;
  }

  hide() {
    this.el.classList.add('hidden');
  }

  updatePosition(x, y) {
    this.el.style.left = `${x + 12}px`;
    this.el.style.top = `${y + 12}px`;
  }
}
