import { useState } from "react";
import "./BulletRewriter.css";

function BulletRewriter() {
  const [text, setText] = useState("");
  const [rewrittenText, setRewrittenText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRewrite = async () => {
    if (!text.trim()) {
      setError("Please enter your resume bullet point.");
      return;
    }

    setLoading(true);
    setError("");
    setRewrittenText("");

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/rewrite-bullet",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setRewrittenText(data.rewrittenText);
    } catch (err) {
      setError(err.message || "Unable to connect to the backend.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rewrittenText);
      alert("Copied successfully!");
    } catch {
      setError("Unable to copy text.");
    }
  };

  return (
    <section className="bullet-rewriter">
      <div className="rewriter-heading">
        <span>AI CAREER TOOL</span>
        <h2>Resume Bullet Point Rewriter</h2>
        <p>
          Transform your simple resume statements into
          professional bullet points.
        </p>
      </div>

      <div className="rewriter-card">
        <label>Original Resume Bullet Point</label>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Example: I am responsible for developing websites..."
          maxLength={1000}
        />

        <div className="character-count">
          {text.length}/1000 characters
        </div>

        <button
          className="rewrite-button"
          onClick={handleRewrite}
          disabled={loading}
        >
          {loading ? "Rewriting..." : "Rewrite Bullet Point"}
        </button>

        {error && <p className="rewriter-error">{error}</p>}

        {rewrittenText && (
          <div className="rewritten-result">
            <h3>Professional Version</h3>
            <p>{rewrittenText}</p>

            <button onClick={handleCopy}>
              Copy Result
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default BulletRewriter;
