import { useRouter } from 'next/router'
import { FC, useState, useEffect } from 'react'
import axios from 'axios'
import {
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

type Props = {
  token: string
}

export const WebPlayback: FC<Props> = () => {
  const router = useRouter()
  const [isClick, setIsClick] = useState<boolean>(false)
  const [token, setToken] = useState<string>('')
  const [queryParam, setQueryParam] = useState<string>('')
  const [ansers, setAnsers] = useState<{ time: string }[]>([])

  /* URLパラメータ取得処理 */
  useEffect(() => {
    if (!router.isReady) {
      return
    }
    setToken((router.query['id'] as string) || '')
    setQueryParam((router.query['device_id'] as string) || '')
  }, [router.query])

  /* introレコードの追加検知 */
  useEffect(() => {
    setAnsers([])
    try {
      const db = getDatabase(firebaseApp)
      const dbRef = ref(db, 'intro')
      return onChildAdded(dbRef, (snapshot) => {
        console.log(snapshot.val())
        const value = snapshot.val()
        setAnsers((prev) => [...prev, { time: value.time }])
      })
    } catch (e) {
      if (e instanceof FirebaseError) {
        console.error(e)
      }
      return
    }
  }, [])

  /* introレコードの削除検知 */
  useEffect(() => {
    try {
      const db = getDatabase(firebaseApp)
      const dbRef = ref(db, 'intro')
      return onChildRemoved(dbRef, (snapshot) => {
        console.log('removed!')
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
  }, [])

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

  /* 回答ボタン押下時処理 */
  const onClickAnserButton = () => {
    const now = dayjs()
    try {
      const db = getDatabase(firebaseApp)
      const dbRef = ref(db, 'intro')
      push(dbRef, {
        time: now.format('YYYY/MM/DD HH:mm:ss.SSS'),
      })
    } catch (e) {
      if (e instanceof FirebaseError) {
        console.log(e)
      }
    }
  }

  /* 回答ボタン押下時処理 */
  const onClickAnserClearButton = () => {
    const db = getDatabase(firebaseApp)
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
              {ansers.map((anser) => (
                <p key={anser.time}>{anser.time}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default WebPlayback
