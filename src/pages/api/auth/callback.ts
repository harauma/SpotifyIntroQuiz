import type { NextApiRequest, NextApiResponse } from 'next'
import { serialize, CookieSerializeOptions } from 'cookie'
import axios from 'axios'
import { SpotifyAuthApiResponse } from 'src/types/Types'

export const setCookie = (
  res: NextApiResponse,
  cookies: {
    name: string
    value: unknown
  }[],
) => {
  const setValues: string[] = []

  const options: CookieSerializeOptions = {
    httpOnly: true,
    secure: true,
    path: '/',
  }

  cookies.forEach((cookie) => {
    const stringValue =
      typeof cookie.value === 'object'
        ? 'j:' + JSON.stringify(cookie.value)
        : String(cookie.value)
    setValues.push(serialize(cookie.name, stringValue, options))
  })
  res.setHeader('Set-Cookie', setValues)
}

const callback = async (req: NextApiRequest, res: NextApiResponse) => {
  const code = req.query.code
  const spotify_redirect_uri = process.env.APP_URL + '/api/auth/callback'

  let spotify_client_id = ''
  if (process.env.SPOTIFY_CLIENT_ID) {
    spotify_client_id = process.env.SPOTIFY_CLIENT_ID
  } else {
    console.error(
      'Undefined Error: An environmental variable, "SPOTIFY_CLIENT_ID", has something wrong.',
    )
  }

  let spotify_client_secret = ''
  if (process.env.SPOTIFY_CLIENT_SECRET) {
    spotify_client_secret = process.env.SPOTIFY_CLIENT_SECRET
  } else {
    console.error(
      'Undefined Error: An environmental variable, "SPOTIFY_CLIENT_SECRET", has something wrong.',
    )
  }

  const params = new URLSearchParams({
    code: code as string,
    redirect_uri: spotify_redirect_uri,
    grant_type: 'authorization_code',
  })

  axios
    .post<SpotifyAuthApiResponse>(
      'https://accounts.spotify.com/api/token',
      params,
      {
        headers: {
          Authorization:
            'Basic ' +
            Buffer.from(
              spotify_client_id + ':' + spotify_client_secret,
            ).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    )
    .then((response) => {
      if (response.data.access_token && response.data.refresh_token) {
        const cookies = [
          {
            name: 'spotify-token',
            value: response.data.access_token,
          },
          {
            name: 'spotify-refreshToken',
            value: response.data.refresh_token,
          },
        ]
        setCookie(res, cookies)
        res.status(200).redirect('/')
      }
    })
    .catch((error) => {
      console.error(`Error: ${error}`)
    })
}

export default callback
