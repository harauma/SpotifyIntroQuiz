import { FC, useState, useEffect } from 'react'
import axios from 'axios'
import { v4 as uuid_v4 } from 'uuid'
import { getDatabase, onChildAdded, ref, set } from '@firebase/database'
import { FirebaseError } from '@firebase/util'
import firebaseApp from '@src/lib/firebase/firebase'
import styles from '@styles/components/web_playback.module.scss'
import { Anser, User } from '@src/types/Types'
import {
  get,
  onChildChanged,
  onChildRemoved,
  push,
  remove,
  update,
} from 'firebase/database'
import dayjs from 'dayjs'
import useSound from 'use-sound'
import { Link, Typography } from '@mui/material'

type Props = {
  token: string
}

export const WebPlayback: FC<Props> = ({ token }) => {
  const db = getDatabase(firebaseApp)
  const [playCorrectSound] = useSound('/mp3/correct.mp3')
  const [playWrongSound] = useSound('/mp3/wrong.mp3')
  const [playResultSound] = useSound('/mp3/result.mp3')
  const [playQuestionSound] = useSound('/mp3/question.mp3')
  const [roomId, setRoomId] = useState<string>('')
  const [wrongUserKey, setWrongUserKey] = useState<string>('')
  const [is_paused, setPaused] = useState<boolean>(false)
  const [is_active, setActive] = useState<boolean>(false)
  const [player, setPlayer] = useState<Spotify.Player | null>(null)
  const [current_track, setTrack] = useState<Spotify.Track | null>(null)
  const [deviceId, setDeviceId] = useState<string>('')
  const [isHide, setIsHide] = useState(false)
  const [ansers, setAnsers] = useState<Anser[]>([])
  const [ranking, setRanking] = useState<User>({})

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
      })
    } catch (e) {
      if (e instanceof FirebaseError) {
        console.error(e)
      }
      return
    }
  }, [roomId])

  /* introレコードの削除検知 */
  useEffect(() => {
    if (roomId === '') {
      return
    }
    try {
      const dbRef = ref(db, `intro/${roomId}`)
      return onChildRemoved(dbRef, (snapshot) => {
        setAnsers((prev) =>
          prev.filter((ans) => {
            return ans.time !== snapshot.val().time
          }),
        )
      })
    } catch (e) {
      if (e instanceof FirebaseError) {
        console.error(e)
      }
      return
    }
  }, [roomId])

  /* 点数記録の追加検知 */
  useEffect(() => {
    if (roomId === '') {
      return
    }
    try {
      const dbRef = ref(db, `result/${roomId}/users`)
      return onChildAdded(dbRef, getRankingData)
    } catch (e) {
      if (e instanceof FirebaseError) {
        console.error(e)
      }
      return
    }
  }, [roomId])

  /* 点数記録の変更検知 */
  useEffect(() => {
    if (roomId === '') {
      return
    }
    try {
      const dbRef = ref(db, `result/${roomId}/users`)
      return onChildChanged(dbRef, getRankingData)
    } catch (e) {
      if (e instanceof FirebaseError) {
        console.error(e)
      }
      return
    }
  }, [roomId])

  // ランキングデータ取得
  const getRankingData = () => {
    try {
      const dbRef = ref(db, `result/${roomId}/users`)
      get(dbRef)
        .then((snapshot) => {
          const value = snapshot.val()
          if (snapshot.exists()) {
            let rank: User = {}
            Object.keys(value).forEach((key) => {
              rank = Object.assign(rank, {
                [value[key].name]: {
                  score: value[key].score,
                },
              })
            })
            rank = Object.keys(rank)
              .sort((a, b) => {
                // オブジェクトをスコアの降順にソート
                return rank[a].score > rank[b].score ? -1 : 1
              })
              .reduce((prev: User, name, index): User => {
                // 順位をオブジェクトに設定(同一の正解数の場合は同順位)
                const someOrder = Object.keys(prev).find((key) => {
                  return key !== name && prev[key].score === rank[name].score
                })
                return {
                  ...prev,
                  [name]: {
                    score: rank[name].score,
                    order:
                      someOrder && prev[someOrder].order
                        ? prev[someOrder].order
                        : index + 1,
                    canAnser: rank[name].canAnser,
                  },
                }
              }, {})
            setRanking(rank)
          }
        })
        .catch((error) => {
          console.error(error)
        })
    } catch (e) {
      if (e instanceof FirebaseError) {
        console.log(e)
      }
    }
  }

  /* 問題出題処理 */
  const nextTrack = () => {
    if (!player) {
      return
    }
    playQuestionSound()
    const now = dayjs()
    const dbRefResult = ref(db, `result/${roomId}`)
    update(dbRefResult, {
      doStart: true,
      startTime: now.format('YYYY/MM/DD HH:mm:ss.SSS'),
    })
    setTimeout(() => {
      player.nextTrack()
    }, 2000)
  }

  /* ゲスト招待用レコード作成、リンクコピー処理 */
  const onClickLinkButton = () => {
    const uuid = uuid_v4()
    // roomIdが未生成の場合のみ生成処理
    if (roomId === '') {
      setRoomId(uuid)
      try {
        const dbRefResult = ref(db, `result/${uuid}`)
        set(dbRefResult, {
          token: token,
          deviceId: deviceId,
          doStart: false,
        })
      } catch (e) {
        if (e instanceof FirebaseError) {
          console.log(e)
        }
      }
    }
    const URL = document.URL + (roomId !== '' ? roomId : uuid)
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
    if (isHide) {
      playResultSound()
      setTimeout(() => {
        setIsHide(!isHide)
      }, 2400)
    } else {
      setIsHide(!isHide)
    }
  }

  /* 正解ボタン押下時処理 */
  const onClickCorrectButton = async (anser: string) => {
    if (ansers.length < 1) {
      return
    }
    playCorrectSound()

    // introHistryに回答記録をコピー
    try {
      const dbRef = ref(db, `introHistry/${roomId}`)
      await push(dbRef, {
        musicName: current_track?.name,
        ansers,
      })
    } catch (e) {
      if (e instanceof FirebaseError) {
        console.log(e)
      }
    }

    // result/roomid/users/nameに点数登録
    try {
      let dbRef = ref(db, `result/${roomId}/users`)
      await get(dbRef)
        .then(async (snapshot) => {
          const value = snapshot.val()
          if (snapshot.exists()) {
            // 正解者の登録済みの点数を絞り込み
            const key = Object.keys(value).find((key) => {
              return value[key].name === anser
            })
            if (key !== undefined) {
              dbRef = ref(db, `result/${roomId}/users/${key}`)
              await update(dbRef, {
                name: value[key].name,
                score: value[key].score + 1,
              })
            } else {
              await push(dbRef, {
                name: anser,
                score: 1,
              })
            }
          } else {
            dbRef = ref(db, `result/${roomId}/users`)
            await push(dbRef, {
              name: anser,
              score: 1,
            })
          }
        })
        .catch((error) => {
          console.error(error)
        })
    } catch (e) {
      if (e instanceof FirebaseError) {
        console.log(e)
      }
    }
    if (wrongUserKey !== '') {
      resetCanAnserFlag(wrongUserKey)
    }
    deleteIntro()
  }

  /* 不正解ボタン押下時処理 */
  const onClickWrongButton = (anser: string) => {
    playWrongSound()
    if (wrongUserKey !== '') {
      resetCanAnserFlag(wrongUserKey)
    }
    // result/roomid/users/nameに点数登録
    try {
      const dbRef = ref(db, `result/${roomId}/users`)
      get(dbRef)
        .then((snapshot) => {
          if (!snapshot.exists()) {
            return
          }
          const value = snapshot.val()
          const key = Object.keys(value).find((key) => {
            return value[key].name === anser
          })
          if (!key) {
            return
          }
          update(dbRef, {
            [key]: {
              name: value[key].name,
              score: value[key].score > 0 ? value[key].score - 1 : 0,
              canAnser: false,
            },
          })
          setWrongUserKey(key)
        })
        .catch((error) => {
          console.error(error)
        })
    } catch (e) {
      if (e instanceof FirebaseError) {
        console.log(e)
      }
    }
    deleteIntro()
  }

  /* 早押し結果をクリア */
  const deleteIntro = () => {
    try {
      remove(ref(db, `intro/${roomId}`))
      clearDoStart()
    } catch (e) {
      if (e instanceof FirebaseError) {
        console.log(e)
      }
    }
  }

  /* スタートフラグをFalseに設定 */
  const clearDoStart = () => {
    const dbRefResult = ref(db, `result/${roomId}`)
    update(dbRefResult, {
      doStart: false,
    })
  }

  /* 対象ユーザの不正解時のペナルティクリア */
  const resetCanAnserFlag = (userKey: string) => {
    const dbRef = ref(db, `result/${roomId}/users/${userKey}`)
    get(dbRef)
      .then((snapshot) => {
        if (!snapshot.exists()) {
          return
        }
        const value = snapshot.val()
        update(dbRef, {
          name: value.name,
          score: value.score,
          canAnser: true,
        })
        setWrongUserKey('')
      })
      .catch((error) => {
        console.error(error)
      })
  }

  if (!player) {
    return (
      <>
        <div className="container">
          <div className="main-wrapper">
            <Typography className="center" variant="body1" gutterBottom>
              Spotify Player is null
            </Typography>
          </div>
        </div>
      </>
    )
  } else if (!is_active) {
    return (
      <>
        <div className="container">
          <div className="main-wrapper">
            <Typography className="center" variant="body1" gutterBottom>
              Instance not active. Transfer your playback using your Spotify app
            </Typography>
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
              <div className={'playing__left ' + (isHide ? 'hide' : 'show')}>
                {current_track && current_track.album.images[0].url ? (
                  <img
                    src={current_track.album.images[0].url}
                    className="now-playing__cover"
                    alt=""
                  />
                ) : null}
              </div>
              <div className="now-playing__right">
                <div
                  className={isHide ? 'hide' : 'now-playing__text-area show'}
                >
                  <div className="now-playing__name">
                    <Typography className="center" variant="body1" gutterBottom>
                      {current_track?.name}
                    </Typography>
                  </div>
                  <div className="now-playing__artist">
                    <Typography className="center" variant="body1" gutterBottom>
                      {current_track?.artists[0].name}
                    </Typography>
                  </div>
                </div>
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
                    className="full-width btn-spotify"
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
                  <button className="btn-spotify" onClick={nextTrack}>
                    &gt;&gt;
                  </button>
                </div>
              </div>
              <div>
                <button
                  className="full-width mb btn-spotify"
                  onClick={onClickNowPlayingToggle}
                >
                  {isHide ? '曲名表示' : '曲名非表示'}
                </button>
              </div>
              <div>
                <button
                  className="full-width btn-spotify"
                  onClick={onClickLinkButton}
                >
                  {roomId !== '' ? 'リンクコピー' : 'リンク生成'}
                </button>
                {roomId !== '' ? (
                  <Link
                    color="white"
                    href={`${document.URL}${roomId}`}
                    underline="hover"
                    sx={{
                      mb: 1,
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: 'white', // 通常時のボーダー色(アウトライン)
                        },
                      },
                    }}
                  >
                    {`${document.URL}${roomId}`}
                  </Link>
                ) : (
                  <p>リンクが生成されていません</p>
                )}
              </div>
            </div>
          </div>
          <div className={styles['users-area']}>
            <div className={styles['users-area-left']}>
              <p className="left">回答者</p>
              {ansers.length > 0 ? (
                ansers
                  .sort((a, b) => {
                    return dayjs(a.time).isAfter(dayjs(b.time)) ? 1 : -1
                  })
                  .map((anser, index) => (
                    <div key={index}>
                      <p className="left">
                        {index + 1}番：{anser.name}({anser.time})
                      </p>
                    </div>
                  ))
              ) : (
                <p className="left">対象のユーザーが存在しません</p>
              )}
              {ansers.length > 0 ? (
                <>
                  <button
                    className="full-width btn-spotify margin-bottom"
                    onClick={() => onClickCorrectButton(ansers[0].name)}
                  >
                    正解
                  </button>
                  <button
                    className="full-width btn-spotify"
                    onClick={() => onClickWrongButton(ansers[0].name)}
                  >
                    不正解
                  </button>
                </>
              ) : (
                ''
              )}
            </div>
            <div className={styles['users-area-right']}>
              <p className="left">ランキング</p>
              {Object.keys(ranking).length > 0 ? (
                ''
              ) : (
                <p className="left">対象のユーザーが存在しません</p>
              )}
              {Object.keys(ranking).map((name, index) => (
                <p className="left" key={index}>
                  {ranking[name].order}位：{name}({ranking[name].score}問)
                </p>
              ))}
            </div>
          </div>
        </div>
      </>
    )
  }
}
