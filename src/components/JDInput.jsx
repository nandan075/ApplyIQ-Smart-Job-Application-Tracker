import Icon from "./Icon.jsx";

export default function JDInput({ value, onChange, onAnalyze, loading = false }) {
  return (
    <div className="panel jd-panel">
      <div className="panel-heading">
        <span className="round-icon"><Icon name="briefcase" /></span>
        <h3>Job Description</h3>
      </div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Paste the full job description here to analyze relevance..."
      />
      <div className="right-actions jd-actions">
        <button className="gold-button" onClick={onAnalyze} disabled={!value.trim() || loading}>
          <Icon name={loading ? "loader" : "sparkles"} className={loading ? "spin" : ""} />
          {loading ? "Analyzing..." : "Analyze & Track"}
        </button>
      </div>
    </div>
  );
}
