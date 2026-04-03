export const SONGS = [
  {
    id: 'twinkle',
    name: '小星星',
    bpm: 100,
    notes: [
      [0, 500, 60], [500, 1000, 60], [1000, 1500, 67], [1500, 2000, 67],
      [2000, 2500, 69], [2500, 3000, 69], [3000, 4000, 67],
      [4000, 4500, 65], [4500, 5000, 65], [5000, 5500, 64], [5500, 6000, 64],
      [6000, 6500, 62], [6500, 7000, 62], [7000, 8000, 60]
    ]
  },
  {
    id: 'happy-birthday',
    name: '生日快乐',
    bpm: 108,
    notes: [
      [0, 400, 60], [400, 800, 60], [800, 1400, 62], [1400, 2000, 60], [2000, 2600, 65], [2600, 3600, 64],
      [3600, 4000, 60], [4000, 4400, 60], [4400, 5000, 62], [5000, 5600, 60], [5600, 6200, 67], [6200, 7200, 65]
    ]
  },
  {
    id: 'two-tigers',
    name: '两只老虎',
    bpm: 100,
    notes: [
      [0, 500, 60], [500, 1000, 62], [1000, 1500, 64], [1500, 2000, 60],
      [2000, 2500, 60], [2500, 3000, 62], [3000, 3500, 64], [3500, 4000, 60],
      [4000, 4500, 64], [4500, 5000, 65], [5000, 6000, 67], [6000, 6500, 64], [6500, 7000, 65], [7000, 8000, 67]
    ]
  }
];

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function midiToHz(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function hzToMidi(hz) {
  return Math.round(12 * Math.log2(hz / 440) + 69);
}

export function midiToName(midi) {
  const octave = Math.floor(midi / 12) - 1;
  const name = NOTE_NAMES[midi % 12] || '?';
  return `${name}${octave}`;
}

export function centsOff(targetHz, detectedHz) {
  return Math.round(1200 * Math.log2(detectedHz / targetHz));
}

export function frameScore(absCents) {
  if (absCents <= 30) {
    return 100;
  }
  if (absCents >= 120) {
    return 0;
  }
  return Math.round(100 - ((absCents - 30) / 90) * 100);
}

export function stabilityScore(centsHistory) {
  if (centsHistory.length < 3) {
    return 0;
  }
  const avg = centsHistory.reduce((sum, n) => sum + n, 0) / centsHistory.length;
  const variance = centsHistory.reduce((sum, n) => sum + Math.pow(n - avg, 2), 0) / centsHistory.length;
  const std = Math.sqrt(variance);
  return Math.max(0, Math.round(100 - std));
}

export function getTargetMidi(song, elapsedMs) {
  const frame = song.notes.find((note) => elapsedMs >= note[0] && elapsedMs < note[1]);
  return frame ? frame[2] : null;
}

export function summarize(frames) {
  if (!frames.length) {
    return { totalScore: 0, stability: 0, avgCents: 0, advice: '没有检测到有效演唱，请检查麦克风或音量。' };
  }

  const avgScore = Math.round(frames.reduce((sum, f) => sum + f.score, 0) / frames.length);
  const centValues = frames.map((f) => f.cents);
  const stability = stabilityScore(centValues);
  const avgCents = Math.round(centValues.reduce((sum, n) => sum + n, 0) / centValues.length);

  let advice = '音准表现不错，继续保持。';
  if (avgCents > 20) {
    advice = '整体偏高，试着放松喉咙，降低起音。';
  } else if (avgCents < -20) {
    advice = '整体偏低，尝试提高气息支撑和起音位置。';
  }

  return {
    totalScore: Math.round(avgScore * 0.8 + stability * 0.2),
    stability,
    avgCents,
    advice
  };
}
