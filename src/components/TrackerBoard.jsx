import { useState } from "react";
import Icon from "./Icon.jsx";

const initialBoard = {
  wishlist: [
    { id: "stripe", company: "Stripe", role: "Frontend Engineer", score: 82, meta: "Added 2d ago", tag: "Remote" },
    { id: "airbnb", company: "Airbnb", role: "UX Designer", score: 76, meta: "Saved today", tag: "Hybrid" },
    { id: "atlas", company: "Atlas AI", role: "UX Engineer", score: 91, meta: "Added 4d ago", tag: "Series B" },
  ],
  applied: [
    { id: "nova", company: "Nova", role: "Product Manager", score: 68, meta: "Waiting 7 days. Consider a follow-up.", tag: "Follow-up", alert: true },
    { id: "figma", company: "Figma", role: "UI Engineer", score: 84, meta: "Applied yesterday", tag: "Viewed" },
  ],
  interviewing: [
    { id: "spotify", company: "Spotify", role: "Senior Designer", score: 89, meta: "Tomorrow, 2:00 PM EST", tag: "Prep Notes", interview: true },
  ],
  offer: [
    { id: "capital-one", company: "Capital One", role: "UX Researcher", score: 71, meta: "Offer received", tag: "Done" },
  ],
  rejected: [],
};

const columns = [
  ["wishlist", "Wishlist"],
  ["applied", "Applied"],
  ["interviewing", "Interviewing"],
  ["offer", "Offer"],
  ["rejected", "Rejected"],
];

export default function TrackerBoard({ initial = initialBoard }) {
  const [board, setBoard] = useState(initial);
  const [dragging, setDragging] = useState(null);
  const [alertVisible, setAlertVisible] = useState(true);

  function moveCard(target) {
    if (!dragging || dragging.from === target) return setDragging(null);
    const card = board[dragging.from].find((item) => item.id === dragging.id);
    setBoard((current) => ({
      ...current,
      [dragging.from]: current[dragging.from].filter((item) => item.id !== dragging.id),
      [target]: [...current[target], card],
    }));
    setDragging(null);
  }

  return (
    <div className="tracker-page">
      {alertVisible && (
        <div className="follow-alert">
          <Icon name="bell" />
          <p><strong>Follow-up Alert:</strong> No response from <span>Nova</span> in 7 days. Draft a check-in?</p>
          <button onClick={() => setAlertVisible(false)}>Draft Message</button>
        </div>
      )}
      <div className="tracker-header">
        <div>
          <h2>Application Tracker</h2>
          <p>Drag and drop to update status.</p>
        </div>
        <div className="search-box"><Icon name="search" /><input placeholder="Search roles..." /></div>
        <button className="icon-square"><Icon name="filter" /></button>
      </div>
      <div className="kanban">
        {columns.map(([key, label]) => (
          <section
            className={`kanban-column ${dragging ? "drop-ready" : ""}`}
            key={key}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => moveCard(key)}
          >
            <header>
              <h3>{label} <span>{board[key].length}</span></h3>
              <button><Icon name="plus" /></button>
            </header>
            <div className="kanban-list">
              {board[key].map((card) => (
                <article
                  draggable
                  className={`job-card ${key === "rejected" ? "rejected-card" : ""}`}
                  key={card.id}
                  onDragStart={() => setDragging({ id: card.id, from: key })}
                  onDragEnd={() => setDragging(null)}
                >
                  <Icon name="grip" />
                  <div className="company-logo">{card.company.slice(0, 1)}</div>
                  <div>
                    <h4>{card.role}</h4>
                    <p>{card.company}</p>
                  </div>
                  {card.alert && <div className="card-note"><Icon name="alert" />Follow up window is open.</div>}
                  {card.interview && <div className="interview-note"><Icon name="clock" />{card.meta}</div>}
                  <div className="card-footer">
                    <span className="pill"><Icon name="sparkles" size={14} />{card.score}% match</span>
                    <span>{card.meta}</span>
                  </div>
                  <button className="tiny-action">{card.tag}</button>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
