export function safeStorageFilename(originalName: string, extension: string) {
  const suffix = `.${extension.toLowerCase()}`;
  const rawStem = originalName.toLowerCase().endsWith(suffix)
    ? originalName.slice(0, -suffix.length)
    : originalName;
  const stem = rawStem
    .normalize("NFKD")
    .replace(/[^A-Za-z0-9._-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 90) || "resume";
  return `${stem}${suffix}`;
}
