let sharedContext: AudioContext | null = null

async function getSharedAudioContext(): Promise<AudioContext | null> {
  try {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    if (!sharedContext || sharedContext.state === 'closed') {
      sharedContext = new Ctor()
    }
    if (sharedContext.state === 'suspended') {
      await sharedContext.resume()
    }
    return sharedContext
  } catch {
    return null
  }
}

/** One shared output stream; oscillators are cheap, new AudioContext per key is not. */
export function playTypewriterBlip(gain = 0.04): void {
  void (async () => {
    const audioCtx = await getSharedAudioContext()
    if (!audioCtx) return

    const osc = audioCtx.createOscillator()
    const gainNode = audioCtx.createGain()
    const t = audioCtx.currentTime

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(140 + Math.random() * 40, t)
    gainNode.gain.setValueAtTime(gain, t)
    gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.08)

    osc.connect(gainNode)
    gainNode.connect(audioCtx.destination)
    osc.start(t)
    osc.stop(t + 0.09)
  })()
}

/** Release shared context when preview unmounts (optional hygiene). */
export function closeSharedTypewriterAudio(): void {
  if (sharedContext && sharedContext.state !== 'closed') {
    void sharedContext.close()
  }
  sharedContext = null
}
