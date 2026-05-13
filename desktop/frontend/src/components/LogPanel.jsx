import { useEffect, useMemo, useRef } from "react";
import ActionButton from "./ActionButton";

function isErrorLine(line) {
  return /error|failed|exception|traceback|warn/i.test(line);
}

export default function LogPanel({ title, content = "", emptyText = "暂无日志。", onRefresh }) {
  const scrollRef = useRef(null);
  const lines = useMemo(() => String(content || "").split(/\r?\n/).filter(Boolean), [content]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [content]);

  return (
    <section className="log-panel manga-card">
      <header className="manga-card-header">
        <div>
          <h3 className="manga-card-title">{title}</h3>
          <p className="manga-card-subtitle">任务情报板</p>
        </div>
        {onRefresh ? (
          <ActionButton variant="ghost" hint="刷新当前日志" onClick={onRefresh}>
            刷新
          </ActionButton>
        ) : null}
      </header>
      <div className="manga-card-body">
        <div ref={scrollRef} className="log-panel-body">
          {lines.length ? (
            lines.map((line, index) => (
              <div key={`${index}-${line.slice(0, 24)}`} className={`log-line ${isErrorLine(line) ? "is-error" : ""}`}>
                {line}
              </div>
            ))
          ) : (
            <div className="log-empty">{emptyText}</div>
          )}
        </div>
      </div>
    </section>
  );
}
