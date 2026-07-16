import { useEffect, useRef, useState } from "react";
import Icon from "./Icon.jsx";

export default function ResumeUpload({ onFileSelected }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle");
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  function chooseFile(nextFile) {
    if (!nextFile) return;
    clearTimeout(timer.current);
    setFile(nextFile);
    setStatus("parsing");
    onFileSelected?.(nextFile);
    timer.current = setTimeout(() => setStatus("ready"), 900);
  }

  return (
    <div className="panel upload-panel">
      <div className="panel-heading">
        <span className="round-icon"><Icon name="file" /></span>
        <h3>Your Resume</h3>
      </div>
      <label
        className={`drop-zone ${status !== "idle" ? "has-file" : ""}`}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          chooseFile(event.dataTransfer.files[0]);
        }}
      >
        <Icon name={status === "parsing" ? "loader" : "upload"} size={36} className={status === "parsing" ? "spin" : ""} />
        <strong>{file ? file.name : "Drag & Drop Resume"}</strong>
        <span>{status === "ready" ? "Parsed and ready for matching" : "Supports PDF, DOCX, TXT (Max 5MB)"}</span>
        <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={(event) => chooseFile(event.target.files[0])} />
        <b>{status === "parsing" ? "Parsing..." : status === "ready" ? "Replace File" : "Browse Files"}</b>
      </label>
    </div>
  );
}
