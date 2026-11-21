function Results() {
  return (
    <section className="results-preview">
      <div className="result-score">
        <span>Match Score</span>
        <strong>78%</strong>
      </div>

      <div className="result-item">
        <h3>Skills Found</h3>
        <div className="result-tags">
          <span>React</span>
          <span>Python</span>
          <span>JavaScript</span>
          <span>Git</span>
        </div>
      </div>

      <div className="result-item">
        <h3>Improvement Suggestions</h3>
        <ul>
          <li>Add relevant keywords from the job description.</li>
          <li>Make education and project details clearer.</li>
          <li>Describe project achievements more specifically.</li>
        </ul>
      </div>
    </section>
  );
}

export default Results;
