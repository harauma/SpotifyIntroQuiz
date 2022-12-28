import { createTheme } from '@mui/material/styles'

const defaultTheme = createTheme({})
const { pxToRem } = defaultTheme.typography

const theme = createTheme({
  palette: {
    primary: {
      main: '#1db954',
      contrastText: 'white',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#333333',
      paper: '#eeeeee',
    },
    text: {
      primary: '#ffffff',
      secondary: '#ffffff',
    },
  },
  typography: {
    h1: { fontSize: pxToRem(60) },
    h2: { fontSize: pxToRem(48) },
    h3: { fontSize: pxToRem(42) },
    h4: { fontSize: pxToRem(36) },
    h5: { fontSize: pxToRem(20) },
    h6: { fontSize: pxToRem(18) },
    subtitle1: { fontSize: pxToRem(18) },
    body1: { fontSize: pxToRem(16) },
  },
})

export default theme
