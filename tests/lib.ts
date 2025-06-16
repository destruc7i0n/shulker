export function compareVersions(a: string, b: string): number {
  const aTuple = a.split('.').map(Number);
  const bTuple = b.split('.').map(Number);
  
  for (let i = 0; i < Math.max(aTuple.length, bTuple.length); i++) {
    const aVal = aTuple[i] || 0;
    const bVal = bTuple[i] || 0;
    if (aVal < bVal) return -1;
    if (aVal > bVal) return 1;
  }
  return 0;
}
