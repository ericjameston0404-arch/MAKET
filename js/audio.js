// Web Audio API procedural sound engine for Smart Greenhouse simulator
// 100% zero-latency, realistic synthesized physical sounds (no external files needed)

const SoundEngine = {
    ctx: null,
    enabled: true,
    pumpOsc1: null,
    pumpOsc2: null,
    pumpGain: null,
    waterGain: null,
    waterSource: null,
    isPumpRunning: false,

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    toggleMute() {
        this.enabled = !this.enabled;
        if (!this.enabled) {
            this.stopPump();
        }
        return this.enabled;
    },

    // Realistic electromagnetic relay click
    playRelayClick(isOn = true) {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            const pitch = isOn ? 1400 : 1100;

            // Armature snap impact (filtered transient pulse)
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(pitch, now);
            osc.frequency.exponentialRampToValueAtTime(180, now + 0.035);

            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(pitch, now);
            filter.Q.setValueAtTime(3.5, now);

            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.05);

            // Secondary mechanical contact bounce
            const osc2 = this.ctx.createOscillator();
            const gain2 = this.ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(pitch * 1.5, now + 0.012);
            osc2.frequency.exponentialRampToValueAtTime(220, now + 0.03);

            gain2.gain.setValueAtTime(0.0, now);
            gain2.gain.setValueAtTime(0.18, now + 0.012);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

            osc2.connect(gain2);
            gain2.connect(this.ctx.destination);

            osc2.start(now + 0.012);
            osc2.stop(now + 0.045);
        } catch (e) {
            console.warn('Audio playback error:', e);
        }
    },

    // DC Water Pump Motor Humming & Vibration
    startPump() {
        if (!this.enabled || this.isPumpRunning) return;
        this.init();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            this.isPumpRunning = true;

            // Fundamental motor spin frequency
            this.pumpOsc1 = this.ctx.createOscillator();
            this.pumpOsc1.type = 'sawtooth';
            this.pumpOsc1.frequency.setValueAtTime(135, now);

            // Motor armature resonance harmonic
            this.pumpOsc2 = this.ctx.createOscillator();
            this.pumpOsc2.type = 'triangle';
            this.pumpOsc2.frequency.setValueAtTime(270, now);

            // Lowpass motor casing dampener
            const motorFilter = this.ctx.createBiquadFilter();
            motorFilter.type = 'lowpass';
            motorFilter.frequency.setValueAtTime(450, now);
            motorFilter.Q.setValueAtTime(2.0, now);

            // Master pump gain with smooth fade-in
            this.pumpGain = this.ctx.createGain();
            this.pumpGain.gain.setValueAtTime(0.001, now);
            this.pumpGain.gain.linearRampToValueAtTime(0.12, now + 0.15);

            this.pumpOsc1.connect(motorFilter);
            this.pumpOsc2.connect(motorFilter);
            motorFilter.connect(this.pumpGain);
            this.pumpGain.connect(this.ctx.destination);

            this.pumpOsc1.start(now);
            this.pumpOsc2.start(now);

            // Start subtle bubbling water sound
            this.startWaterTrickle();
        } catch (e) {
            console.warn('Pump audio error:', e);
        }
    },

    stopPump() {
        if (!this.isPumpRunning) return;
        this.isPumpRunning = false;

        if (this.pumpGain && this.ctx) {
            try {
                const now = this.ctx.currentTime;
                this.pumpGain.gain.linearRampToValueAtTime(0.0001, now + 0.2);
                setTimeout(() => {
                    try {
                        if (this.pumpOsc1) this.pumpOsc1.stop();
                        if (this.pumpOsc2) this.pumpOsc2.stop();
                    } catch (e) {}
                    this.pumpOsc1 = null;
                    this.pumpOsc2 = null;
                    this.pumpGain = null;
                }, 250);
            } catch (e) {}
        }

        this.stopWaterTrickle();
    },

    // Gentle fluid rushing in tube and dripping on soil
    startWaterTrickle() {
        if (!this.ctx) return;
        try {
            const bufferSize = this.ctx.sampleRate * 2;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);

            // Pink/filtered noise
            let b0 = 0, b1 = 0, b2 = 0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                data[i] = (b0 + b1 + b2) * 0.12;
            }

            this.waterSource = this.ctx.createBufferSource();
            this.waterSource.buffer = buffer;
            this.waterSource.loop = true;

            const bandpass = this.ctx.createBiquadFilter();
            bandpass.type = 'bandpass';
            bandpass.frequency.setValueAtTime(1200, this.ctx.currentTime);
            bandpass.Q.setValueAtTime(1.8, this.ctx.currentTime);

            this.waterGain = this.ctx.createGain();
            this.waterGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
            this.waterGain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 0.3);

            this.waterSource.connect(bandpass);
            bandpass.connect(this.waterGain);
            this.waterGain.connect(this.ctx.destination);

            this.waterSource.start();
        } catch (e) {}
    },

    stopWaterTrickle() {
        if (this.waterGain && this.ctx) {
            try {
                const now = this.ctx.currentTime;
                this.waterGain.gain.linearRampToValueAtTime(0.0001, now + 0.25);
                setTimeout(() => {
                    try {
                        if (this.waterSource) this.waterSource.stop();
                    } catch (e) {}
                    this.waterSource = null;
                    this.waterGain = null;
                }, 300);
            } catch (e) {}
        }
    },

    // UI interactive beep
    playBeep(freq = 600, duration = 0.05) {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.8, now + duration);

            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + duration);
        } catch (e) {}
    },

    // Mobile Push Notification Alert Sound (critical / warning / info)
    playAlertSound(severity = 'critical') {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            const tones = severity === 'critical'
                ? [{ f: 880, t: 0, d: 0.12 }, { f: 1175, t: 0.14, d: 0.16 }, { f: 880, t: 0.34, d: 0.18 }]
                : severity === 'warning'
                    ? [{ f: 740, t: 0, d: 0.12 }, { f: 930, t: 0.15, d: 0.16 }]
                    : [{ f: 660, t: 0, d: 0.1 }, { f: 880, t: 0.11, d: 0.12 }];

            tones.forEach(note => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = severity === 'critical' ? 'triangle' : 'sine';
                osc.frequency.setValueAtTime(note.f, now + note.t);

                gain.gain.setValueAtTime(0.001, now + note.t);
                gain.gain.linearRampToValueAtTime(0.11, now + note.t + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, now + note.t + note.d);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(now + note.t);
                osc.stop(now + note.t + note.d + 0.02);
            });
        } catch (e) {}
    },

    // Positive chime when an issue is resolved
    playSuccessSound() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            [523.25, 659.25, 783.99].forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const start = now + idx * 0.075;
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, start);

                gain.gain.setValueAtTime(0.001, start);
                gain.gain.linearRampToValueAtTime(0.08, start + 0.015);
                gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(start);
                osc.stop(start + 0.2);
            });
        } catch (e) {}
    }
};

window.SoundEngine = SoundEngine;
