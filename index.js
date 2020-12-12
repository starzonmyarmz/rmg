// Make arrangement random on clicking random

import { h, render, Component } from './lib/preact.js'
import { useState, useEffect, useMemo, useRef } from './lib/hooks.js'
import htm from './lib/htm.js'
import { Sequence } from './lib/tinymusic.js'

const html = htm.bind(h)

const keySigs = {
  'none': ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'],
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

const generateNotes = ({ notes, key }) => {
  let collection = []

  for (let x = 0; x < notes; x++) {
    const note = sample(0, keySigs[key].length - 1)
    const duration = sample(0, durations.length - 1)
    collection.push(`${keySigs[key][note]}${sample(1, 8)} ${durations[duration]}`)
  }
  return collection
}

const parseArrangement = () => {
  if (!params.has('arrangement')) return
  return params.get('arrangement').split(',')
}

window.sample = (min, max) => {
  return Math.floor(Math.random() * (1 + max - min) + min)
}

const App = () => {
  const [playing, setPlaying] = useState(false)
  const [notes, setNotes] = useState(params.get('notes') || 8)
  const [rangeMin, setRangeMin] = useState(params.get('rangemin') || 2)
  const [rangeMax, setRangeMax] = useState(params.get('rangemax') || 7)
  const [draggingMin, setDraggingMin] = useState(false)
  const [key, setKey] = useState(params.get('key') || 'none')
  const [arrangement, setArrangement] = useState(parseArrangement() || generateNotes({ notes, key }))
  const [tempo, setTempo] = useState(params.get('tempo') || 120)
  const [wave, setWave] = useState(params.get('wave') || 'square')
  const [gain, setGain] = useState(params.get('gain') || 0.5)
  const [smoothing, setSmoothing] = useState(params.get('smoothing') || 0)
  const [staccato, setStaccato] = useState(params.get('staccato') || 0)
  const [bass, setBass] = useState(params.get('bass') || 0)
  const [mid, setMid] = useState(params.get('mid') || 0)
  const [treble, setTreble] = useState(params.get('treble') || 0)
  const [loop, setLoop] = useState(params.get('loop') || true)
  const sequence = useRef()
  const track_ref = useRef()
  const track_min_ref = useRef()
  const track_max_ref = useRef()

  const togglePlay = () => {
    setPlaying(!playing)

    if (!sequence.current) {
      sequence.current = new Sequence(null, tempo, [])
    }
  }

  const resetSettings = () => {
    setNotes(8)
    setTempo(120)
    setKey('none')
    setWave('square')
    setGain(0.5)
    setSmoothing(0)
    setStaccato(0)
    setBass(0)
    setMid(0)
    setTreble(0)
  }

  const randomSettings = () => {
    setNotes(sample(1, 24))
    setTempo(sample(40, 360))
    setKey(Object.keys(keySigs)[sample(0, 13)])
    setWave(waveTypes[sample(0, 3)])
    setGain(sample(25, 100) / 100)
    setSmoothing(sample(0, 100) / 100)
    setStaccato(sample(0, 99) / 100)
    setBass(sample(-100, 100))
    setMid(sample(-100, 100))
    setTreble(sample(-100, 100))
  }

  const changeNotes = (e) => {
    const notes = e.target.value
    setNotes(notes)
    setArrangement(generateNotes({ notes, key }))
  }

  const changeKey = (e) => {
    const key = Object.keys(keySigs)[e.target.value]
    setKey(key)
    setArrangement(generateNotes({ notes, key }))
  }

  useEffect(() => {
    if (!sequence.current) return

    if (playing) {
      sequence.current.play()
    } else {
      sequence.current.stop()
    }
  }, [playing])

  useEffect(() => {
    params.set('notes', notes)
    params.set('tempo', tempo)
    params.set('key', key)
    params.set('arrangement', arrangement)
    params.set('wave', wave)
    params.set('smoothing', smoothing)
    params.set('staccato', staccato)
    params.set('bass', bass)
    params.set('mid', mid)
    params.set('treble', treble)
    params.set('loop', loop)

    window.history.replaceState({}, '', `${location.pathname}?${params}`);
  }, [notes, tempo, key, arrangement, wave, smoothing, staccato, bass, mid, treble, loop])

  if (sequence.current) {
    sequence.current.notes = []
    sequence.current.push(...arrangement)
    sequence.current.tempo = tempo
    sequence.current.waveType = wave
    sequence.current.smoothing = smoothing
    sequence.current.staccato = staccato
    sequence.current.gain.gain.value = gain
    sequence.current.bass.gain.value = bass
    sequence.current.mid.gain.value = mid
    sequence.current.treble.gain.value = treble
    sequence.current.loop = loop
  }

  useEffect(() => {
    if (!track_ref.current) return
    if (!track_min_ref.current) return
    if (!track_max_ref.current) return

    let min_width = track_min_ref.current.clientWidth
    let max_width = track_max_ref.current.clientWidth
    let width = track_ref.current.clientWidth - min_width

    track_min_ref.current.style.transform = `translateX(${Math.round(width / 7 * (rangeMin - 1))}px)`
    track_max_ref.current.style.transform = `translateX(${Math.round(width / 7 * (rangeMax - 1))}px)`
  }, [rangeMin, rangeMax])

  const range = (min, max) => {
    return(html`
      <div class="track" ref=${track_ref}>
        <button type="button" class="track-btn" value=${min} ref=${track_min_ref}></button>
        <button type="button" class="track-btn" value=${max} ref=${track_max_ref}></button>
      </div>
    `)
  }

  const radio = (name) => {
    return(html`
      <div class="radeck">
        <input type="radio" name="wave" id=${name} value=${name} onInput=${e => setWave(e.target.value)} checked=${wave === name} />
        <label for=${name} class="button">${name}</label>
      </div>
    `)
  }

  return(html`
    <fieldset>
      <legend>Generator</legend>

      <div class="field">
        <label for="notes" class="label">Notes</label>
        <input type="range" id="notes" class="range" min="1" max="24" step="1" value=${notes} onInput=${changeNotes} />
        <output for="notes" class="output">${notes}</output>
      </div>

      <div class="field">
        <label for="key" class="label">Key</label>
        <input type="range" id="key" class="range" min="0" max="13" step="1" value=${Object.keys(keySigs).indexOf(key)} onInput=${changeKey} />
        <output for="key" class="output">${key}</output>
      </div>

      <div class="field">
        <label class="label">Range</label>
        ${range(1, 7)}
        <output class="output">${rangeMin}, ${rangeMax}</output>
      </div>
    </fieldset>

    <fieldset>
      <legend>Wave Type</legend>
      <div class="radios">
        ${waveTypes.map(radio)}
      </div>
    </fieldset>

    <fieldset>
      <legend>Effects</legend>

      <div class="field">
        <label for="tempo" class="label">Tempo</label>
        <input type="range" id="tempo" class="range" min="40" max="360" step="1" value=${tempo} onInput=${e => setTempo(e.target.value)} />
        <output for="tempo" class="output">${tempo}</output>
      </div>

      <div class="field">
        <label for="smoothing" class="label">Sweep</label>
        <input type="range" id="smoothing" class="range" min="0" max="1" step="0.01" value=${smoothing} onInput=${e => setSmoothing(e.target.value)} />
        <output for="smoothing" class="output">${smoothing}</output>
      </div>

      <div class="field">
        <label for="staccato" class="label">Decay</label>
        <input type="range" id="staccato" class="range" min="0" max="1" step="0.01" value=${staccato} onInput=${e => setStaccato(e.target.value)} />
        <output for="staccato" class="output">${staccato}</output>
      </div>
    </fieldset>

    <fieldset>
      <legend>Equalizer</legend>

      <div class="field">
        <label for="bass" class="label">Lows</label>
        <input type="range" id="bass" class="range" min="-100" max="100" value=${bass} onInput=${e => setBass(e.target.value)} />
        <output for="bass" class="output">${bass}</output>
      </div>

      <div class="field">
        <label for="mid" class="label">Mids</label>
        <input type="range" id="mid" class="range" min="-100" max="100" value=${mid} onInput=${e => setMid(e.target.value)} />
        <output for="mid" class="output">${mid}</output>
      </div>

      <div class="field">
        <label for="treble" class="label">Highs</label>
        <input type="range" id="treble" class="range" min="-100" max="100" value=${treble} onInput=${e => setTreble(e.target.value)} />
        <output for="treble" class="output">${treble}</output>
      </div>

      <div class="field">
        <label for="gain" class="label">Gain</label>
        <input type="range" id="gain" class="range" min="0" max="1" step="0.01" value=${gain} onInput=${e => setGain(e.target.value)} />
        <output for="gain" class="output">${gain}</output>
      </div>
    </fieldset>

    <fieldset id="playback">
      <div class="radeck radeck-green">
        <input type="checkbox" id="playing" onInput=${togglePlay} checked=${playing} />
        <label for="playing">${playing ? 'Stop' : 'Play'}</label>
      </div>

      <div class="radeck">
        <input type="checkbox" id="loop" onInput=${e => setLoop(!loop)} checked=${loop} />
        <label for="loop">Loop</label>
      </div>

      <button type="button" class="btn" onClick=${resetSettings}>
        Reset
      </button>

      <button type="button" class="btn" onClick=${randomSettings}>
        Random!
      </button>
    </fieldset>
  `)
}


render(html`<${App} />`, document.getElementById('app'))
