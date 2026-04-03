import {
  SONGS,
  centsOff,
  frameScore,
  getTargetMidi,
  hzToMidi,
  midiToHz,
  midiToName,
  summarize
} from './core.js';
import { createWebMicInput } from './web-adapter.js';

const songSelect = document.getElementById('songSelect');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const targetNoteEl = document.getElementById('targetNote');
const detectedNoteEl = document.getElementById('detectedNote');
const centsEl = document.getElementById('cents');
const judgeEl = document.getElementById('judge');
const progressEl = document.getElementById('progress');
const totalScoreEl = document.getElementById('totalScore');
const stabilityEl = document.getElementById('stability');
const adviceEl = document.getElementById('advice');

let session = null;
let startedAt = 0;
let frames = [];
let selectedSong = SONGS[0];

for (const song of SONGS) {
  const option = document.createElement('option');
  option.value = song.id;
  option.innerText = `${song.name}（${song.notes.length} 个音符）`;
  songSelect.appendChild(option);
}

songSelect.addEventListener('change', (event) => {
  selectedSong = SONGS.find((song) => song.id === event.target.value) || SONGS[0];
});

startBtn.addEventListener('click', async () => {
  try {
    resetResult();
    frames = [];
    startedAt = performance.now();
    const last = selectedSong.notes[selectedSong.notes.length - 1];
    const totalDuration = last[1];

    session = await createWebMicInput((sample) => {
      const elapsed = performance.now() - startedAt;
      const targetMidi = getTargetMidi(selectedSong, elapsed);
      const progress = Math.min(100, Math.round((elapsed / totalDuration) * 100));
      progressEl.value = progress;

      if (targetMidi == null) {
        if (elapsed >= totalDuration) {
          stopTraining();
        }
        return;
      }

      targetNoteEl.innerText = midiToName(targetMidi);

      if (!sample.hz || sample.hz < 60 || sample.hz > 1200) {
        detectedNoteEl.innerText = '-';
        centsEl.innerText = '-';
        judgeEl.innerText = '未检测到稳定人声';
        return;
      }

      const detectedMidi = hzToMidi(sample.hz);
      const targetHz = midiToHz(targetMidi);
      const cents = centsOff(targetHz, sample.hz);
      const score = frameScore(Math.abs(cents));

      frames.push({ cents, score, elapsed });

      detectedNoteEl.innerText = midiToName(detectedMidi);
      centsEl.innerText = `${cents > 0 ? '+' : ''}${cents}`;
      judgeEl.innerText = score >= 80 ? '音准良好' : score >= 50 ? '轻微跑调' : '明显跑调';
    });

    startBtn.disabled = true;
    stopBtn.disabled = false;
  } catch (err) {
    judgeEl.innerText = `启动失败：${err.message}`;
  }
});

stopBtn.addEventListener('click', stopTraining);

function stopTraining() {
  if (session) {
    session.stop();
    session = null;
  }

  startBtn.disabled = false;
  stopBtn.disabled = true;

  const result = summarize(frames);
  totalScoreEl.innerText = String(result.totalScore);
  stabilityEl.innerText = String(result.stability);
  adviceEl.innerText = result.advice;
}

function resetResult() {
  progressEl.value = 0;
  targetNoteEl.innerText = '-';
  detectedNoteEl.innerText = '-';
  centsEl.innerText = '-';
  judgeEl.innerText = '进行中...';
  totalScoreEl.innerText = '-';
  stabilityEl.innerText = '-';
  adviceEl.innerText = '-';
}
