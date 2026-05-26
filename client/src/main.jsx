import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router} from 'react-router-dom'
import App from './App.jsx'
import { MovieProvider } from './context/MovieContext.jsx'

const CURRENT_STORAGE_VERSION = 'v2_tokens'

if (localStorage.getItem('storage_version') !== CURRENT_STORAGE_VERSION) {
  localStorage.removeItem('cinema_user') 

  localStorage.setItem('storage_version', CURRENT_STORAGE_VERSION)
}

createRoot(document.getElementById('root')).render(
  <Router>
    <MovieProvider>
      <App />
    </MovieProvider>
  </Router>,
)
