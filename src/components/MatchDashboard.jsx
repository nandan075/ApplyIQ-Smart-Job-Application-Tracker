import Icon from "./Icon.jsx";

function AnalysisList({ title, icon, tone, items }) {
  return (
    <div className="analysis-list">
      <h4 className={tone}><Icon name={icon} />{title}</h4>
      <ul>
        {items.map((item) => (
          <li key={item}><Icon name={tone === "good" ? "checkCircle" : "alert"} />{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default function MatchDashboard({
  loading = false,
  score = 72,
  label = "Strong Match",
  strengths = [
    "5+ years of React/Node.js experience strongly aligned.",
    "Leadership and agile mentoring clearly demonstrated.",
    "Cloud infrastructure (AWS) keywords match exactly.",
  ],
  gaps = [
    "Missing specific mentions of GraphQL APIs.",
    "Recent product metrics could be more quantified.",
  ],
  suggestions = [
    "Add measurable outcomes to the last two roles.",
    "Mirror the posting language around GraphQL and platform work.",
    "Move AWS project ownership into the top third of the resume.",
    "Make mentoring impact visible with team size and cadence.",
  ],
}) {
  if (loading) {
    return (
      <section className="panel score-panel processing-skeleton" aria-busy="true">
        <div className="score-gauge-wrap"><div className="skeleton-circle" /></div>
        <div className="score-details">
          <div className="skeleton-stack"><b /><span /><span /><span /></div>
          <div className="skeleton-stack"><b /><span /><span /></div>
          <div className="suggestions skeleton-stack"><b /><span /><span /><span /></div>
        </div>
      </section>
    );
  }

  return (
    <section className="panel score-panel">
      <div className="score-gauge-wrap">
        <h3>Relevance Score</h3>
        <div className="score-gauge">
          <svg viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" />
            <circle className="progress" cx="50" cy="50" r="45" pathLength="100" strokeDasharray={`${score} 100`} />
          </svg>
          <div><strong>{score}%</strong><span>{label}</span></div>
        </div>
      </div>
      <div className="score-details">
        <AnalysisList title="Matched Strengths" icon="checkCircle" tone="good" items={strengths} />
        <AnalysisList title="Drawbacks & Gaps" icon="alert" tone="warn" items={gaps} />
        <div className="suggestions">
          <h4><Icon name="lightbulb" />Actionable Suggestions</h4>
          <ul>
            {suggestions.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}
