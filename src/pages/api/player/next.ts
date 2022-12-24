import type { NextApiResponse } from 'next'
import axios from 'axios'
import { ExtendNextApiRequest } from 'src/types/Types'

/* SpotifyAPI(音楽スキップ)呼び出し */
const next = (req: ExtendNextApiRequest, res: NextApiResponse) => {
  axios
    .post<void>(
      'https://api.spotify.com/v1/me/player/next',
      req.body.deviceId,
      {
        headers: {
          Authorization: 'Bearer ' + req.body.token,
          'Content-Type': 'application/json',
        },
      },
    )
    .then(() => {
      res.status(204).redirect('/?' + req.body).end
    })
    .catch((error) => {
      console.error(`Error: ${error}`)
      res.status(400).redirect('/?' + req.body).end
    })
}

export default next
