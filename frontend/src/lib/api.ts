const API_BASE = "http://127.0.0.1:8000/api/v1"

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text)
  }
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export async function createPlayer(displayName: string): Promise<{ id: string; displayName: string }> {
  return request("/players", {
    method: "POST",
    body: JSON.stringify({ displayName }),
  })
}

export async function searchPlayers(query = ""): Promise<Array<{ id: string; displayName: string }>> {
  const q = query ? `?query=${encodeURIComponent(query)}` : ""
  return request(`/players${q}`)
}

export async function createEvent(payload: unknown): Promise<{ id: string }> {
  return request("/events", { method: "POST", body: JSON.stringify(payload) })
}

export async function getEvent(id: string): Promise<any> {
  return request(`/events/${id}`)
}

export async function startEvent(id: string): Promise<any> {
  return request(`/events/${id}/start`, { method: "POST" })
}

export async function getCurrentRound(eventId: string): Promise<any> {
  return request(`/events/${eventId}/rounds/current`)
}

export async function submitResult(matchId: string, payload: unknown): Promise<void> {
  await request(`/matches/${matchId}/result`, { method: "POST", body: JSON.stringify(payload) })
}

export async function nextRound(eventId: string): Promise<any> {
  return request(`/events/${eventId}/next`, { method: "POST" })
}

export async function finishEvent(eventId: string): Promise<any> {
  return request(`/events/${eventId}/finish`, { method: "POST" })
}
