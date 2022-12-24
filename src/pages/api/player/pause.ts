import type { NextApiResponse } from 'next'
import axios from 'axios'
import { ExtendNextApiRequest } from 'src/types/Types'
import { AxiosResponse } from 'axios'

interface a {
  a: string
}
/* SpotifyAPI(音楽停止)呼び出し */
const pause = (req: ExtendNextApiRequest, res: NextApiResponse) => {
  axios
    .put<void>(
      `https://api.spotify.com/v1/me/player/pause?device_id=${req.body.deviceId}`,
      {},
      {
        headers: {
          Authorization: 'Bearer ' + req.body.token,
          'Content-Type': 'application/json',
        },
      },
    )
    .then(() => {
      res.status(204).end()
    })
    .catch((error) => {
      console.error(`Error: ${error}`)
      res.status(400).end()
    })
}

export default pause
