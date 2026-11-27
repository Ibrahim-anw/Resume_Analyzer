import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

import "./ResumeCharts.css";

function ResumeCharts({ result }) {
  if (!result) return null;

  const sectionScores = result.sectionScores || {};

  const getScore = (value) => {
    const number = Number(value);
    return Number.isFinite(number)
      ? Math.min(100, Math.max(0, number))
      : 0;
  };

  const sectionData = [
    {
      name: "Skills",
      score: getScore(sectionScores.skills ?? result.skillMatchPercentage)
    },
    {
      name: "Education",
      score: getScore(sectionScores.education)
    },
    {
      name: "Experience",
      score: getScore(sectionScores.experience)
    },
    {
      name: "Projects",
      score: getScore(sectionScores.projects)
    }
  ];

  const matched = Array.isArray(result.foundSkills)
    ? result.foundSkills.length
    : 0;

  const missing = Array.isArray(result.missingSkills)
    ? result.missingSkills.length
    : 0;

  const skillData = [
    { name: "Matched Skills", value: matched },
    { name: "Missing Skills", value: missing }
  ];

  const COLORS = ["#3949ab", "#ef767a"];

  return (
    <section className="resume-charts">

      <div className="charts-heading">
        <span>VISUAL ANALYTICS</span>
        <h2>Resume Performance Dashboard</h2>
        <p>
          Visual overview of your resume analysis and performance.
        </p>
      </div>

      <div className="charts-grid">

        <div className="chart-card">

          <h3>Section Performance</h3>

          <p>Score comparison across resume sections.</p>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={sectionData}>

                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="name" />

                <YAxis domain={[0, 100]} />

                <Tooltip formatter={(value) => ${value}%} />

                <Bar
                  dataKey="score"
                  fill="#3949ab"
                  radius={[8, 8, 0, 0]}
                />

              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>

        <div className="chart-card">

          <h3>Skills Analysis</h3>

          <p>Matched and missing skills comparison.</p>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>

                <Pie
                  data={skillData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label
                >
                  {skillData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={COLORS[index]}
                    />
                  ))}
                </Pie>

                <Tooltip />

                <Legend />

              </PieChart>
            </ResponsiveContainer>
          </div>

        </div>

      </div>

    </section>
  );
}

export default ResumeCharts;
