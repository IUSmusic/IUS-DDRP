
(function(){
'use strict';
const $ = id => document.getElementById(id);
const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
const fmt = s => {
  if(!Number.isFinite(s) || s < 0) return '--:--';
  return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(Math.floor(s%60)).padStart(2,'0')}`;
};

const audio = $('audioEl');
const waveCanvas = $('waveCanvas');
const waveCtx = waveCanvas.getContext('2d');

const EQ_FREQS = [25,40,63,100,160,250,400,630,1000,1600,2500,4000,6300,10000,16000];
const EQ_BANKS = [
  {name:'LOW', idx:[0,1,2,3,4]},
  {name:'MID', idx:[5,6,7,8,9]},
  {name:'HIGH', idx:[10,11,12,13,14]}
];
const EQ_PRESETS = {
  flat:   [0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0],
  bass:   [4,4,3,2,1, 0,-1,-1,0,0, 0,1,1,0,0],
  vocal:  [-2,-2,-1,0,0, 1,2,3,2,1, 0,-1,-1,0,1],
  air:    [-1,-1,0,0,0, 0,0,0,0,1, 2,3,4,4,3],
  warm:   [2,2,1,1,0, 0,-1,-1,0,0, 1,1,0,-1,-1],
  studio: [0,0,1,1,0, 0,-1,0,1,1, 0,0,1,1,0]
};
const TRACKS = [
  {artist:'IUS', title:'Sample 01', file:'assets/audio/sample01.mp3', quality:'Hi-Res · Demo 01', kbps:'Demo file', source:'MP3 Placeholder · Replace with your master<br>Default Player source', badge:'DEMO'},
  {artist:'IUS', title:'Sample 02', file:'assets/audio/sample02.mp3', quality:'Hi-Res · Demo 02', kbps:'Demo file', source:'MP3 Placeholder · Replace with your master<br>Playlist slot 2', badge:'DEMO'},
  {artist:'IUS', title:'Sample 03', file:'assets/audio/sample03.mp3', quality:'Hi-Res · Demo 03', kbps:'Demo file', source:'MP3 Placeholder · Replace with your master<br>Playlist slot 3', badge:'DEMO'}
];
const DEFAULT_STATIONS = [
  {name:'BBC Radio 6 Music', country:'UK', genre:'Alternative', format:'AAC', url:'https://lstn.lv/bbcradio.m3u8?station=bbc_6music'},
  {name:'Classic FM', country:'UK', genre:'Classical', format:'MP3', url:'https://media-ice.musicradio.com/ClassicFMMP3'},
  {name:'KEXP 90.3 FM', country:'USA', genre:'Indie', format:'AAC', url:'https://kexp.streamguys1.com/kexp128.aac'},
  {name:'NTS 1', country:'UK', genre:'Eclectic', format:'MP3', url:'https://stream-relay-geo.ntslive.net/stream'},
  {name:'SomaFM Groove Salad', country:'USA', genre:'Ambient', format:'MP3', url:'https://ice1.somafm.com/groovesalad-128-mp3'}
];

const S = {
  mode:'player',
  playing:false,
  recording:false,
  volume:72,
  trackIdx:0,
  stationIdx:0,
  eqValues:Array(15).fill(0),
  eqPreset:'flat',
  shuffle:false,
  repeat:false,
  knobAngle:-12,
  showTracks:true,
  stations:[...DEFAULT_STATIONS],
  mediaRecorder:null,
  micStream:null,
  micSource:null,
  monitorGain:null,
  recordChunks:[],
  micActive:false,
  audioReady:false,
};

let audioCtx, mediaSource, analyser, gainNode, filters = [];
let animationFrame = null;
let trackBars = [];
let faderRefs = [];

function ensureAudioGraph(){
  if(audioCtx) return;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  audioCtx = new Ctx();
  mediaSource = audioCtx.createMediaElementSource(audio);
  let previous = mediaSource;
  filters = EQ_FREQS.map((freq, i) => {
    const f = audioCtx.createBiquadFilter();
    f.type = 'peaking';
    f.frequency.value = freq;
    f.Q.value = 1.05;
    f.gain.value = S.eqValues[i] || 0;
    previous.connect(f);
    previous = f;
    return f;
  });
  gainNode = audioCtx.createGain();
  gainNode.gain.value = S.volume / 100;
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = 0.84;
  previous.connect(gainNode);
  gainNode.connect(analyser);
  analyser.connect(audioCtx.destination);
  S.audioReady = true;
}

async function unlockAudio(){
  ensureAudioGraph();
  if(audioCtx && audioCtx.state === 'suspended') {
    try { await audioCtx.resume(); } catch (e) {}
  }
}

function setKnobFromVolume(){
  S.knobAngle = -135 + (S.volume/100)*270;
  $('mainKnob').style.transform = `rotate(${S.knobAngle}deg)`;
}

function updateVolume(v){
  S.volume = clamp(v,0,100);
  if(gainNode) gainNode.gain.value = S.volume / 100;
  if(S.monitorGain) S.monitorGain.gain.value = S.mode === 'record' ? (S.volume/100) : 0;
  setKnobFromVolume();
}

function updateStatus(text='READY', color='#9a9a9a'){
  $('topStatusTxt').textContent = text;
  $('statusLed').style.background = color;
  $('statusLed').style.boxShadow = `0 0 10px ${color}`;
}

function updatePlayButton(){
  $('playIcon').style.display = S.playing ? 'none' : 'block';
  $('pauseIcon').style.display = S.playing ? 'block' : 'none';
  $('btnPlay').classList.toggle('active', S.playing);
}

function updateModeTabs(){
  $('tabPlayer').classList.toggle('active', S.mode==='player');
  $('tabRadio').classList.toggle('active', S.mode==='radio');
  $('tabRecord').classList.toggle('active', S.mode==='record');
}

function updateTrackInfo(){
  if(S.mode === 'radio'){
    const st = S.stations[S.stationIdx] || DEFAULT_STATIONS[0];
    $('infName').textContent = `IUS — ${st.name}`;
    $('infQuality').textContent = `${st.country} · ${st.genre}`;
    $('infKbps').textContent = `${st.format} Stream`;
    $('infBadge').textContent = 'RADIO';
    $('infSource').innerHTML = `Internet Radio · Live stream<br>${st.url}`;
    $('radioBandBig').textContent = 'NET';
    $('radioFreqBig').textContent = `${String(S.stationIdx+1).padStart(2,'0')}`;
    $('radioStnBig').textContent = st.name;
  } else if(S.mode === 'record'){
    $('infName').textContent = `IUS — Record ${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`;
    $('infQuality').textContent = 'Live input · Browser capture';
    $('infKbps').textContent = S.recording ? 'Monitoring active' : 'Ready to record';
    $('infBadge').textContent = S.recording ? 'REC' : 'ARMED';
    $('infSource').innerHTML = 'Microphone input · Web Audio monitor<br>Saved locally as browser recording';
  } else {
    const tr = TRACKS[S.trackIdx];
    $('infName').textContent = `${tr.artist} — ${tr.title}`;
    $('infQuality').textContent = tr.quality;
    $('infKbps').textContent = tr.kbps;
    $('infBadge').textContent = tr.badge || 'HI-RES';
    $('infSource').innerHTML = tr.source;
  }
}

function updateTimeDisplays(){
  if(S.mode === 'record'){
    const sec = S.recording && audioCtx ? audioCtx.currentTime : 0;
    $('infTime').textContent = fmt(sec);
    $('infRemain').textContent = 'LIVE';
    $('progLeft').textContent = fmt(sec);
    $('progRight').textContent = 'LIVE';
    $('progFill').style.width = '0%';
    $('infProgFill').style.width = '0%';
    return;
  }
  const current = audio.currentTime || 0;
  const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
  const progress = duration > 0 ? (current / duration) * 100 : 0;
  $('infTime').textContent = fmt(current);
  $('infRemain').textContent = duration ? '-' + fmt(Math.max(duration-current,0)) : '--:--';
  $('progLeft').textContent = fmt(current);
  $('progRight').textContent = duration ? fmt(duration) : '--:--';
  $('progFill').style.width = `${progress}%`;
  $('infProgFill').style.width = `${progress}%`;
}

function renderTracks(){
  const root = $('dawTracks');
  root.innerHTML = '';
  trackBars = [];
  for(let i=0;i<5;i++){
    const col = document.createElement('div');
    col.className = 'track-col';
    col.innerHTML = `
      <div class="track-bars-wrap">
        <div class="track-bar-bg"></div>
        <div class="track-bar" style="height:${20 + i*6}%"></div>
      </div>
      <div class="track-label">TRK ${i+1}</div>
      <div class="track-btns">
        <button class="trk-btn">REC</button>
        <button class="trk-btn ${i===0?'on ply':''}">PLY</button>
        <button class="trk-btn ${i===0?'on mon':''}">MON</button>
      </div>`;
    root.appendChild(col);
    trackBars.push(col.querySelector('.track-bar'));
  }
}

function renderEq(){
  const root = $('eqBanks');
  root.innerHTML = '';
  faderRefs = [];
  EQ_BANKS.forEach(bank => {
    const bankEl = document.createElement('div');
    bankEl.className = 'eq-bank';
    bankEl.innerHTML = `<div class="eq-bank-name">${bank.name}</div><div class="eq-db-row"><div class="eq-db-col"><span>+10</span><span>0</span><span>-10</span></div><div class="eq-faders-row"></div></div>`;
    const row = bankEl.querySelector('.eq-faders-row');
    bank.idx.forEach(idx => {
      const col = document.createElement('div');
      col.className = 'eq-fader-col';
      col.innerHTML = `
        <div class="fader-wrap" data-idx="${idx}">
          <div class="fader-track"></div>
          <div class="fader-knob"></div>
        </div>
        <div class="fader-freq">${formatFreq(EQ_FREQS[idx])}</div>`;
      row.appendChild(col);
      faderRefs[idx] = {wrap: col.querySelector('.fader-wrap'), knob: col.querySelector('.fader-knob')};
    });
    root.appendChild(bankEl);
  });
  refreshFaders();
  installFaderEvents();
}

function formatFreq(freq){
  if(freq >= 1000) return (freq/1000).toFixed(freq>=10000?0:1).replace('.0','') + 'k';
  return String(freq);
}

function refreshFaders(){
  S.eqValues.forEach((v,i)=>{
    const ref = faderRefs[i];
    if(!ref) return;
    const pct = ((12 - clamp(v,-12,12)) / 24) * 100;
    ref.knob.style.top = `${pct}%`;
  });
}

function installFaderEvents(){
  faderRefs.forEach((ref, idx) => {
    if(!ref) return;
    const applyFromY = clientY => {
      const rect = ref.wrap.getBoundingClientRect();
      const ratio = clamp((clientY - rect.top) / rect.height, 0, 1);
      const gain = Math.round((12 - ratio*24) * 10) / 10;
      S.eqValues[idx] = clamp(gain,-12,12);
      if(filters[idx]) filters[idx].gain.value = S.eqValues[idx];
      refreshFaders();
      syncPresetButtons();
    };
    ref.wrap.addEventListener('pointerdown', e => {
      e.preventDefault();
      applyFromY(e.clientY);
      const move = ev => applyFromY(ev.clientY);
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    });
  });
}

function syncPresetButtons(){
  document.querySelectorAll('.eq-p-btn').forEach(btn=>btn.classList.toggle('active', btn.dataset.p===S.eqPreset));
}

function applyPreset(name){
  const preset = EQ_PRESETS[name];
  if(!preset) return;
  S.eqPreset = name;
  S.eqValues = [...preset];
  S.eqValues.forEach((v,i)=>{ if(filters[i]) filters[i].gain.value = v; });
  refreshFaders();
  syncPresetButtons();
}

function resizeCanvas(){
  const dpr = window.devicePixelRatio || 1;
  const rect = waveCanvas.getBoundingClientRect();
  waveCanvas.width = Math.max(1, Math.floor(rect.width * dpr));
  waveCanvas.height = Math.max(1, Math.floor(rect.height * dpr));
  waveCtx.setTransform(dpr,0,0,dpr,0,0);
}

function drawVisualizer(){
  animationFrame = requestAnimationFrame(drawVisualizer);
  const rect = waveCanvas.getBoundingClientRect();
  if(!rect.width || !rect.height) return;
  const w = rect.width, h = rect.height;
  waveCtx.clearRect(0,0,w,h);
  waveCtx.fillStyle = 'rgba(0,0,0,0.16)';
  waveCtx.fillRect(0,0,w,h);

  for(let x=0;x<w;x+=52){
    waveCtx.strokeStyle = 'rgba(255,255,255,0.055)';
    waveCtx.beginPath(); waveCtx.moveTo(x,0); waveCtx.lineTo(x,h); waveCtx.stroke();
  }
  for(let y=0;y<h;y+=28){
    waveCtx.strokeStyle = 'rgba(255,255,255,0.04)';
    waveCtx.beginPath(); waveCtx.moveTo(0,y); waveCtx.lineTo(w,y); waveCtx.stroke();
  }

  let avg = 0;
  if(analyser){
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    avg = data.reduce((a,b)=>a+b,0)/Math.max(1,data.length);
    waveCtx.beginPath();
    const tData = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(tData);
    tData.forEach((v,i)=>{
      const x = (i/(tData.length-1))*w;
      const y = (v/255)*h;
      if(i===0) waveCtx.moveTo(x,y); else waveCtx.lineTo(x,y);
    });
    waveCtx.strokeStyle = S.mode==='radio' ? 'rgba(255,176,32,.95)' : 'rgba(34,221,255,.95)';
    waveCtx.lineWidth = 2;
    waveCtx.stroke();
  } else {
    const t = Date.now()/500;
    waveCtx.beginPath();
    for(let i=0;i<w;i++){
      const y = h/2 + Math.sin(i/32 + t) * 24 + Math.sin(i/11 + t*1.8) * 6;
      if(i===0) waveCtx.moveTo(i,y); else waveCtx.lineTo(i,y);
    }
    waveCtx.strokeStyle = 'rgba(34,221,255,.85)';
    waveCtx.lineWidth = 2;
    waveCtx.stroke();
    avg = 68;
  }

  trackBars.forEach((bar, idx) => {
    const activity = S.mode==='record' ? (avg/255)*100 : (avg/255)*(60 + idx*5) + (Math.sin(Date.now()/240 + idx)*12 + 18);
    bar.style.height = `${clamp(activity, 8, 92)}%`;
  });
}

function showDisplayState(){
  $('waveWrap').classList.toggle('show', S.mode !== 'player' || !S.showTracks);
  $('radioOverlay').classList.toggle('show', S.mode === 'radio');
  $('recDotOverlay').classList.toggle('show', S.mode === 'record' && S.recording);
  $('dawLabelLeft').textContent = S.mode === 'radio' ? 'LIVE RADIO MONITOR' : 'TRACKS 1–5';
  $('dawLabelRight').textContent = S.mode === 'record' ? 'INPUT MONITOR' : 'DAW MONITOR OVERLAY';
}

function pickTrack(index){
  S.trackIdx = (index + TRACKS.length) % TRACKS.length;
  if(S.mode !== 'player') switchMode('player');
  audio.src = TRACKS[S.trackIdx].file;
  audio.load();
  updateTrackInfo();
  updateTimeDisplays();
  updateStatus('PLAYER READY', '#49f49a');
}

function pickStation(index){
  S.stationIdx = (index + S.stations.length) % S.stations.length;
  const st = S.stations[S.stationIdx];
  audio.src = st.url;
  audio.load();
  updateTrackInfo();
  updateTimeDisplays();
  updateStatus('TUNED', '#ffb020');
}

async function playCurrent(){
  await unlockAudio();
  try {
    await audio.play();
    S.playing = true;
    updatePlayButton();
    updateStatus(S.mode==='radio' ? 'STREAMING' : 'PLAYING', S.mode==='radio' ? '#ffb020' : '#49f49a');
  } catch(err){
    updateStatus('PLAY BLOCKED', '#ff6464');
    console.error(err);
  }
}
function pauseCurrent(){
  audio.pause();
  S.playing = false;
  updatePlayButton();
  updateStatus('PAUSED', '#b5b5b5');
}
function stopCurrent(){
  audio.pause();
  try { audio.currentTime = 0; } catch(e){}
  S.playing = false;
  updatePlayButton();
  updateTimeDisplays();
  updateStatus('STOPPED', '#9a9a9a');
}

async function switchMode(mode){
  S.mode = mode;
  updateModeTabs();
  showDisplayState();
  if(mode === 'player'){
    if(!audio.src || audio.src.includes('/stream')) pickTrack(S.trackIdx);
    updateTrackInfo();
    updateStatus('PLAYER', '#49f49a');
  } else if(mode === 'radio'){
    pickStation(S.stationIdx);
    updateStatus('RADIO', '#ffb020');
  } else if(mode === 'record'){
    pauseCurrent();
    await armRecording();
    updateTrackInfo();
    updateStatus('RECORD READY', '#ff4f4f');
  }
  updateTimeDisplays();
}

async function armRecording(){
  await unlockAudio();
  if(S.micActive) return;
  try {
    S.micStream = await navigator.mediaDevices.getUserMedia({audio:true});
    S.micSource = audioCtx.createMediaStreamSource(S.micStream);
    S.monitorGain = audioCtx.createGain();
    S.monitorGain.gain.value = S.volume/100;
    S.micSource.connect(S.monitorGain);
    S.monitorGain.connect(analyser);
    S.micActive = true;
  } catch(err){
    updateStatus('MIC DENIED', '#ff4f4f');
    console.error(err);
  }
}

function startRecording(){
  if(!S.micStream) return;
  S.recordChunks = [];
  S.mediaRecorder = new MediaRecorder(S.micStream);
  S.mediaRecorder.ondataavailable = e => { if(e.data.size) S.recordChunks.push(e.data); };
  S.mediaRecorder.onstop = saveRecording;
  S.mediaRecorder.start();
  S.recording = true;
  showDisplayState();
  updateTrackInfo();
  updateStatus('RECORDING', '#ff2929');
}
function stopRecording(){
  if(S.mediaRecorder && S.mediaRecorder.state !== 'inactive') S.mediaRecorder.stop();
  S.recording = false;
  showDisplayState();
  updateTrackInfo();
  updateStatus('REC STOPPED', '#ff6464');
}
function saveRecording(){
  if(!S.recordChunks.length) return;
  const blob = new Blob(S.recordChunks, {type: S.recordChunks[0].type || 'audio/webm'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ius-recording-${Date.now()}.webm`;
  a.click();
  setTimeout(()=>URL.revokeObjectURL(url), 1500);
}

function attachEvents(){
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  audio.addEventListener('timeupdate', updateTimeDisplays);
  audio.addEventListener('loadedmetadata', updateTimeDisplays);
  audio.addEventListener('ended', ()=>{
    if(S.repeat) return playCurrent();
    if(S.mode === 'player') nextTrack();
    else pauseCurrent();
  });

  $('btnPlay').addEventListener('click', async ()=>{
    if(S.mode === 'record') return S.recording ? stopRecording() : startRecording();
    if(S.playing) pauseCurrent(); else await playCurrent();
  });
  $('btnStop').addEventListener('click', ()=>{
    if(S.mode === 'record') stopRecording(); else stopCurrent();
  });
  $('btnPrev').addEventListener('click', ()=> S.mode==='radio' ? scanStation(-1) : prevTrack());
  $('btnNext').addEventListener('click', ()=> S.mode==='radio' ? scanStation(1) : nextTrack());
  $('btnScanPrev').addEventListener('click', ()=> scanStation(-1));
  $('btnScanNext').addEventListener('click', ()=> scanStation(1));
  $('btnRadioMode').addEventListener('click', ()=> switchMode('radio'));
  $('tabPlayer').addEventListener('click', ()=> switchMode('player'));
  $('tabRadio').addEventListener('click', ()=> switchMode('radio'));
  $('tabRecord').addEventListener('click', ()=> switchMode('record'));
  $('hwRecBtn').addEventListener('click', ()=> S.mode==='record' && !S.recording ? startRecording() : switchMode('record'));
  $('hwStopBtn').addEventListener('click', ()=> S.mode==='record' ? stopRecording() : stopCurrent());
  $('btnShuffle').addEventListener('click', ()=>{
    S.shuffle = !S.shuffle;
    $('btnShuffle').classList.toggle('active', S.shuffle);
  });
  $('btnRepeat').addEventListener('click', ()=>{
    S.repeat = !S.repeat;
    $('btnRepeat').classList.toggle('active', S.repeat);
  });
  $('progTrack').addEventListener('click', e => {
    if(S.mode === 'record') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = clamp((e.clientX - rect.left)/rect.width,0,1);
    if(Number.isFinite(audio.duration)) audio.currentTime = ratio * audio.duration;
  });
  document.querySelectorAll('.eq-p-btn').forEach(btn => btn.addEventListener('click', ()=> applyPreset(btn.dataset.p)));

  const knob = $('mainKnob');
  knob.addEventListener('wheel', e => { e.preventDefault(); updateVolume(S.volume - Math.sign(e.deltaY)*4); }, {passive:false});
  knob.addEventListener('pointerdown', e => {
    e.preventDefault();
    const startY = e.clientY;
    const startVol = S.volume;
    const move = ev => updateVolume(startVol - (ev.clientY - startY) / 1.8);
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  });

  document.addEventListener('keydown', async e => {
    if(e.code === 'Space'){ e.preventDefault(); if(S.mode==='record'){ S.recording ? stopRecording() : startRecording(); } else { S.playing ? pauseCurrent() : await playCurrent(); } }
    if(e.key.toLowerCase() === 'p') switchMode('player');
    if(e.key.toLowerCase() === 'r') switchMode('radio');
    if(e.key.toLowerCase() === 'd') switchMode('record');
    if(e.key === 'ArrowRight') S.mode==='radio' ? scanStation(1) : nextTrack();
    if(e.key === 'ArrowLeft') S.mode==='radio' ? scanStation(-1) : prevTrack();
    if(e.key.toLowerCase() === 't'){ S.showTracks = !S.showTracks; $('dawTracks').style.opacity = S.showTracks ? '1' : '.12'; showDisplayState(); }
  });
}

function prevTrack(){
  if(S.shuffle){
    pickTrack(Math.floor(Math.random()*TRACKS.length));
  } else pickTrack(S.trackIdx - 1);
  if(S.playing) playCurrent();
}
function nextTrack(){
  if(S.shuffle){
    pickTrack(Math.floor(Math.random()*TRACKS.length));
  } else pickTrack(S.trackIdx + 1);
  if(S.playing) playCurrent();
}
function scanStation(delta){
  pickStation(S.stationIdx + delta);
  if(S.playing || S.mode==='radio') playCurrent();
}

async function loadStations(){
  try {
    const res = await fetch('assets/data/stations.json');
    if(res.ok){
      const data = await res.json();
      if(Array.isArray(data) && data.length) S.stations = data;
    }
  } catch(err){ console.warn('Using bundled station defaults', err); }
}

async function boot(){
  renderTracks();
  renderEq();
  attachEvents();
  await loadStations();
  updateVolume(S.volume);
  pickTrack(0);
  applyPreset('flat');
  showDisplayState();
  updatePlayButton();
  updateTimeDisplays();
  updateTrackInfo();
  updateStatus('READY', '#b8b8b8');
  drawVisualizer();

  ['ledA','ledB','ledC'].forEach((id,i)=>setTimeout(()=>$(id).className='led a',120*(i+1)));
  setTimeout(()=>['ledA','ledB','ledC'].forEach(id=>$(id).className='led'),900);
}

boot();
})();
