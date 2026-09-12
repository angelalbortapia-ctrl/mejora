#!/usr/bin/env python3
"""[LEGACY] Genera loops sintéticos — sustituido por scripts/fetch-ambient-sounds.py (grabaciones CC0)."""
import math
import random
import struct
import wave
from pathlib import Path

SR = 44100
SEC = 24
N = SR * SEC
OUT = Path(__file__).resolve().parent.parent / 'public' / 'audio'
OUT.mkdir(parents=True, exist_ok=True)


def pink(n: int) -> list:
    rows = 16
    state = [0.0] * rows
    out = []
    for _ in range(n):
        white = random.uniform(-1, 1)
        state[0] = 0.99886 * state[0] + white * 0.0555179
        state[1] = 0.99332 * state[1] + white * 0.0750759
        state[2] = 0.96900 * state[2] + white * 0.1538520
        state[3] = 0.86650 * state[3] + white * 0.3104856
        state[4] = 0.55000 * state[4] + white * 0.5329522
        state[5] = -0.7616 * state[5] - white * 0.0168980
        s = sum(state) + white * 0.5362
        state.append(state.pop(0))
        out.append(s * 0.11)
    return out


def brown(n: int) -> list:
    out = []
    last = 0.0
    for _ in range(n):
        white = random.uniform(-1, 1)
        last = (last + 0.004 * white) / 1.004
        out.append(last * 2.2)
    return out


def lowpass(samples, cutoff_hz=1200):
    rc = 1.0 / (2 * math.pi * cutoff_hz)
    dt = 1.0 / SR
    alpha = dt / (rc + dt)
    out = []
    prev = 0.0
    for x in samples:
        prev = prev + alpha * (x - prev)
        out.append(prev)
    return out


def highpass(samples, cutoff_hz=400):
    rc = 1.0 / (2 * math.pi * cutoff_hz)
    dt = 1.0 / SR
    alpha = rc / (rc + dt)
    out = []
    prev_x = prev_y = 0.0
    for x in samples:
        y = alpha * (prev_y + x - prev_x)
        prev_x, prev_y = x, y
        out.append(y)
    return out


def seam_loop(samples):
    """Funde inicio/fin para loop sin click."""
    fade = int(SR * 0.4)
    for i in range(fade):
        t = i / fade
        samples[i] = samples[i] * t + samples[-fade + i] * (1 - t)
    return samples


def normalize(samples, peak=0.55):
    m = max(abs(min(samples)), abs(max(samples)), 1e-9)
    return [x / m * peak for x in samples]


def write_wav(name, samples):
    samples = seam_loop(normalize(samples))
    path = OUT / f'{name}.wav'
    with wave.open(str(path), 'w') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        frames = b''.join(struct.pack('<h', int(max(-32767, min(32767, x * 32767)))) for x in samples)
        w.writeframes(frames)
    print(f'  {path.name} ({len(samples) / SR:.1f}s)')


def modulate(samples, rate_hz, depth=0.35):
    out = []
    for i, x in enumerate(samples):
        t = i / SR
        env = 1.0 - depth + depth * (0.5 + 0.5 * math.sin(2 * math.pi * rate_hz * t))
        out.append(x * env)
    return out


def rain():
    base = lowpass(pink(N), 2800)
    shimmer = lowpass(pink(N), 6000)
    out = [base[i] * 0.75 + shimmer[i] * 0.08 for i in range(N)]
    return modulate(out, 0.9, 0.12)


def ocean():
    base = lowpass(brown(N), 520)
    return modulate(base, 0.065, 0.55)


def forest():
    base = lowpass(pink(N), 1400)
    out = [x * 0.35 for x in base]
    # pájaros muy suaves y raros
    for _ in range(8):
        pos = random.randint(SR, N - SR // 2)
        f0 = random.uniform(900, 1400)
        for j in range(int(SR * 0.25)):
            i = pos + j
            if i >= N:
                break
            t = j / SR
            env = math.sin(math.pi * t / 0.25) * 0.018
            out[i] += math.sin(2 * math.pi * f0 * t) * env
    return out


def wind():
    base = lowpass(pink(N), 1800)
    out = []
    phase = 0.0
    for i, x in enumerate(base):
        phase += 0.00008
        sweep = 0.6 + 0.4 * math.sin(phase)
        out.append(x * sweep * 0.4)
    return out


def stream():
    base = highpass(lowpass(pink(N), 3200), 350)
    return modulate(base, 1.4, 0.22)


def fire():
    base = lowpass(brown(N), 900)
    out = [x * 0.5 for x in base]
    for _ in range(90):
        pos = random.randint(0, N - 1)
        length = random.randint(int(SR * 0.01), int(SR * 0.04))
        for j in range(length):
            i = (pos + j) % N
            t = j / length
            out[i] += random.uniform(-1, 1) * (1 - t) * 0.035
    return lowpass(out, 2200)


def night():
    base = lowpass(brown(N), 380)
    out = [x * 0.28 for x in base]
    for _ in range(14):
        pos = random.randint(SR, N - SR)
        for j in range(int(SR * 0.5)):
            i = pos + j
            if i >= N:
                break
            t = j / SR
            if t < 0.08:
                env = t / 0.08
            elif t > 0.35:
                env = max(0, 1 - (t - 0.35) / 0.15)
            else:
                env = 1.0
            f = 4200 + 200 * math.sin(t * 40)
            out[i] += math.sin(2 * math.pi * f * t) * env * 0.006
    return out


def soft_noise():
    return lowpass(brown(N), 450)


def cafe():
    return lowpass(pink(N), 950)


def zen():
    base = lowpass(brown(N), 500)
    out = [x * 0.22 for x in base]
    for start in range(0, N, int(SR * 12)):
        for j in range(int(SR * 3)):
            i = start + j
            if i >= N:
                break
            t = j / SR
            env = math.exp(-t * 0.9) * 0.04
            out[i] += math.sin(2 * math.pi * 392 * t) * env
            out[i] += math.sin(2 * math.pi * 523.25 * t) * env * 0.6
    return out


def main():
    random.seed(42)
    print('Generando loops ambiente…')
    write_wav('rain', rain())
    write_wav('ocean', ocean())
    write_wav('forest', forest())
    write_wav('wind', wind())
    write_wav('stream', stream())
    write_wav('fire', fire())
    write_wav('night', night())
    write_wav('brown', soft_noise())
    write_wav('cafe', cafe())
    write_wav('zen', zen())
    print('Listo.')


if __name__ == '__main__':
    main()
