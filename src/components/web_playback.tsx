import { useRouter } from 'next/router'
import { FC, useState, useEffect } from 'react'
import axios from 'axios'

type Props = {
  token: string
}

export const WebPlayback: FC<Props> = ({ token }) => {
  const router = useRouter()
  const [is_paused, setPaused] = useState<boolean>(false)
  const [is_active, setActive] = useState<boolean>(false)
  const [player, setPlayer] = useState<Spotify.Player | null>(null)
  const [current_track, setTrack] = useState<Spotify.Track | null>(null)
  const [deviceId, setDeviceId] = useState<string>('')
  const [queryParam, setQueryParam] = useState<string>('')

  /* URLパラメータ取得 */
  useEffect(() => {
    if (!router.isReady) {
      return
    }
    setQueryParam((router.query['device_id'] as string) || '')
  }, [router.query])

  /* SDK読み込み */
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://sdk.scdn.co/spotify-player.js'
    script.async = true

    document.body.appendChild(script)

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: 'Web Playback SDK',
        getOAuthToken: (cb) => {
          cb(token)
        },
        volume: 0.5,
      })

      setPlayer(player)

      player.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id)
        setDeviceId(device_id)
      })

      player.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id)
      })

      player.addListener('player_state_changed', (state) => {
        if (!state) {
          return
        }

        setTrack(state.track_window.current_track)
        setPaused(state.paused)

        player.getCurrentState().then((state) => {
          if (!state) {
            setActive(false)
          } else {
            setActive(true)
          }
        })
      })

      player.connect()
    }
  }, [token])

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

  /* 音楽スキップ処理 */
  const onClickNext = () => {
    axios.post(
      '/api/player/next',
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

  /* ゲスト招待リンクコピー処理 */
  const onClickLinkButton = () => {
    // router.push({
    //   pathname: '/',
    //   query: { device_id: deviceId },
    // })
    const URL = `${document.URL}${token}?device_id=${deviceId}`
    console.log(URL)
    navigator.clipboard.writeText(URL).then(
      function () {
        console.log('Async: Copying to clipboard was successful!')
      },
      function (err) {
        console.error('Async: Could not copy text: ', err)
      },
    )
  }

  if (!player) {
    return (
      <>
        <div className="container">
          <div className="main-wrapper">
            <b>Spotify Player is null</b>
          </div>
        </div>
      </>
    )
  } else if (!is_active) {
    return (
      <>
        <div className="container">
          <div className="main-wrapper">
            <b>
              Instance not active. Transfer your playback using your Spotify app
            </b>
            <button className="btn-spotify" onClick={onClickPause}>
              PAUSE
            </button>
          </div>
        </div>
      </>
    )
  } else {
    return (
      <>
        <div className="container">
          <div className="main-wrapper">
            <div className=""></div>
            {current_track && current_track.album.images[0].url ? (
              <img
                src={current_track.album.images[0].url}
                className="now-playing__cover"
                alt=""
              />
            ) : null}

            <div className="now-playing__side">
              <div className="now-playing__name">{current_track?.name}</div>
              <div className="now-playing__artist">
                {current_track?.artists[0].name}
              </div>
            </div>
            <div>
              <button
                className="btn-spotify"
                onClick={() => {
                  player.previousTrack()
                }}
              >
                &lt;&lt;
              </button>

              <button
                className="btn-spotify"
                onClick={() => {
                  player.togglePlay()
                }}
              >
                {is_paused ? 'PLAY' : 'PAUSE'}
              </button>

              <button
                className="btn-spotify"
                onClick={() => {
                  player.nextTrack()
                }}
              >
                &gt;&gt;
              </button>
            </div>
            <div>
              <button className="btn-spotify" onClick={onClickPause}>
                PAUSE
              </button>

              <button className="btn-spotify" onClick={onClickNext}>
                NEXT
              </button>

              <button className="btn-spotify" onClick={onClickLinkButton}>
                link
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }
}
