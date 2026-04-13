import "../styles/home.css";

export default function Home() {
  return (
    <div className="home">

      {/* NAV */}
      <header className="nav container">
        <div className="logo">🚦 TrafficIQ</div>

        <div className="links">
          <a href="#">Home</a>
          <a href="#features">Features</a>
          <a href="/login">Login</a>
        </div>
      </header>

      {/* HERO */}
      <section className="hero container">

        <div className="hero-text">

          <span className="tag">Smart City AI Platform</span>

          <h1>
            Make Traffic <br />
            <span>Predictable & Smart</span>
          </h1>

          <p>
            Analyze real-time traffic, detect congestion and optimize city mobility using AI.
          </p>

          <div className="buttons">
            <button className="primary">Get Started</button>
            <button className="secondary">View Demo</button>
          </div>

        </div>

        <div className="hero-card">
          <div className="stat">
            <h3>98%</h3>
            <p>Accuracy</p>
          </div>

          <div className="stat">
            <h3>24/7</h3>
            <p>Monitoring</p>
          </div>

          <div className="stat">
            <h3>AI</h3>
            <p>Powered</p>
          </div>
        </div>

      </section>

      {/* FEATURES */}
      <section id="features" className="features container">

        <h2>Why TrafficIQ</h2>

        <div className="grid">

          <div className="card">
            <h3>Real-Time Data</h3>
            <p>Live monitoring of traffic across the city.</p>
          </div>

          <div className="card">
            <h3>AI Prediction</h3>
            <p>Predict congestion before it happens.</p>
          </div>

          <div className="card">
            <h3>Smart Routing</h3>
            <p>Suggest optimal routes instantly.</p>
          </div>

        </div>
      </section>

      {/* ABOUT */}
      <section className="about container">

        <h2>About</h2>

        <p>
          ksndjbsjlbbbbbbbbjssssssssjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj
        </p>

      </section>

      {/* FOOTER */}
      <footer className="footer">
        © 2026 TrafficIQ
      </footer>

    </div>
  );
}