import type { NextPage, GetServerSideProps } from 'next'
import { Login } from '../components/login'
import { WebPlayback } from '../components/web_playback'

type Props = {
  token: string
}

const Home: NextPage<Props> = ({ token }) => {
  return <>{token === '' ? <Login /> : <WebPlayback token={token} />}</>
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  if (context.req.cookies['spotify-token']) {
    const token: string = context.req.cookies['spotify-token']
    return {
      props: { token: token },
    }
  } else {
    return {
      props: { token: '' },
    }
  }
}

export default Home
