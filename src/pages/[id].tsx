import { useRouter } from 'next/router'
import { FC, useState, useEffect } from 'react'
import axios from 'axios'
import {
  get,
  getDatabase,
  onChildAdded,
  onChildRemoved,
  ref,
  push,
} from '@firebase/database'
import { FirebaseError } from '@firebase/util'
import dayjs from 'dayjs'
import firebaseApp from '@src/lib/firebase/firebase'
import { Anser } from '@src/types/Types'
import { AnserButton } from '../components/anser_button'

type Props = {
  token: string
}

export const WebPlayback: FC<Props> = () => {
  const db = getDatabase(firebaseApp)
  const router = useRouter()
  const [disabled, setDisabled] = useState<boolean>(false)
  const [token, setToken] = useState<string>('')
  const [deviceId, setDeviceId] = useState<string>('')
  const [roomId, setRoomId] = useState<string>('')
  const [name, setName] = useState<string>('')
  const [ansers, setAnsers] = useState<Anser[]>([])

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
          setToken(snapshot.val().token)
          setDeviceId(snapshot.val().deviceId)
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

  /* 音楽停止処理 */
  const onClickPause = () => {
    setDisabled(true)
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
  }

  /* 回答ボタン押下時処理 */
  const onClickAnserButton = () => {
    const now = dayjs()
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

  return (
    <>
      <div className="container">
        <div className="main-wrapper">
          <div className="column">
            <div>
              <button
                className="btn-spotify"
                onClick={onClickPause}
                disabled={disabled}
              >
                PAUSE(1押下で非活性に)
              </button>
            </div>
            <div>
              <button
                className="btn-spotify"
                onClick={() => setDisabled(false)}
              >
                PAUSE非活性解除
              </button>
            </div>
            <div>
              <input value={name} onChange={(e) => setName(e.target.value)} />
              <p>回答者名：{name}</p>
            </div>
            <div>
              <button className="btn-spotify" onClick={onClickAnserButton}>
                回答
              </button>
            </div>
            <AnserButton
              disabled={disabled}
              setDisabled={setDisabled}
              onClickButton={() => {
                onClickPause()
                onClickAnserButton()
              }}
            />
            <div>
              {ansers
                .sort((a, b) => {
                  return dayjs(a.time).isAfter(dayjs(b.time)) ? 1 : -1
                })
                .map((anser, index) => (
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

export default WebPlayback
