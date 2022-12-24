import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'
import { setCookie } from './callback'

/*
 * アクセストークン再取得処理
 * tokenの再取得は可能だがSDKでは同一deviceIdを再利用できなさそうなので要検討
 */
const refresh = (req: NextApiRequest, res: NextApiResponse) => {
  const refreshToken = req.cookies?.['spotify-refreshToken'] || ''

  if (refreshToken === '') {
    res.status(400).end()
  }

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  })

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

  axios
    .post('https://accounts.spotify.com/api/token', params, {
      headers: {
        Authorization:
          'Basic ' +
          Buffer.from(spotify_client_id + ':' + spotify_client_secret).toString(
            'base64',
          ),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    .then((response) => {
      if (response.data.access_token) {
        const cookies = [
          {
            name: 'spotify-token',
            value: response.data.access_token,
          },
          {
            name: 'spotify-refreshToken',
            value: refreshToken,
          },
        ]
        setCookie(res, cookies)
        res.status(200).end()
      }
    })
    .catch((error) => {
      console.error(`Error: ${error}`)
      res.status(400).end()
    })
}

export default refresh
