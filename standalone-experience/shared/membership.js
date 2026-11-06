/* Accessible, bounded interactions for the membership presentation. */
const tabs = [...document.querySelectorAll('.one-tabs [role="tab"]')];
const panels = [...document.querySelectorAll('.one-product[role="tabpanel"]')];
const breathToggle = document.getElementById('breath-toggle');
const breathOrb = document.getElementById('breath-orb');

function stopQuietMoment() {
  breathOrb?.classList.remove('is-active');
  if (breathToggle) {
    breathToggle.setAttribute('aria-pressed', 'false');
    breathToggle.innerHTML = 'Begin a quiet moment <span aria-hidden="true">▷</span>';
  }
}

function activateTool(tab, focus = false) {
  stopQuietMoment();
  for (const item of tabs) {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
  }
  for (const panel of panels) panel.hidden = panel.id !== tab.getAttribute('aria-controls');
  if (focus) tab.focus({ preventScroll: true });
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activateTool(tab));
  tab.addEventListener('keydown', (event) => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault();
    activateTool(tabs[next], true);
    tabs[next].scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
  });
});

const scopeCopy = {
  general: 'Look across the wider web, then inspect the evidence behind each result.',
  literature: 'Follow an idea through primary texts, translations and commentary.',
  collections: 'Focus your question on specialist archives and chosen collections.'
};
document.querySelectorAll('[data-scope]').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-scope]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    document.getElementById('scope-caption').textContent = scopeCopy[button.dataset.scope];
  });
});

breathToggle?.addEventListener('click', () => {
  const active = breathToggle.getAttribute('aria-pressed') !== 'true';
  breathToggle.setAttribute('aria-pressed', String(active));
  breathOrb.classList.toggle('is-active', active);
  breathToggle.innerHTML = active ? 'Pause this moment <span aria-hidden="true">Ⅱ</span>' : 'Begin a quiet moment <span aria-hidden="true">▷</span>';
});

document.querySelectorAll('[data-plan]').forEach((link) => {
  link.addEventListener('click', () => {
    const select = document.querySelector('#invite-form select[name="plan"]');
    if (select) select.value = link.dataset.plan;
  });
});

const spokes = document.getElementById('one-chart-spokes');
if (spokes) for (let index = 0; index < 12; index++) {
  const angle = index * Math.PI / 6;
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', String(170 + 96 * Math.cos(angle)));
  line.setAttribute('y1', String(170 + 96 * Math.sin(angle)));
  line.setAttribute('x2', String(170 + 142 * Math.cos(angle)));
  line.setAttribute('y2', String(170 + 142 * Math.sin(angle)));
  line.setAttribute('stroke-opacity', '.45');
  spokes.appendChild(line);
}
