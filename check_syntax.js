
(function(){
'use strict';
const $ = id => document.getElementById(id);
const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
const fmt = s => `${String(Math.floor(Math.max(0,s||0)/60)).padStart(2,'0')}:${String(Math.floor(Math.max(0,s||0)%60)).padStart(2,'0')}`;
const STORAGE_KEY = 'ius-drrp-official-ui-state-v1';
const EQ_PRE = {
  flat:   Array(15).fill(0),
  bass:   [7,5,3,1,-1,  5,3,1,0,-1,  3,1,0,0,-1],
  vocal:  [-2,0,4,5,2,  -2,1,5,6,3,  -2,0,4,5,2],
  air:    [0,0,1,3,7,   0,0,1,3,8,   0,1,2,5,9],
  warm:   [4,3,2,0,-2,  4,3,2,0,-2,  3,2,1,0,-2],
  studio: [2,1,0,2,3,   0,0,0,0,0,  -1,0,1,3,5],
};
const EQ_FREQS = ['400','1k','2.5k','6.3k','16k'];
const EQ_BANKS = ['LOW','MID','HIGH'];
const TRACKS = [
  {artist:'IUS', title:'Track 01', dur:243, fmt:'Hi-Res', spec:'49/32', kbps:'2304kbps', source:'FLAC · 49-bit / 32kHz<br>Local Player Bus'},
  {artist:'IUS', title:'Prototype Alpha', dur:318, fmt:'FLAC', spec:'24/48', kbps:'1152kbps', source:'FLAC · 24-bit / 48kHz<br>Local Player Bus'},
  {artist:'Field Session', title:'Morning Recording', dur:412, fmt:'FLAC', spec:'24/48', kbps:'1152kbps', source:'Field capture · 24-bit / 48kHz<br>Local Player Bus'},
  {artist:'IUS', title:'Track 04', dur:3817, fmt:'Hi-Res', spec:'49/32', kbps:'2304kbps', source:'Hi-Res master bus<br>Playback transport'},
  {artist:'Aux Line In', title:'Session A — Take 2', dur:187, fmt:'FLAC', spec:'16/44', kbps:'1411kbps', source:'Aux capture archive<br>Playback transport'},
  {artist:'IUS', title:'Headphone Test', dur:527, fmt:'LOSSLESS', spec:'32/96', kbps:'4608kbps', source:'Lossless validation set<br>Playback transport'},
  {artist:'Studio Input', title:'Live Capture 01', dur:892, fmt:'FLAC', spec:'24/96', kbps:'2304kbps', source:'Studio input print<br>Playback transport'}
];
const DEFAULT_RADIO = [
  {name:'BBC Radio 6 Music', country:'UK', genre:'Alternative', format:'AAC', url:'https://lstn.lv/bbcradio.m3u8?station=bbc_6music'},
  {name:'Classic FM', country:'UK', genre:'Classical', format:'MP3', url:'https://media-ice.musicradio.com/ClassicFMMP3'},
  {name:'KEXP 90.3 FM', country:'USA', genre:'Indie', format:'AAC', url:'https://kexp.streamguys1.com/kexp128.aac'},
  {name:'NTS 1', country:'UK', genre:'Eclectic', format:'MP3', url:'https://stream-relay-geo.ntslive.net/stream'},
  {name:'SomaFM Groove Salad', country:'USA', genre:'Ambient', format:'MP3', url:'https://ice1.somafm.com/groovesalad-128-mp3'}
];
const TRACK_FILTERS = [
  {name:'TRK 1', band:[30,120]},
  {name:'TRK 2', band:[80,260]},
  {name:'TRK 3', band:[220,1200]},
  {name:'TRK 4', band:[1000,5200]},
  {name:'TRK 5', band:[5200,16000], master:true}
];
function loadState(){ try { return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}'); } catch { return {}; } }
const persisted = loadState();
const S = {
  mode: persisted.mode || 'player',
  playing:false,
  recording:false,
  volume: Number.isFinite(persisted.volume) ? clamp(persisted.volume,0,100) : 72,
  trackIdx: Number.isInteger(persisted.trackIdx) ? clamp(persisted.trackIdx,0,TRACKS.length-1) : 3,
  elapsed: 0,
  recElapsed:0,
  recCount: Number.isInteger(persisted.recCount) ? persisted.recCount : 1,
  radioPreset: Number.isInteger(persisted.radioPreset) ? persisted.radioPreset : 0,
  showTracks: persisted.showTracks !== false,
  eqValues: Array.isArray(persisted.eqValues) && persisted.eqValues.length===15 ? persisted.eqValues.slice(0,15) : Array(15).fill(0),
  eqPreset: persisted.eqPreset || 'flat',
  knobAngle:-10,
  scanAnim:null,
  trackTick:null,
  radioClock:null,
  stations: [],
  radioActive:false,
  radioError:false,
  audioReady:false,
  mediaRecorder:null,
  micStream:null,
  micSource:null,
  monitorGain:null,
  sourceType:'player',
  usingFallbackAnalysis:false,
  wPhase:0,
  wPhaseRec:0,
  trackButtons: Array.from({length:5}, (_,i)=>({
    rec: !!persisted.trackButtons?.[i]?.rec,
    ply: persisted.trackButtons?.[i]?.ply !== false,
    mon: persisted.trackButtons?.[i]?.mon !== false
  })),
  trackRecorders:[]
};
function persist(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    mode:S.mode, volume:S.volume, trackIdx:S.trackIdx, recCount:S.recCount, radioPreset:S.radioPreset,
    showTracks:S.showTracks, eqValues:S.eqValues, eqPreset:S.eqPreset, trackButtons:S.trackButtons
  }));
}

// Hidden media elements only for software engine
const playerAudio = document.createElement('audio');
playerAudio.id = 'playerAudio'; playerAudio.preload = 'none'; playerAudio.crossOrigin = 'anonymous'; playerAudio.style.display='none';
const radioAudio = document.createElement('audio');
radioAudio.id = 'radioAudio'; radioAudio.preload = 'none'; radioAudio.crossOrigin = 'anonymous'; radioAudio.style.display='none';
document.body.append(playerAudio, radioAudio);

// Accessibility without altering visible UI
$('mainKnob').setAttribute('role','slider');
$('mainKnob').setAttribute('aria-label','Master volume');
$('mainKnob').setAttribute('aria-valuemin','0');
$('mainKnob').setAttribute('aria-valuemax','100');
$('dawDisplay').setAttribute('role','img');
$('dawDisplay').setAttribute('aria-label','Official IUS DRRP monitor display');
[['btnPrev','Previous'],['btnPlay','Play or pause'],['btnStop','Stop'],['btnNext','Next'],['btnRadioMode','Radio mode'],['btnShuffle','Shuffle'],['btnRepeat','Repeat'],['btnScanPrev','Scan previous'],['btnScanNext','Scan next'],['hwRecBtn','Record'],['hwStopBtn','Stop record'],['tabPlayer','Player mode'],['tabRadio','Radio mode'],['tabRecord','Record mode']].forEach(([id,label])=>$(id).setAttribute('aria-label',label));

const dawTracks = $('dawTracks');
const trackBarEls = [];
const trackBtnEls = [];
(function buildTracks(){
  for(let i=0;i<5;i++){
    const col = document.createElement('div');
    col.className = 'track-col';
    col.innerHTML = `
      <div class="track-label">TRK ${i+1}</div>
      <div class="track-bars-wrap" id="tbw${i}">
        <div class="track-bar-bg"></div>
        <div class="track-bar" id="tbar${i}" style="height:0%"></div>
      </div>
      <div class="track-btns">
        <button class="trk-btn ${S.trackButtons[i].rec?'on':''}" data-ti="${i}" data-act="rec" aria-pressed="${S.trackButtons[i].rec}">REC</button>
        <button class="trk-btn ${S.trackButtons[i].ply?'on ply':''}" data-ti="${i}" data-act="ply" aria-pressed="${S.trackButtons[i].ply}">PLY</button>
        <button class="trk-btn ${S.trackButtons[i].mon?'on mon':''}" data-ti="${i}" data-act="mon" aria-pressed="${S.trackButtons[i].mon}">MON</button>
      </div>`;
    dawTracks.appendChild(col);
    trackBarEls.push(col.querySelector('#tbar'+i));
    trackBtnEls.push({
      rec: col.querySelector('[data-act="rec"]'),
      ply: col.querySelector('[data-act="ply"]'),
      mon: col.querySelector('[data-act="mon"]')
    });
  }
  document.querySelectorAll('.trk-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const ti = +btn.dataset.ti; const act = btn.dataset.act;
      const state = S.trackButtons[ti];
      state[act] = !state[act];
      if(TRACK_FILTERS[ti].master && act==='rec' && !state[act]) state[act] = true;
      syncTrackButtons();
      persist();
      updateMonitorLabels();
    });
  });
  if(TRACK_FILTERS[4].master) S.trackButtons[4].rec = true;
  syncTrackButtons();
})();
function syncTrackButtons(){
  S.trackButtons.forEach((st,i)=>{
    ['rec','ply','mon'].forEach(act=>{
      const btn = trackBtnEls[i][act];
      btn.classList.toggle('on', !!st[act]);
      btn.classList.toggle('ply', act==='ply' && !!st[act]);
      btn.classList.toggle('mon', act==='mon' && !!st[act]);
      btn.setAttribute('aria-pressed', String(!!st[act]));
    });
  });
}

// EQ build preserved
const eqBanksEl = $('eqBanks');
const faderKnobs = [];
(function buildEQ(){
  EQ_BANKS.forEach((bankName,b)=>{
    const bank = document.createElement('div');
    bank.className = 'eq-bank';
    const dbCol = `<div class="eq-db-col"><span>+10</span><span>&nbsp;0</span><span>-10</span></div>`;
    let fadersHTML = '';
    for(let f=0; f<5; f++){
      const idx=b*5+f;
      fadersHTML += `
        <div class="eq-fader-col">
          <div class="fader-wrap" data-idx="${idx}">
            <div class="fader-track" id="ft${idx}">
              <div class="fader-knob" id="fk${idx}"></div>
            </div>
          </div>
          <div class="fader-freq">${EQ_FREQS[f]}</div>
        </div>`;
    }
    bank.innerHTML = `<div class="eq-bank-name">${bankName}</div>
      <div class="eq-db-row">${dbCol}<div class="eq-faders-row">${fadersHTML}</div></div>`;
    eqBanksEl.appendChild(bank);
    for(let f=0;f<5;f++) faderKnobs.push($('fk'+(b*5+f)));
  });
  const presetRow = document.createElement('div');
  presetRow.className = 'eq-preset-row';
  presetRow.style.cssText = 'display:flex;gap:6px;justify-content:flex-end;padding:8px 0 0;flex-wrap:wrap';
  ['flat','bass','vocal','air','warm','studio'].forEach(name=>{
    const b = document.createElement('button');
    b.className = 'eq-p-btn';
    b.dataset.p = name;
    b.textContent = name.toUpperCase();
    b.style.cssText = 'border:1px solid rgba(0,0,0,.18);background:linear-gradient(180deg,#d8d9da,#bfc0c2);border-radius:12px;padding:4px 8px;font:600 10px var(--f-ui);cursor:pointer';
    b.addEventListener('click',()=>applyPreset(name));
    presetRow.appendChild(b);
  });
  eqBanksEl.parentElement.appendChild(presetRow);
  initFaderDrag();
  setTimeout(refreshFaders,80);
})();
function setFader(idx, dB, skipPersist){
  S.eqValues[idx] = clamp(dB,-10,10);
  const pct = (10 - S.eqValues[idx]) / 20;
  const track = $('ft'+idx);
  if(!track) return;
  const h = track.offsetHeight || 86;
  const knob = faderKnobs[idx];
  if(knob) knob.style.top = (pct*h) + 'px';
  if(filters[idx]) filters[idx].gain.value = S.eqValues[idx];
  if(!skipPersist) persist();
}
function refreshFaders(){ for(let i=0;i<15;i++) setFader(i,S.eqValues[i],true); }
new ResizeObserver(refreshFaders).observe(eqBanksEl);
function applyPreset(name){
  S.eqPreset = name;
  (EQ_PRE[name] || EQ_PRE.flat).forEach((v,i)=>setFader(i,v,true));
  document.querySelectorAll('.eq-p-btn').forEach(b=>{
    b.classList.toggle('active', b.dataset.p===name);
    b.style.boxShadow = b.dataset.p===name ? 'inset 0 0 0 1px rgba(255,176,32,.5)' : 'none';
    b.style.color = b.dataset.p===name ? '#111' : '#222';
  });
  persist();
}
function initFaderDrag(){
  document.querySelectorAll('.fader-wrap').forEach(wrap=>{
    const idx=+wrap.dataset.idx; let dragging=false,startY=0,startDB=0;
    const down=(y)=>{dragging=true;startY=y;startDB=S.eqValues[idx];};
    const move=(y)=>{ if(!dragging) return; setFader(idx, clamp(startDB+(startY-y)/4,-10,10)); };
    const up=()=>{dragging=false;};
    wrap.addEventListener('mousedown', e=>{down(e.clientY); e.preventDefault();});
    document.addEventListener('mousemove', e=>move(e.clientY));
    document.addEventListener('mouseup', up);
    wrap.addEventListener('touchstart', e=>{down(e.touches[0].clientY); e.preventDefault();},{passive:false});
    document.addEventListener('touchmove', e=>{if(dragging){move(e.touches[0].clientY); e.preventDefault();}},{passive:false});
    document.addEventListener('touchend', up);
    wrap.addEventListener('click', e=>{
      const rect=wrap.querySelector('.fader-track').getBoundingClientRect();
      setFader(idx, clamp(10-(e.clientY-rect.top)/rect.height*20,-10,10));
    });
  });
}

const AudioContextRef = window.AudioContext || window.webkitAudioContext;
let audioCtx = null, analyser = null, gainNode = null, filters = [], micSourceNode = null, radioSourceNode = null, playerSourceNode = null, currentMediaNode = null, micMonitorGain = null;
let trackNodeSets = [];
const waveCanvas = $('waveCanvas');
const wCtx = waveCanvas.getContext('2d');
let _wW=600,_wH=280, freqData=null, timeData=null;
function resizeWave(){
  const dpr = window.devicePixelRatio||1;
  const disp = $('dawDisplay');
  const w = disp.clientWidth, h = disp.clientHeight;
  waveCanvas.width = w*dpr; waveCanvas.height = h*dpr;
  wCtx.setTransform(1,0,0,1,0,0); wCtx.scale(dpr,dpr);
  _wW=w; _wH=h;
}
new ResizeObserver(resizeWave).observe($('dawDisplay'));
setTimeout(resizeWave,60);
function ensureAudio(){
  if(audioCtx) return;
  audioCtx = new AudioContextRef();
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = 0.84;
  gainNode = audioCtx.createGain();
  gainNode.gain.value = S.volume / 100;
  filters = Array.from({length:15}, (_,i)=>{
    const f = audioCtx.createBiquadFilter();
    f.type = 'peaking';
    f.frequency.value = [25,40,63,100,160,250,400,630,1000,1600,2500,4000,6300,10000,16000][i];
    f.Q.value = 1.05;
    f.gain.value = S.eqValues[i] || 0;
    return f;
  });
  freqData = new Uint8Array(analyser.frequencyBinCount);
  timeData = new Uint8Array(analyser.fftSize);
}
async function safeResume(){ ensureAudio(); if(audioCtx && audioCtx.state==='suspended') { try { await audioCtx.resume(); } catch {} } }
function disconnectNode(node){ try { node.disconnect(); } catch {} }
function chainConnect(sourceNode){
  if(!sourceNode) return;
  ensureAudio();
  if(currentMediaNode) disconnectNode(currentMediaNode);
  filters.forEach(disconnectNode); disconnectNode(analyser); disconnectNode(gainNode);
  currentMediaNode = sourceNode;
  let node = sourceNode;
  filters.forEach(f=>{ node.connect(f); node = f; });
  node.connect(analyser); analyser.connect(gainNode); gainNode.connect(audioCtx.destination);
}
function ensureRadioNode(){
  ensureAudio();
  if(radioSourceNode) return radioSourceNode;
  try {
    radioSourceNode = audioCtx.createMediaElementSource(radioAudio);
    S.usingFallbackAnalysis = false;
    return radioSourceNode;
  } catch(e) {
    S.usingFallbackAnalysis = true;
    return null;
  }
}
function ensurePlayerNode(){
  ensureAudio();
  if(playerSourceNode) return playerSourceNode;
  try {
    playerSourceNode = audioCtx.createMediaElementSource(playerAudio);
    return playerSourceNode;
  } catch { return null; }
}
function useSource(type){
  S.sourceType = type;
  if(type==='radio'){
    const node = ensureRadioNode();
    if(node) chainConnect(node);
  } else if(type==='mic'){
    if(micSourceNode) chainConnect(micSourceNode);
  } else if(type==='player'){
    const node = ensurePlayerNode();
    if(node) chainConnect(node);
  }
}
function setKnobAngleFromVolume(){
  S.knobAngle = -150 + (S.volume/100)*300;
  $('mainKnob').style.transform = `rotate(${S.knobAngle}deg)`;
  $('mainKnob').setAttribute('aria-valuenow', String(S.volume));
}
function updateVolume(v){
  S.volume = clamp(Math.round(v),0,100);
  if(gainNode) gainNode.gain.value = S.volume/100;
  if(micMonitorGain) micMonitorGain.gain.value = S.volume/100;
  setKnobAngleFromVolume();
  persist();
}
(function initKnob(){
  const knob = $('mainKnob'); let dragging=false,startY=0,startV=0;
  const moveTo = (clientY)=> updateVolume(startV + (startY-clientY)*0.45);
  knob.addEventListener('mousedown', e=>{dragging=true;startY=e.clientY;startV=S.volume;document.body.style.cursor='ns-resize';e.preventDefault();});
  document.addEventListener('mousemove', e=>{if(dragging) moveTo(e.clientY);});
  document.addEventListener('mouseup', ()=>{dragging=false; document.body.style.cursor='';});
  knob.addEventListener('touchstart', e=>{dragging=true;startY=e.touches[0].clientY;startV=S.volume; e.preventDefault();},{passive:false});
  document.addEventListener('touchmove', e=>{if(dragging){moveTo(e.touches[0].clientY);e.preventDefault();}},{passive:false});
  document.addEventListener('touchend', ()=>{dragging=false;});
  knob.addEventListener('wheel', e=>{updateVolume(S.volume - e.deltaY*0.05); e.preventDefault();},{passive:false});
  setKnobAngleFromVolume();
})();

function updateTopStatus(txt, ledType){
  $('topStatusTxt').textContent=txt;
  const sl = $('statusLed'); sl.className='status-led';
  if(['PLAYING','LIVE','RECORDING'].includes(txt)) sl.classList.add('on');
  ['ledA','ledB','ledC'].forEach(id=>$(id).className='led');
  if(ledType==='g') $('ledA').className='led g';
  if(ledType==='a') $('ledA').className='led a';
  if(ledType==='r') $('ledA').className='led r';
  $('ledB').className = 'led' + (ledType ? '' : ' a');
}
function updateMonitorLabels(){
  const armed = S.trackButtons.filter(t=>t.rec).length;
  const mon = S.trackButtons.filter(t=>t.mon).length;
  if(S.mode==='record') $('dawLabelRight').textContent = `LIVE MONITOR · ${armed} ARM · ${mon} MON`;
  if(S.mode==='player') $('dawLabelRight').textContent = S.showTracks ? `DAW MONITOR OVERLAY · ${armed} ARM` : 'SOFTWARE ANALYSIS';
  if(S.mode==='radio') $('dawLabelRight').textContent = S.radioError ? 'STREAM ERROR' : (S.radioActive ? 'LIVE STREAM ANALYSIS' : 'STREAM READY');
}
function setTrackOverlay(show){
  S.showTracks = show;
  $('dawTracks').style.opacity = show ? '1' : '0';
  $('dawTracks').style.pointerEvents = show ? '' : 'none';
  $('waveWrap').classList.toggle('show', !show || S.mode!=='player');
  persist();
  updateMonitorLabels();
}

function loadTrack(idx){
  S.trackIdx = ((idx%TRACKS.length)+TRACKS.length)%TRACKS.length;
  S.elapsed = 0;
  const t = TRACKS[S.trackIdx];
  $('infName').textContent = `${t.artist} — ${t.title}`;
  $('infQuality').textContent = `${t.fmt} · ${t.spec}`;
  $('infKbps').textContent = t.kbps;
  $('infBadge').textContent = t.fmt.toUpperCase();
  $('infBadge').className = 'inf-badge';
  $('infSource').innerHTML = t.source;
  updatePlayerUI(); persist();
}
function updatePlayerUI(){
  const t = TRACKS[S.trackIdx];
  const pct = (S.elapsed / t.dur) * 100;
  $('infTime').textContent = fmt(S.elapsed);
  $('infRemain').textContent = `-${fmt(t.dur-S.elapsed)}`;
  $('infProgFill').style.width = pct + '%';
  $('progFill').style.width = pct + '%';
  $('progLeft').textContent = fmt(S.elapsed);
  $('progRight').textContent = fmt(t.dur);
}
function play(){
  if(S.mode!=='player' || S.playing) return;
  S.playing = true;
  $('playIcon').style.display='none'; $('pauseIcon').style.display=''; $('btnPlay').classList.add('playing');
  updateTopStatus('PLAYING','g');
  clearInterval(S.trackTick);
  S.trackTick = setInterval(()=>{
    S.elapsed++;
    const dur = TRACKS[S.trackIdx].dur;
    if(S.elapsed >= dur){ S.elapsed = 0; loadTrack(S.trackIdx+1); }
    updatePlayerUI();
  },1000);
}
function pause(){
  if(S.mode==='radio') { radioAudio.paused ? playRadio() : pauseRadio(); return; }
  if(!S.playing) return;
  S.playing = false;
  $('playIcon').style.display=''; $('pauseIcon').style.display='none'; $('btnPlay').classList.remove('playing');
  clearInterval(S.trackTick); S.trackTick = null;
  updateTopStatus('PAUSED','a');
}
function stop(){
  if(S.mode==='radio'){ stopRadio(); return; }
  S.playing = false;
  clearInterval(S.trackTick); S.trackTick = null;
  S.elapsed = 0;
  $('playIcon').style.display=''; $('pauseIcon').style.display='none'; $('btnPlay').classList.remove('playing');
  updatePlayerUI();
  updateTopStatus('STOPPED','');
}
async function loadStations(){
  try {
    const res = await fetch('data/stations.json');
    const json = await res.json();
    S.stations = Array.isArray(json) && json.length ? json : DEFAULT_RADIO;
  } catch {
    S.stations = DEFAULT_RADIO;
  }
  S.radioPreset = clamp(S.radioPreset,0,S.stations.length-1);
}
function stationFreq(i){ return (88.1 + i*2.9).toFixed(1); }
function loadPreset(idx, autoPlay){
  if(!S.stations.length) return;
  S.radioPreset = ((idx%S.stations.length)+S.stations.length)%S.stations.length;
  const st = S.stations[S.radioPreset];
  $('radioFreqBig').textContent = stationFreq(S.radioPreset);
  $('radioBandBig').textContent = 'NET';
  $('radioStnBig').textContent = st.name;
  $('infName').textContent = st.name;
  $('infQuality').textContent = `${st.genre} · ${st.country}`;
  $('infKbps').textContent = `${st.format} · Dedicated stream`;
  $('infBadge').textContent = 'RADIO'; $('infBadge').className = 'inf-badge radio';
  $('infTime').textContent = '--:--'; $('infRemain').textContent = 'Live'; $('infProgFill').style.width='0%';
  $('progLeft').textContent = stationFreq(S.radioPreset); $('progRight').textContent = 'LIVE';
  $('infSource').innerHTML = `${st.format} internet radio stream<br>${st.url.replace(/^https?:\/\//,'')}`;
  radioAudio.src = st.url;
  S.radioError = false;
  persist();
  if(autoPlay && S.mode==='radio') playRadio();
}
async function playRadio(){
  await safeResume();
  useSource('radio');
  try {
    await radioAudio.play();
    S.radioActive = true; S.playing = true; S.radioError = false;
    $('playIcon').style.display='none'; $('pauseIcon').style.display=''; $('btnPlay').classList.add('playing');
    updateTopStatus('LIVE','g'); updateMonitorLabels();
  } catch {
    S.radioActive = false; S.playing = false; S.radioError = true;
    updateTopStatus('BLOCKED','r'); updateMonitorLabels();
  }
}
function pauseRadio(){ radioAudio.pause(); S.radioActive=false; S.playing=false; $('playIcon').style.display=''; $('pauseIcon').style.display='none'; $('btnPlay').classList.remove('playing'); updateTopStatus('PAUSED','a'); updateMonitorLabels(); }
function stopRadio(){ radioAudio.pause(); radioAudio.currentTime = 0; S.radioActive=false; S.playing=false; $('playIcon').style.display=''; $('pauseIcon').style.display='none'; $('btnPlay').classList.remove('playing'); updateTopStatus('STOPPED',''); updateMonitorLabels(); }
function radioScanTo(dir){
  if(!S.stations.length || S.scanAnim) return;
  const from = Number(stationFreq(S.radioPreset));
  const toIdx = ((S.radioPreset+dir+S.stations.length)%S.stations.length);
  const toFreq = Number(stationFreq(toIdx));
  let step=0, steps=25;
  S.scanAnim = setInterval(()=>{
    step++;
    const t=step/steps, e=t<.5?2*t*t:-1+(4-2*t)*t;
    const f=from+(toFreq-from)*e;
    $('radioFreqBig').textContent=f.toFixed(1); $('progLeft').textContent=f.toFixed(1);
    if(step>=steps){ clearInterval(S.scanAnim); S.scanAnim=null; loadPreset(toIdx, S.radioActive || S.mode==='radio'); }
  },28);
}

async function setupMic(){
  ensureAudio();
  if(S.micStream) return true;
  try {
    S.micStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation:false, noiseSuppression:false, autoGainControl:false } });
    micSourceNode = audioCtx.createMediaStreamSource(S.micStream);
    createTrackProcessing(micSourceNode);
    return true;
  } catch {
    updateTopStatus('MIC BLOCK','r');
    $('infSource').innerHTML = 'Microphone access denied or unavailable<br>Check browser permissions';
    return false;
  }
}
function createTrackProcessing(sourceNode){
  trackNodeSets = TRACK_FILTERS.map((cfg,i)=>{
    const hp = audioCtx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value = cfg.band[0]; hp.Q.value=.707;
    const lp = audioCtx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value = cfg.band[1]; lp.Q.value=.707;
    const gain = audioCtx.createGain(); gain.gain.value = 1;
    const analyserNode = audioCtx.createAnalyser(); analyserNode.fftSize = 512; analyserNode.smoothingTimeConstant=.75;
    const destination = audioCtx.createMediaStreamDestination();
    sourceNode.connect(hp); hp.connect(lp); lp.connect(gain); gain.connect(analyserNode); analyserNode.connect(destination);
    return {hp,lp,gain,analyser:analyserNode,destination,data:new Uint8Array(analyserNode.frequencyBinCount)};
  });
}
function armedTrackIndices(){ return S.trackButtons.map((t,i)=>t.rec?i:-1).filter(i=>i>=0); }
function startRecording(){
  if(S.recording) return;
  const armed = armedTrackIndices();
  if(!armed.length){ updateTopStatus('NO ARM','r'); return; }
  const mimeType = ['audio/webm;codecs=opus','audio/webm','audio/mp4'].find(t=>window.MediaRecorder && MediaRecorder.isTypeSupported(t)) || '';
  S.trackRecorders = armed.map(i=>{
    const chunks=[]; const rec = new MediaRecorder(trackNodeSets[i].destination.stream, mimeType ? {mimeType} : undefined);
    rec.ondataavailable = e=>{ if(e.data.size>0) chunks.push(e.data); };
    rec.onstop = ()=>{
      const blob = new Blob(chunks, { type: rec.mimeType || mimeType || 'audio/webm' });
      const url = URL.createObjectURL(blob);
      const ext = (rec.mimeType || mimeType || 'audio/webm').includes('mp4') ? 'm4a' : 'webm';
      const a = document.createElement('a'); a.href=url; a.download=`IUS-DRRP-TRK${i+1}-${Date.now()}.${ext}`; a.click();
      setTimeout(()=>URL.revokeObjectURL(url), 1000);
    };
    return rec;
  });
  S.trackRecorders.forEach(r=>r.start());
  S.recording = true; S.recElapsed = 0; $('recDotOverlay').classList.add('show'); $('hwRecBtn').classList.add('armed');
  updateTopStatus('RECORDING','r'); updateMonitorLabels();
}
function stopRecording(){
  if(!S.recording) return;
  S.trackRecorders.forEach(r=>{ if(r.state==='recording') r.stop(); });
  S.trackRecorders=[]; S.recording=false; $('recDotOverlay').classList.remove('show'); $('hwRecBtn').classList.remove('armed'); S.recCount++;
  updateTopStatus('STANDBY',''); persist();
}

function switchMode(mode){
  clearInterval(S.radioClock); S.radioClock=null;
  if(S.mode==='player') clearInterval(S.trackTick);
  if(S.mode==='radio') radioAudio.pause();
  if(S.mode==='record' && S.recording) stopRecording();
  S.mode = mode;
  [$('tabPlayer'),$('tabRadio'),$('tabRecord')].forEach(t=>t.classList.remove('active'));
  $('btnRadioMode').classList.remove('mode-lit');
  $('radioOverlay').classList.remove('show');
  if(mode==='player'){
    $('tabPlayer').classList.add('active');
    $('dawLabelLeft').textContent='TRACKS 1–5';
    setTrackOverlay(S.showTracks);
    $('infSource').innerHTML = TRACKS[S.trackIdx].source;
    loadTrack(S.trackIdx);
    updateTopStatus('PLAYER','a');
  } else if(mode==='radio'){
    $('tabRadio').classList.add('active'); $('btnRadioMode').classList.add('mode-lit');
    $('radioOverlay').classList.add('show'); $('waveWrap').classList.add('show'); setTrackOverlay(false);
    $('dawLabelLeft').textContent='RADIO STREAM';
    loadPreset(S.radioPreset, false);
    updateTopStatus('RADIO','a');
    const rclk=()=>{ const d=new Date(); $('infTime').textContent = String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'); };
    rclk(); S.radioClock=setInterval(rclk,30000);
  } else if(mode==='record'){
    $('tabRecord').classList.add('active'); $('waveWrap').classList.add('show'); setTrackOverlay(true);
    $('dawLabelLeft').textContent='RECORDING INPUT';
    $('infName').textContent = `REC_${String(S.recCount).padStart(3,'0')}`;
    $('infQuality').textContent = '24-bit / 48kHz · Line In';
    $('infKbps').textContent = 'Multitrack armed capture';
    $('infBadge').textContent='REC'; $('infBadge').className='inf-badge rec';
    $('infTime').textContent='00:00'; $('infRemain').textContent='ARM'; $('infProgFill').style.width='0%';
    $('progLeft').textContent='00:00'; $('progRight').textContent='ARM';
    $('infSource').innerHTML = 'Mic / line capture engine<br>Armed tracks download separately';
    updateTopStatus('RECORD','');
  }
  updateMonitorLabels(); persist();
}

radioAudio.addEventListener('playing', ()=>{ S.radioActive=true; S.radioError=false; updateTopStatus('LIVE','g'); updateMonitorLabels(); });
radioAudio.addEventListener('pause', ()=>{ if(S.mode==='radio' && !S.radioError && !S.recording) { S.radioActive=false; updateMonitorLabels(); } });
radioAudio.addEventListener('error', ()=>{ S.radioError=true; S.radioActive=false; updateTopStatus('STREAM ERR','r'); updateMonitorLabels(); });
radioAudio.addEventListener('waiting', ()=>{ if(S.mode==='radio'){ updateTopStatus('BUFFERING','a'); } });
radioAudio.addEventListener('stalled', ()=>{ if(S.mode==='radio'){ updateTopStatus('STALL','r'); } });

function simulatedFreqData(){
  if(!freqData) return;
  for(let i=0;i<freqData.length;i++){
    const a = Math.sin(i*0.06 + S.wPhase*1.7)*0.5 + 0.5;
    const b = Math.sin(i*0.015 + S.wPhase*0.6 + 1.1)*0.5 + 0.5;
    const env = S.mode==='record' ? 0.75 : S.playing ? 0.85 : 0.25;
    freqData[i] = Math.max(0, Math.min(255, Math.floor((a*0.65 + b*0.35) * 255 * env)));
  }
  for(let i=0;i<timeData.length;i++){
    const t = i/timeData.length;
    const v = 128 + Math.sin((t*14 + S.wPhase*0.7) * Math.PI)*58 + Math.sin((t*37 + S.wPhase*1.1) * Math.PI)*22;
    timeData[i] = clamp(Math.round(v),0,255);
  }
}
function getAnalysisArrays(){
  if(analyser && audioCtx && audioCtx.state!=='closed' && (S.mode==='radio' || S.mode==='record')){
    try {
      analyser.getByteFrequencyData(freqData);
      analyser.getByteTimeDomainData(timeData);
      return;
    } catch {}
  }
  simulatedFreqData();
}
function avgRange(arr, start, end){ let s=0,c=0; for(let i=start;i<end;i++){ s += arr[i]||0; c++; } return c ? s/c : 0; }
function updateTrackMeters(){
  if(S.mode==='record' && trackNodeSets.length){
    S.trackButtons.forEach((tb,i)=>{
      const set = trackNodeSets[i];
      if(set){ set.analyser.getByteFrequencyData(set.data); const level = avgRange(set.data,0,set.data.length) / 255; trackBarEls[i].style.height = Math.round(level*100)+'%'; }
      else trackBarEls[i].style.height = '0%';
    });
  } else {
    const len = freqData.length;
    TRACK_FILTERS.forEach((cfg,i)=>{
      const start = Math.floor((cfg.band[0]/20000)*len);
      const end = Math.max(start+2, Math.floor((cfg.band[1]/20000)*len));
      const level = avgRange(freqData, start, Math.min(end,len))/255;
      trackBarEls[i].style.height = Math.round(level*100)+'%';
    });
  }
}
function drawGrid(){
  wCtx.strokeStyle='rgba(255,255,255,.05)'; wCtx.lineWidth=1;
  for(let i=1;i<5;i++){ wCtx.beginPath(); wCtx.moveTo(0, (_wH/5)*i); wCtx.lineTo(_wW, (_wH/5)*i); wCtx.stroke(); }
  for(let i=1;i<8;i++){ wCtx.beginPath(); wCtx.moveTo((_wW/8)*i, 0); wCtx.lineTo((_wW/8)*i, _wH); wCtx.stroke(); }
}
function drawAnalysisText(metrics){
  wCtx.save();
  wCtx.font = '11px "Share Tech Mono", monospace';
  wCtx.fillStyle = S.mode==='record' ? 'rgba(255,42,60,.9)' : S.mode==='radio' ? 'rgba(255,176,32,.92)' : 'rgba(232,238,234,.88)';
  const lines = [
    `TILT ${metrics.tilt}`,
    `ENERGY ${metrics.energy}`,
    `DYNAMICS ${metrics.dynamics}`,
    `FOCUS ${metrics.focus}`,
    metrics.detail
  ];
  lines.forEach((line,idx)=> wCtx.fillText(line, 14, 20 + idx*16));
  wCtx.restore();
}
function classifyMetrics(){
  const len = freqData.length;
  const low = avgRange(freqData,0,Math.floor(len*0.12));
  const mid = avgRange(freqData,Math.floor(len*0.12),Math.floor(len*0.45));
  const high = avgRange(freqData,Math.floor(len*0.45),Math.floor(len*0.9));
  let diff=0; for(let i=1;i<timeData.length;i++) diff += Math.abs(timeData[i]-timeData[i-1]);
  const dynamicsScore = diff/(timeData.length-1);
  const energyScore = (low+mid+high)/3;
  const peak = Math.max(low,mid,high);
  const focus = peak===low ? 'LOW BAND' : peak===mid ? 'MID BAND' : 'HIGH BAND';
  const tilt = high > low + 18 ? 'BRIGHT' : low > high + 18 ? 'WARM' : 'BALANCED';
  const energy = energyScore > 165 ? 'HIGH' : energyScore > 95 ? 'MED' : 'LOW';
  const dynamics = dynamicsScore > 18 ? 'TRANSIENT' : dynamicsScore > 10 ? 'CONTROLLED' : 'SMOOTH';
  const detail = S.mode==='radio' ? (S.radioError ? 'STREAM UNSTABLE' : `SIGNAL ${energy} · ${focus}`) : S.mode==='record' ? `ARM ${armedTrackIndices().length} · MON ${S.trackButtons.filter(t=>t.mon).length}` : `${TRACKS[S.trackIdx].fmt} · ${TRACKS[S.trackIdx].spec}`;
  return {low,mid,high,tilt,energy,dynamics,focus,detail};
}
function drawWave(){
  getAnalysisArrays();
  wCtx.clearRect(0,0,_wW,_wH);
  drawGrid();
  const metrics = classifyMetrics();
  // spectrum bars
  const bars = 72, bw = (_wW-24)/bars;
  for(let i=0;i<bars;i++){
    const idx = Math.floor((i/bars)*freqData.length);
    const v = (freqData[idx]||0)/255;
    const bh = Math.max(3, v*(_wH*0.72));
    const x = 12 + i*bw;
    const grad = wCtx.createLinearGradient(0,_wH-bh,0,_wH);
    if(S.mode==='record') { grad.addColorStop(0,'rgba(255,42,60,.92)'); grad.addColorStop(1,'rgba(255,42,60,.08)'); }
    else if(S.mode==='radio') { grad.addColorStop(0,'rgba(255,176,32,.92)'); grad.addColorStop(1,'rgba(255,176,32,.08)'); }
    else { grad.addColorStop(0,'rgba(61,255,122,.82)'); grad.addColorStop(1,'rgba(61,255,122,.06)'); }
    wCtx.fillStyle = grad; wCtx.fillRect(x,_wH-bh,bw-1,bh);
  }
  // waveform line
  wCtx.beginPath();
  wCtx.lineWidth = 1.4;
  wCtx.strokeStyle = S.mode==='record' ? 'rgba(255,42,60,.95)' : S.mode==='radio' ? 'rgba(34,221,255,.85)' : 'rgba(232,238,234,.8)';
  for(let x=0;x<_wW;x++){
    const idx = Math.floor((x/_wW)*timeData.length);
    const v = ((timeData[idx]||128)-128)/128;
    const y = (_wH*0.28) + v*(_wH*0.16);
    if(x===0) wCtx.moveTo(x,y); else wCtx.lineTo(x,y);
  }
  wCtx.stroke();
  drawAnalysisText(metrics);
  updateTrackMeters();
  S.wPhase += 0.03;
  if(S.recording){ S.recElapsed += 1/60; $('infTime').textContent = fmt(S.recElapsed); $('progLeft').textContent = fmt(S.recElapsed); }
}
(function loop(){ requestAnimationFrame(loop); drawWave(); })();

function press(el){ el.classList.add('pressed'); setTimeout(()=>el.classList.remove('pressed'),130); }
$('btnPlay').addEventListener('click', async ()=>{ press($('btnPlay')); if(S.mode==='radio'){ radioAudio.paused ? await playRadio() : pauseRadio(); } else { S.playing ? pause() : play(); } });
$('btnStop').addEventListener('click', ()=>{ press($('btnStop')); stop(); });
$('btnPrev').addEventListener('click', ()=>{ press($('btnPrev')); if(S.mode==='radio') radioScanTo(-1); else { const wp=S.playing; if(S.elapsed>3){ S.elapsed=0; updatePlayerUI(); } else { stop(); loadTrack(S.trackIdx-1); } if(wp) play(); } });
$('btnNext').addEventListener('click', ()=>{ press($('btnNext')); if(S.mode==='radio') radioScanTo(+1); else { const wp=S.playing; stop(); loadTrack(S.trackIdx+1); if(wp) play(); } });
$('btnScanPrev').addEventListener('click', ()=>{ press($('btnScanPrev')); if(S.mode==='radio') radioScanTo(-1); else { const wp=S.playing; stop(); loadTrack(S.trackIdx-1); if(wp) play(); } });
$('btnScanNext').addEventListener('click', ()=>{ press($('btnScanNext')); if(S.mode==='radio') radioScanTo(+1); else { const wp=S.playing; stop(); loadTrack(S.trackIdx+1); if(wp) play(); } });
$('btnRadioMode').addEventListener('click', ()=>switchMode('radio'));
$('tabPlayer').addEventListener('click', ()=>switchMode('player'));
$('tabRadio').addEventListener('click', ()=>switchMode('radio'));
$('tabRecord').addEventListener('click', async ()=>{ await safeResume(); if(await setupMic()) { useSource('mic'); switchMode('record'); } });
$('btnShuffle').addEventListener('click', ()=>{ press($('btnShuffle')); const wp=S.playing; stop(); loadTrack(Math.floor(Math.random()*TRACKS.length)); if(wp) play(); });
$('btnRepeat').addEventListener('click', ()=>press($('btnRepeat')));
$('hwRecBtn').addEventListener('click', async ()=>{ await safeResume(); if(!(await setupMic())) return; useSource('mic'); if(S.mode!=='record') switchMode('record'); if(!S.recording) startRecording(); });
$('hwStopBtn').addEventListener('click', ()=>{ if(S.recording) stopRecording(); else stop(); });
$('progTrack').addEventListener('click', e=>{ if(S.mode!=='player') return; const rect=$('progTrack').getBoundingClientRect(); S.elapsed = Math.round((e.clientX-rect.left)/rect.width*TRACKS[S.trackIdx].dur); updatePlayerUI(); });

document.addEventListener('keydown', async e=>{
  const t = e.target;
  if(t && (t.tagName==='INPUT' || t.tagName==='TEXTAREA' || t.isContentEditable)) return;
  switch(e.code){
    case 'Space': e.preventDefault(); $('btnPlay').click(); break;
    case 'ArrowRight': e.preventDefault(); $('btnNext').click(); break;
    case 'ArrowLeft': e.preventDefault(); $('btnPrev').click(); break;
    case 'KeyP': switchMode('player'); break;
    case 'KeyR': switchMode('radio'); break;
    case 'KeyD': await safeResume(); if(await setupMic()) { useSource('mic'); switchMode('record'); } break;
    case 'KeyT': setTrackOverlay(!S.showTracks); break;
  }
});

(async function boot(){
  await loadStations();
  ensureAudio();
  applyPreset(S.eqPreset || 'flat');
  loadTrack(S.trackIdx);
  updateVolume(S.volume);
  setTrackOverlay(S.showTracks);
  // LED boot flash
  setTimeout(()=>$('ledA').className='led r',120);
  setTimeout(()=>$('ledB').className='led r',240);
  setTimeout(()=>$('ledC').className='led r',360);
  setTimeout(()=>{ $('ledA').className='led'; $('ledB').className='led'; $('ledC').className='led'; },800);
  setTimeout(()=>switchMode(S.mode||'player'),650);
})();
})();
