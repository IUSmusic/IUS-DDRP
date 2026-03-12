(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const STORAGE_KEY = 'ius-ddrp-state-v2';
  const EQ_FREQUENCIES = [25, 40, 63, 100, 160, 250, 400, 630, 1000, 1600, 2500, 4000, 6300, 10000, 16000];
  const PRESETS = {
    flat:  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    bass:  [4,4,3,3,2,1,0,0,0,-1,-1,-1,-1,-2,-2],
    vocal: [-2,-2,-1,0,1,2,3,3,2,2,1,0,-1,-1,-2],
    air:   [-1,-1,-1,0,0,0,0,1,1,2,3,4,4,5,5],
    warm:  [2,2,2,1,1,0,0,-1,-1,-1,0,1,1,1,0],
    studio:[0,0,0,0,0,0,0,0,0,0,0,1,1,1,0]
  };
  const TRACKS = [
    { title: 'sample01.wav', artist: 'Placeholder local track', src: 'assets/audio/sample01.wav' },
    { title: 'sample02.wav', artist: 'Placeholder local track', src: 'assets/audio/sample02.wav' },
    { title: 'sample03.wav', artist: 'Placeholder local track', src: 'assets/audio/sample03.wav' }
  ];
  const MULTITRACKS = [
    { key: 'drums', label: 'T1', name: 'DRUM BUS', descriptor: 'Low-mid punch', band: [40, 220], arm: true, mute: false, solo: false, level: 0 },
    { key: 'bass', label: 'T2', name: 'BASS BUS', descriptor: 'Sub and body', band: [30, 140], arm: true, mute: false, solo: false, level: 0 },
    { key: 'music', label: 'T3', name: 'MUSIC BUS', descriptor: 'Wide tonal bed', band: [180, 6000], arm: false, mute: false, solo: false, level: 0 },
    { key: 'voice', label: 'T4', name: 'VOICE BUS', descriptor: 'Presence band', band: [120, 4200], arm: false, mute: false, solo: false, level: 0 },
    { key: 'master', label: 'MX', name: 'MASTER', descriptor: 'Full monitor mix', band: [20, 18000], arm: true, mute: false, solo: false, level: 0, isMaster: true }
  ];

  const persisted = loadState();
  const state = {
    mode: persisted.mode || 'player',
    trackIndex: clampIndex(persisted.trackIndex, TRACKS.length),
    stationIndex: 0,
    eqValues: Array.isArray(persisted.eqValues) && persisted.eqValues.length === EQ_FREQUENCIES.length ? [...persisted.eqValues] : [...PRESETS.flat],
    preset: persisted.preset || 'flat',
    volume: Number.isFinite(persisted.volume) ? Math.min(100, Math.max(0, persisted.volume)) : 72,
    tracksVisible: persisted.tracksVisible !== false,
    mediaRecorder: null,
    recordChunks: [],
    micStream: null,
    currentSourceType: null,
    stations: [],
    analysis: { tilt: 'Balanced', energy: 'Idle', dynamics: 'Open', focus: 'Midrange', narrative: 'Analyzer waiting for signal.' },
    multitrack: MULTITRACKS.map((track, index) => ({ ...track, ...(persisted.multitrack?.[index] || {}) })),
    trackRecorders: [],
    isRecording: false
  };

  const playerAudio = $('playerAudio');
  const radioAudio = $('radioAudio');
  const AudioContextRef = window.AudioContext || window.webkitAudioContext;
  const audioContext = new AudioContextRef();
  const masterGain = audioContext.createGain();
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 4096;
  analyser.smoothingTimeConstant = 0.84;
  const splitter = audioContext.createChannelSplitter(2);
  const merger = audioContext.createChannelMerger(2);
  const filters = EQ_FREQUENCIES.map((frequency) => {
    const f = audioContext.createBiquadFilter();
    f.type = 'peaking';
    f.frequency.value = frequency;
    f.Q.value = 1.1;
    f.gain.value = 0;
    return f;
  });

  let currentMediaNode = null;
  let playerSourceNode = null;
  let radioSourceNode = null;
  let micSourceNode = null;
  let micMonitorGain = null;
  let analysisData = new Uint8Array(analyser.frequencyBinCount);
  const spectrumCanvas = $('spectrumCanvas');
  const spectrumCtx = spectrumCanvas.getContext('2d');
  const eqCanvas = $('eqCanvas');
  const eqCtx = eqCanvas.getContext('2d');

  function loadState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch {
      return {};
    }
  }

  function persistState() {
    const snapshot = {
      mode: state.mode,
      trackIndex: state.trackIndex,
      stationIndex: state.stationIndex,
      eqValues: state.eqValues,
      preset: state.preset,
      volume: state.volume,
      tracksVisible: state.tracksVisible,
      multitrack: state.multitrack.map(({ arm, mute, solo }) => ({ arm, mute, solo }))
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  }

  function clampIndex(index, length) {
    return Number.isInteger(index) && index >= 0 && index < length ? index : 0;
  }

  function fmtTime(seconds) {
    if (!Number.isFinite(seconds)) return '00:00';
    const s = Math.max(0, Math.floor(seconds));
    const m = Math.floor(s / 60);
    return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  }

  function setStatus(modeLabel, detail, tone) {
    $('statusBadge').textContent = modeLabel;
    $('statusBadge').className = `status-badge ${tone}`;
    $('statusText').textContent = detail;
  }

  function updateVolume() {
    masterGain.gain.value = state.volume / 100;
    $('volumeText').textContent = String(state.volume);
    $('volumeKnob').value = String(state.volume);
    persistState();
  }

  function chainConnect(sourceNode) {
    if (currentMediaNode) {
      try { currentMediaNode.disconnect(); } catch {}
    }
    filters.forEach((filter) => {
      try { filter.disconnect(); } catch {}
    });
    try { analyser.disconnect(); } catch {}

    currentMediaNode = sourceNode;
    let node = sourceNode;
    filters.forEach((filter) => {
      node.connect(filter);
      node = filter;
    });
    node.connect(analyser);
    analyser.connect(masterGain);
    masterGain.connect(audioContext.destination);
  }

  function ensurePlayerNode() {
    if (!playerSourceNode) playerSourceNode = audioContext.createMediaElementSource(playerAudio);
    return playerSourceNode;
  }

  function ensureRadioNode() {
    if (!radioSourceNode) radioSourceNode = audioContext.createMediaElementSource(radioAudio);
    return radioSourceNode;
  }

  function useSource(type) {
    if (state.currentSourceType === type) return;
    if (type === 'player') chainConnect(ensurePlayerNode());
    if (type === 'radio') chainConnect(ensureRadioNode());
    if (type === 'mic' && micSourceNode) chainConnect(micSourceNode);
    state.currentSourceType = type;
  }

  function renderPlaylist() {
    const playlist = $('playlist');
    playlist.innerHTML = '';
    TRACKS.forEach((track, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `playlist-item ${index === state.trackIndex ? 'active' : ''}`;
      button.setAttribute('role', 'listitem');
      const title = document.createElement('div');
      title.className = 'playlist-title';
      title.textContent = track.title;
      const sub = document.createElement('div');
      sub.className = 'playlist-sub';
      sub.textContent = track.artist;
      button.append(title, sub);
      button.addEventListener('click', () => {
        state.trackIndex = index;
        persistState();
        loadTrack(index, true);
      });
      playlist.appendChild(button);
    });
  }

  function renderStations() {
    const list = $('stationList');
    list.innerHTML = '';
    state.stations.forEach((station, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `station-item ${index === state.stationIndex ? 'active' : ''}`;
      button.setAttribute('role', 'listitem');
      const title = document.createElement('div');
      title.className = 'station-title';
      title.textContent = station.name;
      const sub = document.createElement('div');
      sub.className = 'station-sub';
      sub.textContent = `${station.country} · ${station.genre}`;
      button.append(title, sub);
      button.addEventListener('click', () => {
        state.stationIndex = index;
        persistState();
        if (state.mode === 'radio') loadStation(index, true);
        renderStations();
      });
      list.appendChild(button);
    });
  }

  function activeSolo() {
    return state.multitrack.some((track) => track.solo);
  }

  function trackIsAudible(track) {
    if (track.mute) return false;
    const soloOn = activeSolo();
    return soloOn ? track.solo : true;
  }

  function renderTrackOverlay() {
    const overlay = $('overlayTracks');
    const toggle = $('toggleTracks');
    overlay.classList.toggle('show', state.tracksVisible);
    toggle.textContent = state.tracksVisible ? 'Hide track mixer' : 'Show track mixer';
    toggle.setAttribute('aria-pressed', String(state.tracksVisible));
    overlay.innerHTML = '';

    state.multitrack.forEach((track, index) => {
      const row = document.createElement('div');
      row.className = 'track-strip';

      const id = document.createElement('div');
      id.className = 'track-id';
      const badge = document.createElement('div');
      badge.className = 'track-badge';
      badge.textContent = track.label;
      const role = document.createElement('div');
      role.className = 'track-role';
      role.textContent = track.name;
      id.append(badge, role);

      const meter = document.createElement('div');
      meter.className = 'track-meter';
      const meterFill = document.createElement('span');
      meterFill.style.width = `${track.level || 0}%`;
      meter.appendChild(meterFill);

      const level = document.createElement('div');
      level.className = 'track-level';
      level.textContent = track.level > 0 ? `${Math.max(-60, -60 + track.level * 0.6).toFixed(1)} dB` : '-∞ dB';

      const arm = document.createElement('button');
      arm.type = 'button';
      arm.className = `arm-toggle ${track.arm ? 'armed' : ''}`;
      arm.textContent = track.arm ? 'ARMED' : 'ARM';
      arm.setAttribute('aria-pressed', String(track.arm));
      arm.addEventListener('click', () => {
        track.arm = !track.arm;
        if (track.isMaster) track.arm = true;
        persistState();
        renderTrackOverlay();
      });

      const muteSolo = document.createElement('div');
      muteSolo.style.display = 'flex';
      muteSolo.style.gap = '8px';
      const mute = document.createElement('button');
      mute.type = 'button';
      mute.className = `mini-btn ${track.mute ? 'active' : ''}`;
      mute.textContent = 'M';
      mute.setAttribute('aria-pressed', String(track.mute));
      mute.addEventListener('click', () => {
        track.mute = !track.mute;
        persistState();
        renderTrackOverlay();
      });
      const solo = document.createElement('button');
      solo.type = 'button';
      solo.className = `mini-btn ${track.solo ? 'active' : ''}`;
      solo.textContent = 'S';
      solo.setAttribute('aria-pressed', String(track.solo));
      solo.addEventListener('click', () => {
        track.solo = !track.solo;
        persistState();
        renderTrackOverlay();
      });
      muteSolo.append(mute, solo);

      const mode = document.createElement('button');
      mode.type = 'button';
      mode.className = `track-button ${trackIsAudible(track) ? 'active' : ''}`;
      mode.textContent = track.descriptor;
      mode.title = `${track.name}: ${track.descriptor}`;

      row.append(id, meter, level, arm, muteSolo, mode);
      overlay.appendChild(row);
    });
  }

  function updateMetaForTrack(track) {
    $('trackTitle').textContent = track.title;
    $('trackArtist').textContent = track.artist;
    $('sourceLabel').textContent = state.mode === 'radio' ? 'Internet radio monitor' : 'Local library';
    $('formatLabel').textContent = state.mode === 'radio' ? 'Live stream via browser' : 'Web Audio chain active';
  }

  async function safeResume() {
    if (audioContext.state !== 'running') await audioContext.resume();
  }

  function loadTrack(index, autoplay = false) {
    const track = TRACKS[index];
    updateMetaForTrack(track);
    playerAudio.src = track.src;
    playerAudio.load();
    useSource('player');
    renderPlaylist();
    if (autoplay) playPlayer();
  }

  async function playPlayer() {
    await safeResume();
    switchMode('player');
    useSource('player');
    try {
      await playerAudio.play();
      setStatus('PLAYER', 'Playback active', 'amber');
    } catch {
      setStatus('PLAYER', 'Track missing — add MP3 file', 'red');
    }
  }

  function pausePlayer() {
    playerAudio.pause();
    if (state.mode === 'player') setStatus('PLAYER', 'Paused', 'amber');
  }

  function stopAll() {
    playerAudio.pause();
    radioAudio.pause();
    if (playerAudio.duration) playerAudio.currentTime = 0;
    if (radioAudio.duration && Number.isFinite(radioAudio.duration)) radioAudio.currentTime = 0;
    if (state.isRecording) stopRecording();
    setStatus(state.mode.toUpperCase(), 'Stopped', state.mode === 'record' ? 'red' : state.mode === 'radio' ? 'green' : 'amber');
  }

  async function loadStation(index, autoplay = true) {
    const station = state.stations[index];
    if (!station) return;
    $('radioName').textContent = station.name;
    $('radioGenre').textContent = station.genre;
    $('radioCountry').textContent = station.country;
    $('radioFormat').textContent = station.format;
    $('radioSignal').textContent = 'Buffering';
    $('trackTitle').textContent = station.name;
    $('trackArtist').textContent = `${station.country} · ${station.genre}`;
    $('sourceLabel').textContent = 'Free internet stream';
    $('formatLabel').textContent = station.format;
    radioAudio.src = station.url;
    radioAudio.load();
    useSource('radio');
    renderStations();
    if (!autoplay) return;
    await safeResume();
    try {
      await radioAudio.play();
      $('radioSignal').textContent = 'Live';
      setStatus('RADIO', 'Live stream active', 'green');
    } catch {
      $('radioSignal').textContent = 'Blocked';
      setStatus('RADIO', 'Stream blocked or unavailable', 'red');
    }
  }

  function createTrackProcessing(inputNode) {
    state.trackNodes?.forEach((nodeSet) => {
      try { nodeSet.input.disconnect(); } catch {}
      try { nodeSet.highpass.disconnect(); } catch {}
      try { nodeSet.lowpass.disconnect(); } catch {}
      try { nodeSet.meter.disconnect(); } catch {}
      try { nodeSet.output.disconnect(); } catch {}
      try { nodeSet.destination.disconnect(); } catch {}
    });

    state.trackNodes = state.multitrack.map((track) => {
      const input = audioContext.createGain();
      const highpass = audioContext.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.value = track.band[0];
      const lowpass = audioContext.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = track.band[1];
      const meter = audioContext.createAnalyser();
      meter.fftSize = 1024;
      const output = audioContext.createGain();
      const destination = audioContext.createMediaStreamDestination();
      inputNode.connect(input);
      input.connect(highpass);
      highpass.connect(lowpass);
      lowpass.connect(meter);
      lowpass.connect(output);
      output.connect(destination);
      if (track.isMaster) {
        output.gain.value = 1;
      }
      return { input, highpass, lowpass, meter, output, destination };
    });
  }

  async function setupMic() {
    if (state.micStream) return true;
    try {
      state.micStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      micSourceNode = audioContext.createMediaStreamSource(state.micStream);
      createTrackProcessing(micSourceNode);
      micMonitorGain = audioContext.createGain();
      micMonitorGain.gain.value = 1;
      micSourceNode.connect(micMonitorGain);
      return true;
    } catch {
      $('recordHint').textContent = 'Microphone permission denied or unavailable.';
      setStatus('RECORD', 'Mic unavailable', 'red');
      return false;
    }
  }

  function getRecorderMimeType() {
    const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
    return candidates.find((type) => window.MediaRecorder && MediaRecorder.isTypeSupported(type)) || '';
  }

  async function startRecording() {
    const ok = await setupMic();
    if (!ok) return;
    await safeResume();
    switchMode('record');
    useSource('mic');
    if (state.isRecording) return;

    const armedTracks = state.multitrack.filter((track) => track.arm || track.isMaster);
    if (!armedTracks.length) {
      $('recordHint').textContent = 'Arm at least one track first.';
      setStatus('RECORD', 'No armed tracks', 'red');
      return;
    }

    const mimeType = getRecorderMimeType();
    state.trackRecorders = [];

    armedTracks.forEach((track, index) => {
      const chunks = [];
      const nodeSet = state.trackNodes[index];
      if (!nodeSet) return;
      const recorder = new MediaRecorder(nodeSet.destination.stream, mimeType ? { mimeType } : undefined);
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: recorder.mimeType || mimeType || 'audio/webm' });
        const extension = (recorder.mimeType || mimeType || 'audio/webm').includes('mp4') ? 'm4a' : 'webm';
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `ius-ddrp-${track.key}-${Date.now()}.${extension}`;
        anchor.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      };
      state.trackRecorders.push({ recorder, trackKey: track.key });
    });

    state.trackRecorders.forEach(({ recorder }) => recorder.start());
    state.isRecording = true;
    $('recordHint').textContent = `Recording ${state.trackRecorders.length} armed track${state.trackRecorders.length > 1 ? 's' : ''}. Stop to download each file.`;
    setStatus('RECORD', 'Recording armed tracks', 'red');
  }

  function stopRecording() {
    if (!state.isRecording) return;
    state.trackRecorders.forEach(({ recorder }) => {
      if (recorder.state === 'recording') recorder.stop();
    });
    state.isRecording = false;
    $('recordHint').textContent = 'Tracks saved as separate browser downloads.';
    setStatus('RECORD', 'Saved armed tracks', 'red');
  }

  function switchMode(mode) {
    state.mode = mode;
    persistState();
    document.body.classList.remove('mode-player', 'mode-radio', 'mode-record');
    document.body.classList.add(`mode-${mode}`);
    document.querySelectorAll('.mode-tab').forEach((tab) => {
      const active = tab.dataset.mode === mode;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
    });
    $('radioPanel').classList.toggle('hidden', mode !== 'radio');
    $('recordPanel').classList.toggle('hidden', mode !== 'record');
    if (mode === 'player') {
      radioAudio.pause();
      setStatus('PLAYER', playerAudio.paused ? 'Ready' : 'Playback active', 'amber');
      updateMetaForTrack(TRACKS[state.trackIndex]);
      useSource('player');
    } else if (mode === 'radio') {
      playerAudio.pause();
      setStatus('RADIO', radioAudio.paused ? 'Ready' : 'Live stream active', 'green');
      loadStation(state.stationIndex, false);
      useSource('radio');
    } else if (mode === 'record') {
      playerAudio.pause();
      radioAudio.pause();
      setStatus('RECORD', state.isRecording ? 'Recording armed tracks' : 'Arm mic capture', 'red');
    }
  }

  function applyEq() {
    filters.forEach((filter, i) => { filter.gain.value = state.eqValues[i]; });
    drawEqCurve();
    persistState();
  }

  function renderEqControls() {
    const wrap = $('eqSliders');
    wrap.innerHTML = '';
    EQ_FREQUENCIES.forEach((freq, index) => {
      const cell = document.createElement('div');
      cell.className = 'eq-cell';
      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = '-12';
      slider.max = '12';
      slider.step = '0.5';
      slider.value = String(state.eqValues[index]);
      slider.setAttribute('aria-label', `${freq} hertz EQ band`);
      const value = document.createElement('div');
      value.className = 'eq-value';
      value.textContent = `${state.eqValues[index]} dB`;
      slider.addEventListener('input', () => {
        state.eqValues[index] = Number(slider.value);
        value.textContent = `${slider.value} dB`;
        state.preset = 'flat';
        $('presetSelect').value = 'flat';
        applyEq();
      });
      const label = document.createElement('div');
      label.className = 'eq-label';
      label.textContent = freq >= 1000 ? `${(freq/1000).toFixed(freq >= 10000 ? 0 : 1)}k` : `${freq}`;
      cell.append(slider, value, label);
      wrap.appendChild(cell);
    });
  }

  $('presetSelect').addEventListener('change', () => {
    state.preset = $('presetSelect').value;
    state.eqValues = [...PRESETS[state.preset]];
    renderEqControls();
    applyEq();
  });

  function drawEqCurve() {
    const { width, height } = eqCanvas;
    eqCtx.clearRect(0, 0, width, height);
    eqCtx.strokeStyle = 'rgba(255,255,255,0.08)';
    eqCtx.lineWidth = 1;
    for (let i = 0; i <= 6; i++) {
      const y = (height / 6) * i;
      eqCtx.beginPath(); eqCtx.moveTo(0, y); eqCtx.lineTo(width, y); eqCtx.stroke();
    }
    eqCtx.strokeStyle = 'rgba(132,202,255,0.2)';
    [40, 100, 250, 1000, 4000, 10000].forEach((freq) => {
      const x = Math.log10(freq / 20) / Math.log10(16000 / 20) * width;
      eqCtx.beginPath(); eqCtx.moveTo(x, 0); eqCtx.lineTo(x, height); eqCtx.stroke();
    });
    eqCtx.strokeStyle = 'rgba(240,179,91,0.95)';
    eqCtx.lineWidth = 2.2;
    eqCtx.beginPath();
    EQ_FREQUENCIES.forEach((freq, index) => {
      const x = Math.log10(freq / 20) / Math.log10(16000 / 20) * width;
      const y = height / 2 - (state.eqValues[index] / 12) * (height * 0.38);
      if (index === 0) eqCtx.moveTo(x, y); else eqCtx.lineTo(x, y);
    });
    eqCtx.stroke();
  }

  function computeBandMetrics(data) {
    const width = data.length;
    const bucket = (from, to) => {
      const start = Math.max(0, Math.floor(from * width));
      const end = Math.max(start + 1, Math.floor(to * width));
      let total = 0;
      for (let i = start; i < end; i++) total += data[i];
      return total / (end - start || 1);
    };
    return {
      sub: bucket(0.0, 0.05),
      bass: bucket(0.05, 0.14),
      lowMid: bucket(0.14, 0.3),
      mid: bucket(0.3, 0.5),
      presence: bucket(0.5, 0.72),
      air: bucket(0.72, 1.0)
    };
  }

  function setAnalysis(metrics) {
    const low = metrics.sub + metrics.bass + metrics.lowMid;
    const high = metrics.presence + metrics.air;
    const mid = metrics.mid;
    const overall = (low + high + mid) / 6;
    const energy = overall > 165 ? 'High drive' : overall > 95 ? 'Active' : overall > 35 ? 'Gentle' : 'Idle';
    const tilt = low > high * 1.2 ? 'Warm / bass-led' : high > low * 1.2 ? 'Bright / airy' : 'Balanced';
    const maxBand = Object.entries(metrics).sort((a,b) => b[1] - a[1])[0]?.[0] || 'mid';
    const focusMap = {
      sub: 'Sub bass', bass: 'Bass body', lowMid: 'Low mids', mid: 'Midrange', presence: 'Presence', air: 'Air band'
    };
    const crest = Math.abs(metrics.presence - overall) + Math.abs(metrics.bass - overall);
    const dynamics = crest > 90 ? 'Expressive' : crest > 45 ? 'Controlled' : 'Dense';
    const narrative = overall < 25
      ? 'Very low signal. Feed audio or raise level to see character analysis.'
      : `${tilt} with ${focusMap[maxBand].toLowerCase()} emphasis. ${energy.toLowerCase()} energy and ${dynamics.toLowerCase()} transient behaviour.`;

    state.analysis = { tilt, energy, dynamics, focus: focusMap[maxBand], narrative };
    $('analysisTilt').textContent = tilt;
    $('analysisEnergy').textContent = energy;
    $('analysisDynamics').textContent = dynamics;
    $('analysisFocus').textContent = focusMap[maxBand];
    $('analysisNarrative').textContent = narrative;
  }

  function updateTrackMeters() {
    if (!state.trackNodes) return;
    state.trackNodes.forEach((nodeSet, index) => {
      const track = state.multitrack[index];
      const meterData = new Uint8Array(nodeSet.meter.frequencyBinCount);
      nodeSet.meter.getByteFrequencyData(meterData);
      const avg = meterData.reduce((sum, value) => sum + value, 0) / meterData.length;
      const audible = trackIsAudible(track);
      const displayLevel = audible ? Math.round((avg / 255) * 100) : 0;
      track.level = track.arm || audible ? displayLevel : 0;
      nodeSet.output.gain.value = audible ? 1 : 0;
    });
  }

  function animateSpectrum() {
    const width = spectrumCanvas.width;
    const height = spectrumCanvas.height;
    const waveform = new Uint8Array(analyser.fftSize);

    function frame() {
      requestAnimationFrame(frame);
      analyser.getByteFrequencyData(analysisData);
      analyser.getByteTimeDomainData(waveform);
      updateTrackMeters();
      if (state.tracksVisible) renderTrackOverlay();
      setAnalysis(computeBandMetrics(analysisData));

      spectrumCtx.clearRect(0, 0, width, height);
      spectrumCtx.fillStyle = '#090c10';
      spectrumCtx.fillRect(0, 0, width, height);

      spectrumCtx.strokeStyle = 'rgba(255,255,255,0.05)';
      spectrumCtx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        const y = (height / 5) * i;
        spectrumCtx.beginPath(); spectrumCtx.moveTo(0, y); spectrumCtx.lineTo(width, y); spectrumCtx.stroke();
      }

      [60, 120, 250, 500, 1000, 2000, 4000, 8000, 16000].forEach((freq) => {
        const x = Math.log10(freq / 20) / Math.log10(20000 / 20) * width;
        spectrumCtx.strokeStyle = 'rgba(132,202,255,0.12)';
        spectrumCtx.beginPath(); spectrumCtx.moveTo(x, 0); spectrumCtx.lineTo(x, height); spectrumCtx.stroke();
      });

      const barCount = 160;
      const step = Math.max(1, Math.floor(analysisData.length / barCount));
      for (let i = 0; i < barCount; i++) {
        const magnitude = analysisData[i * step] / 255;
        const barHeight = Math.max(2, magnitude * (height - 28));
        const x = i * (width / barCount);
        const gradient = spectrumCtx.createLinearGradient(0, height, 0, height - barHeight);
        gradient.addColorStop(0, '#56d3a1');
        gradient.addColorStop(0.58, '#f0b35b');
        gradient.addColorStop(1, '#fff3da');
        spectrumCtx.fillStyle = gradient;
        spectrumCtx.fillRect(x, height - barHeight, (width / barCount) - 1.5, barHeight);
      }

      spectrumCtx.strokeStyle = 'rgba(132,202,255,0.85)';
      spectrumCtx.lineWidth = 1.5;
      spectrumCtx.beginPath();
      for (let i = 0; i < waveform.length; i += 8) {
        const x = (i / waveform.length) * width;
        const y = (waveform[i] / 255) * 72 + 20;
        if (i === 0) spectrumCtx.moveTo(x, y); else spectrumCtx.lineTo(x, y);
      }
      spectrumCtx.stroke();

      spectrumCtx.fillStyle = 'rgba(235,240,245,0.8)';
      spectrumCtx.font = '14px "Share Tech Mono", monospace';
      spectrumCtx.fillText(`ENERGY ${state.analysis.energy.toUpperCase()}`, 16, height - 16);
      spectrumCtx.fillText(`FOCUS ${state.analysis.focus.toUpperCase()}`, width - 220, height - 16);
    }
    frame();
  }

  function syncTimeUi() {
    const active = state.mode === 'radio' ? radioAudio : playerAudio;
    const duration = active.duration;
    const current = active.currentTime || 0;
    $('timeText').textContent = `${fmtTime(current)} / ${fmtTime(duration)}`;
    const ratio = Number.isFinite(duration) && duration > 0 ? current / duration : 0;
    $('seekBar').value = String(Math.round(ratio * 1000));
  }

  function isTypingTarget(target) {
    if (!target) return false;
    const tag = (target.tagName || '').toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable;
  }

  $('seekBar').addEventListener('input', () => {
    if (!Number.isFinite(playerAudio.duration) || state.mode !== 'player') return;
    playerAudio.currentTime = (Number($('seekBar').value) / 1000) * playerAudio.duration;
  });

  $('volumeKnob').addEventListener('input', () => {
    state.volume = Number($('volumeKnob').value);
    updateVolume();
  });

  $('playBtn').addEventListener('click', () => {
    if (state.mode === 'radio') loadStation(state.stationIndex, true);
    else if (state.mode === 'record') startRecording();
    else playPlayer();
  });
  $('pauseBtn').addEventListener('click', () => {
    if (state.mode === 'radio') radioAudio.pause(); else pausePlayer();
  });
  $('stopBtn').addEventListener('click', stopAll);
  $('prevBtn').addEventListener('click', () => {
    state.trackIndex = (state.trackIndex - 1 + TRACKS.length) % TRACKS.length;
    persistState();
    loadTrack(state.trackIndex, true);
  });
  $('nextBtn').addEventListener('click', () => {
    state.trackIndex = (state.trackIndex + 1) % TRACKS.length;
    persistState();
    loadTrack(state.trackIndex, true);
  });
  $('scanPrevBtn').addEventListener('click', () => {
    state.stationIndex = (state.stationIndex - 1 + state.stations.length) % state.stations.length;
    persistState();
    loadStation(state.stationIndex, true);
  });
  $('scanNextBtn').addEventListener('click', () => {
    state.stationIndex = (state.stationIndex + 1) % state.stations.length;
    persistState();
    loadStation(state.stationIndex, true);
  });
  $('recordBtn').addEventListener('click', startRecording);
  $('recordStopBtn').addEventListener('click', stopRecording);
  $('toggleTracks').addEventListener('click', () => {
    state.tracksVisible = !state.tracksVisible;
    persistState();
    renderTrackOverlay();
  });
  document.querySelectorAll('.mode-tab').forEach((tab) => {
    tab.addEventListener('click', () => switchMode(tab.dataset.mode));
  });

  playerAudio.addEventListener('timeupdate', syncTimeUi);
  radioAudio.addEventListener('timeupdate', syncTimeUi);
  playerAudio.addEventListener('loadedmetadata', syncTimeUi);
  radioAudio.addEventListener('loadedmetadata', syncTimeUi);
  playerAudio.addEventListener('ended', () => {
    state.trackIndex = (state.trackIndex + 1) % TRACKS.length;
    persistState();
    loadTrack(state.trackIndex, true);
  });
  playerAudio.addEventListener('error', () => setStatus('PLAYER', 'Missing or invalid MP3 file', 'red'));
  radioAudio.addEventListener('error', () => {
    $('radioSignal').textContent = 'Error';
    setStatus('RADIO', 'Stream unavailable', 'red');
  });
  radioAudio.addEventListener('stalled', () => $('radioSignal').textContent = 'Stalled');
  radioAudio.addEventListener('waiting', () => $('radioSignal').textContent = 'Buffering');
  radioAudio.addEventListener('playing', () => $('radioSignal').textContent = 'Live');

  document.addEventListener('keydown', (event) => {
    if (isTypingTarget(event.target)) return;
    const key = event.key.toLowerCase();
    if (key === ' ') {
      event.preventDefault();
      if (state.mode === 'player') {
        if (playerAudio.paused) playPlayer(); else pausePlayer();
      } else if (state.mode === 'radio') {
        if (radioAudio.paused) loadStation(state.stationIndex, true); else radioAudio.pause();
      } else if (state.mode === 'record') {
        if (state.isRecording) stopRecording(); else startRecording();
      }
    }
    if (key === 'p') playPlayer();
    if (key === 'r') switchMode('record');
    if (key === 'd') switchMode('radio');
    if (key === 't') {
      state.tracksVisible = !state.tracksVisible;
      persistState();
      renderTrackOverlay();
    }
    if (key === 'arrowright') {
      if (state.mode === 'radio') $('scanNextBtn').click(); else $('nextBtn').click();
    }
    if (key === 'arrowleft') {
      if (state.mode === 'radio') $('scanPrevBtn').click(); else $('prevBtn').click();
    }
  });

  async function initStations() {
    try {
      const response = await fetch('assets/data/stations.json');
      state.stations = await response.json();
      renderStations();
      loadStation(state.stationIndex, false);
    } catch {
      state.stations = [];
      $('stationList').innerHTML = '<div class="section-note">Could not load stations.json</div>';
    }
  }

  function boot() {
    document.body.classList.add(`mode-${state.mode}`);
    $('presetSelect').value = PRESETS[state.preset] ? state.preset : 'flat';
    renderPlaylist();
    renderTrackOverlay();
    renderEqControls();
    drawEqCurve();
    updateVolume();
    loadTrack(state.trackIndex, false);
    initStations();
    animateSpectrum();
    syncTimeUi();
    switchMode(state.mode);
  }

  boot();
})();
