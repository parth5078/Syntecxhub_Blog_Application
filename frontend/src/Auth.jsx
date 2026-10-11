
import { useState } from "react";
import { ArrowLeft, Eye, EyeOff, Feather } from "lucide-react";
import "./Auth.css";

const API = "http://localhost:5000/api/auth";

export default function Auth({ onBack, onLogin, initialMode = "login" }) {
  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    if (mode === "register" && name.trim().length < 2) {
      setMessage("Please enter your full name.");
      setMessageType("error");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API}/${mode === "login" ? "login" : "register"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "login"
            ? { email: email.trim(), password }
            : { name: name.trim(), email: email.trim(), password }
        ),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Please check your details and try again.");
      }

      if (mode === "register") {
        setMode("login");
        setPassword("");
        setMessage("Your account is ready. Please sign in.");
        setMessageType("success");
      } else {
        if (!data.token || !data.user) {
          throw new Error("The server did not return a valid login session.");
        }
        onLogin(data);
      }
    } catch (error) {
      setMessage(error.message || "Unable to connect. Please check that the server is running.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  function changeMode(nextMode) {
    setMode(nextMode);
    setMessage("");
    setPassword("");
  }

  return (
    <main className="auth-screen">
      <button className="auth-back-link" onClick={onBack}>
        <ArrowLeft size={16} /> Back to stories
      </button>

      <section className="auth-layout">
        <div className="auth-story-side">
          <a href="#home" className="auth-wordmark" onClick={onBack}>
            <span className="auth-logo"><Feather size={21} /></span>
            <span>ink<span>.</span>space</span>
          </a>

          <div className="auth-quote">
            <span className="auth-quote-mark">“</span>
            <h1>A good story can change the way we see the world.</h1>
            <p>A thoughtful space for ideas, learning, and perspectives worth sharing.</p>
          </div>

          <div className="auth-side-footer">READ THOUGHTFULLY. WRITE HONESTLY.</div>
        </div>

        <div className="auth-form-side">
          <div className="auth-form-card">
            <span className="auth-eyebrow">YOUR CREATIVE SPACE</span>
            <h2>{mode === "login" ? "Welcome back." : "Join the community."}</h2>
            <p className="auth-intro">
              {mode === "login"
                ? "Pick up where your curiosity left off."
                : "Create an account and share your ideas with the world."}
            </p>

            <form onSubmit={handleSubmit}>
              {mode === "register" && (
                <label className="auth-label">
                  Full name
                  <input
                    autoComplete="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your name"
                    maxLength={80}
                    required
                  />
                </label>
              )}

              <label className="auth-label">
                Email address
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </label>

              <label className="auth-label">
                Password
                <span className="auth-password-wrap">
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="At least 6 characters"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    className="auth-eye"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </span>
              </label>

              {message && (
                <p className={`auth-alert ${messageType}`} role="status">{message}</p>
              )}

              <button className="auth-primary" type="submit" disabled={loading}>
                {loading
                  ? "Please wait..."
                  : mode === "login" ? "Sign in to your account" : "Create your account"}
              </button>
            </form>

            <div className="auth-switch">
              <span>{mode === "login" ? "New to ink.space?" : "Already have an account?"}</span>
              <button onClick={() => changeMode(mode === "login" ? "register" : "login")}>
                {mode === "login" ? "Create account" : "Sign in"}
              </button>
            </div>

            <div className="auth-terms">
              A place to read, reflect, and share what matters to you.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
