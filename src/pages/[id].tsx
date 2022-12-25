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
  remove,
} from '@firebase/database'
import { FirebaseError } from '@firebase/util'
import dayjs from 'dayjs'
import firebaseApp from '@src/lib/firebase/firebase'
import { Anser } from '@src/types/Types'

type Props = {
  token: string
}

export const WebPlayback: FC<Props> = () => {
  const db = getDatabase(firebaseApp)
  const router = useRouter()
  const [isClick, setIsClick] = useState<boolean>(false)
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
    setRoomId((router.query['id'] as string) || '')
    const dbRef = ref(db, `result/${roomId}`)
    get(dbRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          console.log(snapshot.val())
          setToken(snapshot.val().token)
          setDeviceId(snapshot.val().deviceId)
        } else {
          console.log('No data available')
        }
      })
      .catch((error) => {
        console.error(error)
      })
  }, [router.query])

  /* introレコードの追加検知 */
  useEffect(() => {
    if (roomId === '') {
      return
    }
    setAnsers([])
    try {
      const dbRef = ref(db, `intro/${roomId}`)
      return onChildAdded(dbRef, (snapshot) => {
        console.log(snapshot.val())
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

  /* 音楽停止処理 */
  const onClickPause = () => {
    setIsClick(true)
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

  /* 回答クリアボタン押下時処理 */
  const onClickAnserClearButton = () => {
    remove(ref(db, 'intro'))
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
                PAUSE(1押下で非活性に)
              </button>
            </div>
            <div>
              <button className="btn-spotify" onClick={() => setIsClick(false)}>
                PAUSE非活性解除
              </button>
            </div>
            <div>
              <input value={name} onChange={(e) => setName(e.target.value)} />
              <p>{name}</p>
            </div>
            <div>
              <button className="btn-spotify" onClick={onClickAnserButton}>
                回答
              </button>
            </div>
            <div>
              <button className="btn-spotify" onClick={onClickAnserClearButton}>
                回答クリア
              </button>
            </div>
            <div>
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

export default WebPlayback
