import { AppProps } from 'next/app'
import Head from 'next/head'
import '../styles/App.scss'
import { initializeFirebaseApp } from '@src/lib/firebase/firebase'

initializeFirebaseApp()
function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>SpotifyIntroQuiz</title>
        <meta name="description" content="Spotifyを使ったイントロドンアプリ" />
      </Head>
      <Component {...pageProps} />
    </>
  )
}

export default MyApp
