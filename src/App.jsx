import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import MovieDetail from './pages/MovieDetail'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <header className="navbar">
        <Link to="/"><h1>TMDB</h1></Link>
        <nav>
          <Link to="/">Home</Link>
        </nav>
      </header>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movie/:id" element={<MovieDetail />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}

export default App
