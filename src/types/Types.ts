import type { NextApiRequest } from 'next'

export interface ExtendNextApiRequest extends NextApiRequest {
  body: {
    token: string
    deviceId: string
  }
}

export interface SpotifyAuthApiResponse {
  access_token: string
  token_type: string
  scope: string
  expires_in: number
  refresh_token: string
}

export interface Anser {
  name: string
  time: string
}

export interface Ranking {
  [name: string]: {
    score: number
    order?: number
  }
}
