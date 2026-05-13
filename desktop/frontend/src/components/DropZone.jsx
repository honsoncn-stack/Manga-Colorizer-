import { useMemo, useState } from "react";
import ActionButton from "./ActionButton";
import { dirname } from "../lib/paths";
import { selectCbzFile, selectImageFolder, selectPdfFile } from "../lib/api";

function extractFilePath(file) {
  return file?.path || file?.name || "";
}

export default function DropZone({ mode = "folder", onSelectPath, label, hint }) {
  const [dragActive, setDragActive] = useState(false);
  const actionLabel = useMemo(() => {
    if (mode === "pdf") {
      return "选择 PDF";
    }
    if (mode === "cbz") {
      return "选择 CBZ";
    }
    return "选择图片文件夹";
  }, [mode]);

  const handleDrop = async (event) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer?.files?.[0];
    if (!file) {
      return;
    }
    const rawPath = extractFilePath(file);
    if (!rawPath) {
      return;
    }
    if (mode === "folder") {
      onSelectPath?.(dirname(rawPath));
    } else {
      onSelectPath?.(rawPath);
    }
  };

  const handlePick = async () => {
    let selected = null;
    if (mode === "pdf") {
      selected = await selectPdfFile();
    } else if (mode === "cbz") {
      selected = await selectCbzFile();
    } else {
      selected = await selectImageFolder();
    }
    if (selected) {
      onSelectPath?.(selected);
    }
  };

  return (
    <div
      className={`drop-zone ${dragActive ? "is-active" : ""}`}
      onDragOver={(event) => {
        event.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
    >
      <div className="drop-zone-title">{label}</div>
      <div className="drop-zone-hint">{hint}</div>
      <ActionButton variant="secondary" hint={actionLabel} onClick={handlePick}>
        {actionLabel}
      </ActionButton>
    </div>
  );
}
