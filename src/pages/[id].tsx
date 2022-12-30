import { useRouter } from 'next/router'
import { FC, useState, useEffect } from 'react'
import axios from 'axios'
import {
  get,
  getDatabase,
  onChildAdded,
  onChildChanged,
  onChildRemoved,
  ref,
  push,
} from '@firebase/database'
import { FirebaseError } from '@firebase/util'
import dayjs from 'dayjs'
import firebaseApp from '@src/lib/firebase/firebase'
import { Anser, User } from '@src/types/Types'
import { AnserButton } from '../components/anser_button'
import { Button, TextField, Typography } from '@mui/material'
import { Container } from '@mui/system'
import styles from '@styles/[id].module.scss'

type Props = {
  token: string
}

export const WebPlayback: FC<Props> = () => {
  const db = getDatabase(firebaseApp)
  const router = useRouter()
  const [registered, setRegistered] = useState<boolean>(false)
  const [disabled, setDisabled] = useState<boolean>(false)
  const [timerFlag, setTimerFlag] = useState<boolean>(false)
  const [token, setToken] = useState<string>('')
  const [deviceId, setDeviceId] = useState<string>('')
  const [roomId, setRoomId] = useState<string>('')
  const [name, setName] = useState<string>('')
  const [timer, setTimer] = useState<number>(0)
  const [ansers, setAnsers] = useState<Anser[]>([])
  const [users, setUsers] = useState<User>({})

  /* URLパラメータ取得処理 */
  useEffect(() => {
    if (!router.isReady) {
      return
    }
    const id = (router.query['id'] as string) || ''
    if (id === undefined) {
      return
    }
    setRoomId(id)
    const dbRef = ref(db, `result/${id}`)
    get(dbRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const value = snapshot.val()
          setToken(value.token)
          setDeviceId(value.deviceId)
        } else {
          console.log('No data available')
        }
      })
      .catch((error) => {
        console.error(error)
      })
  }, [router, router.query])

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
        setDisabled(false)
      })
    } catch (e) {
      if (e instanceof FirebaseError) {
        console.error(e)
      }
      return
    }
  }, [roomId])

  /* userレコードの追加検知 */
  useEffect(() => {
    if (roomId === '' || name === '') {
      return
    }
    try {
      const dbRef = ref(db, `result/${roomId}/users`)
      return onChildAdded(dbRef, (snapshot) => {
        const value = snapshot.val()
        setUsers((prev) => {
          return {
            ...prev,
            [value.name]: {
              score: value.score,
              canAnser: value.canAnser,
            },
          }
        })
      })
    } catch (e) {
      if (e instanceof FirebaseError) {
        console.error(e)
      }
      return
    }
  }, [registered])

  /* userレコード変更検知 */
  useEffect(() => {
    if (roomId === '' || name === '') {
      return
    }
    try {
      const dbRef = ref(db, `result/${roomId}/users`)
      return onChildChanged(dbRef, (snapshot) => {
        const value = snapshot.val()
        setUsers((prev) => {
          return {
            ...prev,
            [value.name]: {
              score: value.score,
              canAnser: value.canAnser,
            },
          }
        })
      })
    } catch (e) {
      if (e instanceof FirebaseError) {
        console.error(e)
      }
      return
    }
  }, [registered])

  /* 問題出題検知 */
  useEffect(() => {
    if (roomId === '' || name === '') {
      return
    }
    try {
      const dbRef = ref(db, `result/${roomId}`)
      return onChildChanged(dbRef, (snapshot) => {
        if (
          !snapshot.exists() ||
          snapshot.key !== 'doStart' ||
          !snapshot.val()
        ) {
          return
        }
        const dbRef = ref(db, `result/${roomId}/users`)
        get(dbRef)
          .then((s) => {
            const value = s.val()
            const findKey = Object.keys(value).find((key) => {
              return value[key].name === name
            })
            if (!findKey) {
              return
            }
            setUsers({
              [value[findKey].name]: {
                score: value[findKey].score,
                canAnser: value[findKey].canAnser,
              },
            })
            let num = value[findKey].score
            setTimerFlag(true)
            setTimeout(() => {
              setTimer(num)
              const interval = setInterval(() => {
                num -= 1
                setTimer(num)
              }, 1000)
              setTimeout(() => {
                setTimerFlag(false)
                clearInterval(interval)
              }, num * 1000)
            }, 2000)
          })
          .catch((error) => {
            console.error(error)
          })
      })
    } catch (e) {
      if (e instanceof FirebaseError) {
        console.error(e)
      }
      return
    }
  }, [registered])

  /* 回答ボタン押下時処理 */
  const onClickAnserButton = () => {
    setDisabled(true)
    const now = dayjs()
    try {
      axios.post(
        '/api/player/pause',
        {
          token: token,
          deviceId: deviceId,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )
    } catch (e) {
      console.error(e)
    }

    try {
      const dbRef = ref(db, `intro/${roomId}`)
      push(dbRef, {
        name: name,
        time: now.format('YYYY/MM/DD HH:mm:ss.SSS'),
      })
    } catch (e) {
      if (e instanceof FirebaseError) {
        console.log(e)
      }
    }
  }

  /* 名前登録ボタン押下時処理 */
  const onClickSubmitButton = () => {
    try {
      const dbRef = ref(db, `result/${roomId}/users`)
      get(dbRef)
        .then((snapshot) => {
          setRegistered(true)
          // users配下にデータが登録されているか
          const value = snapshot.val()
          if (snapshot.exists()) {
            // 入力した名前のデータを絞り込み
            const key = Object.keys(value).find((key) => {
              return value[key].name === name
            })
            if (key === undefined) {
              push(dbRef, {
                name: name,
                score: 0,
                canAnser: true,
              })
            }
          } else {
            push(dbRef, {
              name: name,
              score: 0,
              canAnser: true,
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
  }

  return (
    <>
      <Container maxWidth="sm">
        <div className="main-wrapper">
          {!registered ? (
            <div className={styles['guest-top']}>
              <Typography className="center" variant="body1" gutterBottom>
                あなたの名前を教えてください
              </Typography>
              <TextField
                fullWidth
                label="名前"
                variant="outlined"
                value={name}
                onChange={(e) => setName(e.target.value)}
                sx={{
                  mb: 1,
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'white', // 通常時のボーダー色(アウトライン)
                    },
                  },
                }}
              />
              <Button
                fullWidth
                size="large"
                variant="contained"
                onClick={onClickSubmitButton}
              >
                登録
              </Button>
            </div>
          ) : (
            <div className="column">
              <Typography className="center" variant="body1" gutterBottom>
                あなたの名前：{name}
              </Typography>
              {users[name] && !users[name].canAnser ? (
                <Typography className="center" variant="body1" gutterBottom>
                  不正解のため１回休みです
                </Typography>
              ) : timer > 0 ? (
                <Typography className="center" variant="body1" gutterBottom>
                  正解数ハンデ残り{timer}秒
                </Typography>
              ) : (
                ''
              )}
              <AnserButton
                disabled={
                  (users[name] && !users[name].canAnser) ||
                  timerFlag ||
                  disabled
                }
                setDisabled={setDisabled}
                onClickButton={onClickAnserButton}
              />
              <div>
                {Object.keys(ansers).length > 0 ? (
                  <Typography className="center" variant="body1" gutterBottom>
                    回答順
                  </Typography>
                ) : (
                  ''
                )}
                {ansers
                  .sort((a, b) => {
                    return dayjs(a.time).isAfter(dayjs(b.time)) ? 1 : -1
                  })
                  .map((anser, index) => (
                    <div key={anser.time}>
                      <Typography className="left" variant="body1" gutterBottom>
                        {index + 1}番：{anser.name}
                        <br />({anser.time})
                      </Typography>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </Container>
    </>
  )
}

export default WebPlayback
