import { useRouter } from 'next/router'
import { FC, useState, useEffect } from 'react'
import axios from 'axios'

type Props = {
  token: string
}

export const WebPlayback: FC<Props> = () => {
  const router = useRouter()
  const [isClick, setIsClick] = useState<boolean>(false)
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
    setIsClick(true)
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
          <div className="column">
            <div>
              <button
                className="btn-spotify"
                onClick={onClickPause}
                disabled={isClick}
              >
                PAUSE
              </button>
            </div>
            <div>
              <button className="btn-spotify" onClick={() => setIsClick(false)}>
                解除
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default WebPlayback
