import { useRouter } from 'next/router'
import { FC, useState, useEffect } from 'react'
import axios from 'axios'

type Props = {
  token: string
}

export const WebPlayback: FC<Props> = () => {
  const router = useRouter()
  const [token, setToken] = useState<string>('')
  const [queryParam, setQueryParam] = useState<string>('')

  /* URLパラメータ取得処理 */
  useEffect(() => {
    if (!router.isReady) {
      return
    }
    setToken((router.query['id'] as string) || '')
    setQueryParam((router.query['device_id'] as string) || '')
  }, [router.query])

  /* 音楽停止処理 */
  const onClickPause = () => {
    axios.post(
      '/api/player/pause',
      {
        token: token,
        deviceId: queryParam,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )
  }

  return (
    <>
      <div className="container">
        <div className="main-wrapper">
          <button className="btn-spotify" onClick={onClickPause}>
            PAUSE
          </button>
        </div>
      </div>
    </>
  )
}

export default WebPlayback
