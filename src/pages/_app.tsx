import { AppProps } from 'next/app'
import Head from 'next/head'
import '../styles/App.scss'
import { initializeFirebaseApp } from '@src/lib/firebase/firebase'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import theme from '@styles/theme/theme'

initializeFirebaseApp()
function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>SpotifyIntroQuiz</title>
        <meta name="description" content="Spotifyを使ったイントロドンアプリ" />
      </Head>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Component {...pageProps} />
      </ThemeProvider>
    </>
  )
}

export default MyApp
