import { useEffect, useMemo, useState } from "react";
import { BookOpen } from "lucide-react";

function buildShortLabel(title = "") {
  const clean = String(title || "").trim();
  if (!clean) {
    return "BOOK";
  }
  return clean.slice(0, 2).toUpperCase();
}

export default function BookCover({ src, title, className = "" }) {
  const [broken, setBroken] = useState(false);
  const shortLabel = useMemo(() => buildShortLabel(title), [title]);

  useEffect(() => {
    setBroken(false);
  }, [src]);

  if (!src || broken) {
    return (
      <div className={`${className} book-cover-fallback`.trim()} aria-label={title || "书籍封面占位"}>
        <BookOpen size={28} />
        <div className="book-cover-fallback-text">{shortLabel}</div>
      </div>
    );
  }

  return <img src={src} alt={title} className={className} onError={() => setBroken(true)} />;
}
