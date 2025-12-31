export function formatOnlineMinutes(min: number = 0): string {
  const hours = Math.floor(min / 60);
  const minutes = min % 60;
  return `${hours}h ${minutes}m`;
}
