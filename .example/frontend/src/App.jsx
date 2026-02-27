import { gsap } from 'gsap'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Aurora from './components/Aurora'
import LogoInteractive from './components/LogoInteractive'
import MagicBento from './components/MagicBento'
import courtImage from './assets/elevel-labs-padel-court.png'
import logoImage from './assets/logo-molndal-transparent.png'
import './App.css'

const API_BASE = 'http://127.0.0.1:8000'

const bentoCards = [
  {
    id: 'americano',
    label: 'Mode',
    title: 'Americano',
    description: (
      <>
      Play with your partner and reach for the top! 
      <br/>
      6 rounds, 15 minutes each, for a total of 90 min.
      </>
    )
  },
  {
    id: 'mexicano',
    label: 'Mode',
    title: 'Mexicano',
    description: (
      <>
      Play with mixed teams and earn points! 
      <br/>
      6 rounds, 15 minutes each, for a total of 90 min.
      </>
    )
  },
  {
    id: 'beat_the_box',
    label: 'Mode',
    title: 'Beat-the-box',
    description: (
      <>
      Play everyone in the box and increase your rank! 
      <br/>
      3 rounds, 30 minutes each, for a total of 90 min.
      </>
    )
  },
]

const emptyEventSetup = {
  title: '',
  start_time: '',
}

const emptyNewPlayer = {
  name: '',
  skill_level: 'Beginner',
}

function firstName(fullName = '') {
  return fullName.trim().split(/\s+/)[0] || fullName
}

function App() {
  const [view, setView] = useState('menu')
  const [selectedMode, setSelectedMode] = useState('')
  const [players, setPlayers] = useState([])
  const [events, setEvents] = useState([])
  const [eventSetup, setEventSetup] = useState(emptyEventSetup)
  const [selectedCourts, setSelectedCourts] = useState([])
  const [selectedPlayerIds, setSelectedPlayerIds] = useState([])
  const [playerQuery, setPlayerQuery] = useState('')
  const [newPlayerForm, setNewPlayerForm] = useState(emptyNewPlayer)

  const [activeEventId, setActiveEventId] = useState(null)
  const [activeEvent, setActiveEvent] = useState(null)
  const [liveRound, setLiveRound] = useState(0)
  const [liveMatches, setLiveMatches] = useState([])
  const [matchHistory, setMatchHistory] = useState([])
  const [showResults, setShowResults] = useState(false)

  const [scoreModal, setScoreModal] = useState({ open: false, match: null, team: 'A', value: 12 })
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const resultsPanelRef = useRef(null)
  const resultsContentRef = useRef(null)

  const auroraColorStops = useMemo(() => ['#7cff67', '#B19EEF', '#5227FF'], [])

  async function api(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    })

    if (!response.ok) {
      let detail = `Request failed (${response.status})`
      try {
        const data = await response.json()
        detail = data?.detail || detail
      } catch {
        // ignore parse errors
      }
      throw new Error(detail)
    }

    return response.json()
  }

  const loadMenuData = useCallback(async () => {
    try {
      setLoading(true)
      const [playersData, eventsData] = await Promise.all([api('/players'), api('/events')])
      setPlayers(playersData)
      setEvents(eventsData)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMenuData()
  }, [loadMenuData])

  const loadLive = useCallback(async (eventId) => {
    try {
      setLoading(true)
      const [liveData, matchesData] = await Promise.all([
        api(`/events/${eventId}/live`),
        api(`/events/${eventId}/matches`),
      ])
      setActiveEvent(liveData.event)
      setLiveRound(liveData.round_number)
      setLiveMatches(liveData.matches)
      setMatchHistory(matchesData)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useLayoutEffect(() => {
    const panel = resultsPanelRef.current
    const content = resultsContentRef.current
    if (!panel || !content) {
      return
    }

    const targetHeight = showResults ? content.scrollHeight : 0
    gsap.to(panel, {
      height: targetHeight,
      opacity: showResults ? 1 : 0,
      duration: showResults ? 0.42 : 0.32,
      ease: 'power3.out',
    })
  }, [showResults, matchHistory, activeEvent])

  const selectedPlayers = useMemo(
    () =>
      selectedPlayerIds
        .map((playerId) => players.find((player) => player.id === playerId))
        .filter(Boolean),
    [players, selectedPlayerIds]
  )

  const playerSuggestions = useMemo(() => {
    const query = playerQuery.trim().toLowerCase()
    if (!query) {
      return []
    }

    return players
      .filter((player) => !selectedPlayerIds.includes(player.id))
      .filter((player) => player.name.toLowerCase().includes(query))
      .slice(0, 8)
  }, [playerQuery, players, selectedPlayerIds])

  const resultsMatrix = useMemo(() => {
    if (!activeEvent?.players?.length) {
      return { rounds: [], rows: [] }
    }

    const rounds = Array.from(new Set(matchHistory.map((match) => match.round_number))).sort((a, b) => a - b)
    const rows = activeEvent.players.map((player) => {
      const roundValues = Object.fromEntries(rounds.map((round) => [round, '-']))

      matchHistory.forEach((match) => {
        if (!match.reported_at) {
          return
        }

        const teamA = [match.team_a_player_1, match.team_a_player_2]
        const teamB = [match.team_b_player_1, match.team_b_player_2]

        if (teamA.includes(player.id) && match.team_a_score != null) {
          roundValues[match.round_number] = String(match.team_a_score)
        }
        if (teamB.includes(player.id) && match.team_b_score != null) {
          roundValues[match.round_number] = String(match.team_b_score)
        }
      })

      return {
        id: player.id,
        name: player.name,
        total: player.total_score,
        roundValues,
      }
    })

    return { rounds, rows }
  }, [activeEvent, matchHistory])

  function goHome() {
    setView('menu')
    setMessage('Modes')
  }

  function openSetup(mode) {
    setSelectedMode(mode)
    setView('setup')
    setEventSetup(emptyEventSetup)
    setSelectedCourts([])
    setSelectedPlayerIds([])
    setPlayerQuery('')
    setMessage(`Setup for ${mode.replaceAll('_', ' ')}`)
  }

  function toggleCourt(courtNumber) {
    setSelectedCourts((previous) =>
      previous.includes(courtNumber)
        ? previous.filter((item) => item !== courtNumber)
        : [...previous, courtNumber]
    )
  }

  function addSelectedPlayer(playerId) {
    setSelectedPlayerIds((previous) => (previous.includes(playerId) ? previous : [...previous, playerId]))
    setPlayerQuery('')
  }

  function removeSelectedPlayer(playerId) {
    setSelectedPlayerIds((previous) => previous.filter((item) => item !== playerId))
  }

  async function addGlobalPlayer(event) {
    event.preventDefault()
    try {
      await api('/players', { method: 'POST', body: JSON.stringify(newPlayerForm) })
      setNewPlayerForm(emptyNewPlayer)
      await loadMenuData()
      setMessage('Global player added.')
    } catch (error) {
      setMessage(error.message)
    }
  }

  async function createEvent(event) {
    event.preventDefault()
    try {
      const created = await api('/events', {
        method: 'POST',
        body: JSON.stringify({
          ...eventSetup,
          owner_name: 'Host',
          location: '',
          game_mode: selectedMode,
          courts: [...selectedCourts].sort((a, b) => a - b),
          player_ids: selectedPlayerIds,
        }),
      })
      setActiveEvent(created)
      setActiveEventId(created.id)
      setView('lobby')
      await loadMenuData()
      setMessage('Event created. Start event when everyone is ready.')
    } catch (error) {
      setMessage(error.message)
    }
  }

  async function startEvent() {
    if (!activeEventId) {
      return
    }

    try {
      setLoading(true)
      await api(`/events/${activeEventId}/start`, { method: 'POST' })
      setView('live')
      await loadLive(activeEventId)
      setMessage('Event started. Courts are live.')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function openLive(eventId) {
    setActiveEventId(eventId)
    setView('live')
    await loadLive(eventId)
  }

  function openMexicanoScore(match, team) {
    if (activeEvent?.game_mode !== 'mexicano' || match.reported_at) {
      return
    }
    setScoreModal({ open: true, match, team, value: 12 })
  }

  async function saveMexicanoScore() {
    const picked = Number(scoreModal.value)
    if (!scoreModal.match || Number.isNaN(picked) || picked < 0 || picked > 24) {
      return
    }

    const teamAScore = scoreModal.team === 'A' ? picked : 24 - picked
    const teamBScore = 24 - teamAScore

    try {
      await api(`/matches/${scoreModal.match.id}/result`, {
        method: 'POST',
        body: JSON.stringify({
          team_a_score: teamAScore,
          team_b_score: teamBScore,
          notes: '',
        }),
      })
      setScoreModal({ open: false, match: null, team: 'A', value: 12 })
      await loadLive(activeEventId)
      setMessage(`Saved court ${scoreModal.match.court_number}: ${teamAScore}-${teamBScore}`)
    } catch (error) {
      setMessage(error.message)
    }
  }

  async function quickResult(match, winner) {
    if (match.reported_at) {
      return
    }

    let payload
    if (winner === 'A') {
      payload = { team_a_score: 1, team_b_score: 0, notes: '' }
    } else if (winner === 'B') {
      payload = { team_a_score: 0, team_b_score: 1, notes: '' }
    } else {
      payload = { team_a_score: 1, team_b_score: 1, notes: '' }
    }

    try {
      await api(`/matches/${match.id}/result`, { method: 'POST', body: JSON.stringify(payload) })
      await loadLive(activeEventId)
      setMessage(`Saved quick result for court ${match.court_number}.`)
    } catch (error) {
      setMessage(error.message)
    }
  }

  async function nextMatch() {
    if (!activeEventId) {
      return
    }

    try {
      await api(`/events/${activeEventId}/next-round`, { method: 'POST' })
      await loadLive(activeEventId)
      setMessage('Next round created.')
    } catch (error) {
      setMessage(error.message)
    }
  }

  const canCreateEvent = useMemo(
    () =>
      selectedCourts.length > 0 &&
      selectedPlayerIds.length >= 4 &&
      selectedPlayerIds.length % 4 === 0 &&
      eventSetup.title.trim().length >= 2 &&
      Boolean(eventSetup.start_time),
    [eventSetup, selectedCourts, selectedPlayerIds]
  )

  return (
    <div className="app-shell">
      <div className="aurora-layer" aria-hidden="true">
        <Aurora colorStops={auroraColorStops} blend={0.5} amplitude={1.0} speed={1} />
      </div>

      <header className="topbar">
        <LogoInteractive src={logoImage} alt="Molndal Padel" onClick={goHome} />
        <div className="topbar-right">
          <strong>Padel Event Studio</strong>
          <span>{activeEvent?.title || 'No active event'}</span>
        </div>
      </header>

      <header className="hero">
        <div className="hero-eyebrow">Host workflow</div>
        <h1>Setup fast. Play rounds. Report live.</h1>
        <p>Dark glass UI with animated Aurora background and mode-first workflow.</p>
      </header>

      {view === 'menu' ? (
        <main className="layout">
          <section className="panel span-two">
            <h2>Modes</h2>
            <MagicBento
              cards={bentoCards}
              onCardClick={(card) => openSetup(card.id)}
              textAutoHide={true}
              enableSpotlight
              enableBorderGlow={true}
              enableTilt={false}
              enableMagnetism={false}
              clickEffect
              spotlightRadius={400}
              glowColor="42, 53, 131"
              disableAnimations={false}
            />
          </section>

          <section className="panel span-two">
            <h2>Open event</h2>
            <div className="event-list">
              {events.map((eventItem) => (
                <button key={eventItem.id} className="event-item" onClick={() => openLive(eventItem.id)}>
                  <strong>{eventItem.title}</strong>
                  <span>
                    {eventItem.game_mode.replaceAll('_', ' ')} | {eventItem.status}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </main>
      ) : null}

      {view === 'setup' ? (
        <main className="layout">
          <section className="panel span-two">
            <MagicBento
              cards={bentoCards}
              onCardClick={(card) => setSelectedMode(card.id)}
              textAutoHide={true}
              enableSpotlight
              enableBorderGlow={true}
              enableTilt={false}
              enableMagnetism={false}
              clickEffect
              spotlightRadius={400}
              glowColor="42, 53, 131"
              disableAnimations={false}
            />
          </section>

          <section className="panel">
            <div className="section-head">
              <h2>{selectedMode.replaceAll('_', ' ')} setup</h2>
              <button className="ghost-btn" onClick={goHome}>
                Back
              </button>
            </div>

            <form className="form-grid" onSubmit={createEvent}>
              <input
                required
                placeholder="Event title"
                value={eventSetup.title}
                onChange={(event) => setEventSetup({ ...eventSetup, title: event.target.value })}
              />
              <input
                required
                type="datetime-local"
                value={eventSetup.start_time}
                onChange={(event) => setEventSetup({ ...eventSetup, start_time: event.target.value })}
              />

              <p className="field-label">Select courts</p>
              <div className="court-grid">
                {[1, 2, 3, 4, 5, 6, 7].map((court) => (
                  <button
                    key={court}
                    type="button"
                    className={`court ${selectedCourts.includes(court) ? 'court-selected' : ''}`}
                    onClick={() => toggleCourt(court)}
                  >
                    <span>Court {court}</span>
                  </button>
                ))}
              </div>

              <button type="submit" disabled={!canCreateEvent}>
                Create event
              </button>
              <p className="helper">Players must be selected in multiples of 4. Current: {selectedPlayerIds.length}</p>
            </form>
          </section>

          <section className="panel">
            <h2>Event players</h2>
            <input
              placeholder="Search registered players"
              value={playerQuery}
              onChange={(event) => setPlayerQuery(event.target.value)}
            />

            {playerSuggestions.length > 0 ? (
              <div className="suggestions-list">
                {playerSuggestions.map((player) => (
                  <button key={player.id} className="suggestion-item" onClick={() => addSelectedPlayer(player.id)}>
                    <span>{player.name}</span>
                    <small>{player.skill_level}</small>
                  </button>
                ))}
              </div>
            ) : null}

            <div className="selected-players-wrap">
              {selectedPlayers.length === 0 ? (
                <p className="helper">No players selected yet.</p>
              ) : (
                selectedPlayers.map((player) => (
                  <div key={player.id} className="selected-player-chip">
                    <span>{player.name}</span>
                    <button className="chip-remove" onClick={() => removeSelectedPlayer(player.id)}>
                      x
                    </button>
                  </div>
                ))
              )}
            </div>

            <form className="inline-form inline-form-single" onSubmit={addGlobalPlayer}>
              <input
                required
                placeholder="Register new player"
                value={newPlayerForm.name}
                onChange={(event) => setNewPlayerForm({ ...newPlayerForm, name: event.target.value })}
              />
              <select
                value={newPlayerForm.skill_level}
                onChange={(event) => setNewPlayerForm({ ...newPlayerForm, skill_level: event.target.value })}
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
                <option>Pro</option>
              </select>
              <button type="submit">Add</button>
            </form>
          </section>
        </main>
      ) : null}

      {view === 'lobby' ? (
        <main className="layout">
          <section className="panel span-two">
            <MagicBento
              cards={bentoCards}
              onCardClick={() => {}}
              textAutoHide={true}
              enableSpotlight
              enableBorderGlow={true}
              enableTilt={false}
              enableMagnetism={false}
              clickEffect
              spotlightRadius={400}
              glowColor="42, 53, 131"
              disableAnimations={false}
            />
          </section>

          <section className="panel">
            <h2>Event lobby</h2>
            <p className="helper">Start event when players are ready.</p>
            <button onClick={startEvent}>Start event</button>
          </section>

          <section className="panel">
            <h2>Selected players</h2>
            <div className="standings-list">
              {(activeEvent?.players || []).map((player) => (
                <div key={player.id} className="standing-row">
                  <strong>{player.name}</strong>
                  <span>{player.skill_level}</span>
                </div>
              ))}
            </div>
          </section>
        </main>
      ) : null}

      {view === 'live' ? (
        <main className="layout">
          <section className="panel span-two">
            <MagicBento
              cards={bentoCards}
              onCardClick={(card) => setMessage(`Mode card: ${card.title}`)}
              textAutoHide={true}
              enableSpotlight
              enableBorderGlow={true}
              enableTilt={false}
              enableMagnetism={false}
              clickEffect
              spotlightRadius={400}
              glowColor="42, 53, 131"
              disableAnimations={false}
            />
          </section>

          <section className="panel span-two">
            <div className="section-head">
              <h2>
                Round {liveRound} - {activeEvent?.title}
              </h2>
              <button className="ghost-btn" onClick={goHome}>
                Back
              </button>
            </div>
            <p className="helper">Only current event courts are shown.</p>

            <div className="live-controls-row">
              <button className="next-match-btn" onClick={nextMatch}>
                Next match
              </button>
              <button className="ghost-btn" onClick={() => setShowResults((current) => !current)}>
                {showResults ? 'Hide results' : 'View results'}
              </button>
            </div>

            <div className="results-panel" ref={resultsPanelRef}>
              <div className="results-inner" ref={resultsContentRef}>
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>Player</th>
                      {resultsMatrix.rounds.map((round) => (
                        <th key={round}>R{round}</th>
                      ))}
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultsMatrix.rows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.name}</td>
                        {resultsMatrix.rounds.map((round) => (
                          <td key={`${row.id}-${round}`}>{row.roundValues[round]}</td>
                        ))}
                        <td>{row.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="panel span-two">
            <h2>Live courts</h2>
            <div className="live-courts-grid">
              {liveMatches.map((match) => {
                const isMexicano = activeEvent?.game_mode === 'mexicano'
                return (
                  <article key={match.id} className="court-card">
                    <div className="court-card-head">
                      <strong>Court {match.court_number}</strong>
                      <span className="score-chip">{match.score || 'No score yet'}</span>
                    </div>

                    <div className="court-visual" style={{ backgroundImage: `url(${courtImage})` }}>
                      <button
                        className="player-dot p-a1"
                        onClick={() => openMexicanoScore(match, 'A')}
                        disabled={!isMexicano || Boolean(match.reported_at)}
                        title={match.team_a_player_1_name}
                      >
                        {firstName(match.team_a_player_1_name)}
                      </button>
                      <button
                        className="player-dot p-a2"
                        onClick={() => openMexicanoScore(match, 'A')}
                        disabled={!isMexicano || Boolean(match.reported_at)}
                        title={match.team_a_player_2_name}
                      >
                        {firstName(match.team_a_player_2_name)}
                      </button>
                      <button
                        className="player-dot p-b1"
                        onClick={() => openMexicanoScore(match, 'B')}
                        disabled={!isMexicano || Boolean(match.reported_at)}
                        title={match.team_b_player_1_name}
                      >
                        {firstName(match.team_b_player_1_name)}
                      </button>
                      <button
                        className="player-dot p-b2"
                        onClick={() => openMexicanoScore(match, 'B')}
                        disabled={!isMexicano || Boolean(match.reported_at)}
                        title={match.team_b_player_2_name}
                      >
                        {firstName(match.team_b_player_2_name)}
                      </button>
                    </div>

                    {isMexicano ? (
                      <p className="helper small">Click any player name to pick Team score (0-24).</p>
                    ) : (
                      <div className="quick-actions">
                        <button onClick={() => quickResult(match, 'A')} disabled={Boolean(match.reported_at)}>
                          Team A Win
                        </button>
                        <button onClick={() => quickResult(match, 'draw')} disabled={Boolean(match.reported_at)}>
                          Draw
                        </button>
                        <button onClick={() => quickResult(match, 'B')} disabled={Boolean(match.reported_at)}>
                          Team B Win
                        </button>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          </section>
        </main>
      ) : null}

      {scoreModal.open ? (
        <div className="modal-backdrop" onClick={() => setScoreModal({ open: false, match: null, team: 'A', value: 12 })}>
          <div className="score-modal" onClick={(event) => event.stopPropagation()}>
            <h3>Set Team {scoreModal.team} score</h3>
            <p className="helper">Mexicano only. Opposite team is auto: 24 - selected score.</p>
            <select
              value={scoreModal.value}
              onChange={(event) =>
                setScoreModal((previous) => ({ ...previous, value: Number(event.target.value) }))
              }
            >
              {Array.from({ length: 25 }).map((_, value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <div className="modal-actions">
              <button className="ghost-btn" onClick={() => setScoreModal({ open: false, match: null, team: 'A', value: 12 })}>
                Cancel
              </button>
              <button onClick={saveMexicanoScore}>Save score</button>
            </div>
          </div>
        </div>
      ) : null}

      <footer className="status-bar">{loading ? 'Loading...' : message || 'Ready.'}</footer>
    </div>
  )
}

export default App
