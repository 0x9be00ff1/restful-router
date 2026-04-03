function autoCorrelate(buffer, sampleRate) {
  let rms = 0;
  for (let i = 0; i < buffer.length; i++) {
    rms += buffer[i] * buffer[i];
  }
  rms = Math.sqrt(rms / buffer.length);
  if (rms < 0.01) {
    return null;
  }

  let r1 = 0;
  let r2 = buffer.length - 1;
  const threshold = 0.2;

  for (let i = 0; i < buffer.length / 2; i++) {
    if (Math.abs(buffer[i]) < threshold) {
      r1 = i;
      break;
    }
  }

  for (let i = 1; i < buffer.length / 2; i++) {
    if (Math.abs(buffer[buffer.length - i]) < threshold) {
      r2 = buffer.length - i;
      break;
    }
  }

  const trimmed = buffer.slice(r1, r2);
  const c = new Array(trimmed.length).fill(0);

  for (let i = 0; i < trimmed.length; i++) {
    for (let j = 0; j < trimmed.length - i; j++) {
      c[i] += trimmed[j] * trimmed[j + i];
    }
  }

  let d = 0;
  while (c[d] > c[d + 1]) {
    d++;
  }

  let maxValue = -1;
  let maxIndex = -1;
  for (let i = d; i < trimmed.length; i++) {
    if (c[i] > maxValue) {
      maxValue = c[i];
      maxIndex = i;
    }
  }

  if (maxIndex <= 0) {
    return null;
  }

  const x1 = c[maxIndex - 1] ?? c[maxIndex];
  const x2 = c[maxIndex];
  const x3 = c[maxIndex + 1] ?? c[maxIndex];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;

  const refined = a ? maxIndex - b / (2 * a) : maxIndex;
  return sampleRate / refined;
}

export async function createWebMicInput(onFrame) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(stream);
  const analyzer = audioContext.createAnalyser();
  analyzer.fftSize = 2048;
  source.connect(analyzer);

  const buffer = new Float32Array(analyzer.fftSize);
  let running = true;

  function loop() {
    if (!running) {
      return;
    }

    analyzer.getFloatTimeDomainData(buffer);
    const hz = autoCorrelate(buffer, audioContext.sampleRate);
    onFrame({ hz, ts: performance.now() });
    requestAnimationFrame(loop);
  }

  loop();

  return {
    stop() {
      running = false;
      stream.getTracks().forEach((track) => track.stop());
      source.disconnect();
      analyzer.disconnect();
      audioContext.close();
    }
  };
}
