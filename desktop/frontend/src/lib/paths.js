export const projectPaths = {
  projectRoot: "D:\\AIProjects\\manga-auto-colorizer",
  pythonPath: "D:\\CondaEnvs\\manga-color-v2\\python.exe",
  libraryRoot: "D:\\AIProjects\\manga-auto-colorizer\\library",
  libraryBooks: "D:\\AIProjects\\manga-auto-colorizer\\library\\books",
  inputPages: "D:\\AIProjects\\manga-auto-colorizer\\input\\pages_bw",
  inputPdf: "D:\\AIProjects\\manga-auto-colorizer\\input\\pdf",
  outputRoot: "D:\\AIProjects\\manga-auto-colorizer\\output",
  outputFixed: "D:\\AIProjects\\manga-auto-colorizer\\output\\colorized_fixed",
  outputFinalPdf: "D:\\AIProjects\\manga-auto-colorizer\\output\\final_pdf",
  outputNeedsReview: "D:\\AIProjects\\manga-auto-colorizer\\output\\needs_review",
  logsDir: "D:\\AIProjects\\manga-auto-colorizer\\logs"
};

export function dirname(pathValue) {
  const normalized = String(pathValue || "").replaceAll("/", "\\");
  const index = normalized.lastIndexOf("\\");
  return index >= 0 ? normalized.slice(0, index) : normalized;
}

export function basename(pathValue) {
  const normalized = String(pathValue || "").replaceAll("/", "\\");
  const index = normalized.lastIndexOf("\\");
  return index >= 0 ? normalized.slice(index + 1) : normalized;
}
