import { h, render, Component } from './lib/preact.js'
import { useState, useEffect, useMemo, useRef } from './lib/hooks.js'
import htm from './lib/htm.js'
import { Sequence } from './lib/tinymusic.js'

const html = htm.bind(h)
let pulse

const keySigs = {
  '—':   ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'],
  'C':   ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
  'F':   ['F', 'G', 'A', 'Bb', 'C', 'D', 'E'],
  'B♭':  ['Bb', 'C', 'D', 'Eb', 'F', 'G', 'A'],
  'E♭':  ['Eb', 'F', 'G', 'Ab', 'Bb', 'C', 'D'],
  'A♭':  ['Ab', 'Bb', 'C', 'Db', 'Eb', 'F', 'G'],
  'G♭':  ['Gb', 'Ab', 'Bb', 'Cb', 'Db', 'Eb', 'F'],
  'C♭':  ['Cb', 'Db', 'Eb', 'Fb', 'Gb', 'Ab', 'Bb'],
  'G':   ['G', 'A', 'B', 'C', 'D', 'E', 'F#', 'G'],
  'F':   ['D', 'E', 'F#', 'G', 'A', 'B', 'C#', 'D'],
  'A':   ['A', 'B', 'C#', 'D', 'E', 'F#', 'G#'],
  'E':   ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#'],
  'B':   ['B', 'C#', 'D#', 'E', 'F#', 'G#', 'A#'],
  'F♯':  ['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'E#'],
  'C♯':  ['C#', 'D#', 'E#', 'F#', 'G#', 'A#', 'B#']
}

const durations = [4, 2, 1, 0.5, 0.25, 0.75]
const waveTypes = ['square', 'sine', 'sawtooth', 'triangle']
const params = new URLSearchParams(window.location.search)
const maxVolume = 0.5

const generateNotes = ({ notes, key, rangeMin, rangeMax, snap }) => {
  let collection = []
  let beats = 0

  for (let x = 1; x <= notes; x++) {
    const note = sample(0, keySigs[key].length)
    let duration = 0

    if (snap && x == notes) {
      duration = Math.ceil(beats) - beats
    } else {
      duration = durations[sample(0, durations.length - 1)]
    }

    collection.push(`${keySigs[key][note]}${sample(rangeMin * 1, rangeMax * 1)} ${duration}`)
    beats += duration
  }
  return {
    beats,
    collection
  }
}

const parseArrangement = () => {
  if (!params.has('arrangement')) return
  return params.get('arrangement').split(',')
}

const sample = (min, max) => {
  return Math.floor(Math.random() * (1 + max - min) + min)
}

// Cheating to check and see if the page has been parsed
// to determine if the arrangement useMemo needs to parse
// a arrangement via params or not...
let parsed = false

const App = () => {
  const [playing, setPlaying] = useState(false)
  const [notes, setNotes] = useState(params.get('notes') || 8)
  const [rangeMin, setRangeMin] = useState(params.get('rangemin') || 2)
  const [rangeMax, setRangeMax] = useState(params.get('rangemax') || 6)
  const [key, setKey] = useState(params.get('key') || '—')
  const [tempo, setTempo] = useState(params.get('tempo') || 120)
  const [wave, setWave] = useState(params.get('wave') || 'square')
  const [smoothing, setSmoothing] = useState(params.get('smoothing') || 0)
  const [staccato, setStaccato] = useState(params.get('staccato') || 0)
  const [bass, setBass] = useState(params.get('bass') || 0)
  const [mid, setMid] = useState(params.get('mid') || 0)
  const [treble, setTreble] = useState(params.get('treble') || 0)
  const [loop, setLoop] = useState(params.get('loop') || true)
  const [click, setClick] = useState(false)
  const [clickGain, setClickGain] = useState(1)
  const [snap, setSnap] = useState(false)
  const [beats, setBeats] = useState(0)
  const [split, setSplit] = useState(1)
  const [pulseGain, setPulseGain] = useState(0)
  const [pulseSpeed, setPulseSpeed] = useState(0.25)
  const [keysVisible, setKeysVisible] = useState(false)
  const sequence = useRef()
  const clickTrack = useRef()

  const arrangement = useMemo(() => {
    const generated = generateNotes({ notes, key, rangeMin, rangeMax, snap })
    const collection = generated.collection
    const beats = generated.beats

    if (!parsed) {
      parsed = true
      return parseArrangement() || { beats, collection }
    } else {
      return { beats, collection }
    }
  }, [notes, key, rangeMin, rangeMax, snap])

  const changeNotes = (e) => {
    const notes = e.target.value
    setNotes(notes)
  }

  const changeKey = (e) => {
    const key = e.target.value
    setKey(key)
    setKeysVisible(false)
  }

  const getSeconds = () => {
    return Math.round(beats * (60 / tempo) * 100) / 100
  }

  const togglePlay = () => {
    setPlaying(!playing)

    if (!sequence.current) {
      sequence.current = new Sequence(null, tempo, [])
      sequence.current.gain.gain.value = maxVolume

      clickTrack.current = new Sequence(null, tempo / split, ['G7 Q'])
      clickTrack.current.staccato = 0.95
    }
  }

  const randomizeSettings = () => {
    setNotes(sample(1, 24))
    setKey(Object.keys(keySigs)[sample(0, Object.keys(keySigs).length - 1)])
    setRangeMin(sample(1, 8))
    setRangeMax(sample(rangeMin, 8))
    setWave(waveTypes[sample(0, waveTypes.length - 1)])
    setTempo(sample(40, 360))
    setBass(sample(-25, 25))
    setMid(sample(-25, 25))
    setTreble(sample(-25, 25))
    setSmoothing(Math.round(Math.random() * 100) / 100)
    setStaccato(Math.round(Math.random() * 100) / 100)
    setPulseGain(sample(0, 70) / 100)
    setPulseSpeed(sample(-beats, 0))
  }

  const shareSequence = () => {
    params.set('notes', notes)
    params.set('key', key)
    params.set('rangemin', rangeMin)
    params.set('rangemax', rangeMax)
    params.set('arrangement', arrangement.collection)
    params.set('tempo', tempo)
    params.set('wave', wave)
    params.set('smoothing', smoothing)
    params.set('staccato', staccato)
    params.set('bass', bass)
    params.set('mid', mid)
    params.set('treble', treble)
    params.set('loop', loop)

    window.history.replaceState({}, '', `${location.pathname}?${params}`);
  }

  let fade
  let direction

  const pulseIt = () => {
    const ceiling = Math.abs(pulseSpeed) * (30 + 1)

    if (direction === 'up') {
      fade += 1
      if (fade > ceiling) {
        direction = 'down'
        fade -= 1
      }
    }

    if (direction === 'down') {
      fade -= 1
      if (fade < 1) {
        direction = 'up'
        fade += 1
      }
    }

    sequence.current.gain.gain.value = maxVolume - ((fade * pulseGain) / ceiling)
  }

  useEffect(() => {
    if (!sequence.current) return

    if (playing) {
      sequence.current.play()
      clickTrack.current.play()
    } else {
      sequence.current.stop()
      clickTrack.current.stop()
      clearInterval(pulse)
    }
  }, [playing])

  useEffect(() => {
    if (!sequence.current) return

    clearInterval(pulse)

    if (playing) {
      fade = 0
      direction = 'up'
      pulse = setInterval(pulseIt, 1000 / 60)
    }
  }, [playing, pulseGain, pulseSpeed])

  useEffect(() => {
    setBeats(arrangement.beats)
  })

  if (sequence.current) {
    sequence.current.notes = []
    sequence.current.push(...arrangement.collection)
    sequence.current.tempo = tempo
    sequence.current.waveType = wave
    sequence.current.smoothing = smoothing
    sequence.current.staccato = staccato
    sequence.current.bass.gain.value = bass
    sequence.current.mid.gain.value = mid
    sequence.current.treble.gain.value = treble
    sequence.current.loop = loop

    clickTrack.current.tempo = tempo / split
    const gain = clickTrack.current.gain.gain
    click ? gain.value = clickGain : gain.value = 0
  }

  const noteType = (name) => {
    return(html`
      <div class="toggle">
        <input type="checkbox" id=${name} class="toggle-input" value=${name} />
        <label for=${name} class="toggle-label"><span>${name}</span></label>
      </div>
    `)
  }

  const waveType = (name) => {
    return(html`
      <div class="toggle">
        <input type="radio" name="wave" id=${name} class="toggle-input" value=${name} onInput=${e => setWave(e.target.value)} checked=${wave === name} />
        <label for=${name} class="toggle-label"><span>${name}</span></label>
      </div>
    `)
  }

  return(html`
    <section id="input">
      <div>
        <h1>RMG-2021</h1>
        <h2>TinyMusic Sequencer</h2>
      </div>

      <div class="grid2">
        <div class="field">
          <label for="notes" class="label">Notes</label>
          <input type="number" id="notes" class="input" min="1" max="24" step="1" value=${notes} onInput=${changeNotes} />
        </div>

        <div class="field">
          <label for="key" class="label">Key</label>
          <output id="key" class="input" onClick=${e => setKeysVisible(!keysVisible)}>${key}</output>

          <div id="keys" hidden=${!keysVisible}>
            ${Object.keys(keySigs).map(keySig => html`
              <div>
                <input type="radio" name="keySig" id=${keySig} value=${keySig} onInput=${changeKey} checked=${keySig === key} />
                <label for=${keySig}>${keySig}</label>
              </div>
            `)}
          </div>
        </div>
      </div>

      <fieldset>
        <legend class="label legend">Octaves</legend>

        <div class="grid2">
          <div class="field">
            <label for="range-min" class="label">Low</label>
            <input type="number" id="range-min" class="input" min="1" max=${rangeMax} value=${rangeMin >= rangeMax ? rangeMax : rangeMin} onInput=${e => setRangeMin(e.target.value)} />
          </div>

          <div class="field">
            <label for="range-max" class="label">High</label>
            <input type="number" id="range-max" class="input" min=${rangeMin} max="8" value=${rangeMax <= rangeMin ? rangeMin : rangeMax} onInput=${e => setRangeMax(e.target.value)} />
          </div>
        </div>
      </fieldset>

      <div class="toggle">
        <label for="snap" class="label">Snap to beat</label>
        <input type="checkbox" id="snap" class="toggle-input" onInput=${e => setSnap(!snap)} checked=${snap} />
        <label for="snap" class="toggle-label toggle-label-sm" aria-hidden="true"></label>
      </div>

      <button type="button" class="btn btn-generate" onClick=${randomizeSettings}>
        Randomize Settings
      </button>
    </section>

    <section id="output">
      <fieldset id="playback">
        <div class="toggle mb24">
          <label for="playing" class="label">Play</label>
          <input type="checkbox" id="playing" class="toggle-input" onInput=${togglePlay} checked=${playing} />
          <label for="playing" class="toggle-label toggle-play" aria-hidden="true">
            ${playing ? html`
              <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              </svg>
            `: html`
              <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            `}
          </label>
        </div>

        <div class="grid2">
          <div class="toggle">
            <label for="loop" class="label">Loop</label>
            <input type="checkbox" id="loop" class="toggle-input" onInput=${e => setLoop(!loop)} checked=${loop} />
            <label for="loop" class="toggle-label toggle-label-sm" aria-hidden="true"></label>
          </div>

          <div class="toggle">
            <label for="click" class="label">Click</label>
            <input type="checkbox" id="click" class="toggle-input" onInput=${e => setClick(!click)} checked=${click} />
            <label for="click" class="toggle-label toggle-label-sm" aria-hidden="true"></label>
          </div>
        </div>
      </fieldset>

      <div id="display">
        <div id="meta">
          <div>
            <div class="field ib mr24">
              <div class="label">Beats</div>
              <output for="beats" class="output">${beats}</output>
            </div>

            <div class="field ib mr24">
              <div class="label">Tempo</div>
              <output for="tempo" class="output">${tempo}</output>
            </div>

            <div class="field ib mr24">
              <div class="label">Split</div>
              <output for="split" class="output">${split}</output>
            </div>

            <div class="field ib mr24">
              <div class="label">Seconds</div>
              <output for="seconds" class="output">${getSeconds()}</output>
            </div>
          </div>

          <button type="button" class="btn-share" onClick=${shareSequence}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </button>
        </div>

        <div id="viz"></div>
      </div>

      <fieldset>
        <legend class="label legend">Wave Type</legend>
        <div class="grid2">
          ${waveTypes.map(waveType)}
        </div>
      </fieldset>

      <div id="sliders">
        <fieldset>
          <legend class="label legend">Meter</legend>

          <div class="grid3">
            <div class="field">
              <div class="slider-wrapper mb8">
                <input type="range" id="click-gain" class="slider" min="0" max="1" step="0.01" value=${clickGain} onInput=${e => setClickGain(e.target.value)} />
              </div>
              <label for="click-gain" class="label">Gain</label>
            </div>

            <div class="field">
              <div class="slider-wrapper mb8">
                <input type="range" id="tempo" class="slider" min="40" max="360" step="1" value=${tempo} onInput=${e => setTempo(e.target.value)} />
              </div>
              <label for="tempo" class="label">Tempo</label>
            </div>

            <div class="field">
              <div class="slider-wrapper mb8">
                <input type="range" id="split" class="slider" min="0.25" max=${beats} step="0.25" value=${split} onInput=${e => setSplit(e.target.value)} />
              </div>
              <label for="split" class="label">Split</label>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend class="label legend">EQ</legend>

          <div class="grid3">
            <div class="field">
              <div class="slider-wrapper mb8">
                <input type="range" id="bass" class="slider" min="-100" max="100" value=${bass} onInput=${e => setBass(e.target.value)} />
              </div>
              <label for="bass" class="label">Lows</label>
            </div>

            <div class="field">
              <div class="slider-wrapper mb8">
                <input type="range" id="mid" class="slider" min="-100" max="100" value=${mid} onInput=${e => setMid(e.target.value)} />
              </div>
              <label for="mid" class="label">Mids</label>
            </div>

            <div class="field">
              <div class="slider-wrapper mb8">
                <input type="range" id="treble" class="slider" min="-100" max="100" value=${treble} onInput=${e => setTreble(e.target.value)} />
              </div>
              <label for="treble" class="label">Highs</label>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend class="label legend">Note</legend>

          <div class="grid2">
            <div class="field">
              <div class="slider-wrapper mb8">
                <input type="range" id="smoothing" class="slider" min="0" max="1" step="0.01" value=${smoothing} onInput=${e => setSmoothing(e.target.value)} />
              </div>
              <label for="smoothing" class="label">Sweep</label>
            </div>

            <div class="field">
              <div class="slider-wrapper mb8">
                <input type="range" id="staccato" class="slider" min="0" max="0.99" step="0.01" value=${staccato} onInput=${e => setStaccato(e.target.value)} />
              </div>
              <label for="staccato" class="label">Decay</label>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend class="label legend">Pulse</legend>

          <div class="grid2">
            <div class="field">
              <div class="slider-wrapper mb8">
                <input type="range" id="pulse-gain" class="slider" min="0" max=${maxVolume} step="0.01" value=${pulseGain} onInput=${e => setPulseGain(e.target.value)} />
              </div>
              <label for="pulse-gain" class="label">Gain</label>
            </div>

            <div class="field">
              <div class="slider-wrapper mb8">
                <input type="range" id="pulse-speed" class="slider" min=${-beats} max="0.25" step="0.25" value=${pulseSpeed} onInput=${e => setPulseSpeed(e.target.value)} />
              </div>
              <label for="pulse-speed" class="label">Speed</label>
            </div>
          </div>
        </fieldset>
      </div>
    </section>
  `)
}


render(html`<${App} />`, document.getElementById('app'))
