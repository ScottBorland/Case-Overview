export function getHazardColourFromTitle(titleRaw: string): string {
  const raw = (titleRaw || '').trim();
  const normalized = raw
    .toLowerCase()
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();

  const firstWord = normalized.split(' ')[0] || '';

  const isEmerging =
    firstWord === 'emerging' ||
    normalized.endsWith('- emerging') ||
    normalized.includes(' - emerging');

  const isModerate =
    firstWord === 'moderate' ||
    normalized.endsWith('- moderate') ||
    normalized.includes(' - moderate');

  const isSignificant =
    firstWord === 'significant' ||
    normalized.endsWith('- significant') ||
    normalized.includes(' - significant');

  if (isSignificant) return 'rgb(185, 28, 28)';   // red
  if (isModerate) return 'rgb(180, 83, 9)';       // amber
  if (isEmerging) return 'rgb(22, 163, 74)';      // green

  return '#64748b'; // default slate
}