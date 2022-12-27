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
  const [registered, setRegistered] = useState<boolean>(false)
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
              })
            }
          } else {
            push(dbRef, {
              name: name,
              score: 0,
            })
          }
          setRegistered(true)
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
      <div className="container">
        <div className="main-wrapper">
          {!registered ? (
            <div>
              <div>
                <p className="center">名前を登録してください</p>
              </div>
              <div>
                <input
                  className="full-width margin-bottom"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <button
                  className="full-width btn-spotify"
                  onClick={onClickSubmitButton}
                >
                  登録
                </button>
              </div>
            </div>
          ) : (
            <div className="column">
              <p className="center">あなたの名前：{name}</p>
              <AnserButton
                disabled={disabled}
                setDisabled={setDisabled}
                onClickButton={onClickAnserButton}
              />
              <div>
                {Object.keys(ansers).length > 0 ? <p>回答順</p> : ''}
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
          )}
        </div>
      </div>
    </>
  )
}

export default WebPlayback
