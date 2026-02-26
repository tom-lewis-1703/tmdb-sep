import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { useRef, useEffect } from 'react'
import Home from './pages/Home'
import MovieDetail from './pages/MovieDetail'
import PersonDetail from './pages/PersonDetail'
import ScrollToTop from './components/ScrollToTop'
import './App.css'

function PageTransition({ children }) {
  const location = useLocation()
  const contentRef = useRef(null)

  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    el.classList.remove('page-enter')
    // trigger reflow
    void el.offsetWidth
    el.classList.add('page-enter')
  }, [location.pathname])

  return (
    <div ref={contentRef} className="page-transition">
      {children}
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
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
        <PageTransition>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/movie/:id" element={<MovieDetail />} />
            <Route path="/person/:id" element={<PersonDetail />} />
          </Routes>
        </PageTransition>
      </main>
      <footer className="site-footer">
        <p>Powered by TMDB API</p>
      </footer>
    </BrowserRouter>
  )
}

export default App
