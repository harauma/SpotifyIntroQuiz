import { FC, useState, useEffect } from 'react'
import axios from 'axios'
import { v4 as uuid_v4 } from 'uuid'
import { getDatabase, onChildAdded, ref, set } from '@firebase/database'
import { FirebaseError } from '@firebase/util'
import firebaseApp from '@src/lib/firebase/firebase'
import styles from '@styles/components/web_playback.module.scss'
import { Anser } from '@src/types/Types'

type Props = {
  token: string
}

export const WebPlayback: FC<Props> = ({ token }) => {
  const db = getDatabase(firebaseApp)
  // sessionStorage.setItem('roomId', uuid_v4())
  const [roomId, setRoomId] = useState<string>('')
  const [is_paused, setPaused] = useState<boolean>(false)
  const [is_active, setActive] = useState<boolean>(false)
  const [player, setPlayer] = useState<Spotify.Player | null>(null)
  const [current_track, setTrack] = useState<Spotify.Track | null>(null)
  const [deviceId, setDeviceId] = useState<string>('')
  const [isHide, setIsHide] = useState(false)
  const [ansers, setAnsers] = useState<Anser[]>([])
  const [count, setCount] = useState(0)

  /* roomId生成 */
  useEffect(() => {
    setRoomId(uuid_v4())
  }, [])

  /* Spotify SDK読み込み */
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
  }, [])

  /* introレコードの追加検知 */
  useEffect(() => {
    if (roomId === '') {
      return
    }
    setAnsers([])
    try {
      const dbRef = ref(db, `intro/${roomId}`)
      return onChildAdded(dbRef, (snapshot) => {
        const value = snapshot.val()
        setAnsers((prev) => [
          ...prev,
          {
            name: value.name,
            time: value.time,
          },
        ])
        console.log(ansers)
      })
    } catch (e) {
      if (e instanceof FirebaseError) {
        console.error(e)
      }
      return
    }
  }, [roomId])

  /* ゲスト招待用レコード作成、リンクコピー処理 */
  const onClickLinkButton = () => {
    try {
      const dbRefResult = ref(db, `result/${roomId}`)
      set(dbRefResult, {
        token: token,
        deviceId: deviceId,
      })
    } catch (e) {
      if (e instanceof FirebaseError) {
        console.log(e)
      }
    }
    const URL = `${document.URL}${roomId}`
    navigator.clipboard.writeText(URL).then(
      function () {
        console.log('Async: Copying to clipboard was successful!')
      },
      function (err) {
        console.error('Async: Could not copy text: ', err)
      },
    )
  }

  /* toggleで曲名表示非表示切り替え */
  const onClickNowPlayingToggle = () => {
    // 再生中に非表示状態の場合は表示できないように
    if (isHide && !is_paused) return
    setIsHide(!isHide)
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
          </div>
        </div>
      </>
    )
  } else {
    return (
      <>
        <div className="container">
          <div className="now-playing__area">
            <div className="main-wrapper">
              <div className={isHide ? 'hide' : ''}>
                {current_track && current_track.album.images[0].url ? (
                  <img
                    src={current_track.album.images[0].url}
                    className="now-playing__cover"
                    alt=""
                  />
                ) : null}
              </div>
              <div className="now-playing__right">
                <div className={isHide ? 'hide' : 'now-playing__text-area'}>
                  <div className="now-playing__name">{current_track?.name}</div>
                  <div className="now-playing__artist">
                    {current_track?.artists[0].name}
                  </div>
                </div>
                <button
                  className="button btn-spotify"
                  onClick={onClickNowPlayingToggle}
                >
                  曲名非表示
                </button>
              </div>
            </div>
            <div className={styles['controll-area']}>
              <div className={styles['controll-area-top']}>
                <div>
                  <button
                    className="btn-spotify"
                    onClick={() => {
                      player.previousTrack()
                    }}
                  >
                    &lt;&lt;
                  </button>
                </div>
                <div className={styles['play-button']}>
                  <button
                    className="button btn-spotify"
                    onClick={() => {
                      player
                        .togglePlay()
                        .then(() => {})
                        .catch((error) => {
                          if (error.status === 401) {
                            axios
                              .post(
                                '/api/auth/refresh',
                                {},
                                {
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                },
                              )
                              .then(() => {
                                player.togglePlay()
                              })
                          }
                        })
                    }}
                  >
                    {is_paused ? 'PLAY' : 'PAUSE'}
                  </button>
                </div>
                <div>
                  <button
                    className="btn-spotify"
                    onClick={() => {
                      player.nextTrack()
                    }}
                  >
                    &gt;&gt;
                  </button>
                </div>
              </div>
              <div>
                <button
                  className="button btn-spotify"
                  onClick={onClickLinkButton}
                >
                  link
                </button>
                <p>回答者</p>
                {ansers.map((anser, index) => (
                  <div key={anser.time}>
                    <p>
                      {index + 1}番：{anser.name}({anser.time})
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }
}
