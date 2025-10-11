import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import CardCreator from './components/CardCreator';
import Gallery from './components/Gallery';
import Auth from './components/Auth';

function Navigation() {
  const { user, signOut } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  return (
    <>
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="nav-brand">AI Card Maker</Link>
          <div className="nav-links">
            <Link to="/">Create</Link>
            <Link to="/gallery">Gallery</Link>
            {user ? (
              <>
                <span className="user-email">{user.email}</span>
                <button onClick={signOut} className="nav-btn">Sign Out</button>
              </>
            ) : (
              <button onClick={() => setShowAuth(true)} className="nav-btn">Sign In</button>
            )}
          </div>
        </div>
      </nav>

      {showAuth && <Auth onClose={() => setShowAuth(false)} />}
    </>
  );
}

function AppContent() {
  return (
    <BrowserRouter>
      <div className="app">
        <Navigation />
        <main>
          <Routes>
            <Route path="/" element={<CardCreator />} />
            <Route path="/gallery" element={<Gallery />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
