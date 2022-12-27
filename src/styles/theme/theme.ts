import { createTheme } from '@mui/material/styles'

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
})

export default theme
