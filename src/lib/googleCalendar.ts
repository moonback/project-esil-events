import type { Mission, User } from '@/types/database'

export interface GoogleCalendarEvent {
  id?: string
  summary: string
  description: string
  location: string
  start: {
    dateTime: string
    timeZone: string
  }
  end: {
    dateTime: string
    timeZone: string
  }
  attendees: Array<{
    email: string
    displayName: string
  }>
  reminders: {
    useDefault: false
    overrides: Array<{
      method: 'email'
      minutes: number
    }>
  }
}

export interface GoogleCalendarConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  accessToken?: string
  refreshToken?: string
}

class GoogleCalendarService {
  private accessToken: string | null = null
  private refreshToken: string | null = null
  private config: GoogleCalendarConfig | null = null

  constructor() {
    // Charger les tokens depuis le localStorage
    this.accessToken = localStorage.getItem('google_access_token')
    this.refreshToken = localStorage.getItem('google_refresh_token')
    
    // Charger la configuration depuis les variables d'environnement
    this.config = {
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
      clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '',
      redirectUri: import.meta.env.VITE_GOOGLE_REDIRECT_URI || '',
    }
  }

  async initialize(): Promise<boolean> {
    if (!this.config?.clientId) {
      console.error('Google Client ID non configuré')
      return false
    }

    // Vérifier si nous avons un token valide
    if (this.accessToken) {
      try {
        const isValid = await this.validateToken()
        if (isValid) {
          return true
        }
      } catch (error) {
        console.error('Erreur lors de la validation du token:', error)
      }
    }

    return false
  }

  generateAuthUrl(): string {
    if (!this.config?.clientId || !this.config?.redirectUri) {
      throw new Error('Configuration Google incomplète')
    }

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/calendar',
      access_type: 'offline',
      prompt: 'consent',
    })

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  }

  async exchangeCodeForToken(code: string): Promise<boolean> {
    if (!this.config?.clientId || !this.config?.clientSecret || !this.config?.redirectUri) {
      throw new Error('Configuration Google incomplète')
    }

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: this.config.redirectUri,
        }),
      })

      if (!response.ok) {
        throw new Error(`Erreur OAuth: ${response.status}`)
      }

      const data = await response.json()
      this.accessToken = data.access_token
      this.refreshToken = data.refresh_token

      // Sauvegarder les tokens
      localStorage.setItem('google_access_token', this.accessToken)
      if (this.refreshToken) {
        localStorage.setItem('google_refresh_token', this.refreshToken)
      }

      return true
    } catch (error) {
      console.error('Erreur lors de l\'échange du code:', error)
      return false
    }
  }

  private async validateToken(): Promise<boolean> {
    if (!this.accessToken) return false

    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + this.accessToken)
      return response.ok
    } catch (error) {
      console.error('Erreur lors de la validation du token:', error)
      return false
    }
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken || !this.config?.clientId || !this.config?.clientSecret) {
      return false
    }

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          refresh_token: this.refreshToken,
          grant_type: 'refresh_token',
        }),
      })

      if (!response.ok) {
        throw new Error(`Erreur de rafraîchissement: ${response.status}`)
      }

      const data = await response.json()
      this.accessToken = data.access_token

      // Sauvegarder le nouveau token
      localStorage.setItem('google_access_token', this.accessToken)

      return true
    } catch (error) {
      console.error('Erreur lors du rafraîchissement du token:', error)
      return false
    }
  }

  private async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    if (!this.accessToken) {
      throw new Error('Non authentifié')
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (response.status === 401) {
      // Token expiré, essayer de le rafraîchir
      const refreshed = await this.refreshAccessToken()
      if (refreshed) {
        // Réessayer la requête avec le nouveau token
        return fetch(url, {
          ...options,
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            ...options.headers,
          },
        })
      }
    }

    return response
  }

  async createMissionEvent(mission: Mission, technicians: User[], calendarId: string = 'primary'): Promise<string | null> {
    if (!this.accessToken) {
      throw new Error('Non authentifié')
    }

    try {
      const event: GoogleCalendarEvent = {
        summary: `Mission: ${mission.title}`,
        description: this.formatMissionDescription(mission),
        location: mission.address,
        start: {
          dateTime: new Date(mission.start_time).toISOString(),
          timeZone: 'Europe/Paris',
        },
        end: {
          dateTime: new Date(mission.end_time).toISOString(),
          timeZone: 'Europe/Paris',
        },
        attendees: technicians.map(tech => ({
          email: tech.email,
          displayName: `${tech.first_name} ${tech.last_name}`,
        })),
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 24 heures avant
            { method: 'email', minutes: 60 }, // 1 heure avant
          ],
        },
      }

      const response = await this.makeAuthenticatedRequest(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
        {
          method: 'POST',
          body: JSON.stringify(event),
        }
      )

      if (!response.ok) {
        throw new Error(`Erreur lors de la création de l'événement: ${response.status}`)
      }

      const createdEvent = await response.json()
      return createdEvent.id
    } catch (error) {
      console.error('Erreur lors de la création de l\'événement:', error)
      return null
    }
  }

  async updateMissionEvent(eventId: string, mission: Mission, technicians: User[], calendarId: string = 'primary'): Promise<boolean> {
    if (!this.accessToken) {
      throw new Error('Non authentifié')
    }

    try {
      const event: GoogleCalendarEvent = {
        summary: `Mission: ${mission.title}`,
        description: this.formatMissionDescription(mission),
        location: mission.address,
        start: {
          dateTime: new Date(mission.start_time).toISOString(),
          timeZone: 'Europe/Paris',
        },
        end: {
          dateTime: new Date(mission.end_time).toISOString(),
          timeZone: 'Europe/Paris',
        },
        attendees: technicians.map(tech => ({
          email: tech.email,
          displayName: `${tech.first_name} ${tech.last_name}`,
        })),
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'email', minutes: 60 },
          ],
        },
      }

      const response = await this.makeAuthenticatedRequest(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
        {
          method: 'PUT',
          body: JSON.stringify(event),
        }
      )

      return response.ok
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'événement:', error)
      return false
    }
  }

  async deleteMissionEvent(eventId: string, calendarId: string = 'primary'): Promise<boolean> {
    if (!this.accessToken) {
      throw new Error('Non authentifié')
    }

    try {
      const response = await this.makeAuthenticatedRequest(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
        {
          method: 'DELETE',
        }
      )

      return response.ok
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'événement:', error)
      return false
    }
  }

  async listCalendars(): Promise<Array<{ id: string; summary: string }>> {
    if (!this.accessToken) {
      throw new Error('Non authentifié')
    }

    try {
      const response = await this.makeAuthenticatedRequest(
        'https://www.googleapis.com/calendar/v3/users/me/calendarList'
      )

      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération des calendriers: ${response.status}`)
      }

      const data = await response.json()
      return data.items.map((calendar: any) => ({
        id: calendar.id,
        summary: calendar.summary,
      }))
    } catch (error) {
      console.error('Erreur lors de la récupération des calendriers:', error)
      return []
    }
  }

  private formatMissionDescription(mission: Mission): string {
    return `
Mission: ${mission.title}

Description: ${mission.description}

Type: ${mission.mission_type}

Adresse: ${mission.address}

Instructions spéciales: ${mission.special_instructions || 'Aucune'}

Contact: ${mission.contact_name} - ${mission.contact_phone}
    `.trim()
  }

  logout(): void {
    this.accessToken = null
    this.refreshToken = null
    localStorage.removeItem('google_access_token')
    localStorage.removeItem('google_refresh_token')
  }

  isAuthenticated(): boolean {
    return !!this.accessToken
  }
}

export const googleCalendarService = new GoogleCalendarService() 