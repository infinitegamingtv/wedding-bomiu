'use client';

import { useEffect } from 'react';

// A quiet synthesized click needs no download and only runs after a user gesture.
export default function ButtonSfx() {
  useEffect(() => {
    let context;

    const playClick = event => {
      if (!(event.target instanceof Element)) return;
      const button = event.target.closest('button');
      if (!button || button.disabled) return;

      try {
        const AudioContextType = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextType) return;
        context ||= new AudioContextType();
        if (context.state === 'suspended') void context.resume();

        const now = context.currentTime;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(520, now);
        oscillator.frequency.exponentialRampToValueAtTime(700, now + 0.055);
        gain.gain.setValueAtTime(0.025, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.085);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(now);
        oscillator.stop(now + 0.09);
      } catch {
        // Sound support is optional; clicks must keep working without it.
      }
    };

    document.addEventListener('click', playClick);
    return () => {
      document.removeEventListener('click', playClick);
      if (context) void context.close();
    };
  }, []);

  return null;
}
