const BAND_FREQUENCIES = [25, 40, 63, 100, 160, 250, 400, 630, 1000, 1600, 2500, 4000, 6300, 10000, 16000];
const SAMPLE_RATE = 48000;
const DEFAULT_Q = 2.145; // Approx. 2/3 octave peaking bandwidth.

const PRESETS = {
  flat: Array(15).fill(0),
  bass: [5, 4.5, 4, 3.5, 2.5, 1.2, 0.6, 0, -0.5, -1, -1.3, -1.5, -1.2, -0.8, 0],
  vocal: [-1.5, -1.2, -0.8, -0.3, 0.4, 0.8, 1.6, 2.2, 2.5, 2.8, 2.2, 1.2, 0.6, 0.2, 0],
  air: [-1.5, -1.2, -1, -0.8, -0.4, 0, 0.2, 0.8, 1.2, 1.8, 2.4, 3, 3.6, 4.2, 4.8],
  warm: [1.8, 1.6, 1.3, 1, 0.8, 0.4, 0, -0.2, -0.1, 0.3, 0.7, 1.1, 0.8, 0.4, 0],
  studio: [0, 0, -0.4, -0.4, 0, 0.2, 0.8, 1.2, 1, 0.7, 0.4, 0.2, 0.2, 0.1, 0]
};

const TRACK_TEMPLATES = [
  { name: "Track 1", role: "Input", colorBias: 1.0 },
  { name: "Track 2", role: "Monitor", colorBias: 0.9 },
  { name: "Track 3", role: "Radio", colorBias: 0.75 },
  { name: "Track 4", role: "Player", colorBias: 1.1 },
  { name: "Track 5", role: "Print", colorBias: 0.82 }
];

const state = {
  mode: "player",
  preset: "flat",
  transport: "standby",
  route: { player: true, radio: true, monitor: true },
  recordPolicy: "metadata",
  volume: 72,
  station: "102.5 FM · BBC Radio 6",
  trackOverlayPinned: false,
  overlayUntil: 0,
  gains: [...PRESETS.flat],
  trackLevels: [0.38, 0.56, 0.28, 0.61, 0.44],
  phase: Math.random() * Math.PI * 2
};

const els = {};
let graphCtx;
let animationId;

document.addEventListener("DOMContentLoaded", () => {
  bindElements();
  buildSliders();
  buildTrackCards();
  bindControls();
  applyPreset("flat", false);
  syncUI();
  renderAll();
  animate();
});

function bindElements() {
  [
    "graphCanvas","currentMode","transportState","sourceReadout","responseReadout","selectedBandReadout","routeReadout",
    "overlay","overlayStatus","trackGrid","recordPolicyBtn","volumeRange","volumeValue","recordPolicyText","routingText",
    "transportText","latencyText","engineText","modeBadge","trackAction","trackSummary","presetSummary"
  ].forEach(id => els[id] = document.getElementById(id));

  graphCtx = els.graphCanvas.getContext("2d");
  resizeCanvas();
  window.addEventListener("resize", () => {
    resizeCanvas();
    renderAll();
  });
}

function buildSliders() {
  const wrap = document.getElementById("sliders");
  wrap.innerHTML = "";
  BAND_FREQUENCIES.forEach((freq, index) => {
    const band = document.createElement("div");
    band.className = "band";
    band.innerHTML = `
      <div class="band-value" id="bandValue-${index}">0.0 dB</div>
      <input class="band-slider" id="band-${index}" type="range" min="-12" max="12" step="0.5" value="0" aria-label="${freq} Hz EQ gain">
      <div class="band-label">${formatFrequency(freq)}</div>
    `;
    wrap.appendChild(band);

    const slider = band.querySelector("input");
    slider.addEventListener("input", (e) => {
      state.gains[index] = parseFloat(e.target.value);
      state.preset = "custom";
      state.overlayUntil = performance.now() + 2600;
      state.transport = state.transport === "recording" ? "recording" : "active";
      syncUI();
      renderAll();
    });
  });
}

function buildTrackCards() {
  const grid = document.getElementById("trackGrid");
  grid.innerHTML = "";
  TRACK_TEMPLATES.forEach((track, index) => {
    const card = document.createElement("div");
    card.className = "track-card";
    card.innerHTML = `
      <div class="track-head">
        <div>
          <div class="track-name">${track.name}</div>
          <div class="track-role">${track.role}</div>
        </div>
        <div class="badge">${index + 1}</div>
      </div>
      <div class="meter"><div class="meter-fill" id="meter-${index}"></div></div>
      <div class="track-foot">
        <span id="trackState-${index}">idle</span>
        <span id="trackPeak-${index}">-18 dBFS</span>
      </div>
    `;
    grid.appendChild(card);
  });
}

function bindControls() {
  document.querySelectorAll("[data-mode]").forEach(btn => {
    btn.addEventListener("click", () => setMode(btn.dataset.mode));
  });

  document.querySelectorAll("[data-preset]").forEach(btn => {
    btn.addEventListener("click", () => applyPreset(btn.dataset.preset, true));
  });

  document.querySelectorAll("[data-route]").forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.route;
      state.route[key] = !state.route[key];
      state.overlayUntil = performance.now() + 1800;
      syncUI();
      renderAll();
    });
  });

  document.getElementById("trackAction").addEventListener("click", () => {
    state.trackOverlayPinned = !state.trackOverlayPinned;
    state.overlayUntil = performance.now() + 2500;
    syncUI();
  });

  document.getElementById("transportAction").addEventListener("click", toggleTransport);

  els.recordPolicyBtn.addEventListener("click", () => {
    state.recordPolicy = state.recordPolicy === "metadata" ? "printed" : "metadata";
    syncUI();
  });

  els.volumeRange.addEventListener("input", (e) => {
    state.volume = parseInt(e.target.value, 10);
    syncUI();
  });

  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      e.preventDefault();
      toggleTransport();
    }
    if (e.key === "p" || e.key === "P") setMode("player");
    if (e.key === "r" || e.key === "R") setMode("radio");
    if (e.key === "d" || e.key === "D") setMode("record");
    if (e.key === "t" || e.key === "T") {
      state.trackOverlayPinned = !state.trackOverlayPinned;
      syncUI();
    }
  });
}

function setMode(mode) {
  state.mode = mode;
  if (mode === "record") {
    state.transport = "armed";
  } else if (state.transport === "recording") {
    state.transport = "active";
  }
  state.overlayUntil = performance.now() + 1800;
  syncUI();
  renderAll();
}

function toggleTransport() {
  if (state.mode === "record") {
    state.transport = state.transport === "recording" ? "armed" : "recording";
  } else {
    state.transport = state.transport === "playing" ? "standby" : "playing";
  }
  syncUI();
}

function applyPreset(name, updateUI = true) {
  const preset = PRESETS[name];
  if (!preset) return;
  state.gains = [...preset];
  state.preset = name;
  if (updateUI) state.overlayUntil = performance.now() + 2000;
  BAND_FREQUENCIES.forEach((_, index) => {
    const slider = document.getElementById(`band-${index}`);
    if (slider) slider.value = state.gains[index];
  });
  syncUI();
  renderAll();
}

function syncUI() {
  document.querySelectorAll("[data-mode]").forEach(btn => btn.classList.toggle("active", btn.dataset.mode === state.mode));
  document.querySelectorAll("[data-preset]").forEach(btn => btn.classList.toggle("active", btn.dataset.preset === state.preset));
  document.querySelectorAll("[data-route]").forEach(btn => btn.classList.toggle("active", !!state.route[btn.dataset.route]));

  BAND_FREQUENCIES.forEach((freq, index) => {
    const value = document.getElementById(`bandValue-${index}`);
    if (value) value.textContent = formatGain(state.gains[index]);
  });

  els.currentMode.textContent = state.mode.toUpperCase();
  els.modeBadge.textContent = state.mode === "record" ? "Record path" : state.mode === "radio" ? "Radio path" : "Player path";
  els.transportState.textContent = state.transport.toUpperCase();
  els.volumeValue.textContent = `${state.volume}%`;
  els.sourceReadout.textContent = state.mode === "radio" ? state.station : state.mode === "record" ? "Line input · Monitor bus" : "Track 04 · FLAC 24-bit / 48 kHz";
  els.routeReadout.textContent = [
    state.route.player ? "Player" : null,
    state.route.radio ? "Radio" : null,
    state.route.monitor ? "Monitor" : null
  ].filter(Boolean).join(" · ") || "Bypassed";

  els.recordPolicyText.textContent = state.recordPolicy === "metadata"
    ? "Record path stores dry audio plus EQ metadata."
    : "Record path prints EQ to the recorded file.";

  els.routingText.textContent = `EQ active on ${els.routeReadout.textContent}.`;
  els.transportText.textContent = state.transport === "recording"
    ? "Record engine live, monitor path hot."
    : state.transport === "playing"
      ? "Playback engine live."
      : state.transport === "armed"
        ? "Record engine armed."
        : "Transport standing by.";

  els.latencyText.textContent = "Target UI feel: immediate. Static demo simulates low-latency response.";
  els.engineText.textContent = "Graph model: 15 peaking biquads, 48 kHz reference, 2/3-octave-style spacing.";
  els.presetSummary.textContent = state.preset === "custom" ? "Custom curve" : `${capitalize(state.preset)} preset`;

  const selectedIndex = nearestActiveBand();
  els.selectedBandReadout.textContent = `${formatFrequency(BAND_FREQUENCIES[selectedIndex])} · ${formatGain(state.gains[selectedIndex])}`;
  els.responseReadout.textContent = summarizeCurve();

  const shouldShowOverlay = state.trackOverlayPinned || performance.now() < state.overlayUntil;
  els.overlay.classList.toggle("visible", shouldShowOverlay);
  els.overlayStatus.textContent = shouldShowOverlay ? "visible" : "hidden";
  els.trackAction.textContent = shouldShowOverlay ? "Hide Tracks" : "Show Tracks";
  els.recordPolicyBtn.textContent = state.recordPolicy === "metadata" ? "Record: Metadata" : "Record: Printed";
  els.trackSummary.textContent = state.mode === "record" ? "5-track record monitor" : state.mode === "radio" ? "5-track radio monitor" : "5-track playback monitor";
}

function nearestActiveBand() {
  let maxIndex = 0;
  let maxAbs = -1;
  state.gains.forEach((gain, index) => {
    const mag = Math.abs(gain);
    if (mag > maxAbs) {
      maxAbs = mag;
      maxIndex = index;
    }
  });
  return maxAbs <= 0.01 ? 8 : maxIndex;
}

function summarizeCurve() {
  const low = averageRange([0,1,2,3,4]);
  const mid = averageRange([5,6,7,8,9]);
  const high = averageRange([10,11,12,13,14]);
  return `Low ${signed(low,1)} · Mid ${signed(mid,1)} · High ${signed(high,1)}`;
}

function averageRange(indices) {
  const sum = indices.reduce((acc, i) => acc + state.gains[i], 0);
  return sum / indices.length;
}

function renderAll() {
  renderGraph();
  updateTrackLevels(0.016);
}

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  const rect = els.graphCanvas.getBoundingClientRect();
  els.graphCanvas.width = Math.max(10, Math.floor(rect.width * ratio));
  els.graphCanvas.height = Math.max(10, Math.floor(rect.height * ratio));
  graphCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function renderGraph() {
  const ctx = graphCtx;
  const width = els.graphCanvas.clientWidth;
  const height = els.graphCanvas.clientHeight;
  ctx.clearRect(0, 0, width, height);

  const left = 50;
  const right = width - 18;
  const top = 18;
  const bottom = height - 32;
  const graphW = right - left;
  const graphH = bottom - top;

  // background guide
  ctx.fillStyle = "rgba(255,255,255,0.015)";
  ctx.fillRect(left, top, graphW, graphH);

  // horizontal dB lines
  const dbMarks = [-12, -9, -6, -3, 0, 3, 6, 9, 12];
  ctx.font = "11px Inter, sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";

  dbMarks.forEach(db => {
    const y = top + graphH * (1 - (db + 12) / 24);
    ctx.strokeStyle = db === 0 ? "rgba(116,224,209,0.45)" : "rgba(255,255,255,0.08)";
    ctx.lineWidth = db === 0 ? 1.4 : 1;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
    ctx.fillStyle = "rgba(158,172,200,.85)";
    ctx.fillText(`${db > 0 ? "+" : ""}${db} dB`, left - 8, y);
  });

  // frequency grid
  const fMarks = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  fMarks.forEach(freq => {
    const x = freqToX(freq, left, graphW);
    ctx.strokeStyle = "rgba(255,255,255,0.07)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
    ctx.stroke();
    ctx.fillStyle = "rgba(158,172,200,.8)";
    ctx.fillText(freq >= 1000 ? `${(freq/1000).toFixed(freq === 1000 ? 0 : 1)}k` : `${freq}`, x, bottom + 8);
  });

  // band markers
  BAND_FREQUENCIES.forEach((freq, index) => {
    const x = freqToX(freq, left, graphW);
    const y = dbToY(state.gains[index], top, graphH);
    ctx.strokeStyle = "rgba(128,168,255,0.18)";
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
    ctx.stroke();

    ctx.fillStyle = "rgba(128,168,255,.9)";
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  // response path
  const points = [];
  const response = computeResponseCurve(460);
  response.forEach(({ f, db }, i) => {
    const x = freqToX(f, left, graphW);
    const y = dbToY(db, top, graphH);
    points.push([x, y]);
  });

  // fill
  ctx.beginPath();
  points.forEach(([x, y], index) => {
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.lineTo(points[points.length - 1][0], bottom);
  ctx.lineTo(points[0][0], bottom);
  ctx.closePath();
  const fill = ctx.createLinearGradient(0, top, 0, bottom);
  fill.addColorStop(0, "rgba(128,168,255,0.26)");
  fill.addColorStop(.65, "rgba(116,224,209,0.08)");
  fill.addColorStop(1, "rgba(116,224,209,0.01)");
  ctx.fillStyle = fill;
  ctx.fill();

  // line
  ctx.beginPath();
  points.forEach(([x, y], index) => {
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = "rgba(116,224,209,0.95)";
  ctx.lineWidth = 2.2;
  ctx.stroke();
}

function computeResponseCurve(pointCount = 400) {
  const results = [];
  for (let i = 0; i < pointCount; i++) {
    const t = i / (pointCount - 1);
    const f = 20 * Math.pow(1000, t); // 20 Hz -> 20 kHz
    let magnitude = 1;
    for (let band = 0; band < BAND_FREQUENCIES.length; band++) {
      magnitude *= biquadMagnitude(BAND_FREQUENCIES[band], state.gains[band], f, SAMPLE_RATE, DEFAULT_Q);
    }
    const db = clamp(20 * Math.log10(Math.max(magnitude, 1e-8)), -12, 12);
    results.push({ f, db });
  }
  return results;
}

function biquadMagnitude(f0, gainDb, f, sampleRate, q) {
  if (Math.abs(gainDb) < 1e-6) return 1;
  const A = Math.pow(10, gainDb / 40);
  const w0 = 2 * Math.PI * f0 / sampleRate;
  const alpha = Math.sin(w0) / (2 * q);
  const cosW0 = Math.cos(w0);

  let b0 = 1 + alpha * A;
  let b1 = -2 * cosW0;
  let b2 = 1 - alpha * A;
  let a0 = 1 + alpha / A;
  let a1 = -2 * cosW0;
  let a2 = 1 - alpha / A;

  b0 /= a0; b1 /= a0; b2 /= a0; a1 /= a0; a2 /= a0;

  const w = 2 * Math.PI * f / sampleRate;
  const cosW = Math.cos(w), sinW = Math.sin(w);
  const cos2W = Math.cos(2 * w), sin2W = Math.sin(2 * w);

  const nr = b0 + b1 * cosW + b2 * cos2W;
  const ni = -(b1 * sinW + b2 * sin2W);
  const dr = 1 + a1 * cosW + a2 * cos2W;
  const di = -(a1 * sinW + a2 * sin2W);

  const nMag = Math.hypot(nr, ni);
  const dMag = Math.hypot(dr, di);
  return dMag > 0 ? nMag / dMag : 1;
}

function updateTrackLevels(dt) {
  state.phase += dt * 1.6;
  const energy = state.gains.reduce((acc, g) => acc + Math.abs(g), 0) / (BAND_FREQUENCIES.length * 12);
  const modeBoost = state.mode === "record" ? 0.2 : state.mode === "radio" ? 0.08 : 0.14;
  TRACK_TEMPLATES.forEach((track, index) => {
    const target =
      0.18 +
      (Math.sin(state.phase * (0.8 + index * 0.19) + index) + 1) * 0.16 +
      energy * track.colorBias * 0.34 +
      modeBoost;
    state.trackLevels[index] += (clamp(target, 0.08, 0.98) - state.trackLevels[index]) * 0.12;
    const meter = document.getElementById(`meter-${index}`);
    const trackState = document.getElementById(`trackState-${index}`);
    const trackPeak = document.getElementById(`trackPeak-${index}`);
    meter.style.height = `${(state.trackLevels[index] * 100).toFixed(1)}%`;
    const peakDb = -36 + state.trackLevels[index] * 34;
    trackPeak.textContent = `${peakDb.toFixed(1)} dBFS`;
    trackState.textContent =
      state.mode === "record" && index < 2 ? "armed" :
      state.mode === "radio" && index === 2 ? "tuned" :
      state.transport === "playing" || state.transport === "recording" ? "live" : "idle";
  });
}

function animate() {
  updateTrackLevels(0.016);
  const shouldShowOverlay = state.trackOverlayPinned || performance.now() < state.overlayUntil;
  els.overlay.classList.toggle("visible", shouldShowOverlay);
  animationId = requestAnimationFrame(animate);
}

function freqToX(freq, left, width) {
  const min = Math.log10(20);
  const max = Math.log10(20000);
  const norm = (Math.log10(freq) - min) / (max - min);
  return left + norm * width;
}

function dbToY(db, top, height) {
  const clamped = clamp(db, -12, 12);
  return top + height * (1 - (clamped + 12) / 24);
}

function formatFrequency(freq) {
  if (freq >= 1000) {
    return `${Number.isInteger(freq / 1000) ? (freq / 1000).toFixed(0) : (freq / 1000).toFixed(1)} kHz`;
  }
  return `${freq} Hz`;
}
function formatGain(gain) {
  return `${gain > 0 ? "+" : ""}${gain.toFixed(1)} dB`;
}
function signed(value, digits = 1) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(digits)} dB`;
}
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
