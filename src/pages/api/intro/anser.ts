import type { NextApiResponse } from 'next'
import { getDatabase, ref, push } from 'firebase/database'
import dayjs from 'dayjs'
import { ExtendNextApiRequest } from 'src/types/Types'
import firebaseApp from '@src/lib/firebase/firebase'

/* 早押し結果登録処理 */
const anser = (req: ExtendNextApiRequest, res: NextApiResponse) => {
  // Initialize Realtime Database and get a reference to the service
  const db = getDatabase(firebaseApp)
  const now = dayjs()

  console.log(now.format())
  push(ref(db, 'intro'), {
    time: now.format(),
  })
    .then(() => {
      res.status(200).end()
    })
    .catch((error) => {
      console.error(`Error: ${error}`)
      res.status(400).end()
    })
}

export default anser
