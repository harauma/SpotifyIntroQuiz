import type { NextApiRequest, NextApiResponse } from 'next'

/* ランダムな文字列を生成 */
const generateRandomString = (length: number): string => {
  let text = ''
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}

/* ログイン処理 */
const login = (_: NextApiRequest, res: NextApiResponse) => {
  const scope = 'streaming user-read-email user-read-private'
  const spotify_redirect_uri = process.env.APP_URL + '/api/auth/callback'
  const state: string = generateRandomString(16)

  let spotify_client_id = ''
  if (process.env.SPOTIFY_CLIENT_ID) {
    spotify_client_id = process.env.SPOTIFY_CLIENT_ID
  } else {
    console.error(
      'Undefined Error: An environmental variable, "SPOTIFY_CLIENT_ID", has something wrong.',
    )
  }

  const auth_query_parameters = new URLSearchParams({
    response_type: 'code',
    client_id: spotify_client_id,
    scope: scope,
    redirect_uri: spotify_redirect_uri,
    state: state,
  })

  res.redirect(
    'https://accounts.spotify.com/authorize/?' +
      auth_query_parameters.toString(),
  )
}

export default login
