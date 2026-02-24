import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import MovieDetail from './pages/MovieDetail'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <header className="navbar">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">▶</span>
          <h1>CINEMATE</h1>
        </Link>
        <nav>
          <Link to="/">Discover</Link>
        </nav>
      </header>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movie/:id" element={<MovieDetail />} />
        </Routes>
      </main>
      <footer className="site-footer">
        <p>Powered by TMDB API</p>
      </footer>
    </BrowserRouter>
  )
}

export default App
