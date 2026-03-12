(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const fmtTime = (seconds) => {
    if (!Number.isFinite(seconds)) return '00:00';
    const s = Math.max(0, Math.floor(seconds));
    const m = Math.floor(s / 60);
    return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  };

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
    { title: 'sample01.mp3', artist: 'Placeholder local track', src: 'assets/audio/sample01.mp3' },
    { title: 'sample02.mp3', artist: 'Placeholder local track', src: 'assets/audio/sample02.mp3' },
    { title: 'sample03.mp3', artist: 'Placeholder local track', src: 'assets/audio/sample03.mp3' }
  ];

  const state = {
    mode: 'player',
    trackIndex: 0,
    stationIndex: 0,
    eqValues: [...PRESETS.flat],
    volume: 72,
    tracksVisible: true,
    mediaRecorder: null,
    recordChunks: [],
    micStream: null,
    currentSourceType: null,
    stations: []
  };

  const playerAudio = $('playerAudio');
  const radioAudio = $('radioAudio');
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const masterGain = audioContext.createGain();
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;

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

  function chainConnect(sourceNode) {
    if (currentMediaNode) {
      try { currentMediaNode.disconnect(); } catch (e) {}
    }
    filters.forEach((f) => { try { f.disconnect(); } catch (e) {} });

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

  function updateVolume() {
    masterGain.gain.value = state.volume / 100;
    $('volumeText').textContent = String(state.volume);
    $('volumeKnob').value = String(state.volume);
  }

  function setStatus(modeLabel, detail, tone) {
    $('statusBadge').textContent = modeLabel;
    $('statusBadge').className = `status-badge ${tone}`;
    $('statusText').textContent = detail;
  }

  function renderPlaylist() {
    $('playlist').innerHTML = '';
    TRACKS.forEach((track, index) => {
      const button = document.createElement('button');
      button.className = `playlist-item ${index === state.trackIndex ? 'active' : ''}`;
      button.innerHTML = `<div class="playlist-title">${track.title}</div><div class="playlist-sub">${track.artist}</div>`;
      button.addEventListener('click', () => {
        state.trackIndex = index;
        loadTrack(index, true);
      });
      $('playlist').appendChild(button);
    });
  }

  function renderStations() {
    $('stationList').innerHTML = '';
    state.stations.forEach((station, index) => {
      const button = document.createElement('button');
      button.className = `station-item ${index === state.stationIndex ? 'active' : ''}`;
      button.innerHTML = `<div class="station-title">${station.name}</div><div class="station-sub">${station.country} · ${station.genre}</div>`;
      button.addEventListener('click', () => {
        state.stationIndex = index;
        if (state.mode === 'radio') loadStation(index, true);
        renderStations();
      });
      $('stationList').appendChild(button);
    });
  }

  function renderTrackOverlay() {
    const overlay = $('overlayTracks');
    overlay.classList.toggle('show', state.tracksVisible);
    overlay.innerHTML = '';
    const names = ['DRUM', 'BASS', 'MUSIC', 'VOICE', 'MASTER'];
    names.forEach((name, idx) => {
      const level = idx === 4 ? 88 : 25 + idx * 14;
      const row = document.createElement('div');
      row.className = 'track-item';
      row.innerHTML = `<div><div class="track-badge">T${idx + 1}</div><div>${name}</div></div><div class="track-meter"><span style="width:${level}%"></span></div><div class="mono">-${(20 - idx * 2).toFixed(1)} dB</div>`;
      overlay.appendChild(row);
    });
  }

  function updateMetaForTrack(track) {
    $('trackTitle').textContent = track.title;
    $('trackArtist').textContent = track.artist;
    $('sourceLabel').textContent = state.mode === 'radio' ? 'Internet radio' : 'Local library';
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
    } catch (err) {
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
    setStatus(state.mode.toUpperCase(), 'Stopped', state.mode === 'record' ? 'red' : state.mode === 'radio' ? 'green' : 'amber');
  }

  async function loadStation(index, autoplay = true) {
    const station = state.stations[index];
    if (!station) return;
    $('radioName').textContent = station.name;
    $('radioGenre').textContent = station.genre;
    $('radioCountry').textContent = station.country;
    $('radioFormat').textContent = station.format;
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
      setStatus('RADIO', 'Live stream active', 'green');
    } catch (err) {
      setStatus('RADIO', 'Stream blocked or unavailable', 'red');
    }
  }

  async function setupMic() {
    if (state.micStream) return true;
    try {
      state.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micSourceNode = audioContext.createMediaStreamSource(state.micStream);
      state.mediaRecorder = new MediaRecorder(state.micStream);
      state.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) state.recordChunks.push(event.data);
      };
      state.mediaRecorder.onstop = () => {
        const blob = new Blob(state.recordChunks, { type: state.mediaRecorder.mimeType || 'audio/webm' });
        state.recordChunks = [];
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `ius-recording-${Date.now()}.webm`;
        anchor.click();
        URL.revokeObjectURL(url);
      };
      return true;
    } catch (err) {
      $('recordHint').textContent = 'Microphone permission denied or unavailable.';
      setStatus('RECORD', 'Mic unavailable', 'red');
      return false;
    }
  }

  async function startRecording() {
    const ok = await setupMic();
    if (!ok) return;
    await safeResume();
    switchMode('record');
    useSource('mic');
    if (state.mediaRecorder && state.mediaRecorder.state !== 'recording') {
      state.mediaRecorder.start();
      $('recordHint').textContent = 'Recording in browser. Stop to download clip.';
      setStatus('RECORD', 'Recording', 'red');
    }
  }

  function stopRecording() {
    if (state.mediaRecorder && state.mediaRecorder.state === 'recording') {
      state.mediaRecorder.stop();
      $('recordHint').textContent = 'Recording saved to download.';
      setStatus('RECORD', 'Saved clip', 'red');
    }
  }

  function switchMode(mode) {
    state.mode = mode;
    document.body.classList.remove('mode-player', 'mode-radio', 'mode-record');
    document.body.classList.add(`mode-${mode}`);
    document.querySelectorAll('.mode-tab').forEach((tab) => {
      tab.classList.toggle('active', tab.dataset.mode === mode);
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
      setStatus('RECORD', 'Arm mic capture', 'red');
    }
  }

  function applyEq() {
    filters.forEach((filter, i) => { filter.gain.value = state.eqValues[i]; });
    drawEqCurve();
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
      const value = document.createElement('div');
      value.className = 'eq-value';
      value.textContent = `${state.eqValues[index]} dB`;
      slider.addEventListener('input', () => {
        state.eqValues[index] = Number(slider.value);
        value.textContent = `${slider.value} dB`;
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
    state.eqValues = [...PRESETS[$('presetSelect').value]];
    renderEqControls();
    applyEq();
  });

  const spectrumCanvas = $('spectrumCanvas');
  const spectrumCtx = spectrumCanvas.getContext('2d');
  const eqCanvas = $('eqCanvas');
  const eqCtx = eqCanvas.getContext('2d');

  function drawEqCurve() {
    const { width, height } = eqCanvas;
    eqCtx.clearRect(0, 0, width, height);
    eqCtx.strokeStyle = 'rgba(255,255,255,0.08)';
    eqCtx.lineWidth = 1;
    for (let i = 0; i <= 6; i++) {
      const y = (height / 6) * i;
      eqCtx.beginPath(); eqCtx.moveTo(0, y); eqCtx.lineTo(width, y); eqCtx.stroke();
    }
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

  function animateSpectrum() {
    const width = spectrumCanvas.width;
    const height = spectrumCanvas.height;
    const data = new Uint8Array(analyser.frequencyBinCount);

    function frame() {
      requestAnimationFrame(frame);
      analyser.getByteFrequencyData(data);
      spectrumCtx.clearRect(0, 0, width, height);
      spectrumCtx.fillStyle = '#090c10';
      spectrumCtx.fillRect(0, 0, width, height);

      spectrumCtx.strokeStyle = 'rgba(255,255,255,0.05)';
      spectrumCtx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        const y = (height / 5) * i;
        spectrumCtx.beginPath(); spectrumCtx.moveTo(0, y); spectrumCtx.lineTo(width, y); spectrumCtx.stroke();
      }

      const barCount = 120;
      const step = Math.floor(data.length / barCount);
      for (let i = 0; i < barCount; i++) {
        const magnitude = data[i * step] / 255;
        const barHeight = Math.max(3, magnitude * (height - 20));
        const x = i * (width / barCount);
        const gradient = spectrumCtx.createLinearGradient(0, height, 0, height - barHeight);
        gradient.addColorStop(0, '#56d3a1');
        gradient.addColorStop(0.6, '#f0b35b');
        gradient.addColorStop(1, '#fff3da');
        spectrumCtx.fillStyle = gradient;
        spectrumCtx.fillRect(x, height - barHeight, (width / barCount) - 2, barHeight);
      }
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
    loadTrack(state.trackIndex, true);
  });
  $('nextBtn').addEventListener('click', () => {
    state.trackIndex = (state.trackIndex + 1) % TRACKS.length;
    loadTrack(state.trackIndex, true);
  });
  $('scanPrevBtn').addEventListener('click', () => {
    state.stationIndex = (state.stationIndex - 1 + state.stations.length) % state.stations.length;
    loadStation(state.stationIndex, true);
  });
  $('scanNextBtn').addEventListener('click', () => {
    state.stationIndex = (state.stationIndex + 1) % state.stations.length;
    loadStation(state.stationIndex, true);
  });
  $('recordBtn').addEventListener('click', startRecording);
  $('recordStopBtn').addEventListener('click', stopRecording);
  $('toggleTracks').addEventListener('click', () => {
    state.tracksVisible = !state.tracksVisible;
    renderTrackOverlay();
  });
  document.querySelectorAll('.mode-tab').forEach((tab) => {
    tab.addEventListener('click', () => switchMode(tab.dataset.mode));
  });

  playerAudio.addEventListener('timeupdate', syncTimeUi);
  radioAudio.addEventListener('timeupdate', syncTimeUi);
  playerAudio.addEventListener('loadedmetadata', syncTimeUi);
  playerAudio.addEventListener('ended', () => {
    state.trackIndex = (state.trackIndex + 1) % TRACKS.length;
    loadTrack(state.trackIndex, true);
  });
  playerAudio.addEventListener('error', () => setStatus('PLAYER', 'Missing or invalid MP3 file', 'red'));
  radioAudio.addEventListener('error', () => setStatus('RADIO', 'Stream unavailable', 'red'));

  async function initStations() {
    try {
      const response = await fetch('assets/data/stations.json');
      state.stations = await response.json();
      renderStations();
      loadStation(state.stationIndex, false);
    } catch (err) {
      state.stations = [];
      $('stationList').innerHTML = '<div class="section-note">Could not load stations.json</div>';
    }
  }

  function boot() {
    document.body.classList.add('mode-player');
    renderPlaylist();
    renderTrackOverlay();
    renderEqControls();
    drawEqCurve();
    updateVolume();
    loadTrack(state.trackIndex, false);
    initStations();
    animateSpectrum();
    syncTimeUi();
  }

  boot();
})();
