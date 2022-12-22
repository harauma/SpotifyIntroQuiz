import { FC } from 'react'
import Link from 'next/link'

export const Login: FC = () => {
  return (
    <div className="App">
      <header className="App-header">
        <Link href="/api/auth/login" className="btn-spotify">
          Login with Spotify
        </Link>
      </header>
    </div>
  )
}
