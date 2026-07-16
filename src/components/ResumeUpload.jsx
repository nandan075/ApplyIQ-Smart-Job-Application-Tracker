import { useEffect, useRef, useState } from "react";
import Icon from "./Icon.jsx";

export default function ResumeUpload({ onFileSelected, uploading = false }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle");
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function chooseFile(nextFile) {
    if (!nextFile || uploading) return;
    clearTimeout(timer.current);
    setFile(nextFile);
    setStatus("parsing");
    try {
      await onFileSelected?.(nextFile);
      setStatus("ready");
    } catch (_error) {
      setStatus("idle");
    }
  }

  const parsing = uploading || status === "parsing";

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
        <Icon name={parsing ? "loader" : "upload"} size={36} className={parsing ? "spin" : ""} />
        <strong>{file ? file.name : "Drag & Drop Resume"}</strong>
        <span>{status === "ready" ? "Parsed and ready for matching" : "Parsing text + structured output takes about 3-5 seconds"}</span>
        <input type="file" accept=".pdf,.docx" disabled={uploading} onChange={(event) => chooseFile(event.target.files[0])} />
        <b>{parsing ? "Parsing..." : status === "ready" ? "Replace File" : "Browse Files"}</b>
        {parsing && <div className="upload-progress"><span /></div>}
      </label>
    </div>
  );
}
