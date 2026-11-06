(function (global) {
  'use strict';

  const STORAGE_KEY = 'tetrisArena.soundMuted.v1';
  let audioContext = null;
  let masterGain = null;
  let muted = readMuted();

  function readMuted() {
    try {
      return global.localStorage.getItem(STORAGE_KEY) === '1';
    } catch (error) {
      return false;
    }
  }

  function persistMuted() {
    try {
      global.localStorage.setItem(STORAGE_KEY, muted ? '1' : '0');
    } catch (error) {
      // Storage can be unavailable in restrictive browser modes.
    }
  }

  function ensureContext() {
    if (audioContext) return audioContext;
    const AudioContextClass = global.AudioContext || global.webkitAudioContext;
    if (!AudioContextClass) return null;
    audioContext = new AudioContextClass();
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.34;
    masterGain.connect(audioContext.destination);
    return audioContext;
  }

  function unlock() {
    const context = ensureContext();
    if (!context) return null;
    if (context.state === 'suspended') {
      context.resume().catch(() => {
        // The browser may still be waiting for a user gesture.
      });
    }
    return context;
  }

  function playTone(frequency, startTime, duration, type, volume) {
    if (!audioContext || !masterGain) return;
    const oscillator = audioContext.createOscillator();
    const envelope = audioContext.createGain();
    oscillator.type = type || 'square';
    oscillator.frequency.setValueAtTime(frequency, startTime);
    envelope.gain.setValueAtTime(0.0001, startTime);
    envelope.gain.exponentialRampToValueAtTime(volume || 0.08, startTime + 0.012);
    envelope.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    oscillator.connect(envelope);
    envelope.connect(masterGain);
    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.02);
  }

  function playLineClear(lines) {
    if (muted) return;
    const context = unlock();
    if (!context) return;

    const count = Math.max(1, Math.min(4, Math.round(Number(lines) || 1)));
    const patterns = {
      1: [660, 880],
      2: [523, 784, 1047],
      3: [523, 659, 880, 1175],
      4: [392, 523, 659, 784, 1047, 1319]
    };
    const notes = patterns[count];
    const baseTime = context.currentTime + 0.018;
    const step = count === 4 ? 0.07 : 0.06;

    notes.forEach((frequency, index) => {
      playTone(frequency, baseTime + index * step, count === 4 ? 0.12 : 0.09, 'square', 0.075);
    });

    if (count === 4) {
      playTone(130.81, baseTime, 0.32, 'triangle', 0.1);
      playTone(196, baseTime + 0.02, 0.28, 'triangle', 0.07);
    }
  }

  function setMuted(value) {
    muted = Boolean(value);
    persistMuted();
    if (!muted) unlock();
    return muted;
  }

  function toggleMuted() {
    return setMuted(!muted);
  }

  function isMuted() {
    return muted;
  }

  global.TetrisAudio = {
    unlock,
    playLineClear,
    setMuted,
    toggleMuted,
    isMuted
  };
})(window);
