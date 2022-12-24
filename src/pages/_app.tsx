import { AppProps } from 'next/app'
import Head from 'next/head'
import '../styles/App.scss'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>SpotifyIntroQuiz</title>
        <meta
          name="description"
          content="An example app of Spotify Web Playback SDK based on Next.js and Typescript."
        />
      </Head>
      <Component {...pageProps} />
    </>
  )
}

export default MyApp
