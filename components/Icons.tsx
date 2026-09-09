type Props = { name: string; size?: number };

const icons: Record<string, string> = {
  candidates: "👥", projects: "▣", upload: "↑", search: "⌕", plus: "+",
  mail: "✉", phone: "◡", location: "⌖", building: "▤", briefcase: "▥",
  calendar: "□", salary: "¥", chevron: "›", file: "▧", spark: "✦",
  check: "✓", alert: "!", question: "?", clock: "◷", more: "•••",
};

export function Icon({ name, size = 18 }: Props) {
  return <span aria-hidden="true" className={`icon icon-${name}`} style={{ fontSize: size }}>{icons[name] ?? "•"}</span>;
}
