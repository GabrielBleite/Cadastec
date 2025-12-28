import { FAN_COLORS, FAN_STATE } from "../utils/constants.js";

export class UiController {
  constructor(root) {
    this.root = root;
    this.callbacks = {
      onCaseChange: () => {},
      onReset: () => {},
      onPositive: () => {},
      onNegative: () => {},
      onRecommended: () => {},
      onSmokeToggle: () => {},
    };
    this.elements = {};
  }

  init(caseList) {
    this.root.innerHTML = "";
    this.root.appendChild(this.buildTopBar(caseList));
    this.root.appendChild(this.buildLegend());
    this.root.appendChild(this.buildStatus());
    this.root.appendChild(this.buildHelp());
  }

  buildTopBar(caseList) {
    const bar = document.createElement("div");
    bar.className = "top-bar";

    const label = document.createElement("label");
    label.textContent = "Gabinete";
    bar.appendChild(label);

    const select = document.createElement("select");
    caseList.forEach((item) => {
      const opt = document.createElement("option");
      opt.value = item.id;
      opt.textContent = item.name;
      select.appendChild(opt);
    });
    select.addEventListener("change", (e) => this.callbacks.onCaseChange?.(e.target.value));
    bar.appendChild(select);
    this.elements.caseSelect = select;

    const buttons = [
      { label: "Configuração recomendada", handler: () => this.callbacks.onRecommended?.() },
      { label: "Pressão positiva", handler: () => this.callbacks.onPositive?.() },
      { label: "Pressão negativa", handler: () => this.callbacks.onNegative?.() },
      { label: "Resetar", handler: () => this.callbacks.onReset?.() },
    ];
    buttons.forEach((b) => {
      const btn = document.createElement("button");
      btn.textContent = b.label;
      btn.addEventListener("click", b.handler);
      bar.appendChild(btn);
    });

    const smokeBtn = document.createElement("button");
    smokeBtn.textContent = "Fumaça: DESLIGAR";
    smokeBtn.addEventListener("click", () => {
      const next = smokeBtn.dataset.state !== "on";
      smokeBtn.dataset.state = next ? "on" : "off";
      smokeBtn.textContent = `Fumaça: ${next ? "DESLIGAR" : "LIGAR"}`;
      this.callbacks.onSmokeToggle?.(next);
    });
    smokeBtn.dataset.state = "on";
    bar.appendChild(smokeBtn);
    this.elements.smokeBtn = smokeBtn;

    bar.addEventListener("dblclick", (e) => e.stopPropagation());
    return bar;
  }

  buildLegend() {
    const panel = document.createElement("div");
    panel.className = "legend";
    panel.innerHTML = `
      <h4>Legenda</h4>
      <div class="legend-row"><span class="swatch" style="background:${FAN_COLORS[FAN_STATE.INTAKE].getStyle()};"></span>Azul = entra</div>
      <div class="legend-row"><span class="swatch" style="background:${FAN_COLORS[FAN_STATE.EXHAUST].getStyle()};"></span>Vermelho = sai</div>
      <div class="legend-row"><span class="swatch" style="background:${FAN_COLORS[FAN_STATE.OFF].getStyle()};"></span>Cinza = off</div>
    `;
    return panel;
  }

  buildStatus() {
    const panel = document.createElement("div");
    panel.className = "status-panel";
    const title = document.createElement("h4");
    title.textContent = "Status das fans";
    panel.appendChild(title);

    const list = document.createElement("div");
    panel.appendChild(list);
    this.elements.statusList = list;
    return panel;
  }

  buildHelp() {
    const panel = document.createElement("div");
    panel.className = "help-panel";
    panel.innerHTML = `
      <strong>Como usar</strong>
      <span class="tagline">Clique nas fans para alternar INTAKE → EXHAUST → OFF</span>
      - Use o mouse para orbitar, aproximar e inspecionar o interior.<br />
      - Máquina de fumaça fica fora, à direita.<br />
      - Fumaça respeita aberturas, paredes e vidro.<br />
      - Use os presets para explorar pressão positiva/negativa.
    `;
    return panel;
  }

  updateStatus(fans) {
    if (!this.elements.statusList) return;
    this.elements.statusList.innerHTML = "";
    fans.forEach((fan) => {
      const row = document.createElement("div");
      row.className = "fan-status";
      const dot = document.createElement("span");
      dot.className = "state-dot";
      dot.style.background = FAN_COLORS[fan.state].getStyle();

      const label = document.createElement("span");
      label.textContent = `${fan.slot.id}: ${fan.state}`;
      row.appendChild(dot);
      row.appendChild(label);
      this.elements.statusList.appendChild(row);
    });
  }
}
