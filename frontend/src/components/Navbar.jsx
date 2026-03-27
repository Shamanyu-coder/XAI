function Navbar({ toggleMode }) {
  return (
    <header className="navbar">
      <div className="nav-left">
        <div className="logo">
          <img src="yoga.png" alt="Yogapathy Logo" />
          <span>Yogapathy</span>
        </div>

        <nav className="nav-links">
          <a href="#">Yoga Benefits</a>
          <a href="#">History of Yoga</a>
          <a href="#">About Us</a>
        </nav>
      </div>

      <div className="nav-right">
        <a href="#">Login</a>
        <a href="#" className="signup-link">Sign Up</a>
        <button className="mode-toggle" onClick={toggleMode}>🌙</button>
      </div>
    </header>
  );
}

export default Navbar;
