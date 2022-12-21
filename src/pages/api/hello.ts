// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { NextApiRequest, NextApiResponse } from 'next'

type TestRes = {
  title: string
  content: string
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<TestRes>,
) {
  const result: TestRes = {
    title: 'test title',
    content: 'test content',
  }
  res.status(200).send(result)
}
