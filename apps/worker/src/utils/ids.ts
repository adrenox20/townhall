export function id(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replaceAll('-', '').slice(0, 24)}`;
}

export function publicIssueId() {
  return `GRV-${Math.floor(100000 + Math.random() * 900000)}`;
}
