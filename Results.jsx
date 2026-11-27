import "./Results.css";
import ResumeCharts from "./Charts/ResumeCharts";

function Results({ result }) {
  if (!result) return null;

  const getScore = (value) => {
    const number = Number(value);
    return Number.isFinite(number)
      ? Math.min(100, Math.max(0, number))
      : 0;
  };

  const matchScore = getScore(result.matchPercentage ?? result.score);
  const skillScore = getScore(result.skillMatchPercentage);
  const contentScore = getScore(result.semanticScore);

  const sectionScores = result.sectionScores || {};

  const sections = [
    {
      title: "Skills Score",
      score: getScore(sectionScores.skills ?? skillScore),
      description: "Required job skills found in your resume.",
      icon: "✦"
    },
    {
      title: "Education Score",
      score: getScore(sectionScores.education),
      description: "Educational qualifications and details.",
      icon: "🎓"
    },
    {
      title: "Experience Score",
      score: getScore(sectionScores.experience),
      description: "Professional experience and achievements.",
      icon: "💼"
    },
    {
      title: "Projects Score",
      score: getScore(sectionScores.projects),
      description: "Projects, technologies and practical work.",
      icon: "🚀"
    }
  ];

  const semanticAnalysis = Array.isArray(result.semanticSkillAnalysis)
    ? result.semanticSkillAnalysis
    : [];

  const matchedSkills = Array.isArray(result.semanticMatchedSkills)
    ? result.semanticMatchedSkills
    : [];

  const unmatchedSkills = Array.isArray(result.semanticUnmatchedSkills)
    ? result.semanticUnmatchedSkills
    : [];

  const semanticAvailable =
    result.matchingMethod === "keyword_and_semantic";

  const matchLabel =
    matchScore >= 80
      ? "Excellent match"
      : matchScore >= 60
      ? "Good match"
      : matchScore >= 40
      ? "Moderate match"
      : "Needs improvement";

  const description =
    matchScore >= 80
      ? "Your resume matches most of the job requirements. Keep improving your skills and experience."
      : matchScore >= 60
      ? "You meet many of the requirements. Closing a few skill gaps will raise your score."
      : matchScore >= 40
      ? "Your resume has some relevant qualifications. Consider improving the missing skills."
      : "Your resume needs more relevant skills and experience for this position.";

  return (
    <section className="results-preview">

      <div className="scoreboard">

        <div className="scoreboard-main">

          <div
            className="score-ring"
            style={{ "--score": ${matchScore}% }}
          >
            <div className="score-ring-inner">
              <strong>{matchScore}%</strong>
              <small>Overall match</small>
            </div>
          </div>

          <div className="score-summary">
            <span className="score-eyebrow">
              Resume match score
            </span>

            <h2>
              <span className="score-dot"></span>
              {matchLabel}
            </h2>

            <p>{description}</p>
          </div>

        </div>

        <div className="scoreboard-divider"></div>

        <div className="scoreboard-metrics">

          <div className="score-metric">
            <div className="metric-heading">
              <strong>Skill match</strong>
              <strong>{skillScore}%</strong>
            </div>

            <div className="metric-track">
              <div
                className="metric-fill"
                style={{ width: ${skillScore}% }}
              ></div>
            </div>

            <small>Required skills found in your resume.</small>
          </div>

          <div className="score-metric">
            <div className="metric-heading">
              <strong>Content relevance</strong>
              <strong>
                {semanticAvailable ? ${contentScore}% : "N/A"}
              </strong>
            </div>

            <div className="metric-track">
              <div
                className="metric-fill"
                style={{
                  width: semanticAvailable ? ${contentScore}% : "0%"
                }}
              ></div>
            </div>

            <small>How closely your resume content fits the job.</small>
          </div>

        </div>

      </div>

      {/* SECTION-WISE RESUME SCORING */}

      <div className="section-scoring">

        <div className="section-scoring-heading">
          <span>RESUME PERFORMANCE</span>
          <h2>Section-wise Resume Scoring</h2>
          <p>
            Understand how each section of your resume performs.
          </p>
        </div>

        <div className="section-score-grid">

          {sections.map((section, index) => (
            <div className="section-score-card" key={index}>

              <div className="section-score-top">
                <div className="section-score-icon">
                  {section.icon}
                </div>

                <span className="section-score-value">
                  {section.score}%
                </span>
              </div>

              <h3>{section.title}</h3>

              <p>{section.description}</p>

              <div className="section-score-track">
                <div
                  className="section-score-fill"
                  style={{ width: ${section.score}% }}
                ></div>
              </div>

              <small>
                {section.score >= 80
                  ? "Excellent"
                  : section.score >= 60
                  ? "Good"
                  : section.score >= 40
                  ? "Needs improvement"
                  : "Needs attention"}
              </small>

            </div>
          ))}

        </div>

      </div>

      {/* SKILLS FOUND */}

      <div className="result-item">
        <h3>✓ Skills Found</h3>

        <div className="result-tags">
          {result.foundSkills?.length > 0
            ? result.foundSkills.map((skill, index) => (
                <span className="skill-found" key={index}>
                  ✓ {skill}
                </span>
              ))
            : <p>No matching skills found.</p>}
        </div>
      </div>

      {/* MISSING SKILLS */}

      <div className="result-item">
        <h3>Missing Skills</h3>

        <div className="result-tags">
          {result.missingSkills?.length > 0
            ? result.missingSkills.map((skill, index) => (
                <span className="skill-missing" key={index}>
                  {skill}
                </span>
              ))
            : <p>No missing skills detected.</p>}
        </div>
      </div>

      {/* REQUIRED SKILLS */}

      <div className="result-item">
        <h3>Required Skills</h3>

        <div className="result-tags">
          {result.requiredSkills?.length > 0
            ? result.requiredSkills.map((skill, index) => (
                <span className="skill-required" key={index}>
                  {skill}
                </span>
              ))
            : <p>No required skills detected.</p>}
        </div>
      </div>

      {/* SEMANTIC MATCHING */}

      <div className="semantic-section">

        <div className="semantic-heading">
          <span className="semantic-label">AI POWERED NLP</span>
          <h2>Semantic Matching Analysis</h2>
          <p>
            Understands related resume content, even when exact job
            keywords are not present.
          </p>
        </div>

        {semanticAvailable ? (
          <>
            <div className="semantic-skill-grid">

              <div className="semantic-skill-card matched-card">
                <h3>✓ Semantically Matched</h3>
                <p className="semantic-count">{matchedSkills.length}</p>

                <div className="semantic-tags">
                  {matchedSkills.length > 0
                    ? matchedSkills.map((skill, index) => (
                        <span key={index}>{skill}</span>
                      ))
                    : <p>No semantic matches detected.</p>}
                </div>
              </div>

              <div className="semantic-skill-card unmatched-card">
                <h3>! Not Matched</h3>
                <p className="semantic-count">{unmatchedSkills.length}</p>

                <div className="semantic-tags">
                  {unmatchedSkills.length > 0
                    ? unmatchedSkills.map((skill, index) => (
                        <span key={index}>{skill}</span>
                      ))
                    : <p>No unmatched skills detected.</p>}
                </div>
              </div>

            </div>

            {semanticAnalysis.length > 0 && (
              <div className="semantic-details">
                <h3>Skill-wise Similarity Details</h3>

                <p className="semantic-details-subtitle">
                  Individual similarity scores for missing keywords.
                </p>

                {semanticAnalysis.map((item, index) => {
                  const percentage = getScore(item.similarityPercentage);
                  const isMatched = item.status === "Matched";

                  return (
                    <div className="semantic-detail-row" key={index}>
                      <div className="semantic-detail-top">
                        <strong>{item.skill}</strong>

                        <span className={
                          isMatched ? "status-matched" : "status-unmatched"
                        }>
                          {item.status}
                        </span>
                      </div>

                      <div className="semantic-detail-progress">
                        <div
                          className={`semantic-detail-fill ${
                            isMatched ? "matched-fill" : "unmatched-fill"
                          }`}
                          style={{ width: ${percentage}% }}
                        ></div>
                      </div>

                      <small>{percentage}% similarity</small>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <p className="semantic-unavailable">
            Semantic matching is currently unavailable.
            Keyword-based analysis was used instead.
          </p>
        )}

      </div>
       <ResumeCharts result={result} />

    </section>
  );
}

export default Results;
