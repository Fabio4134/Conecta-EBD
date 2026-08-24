export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return 'N/A';
  // If it's already in DD/MM/AAAA format, return it
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
  
  // If it's in YYYY-MM-DD format
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  
  return dateStr;
}

export function toIsoDate(dateStr: string): string {
  // Converts DD/MM/AAAA to YYYY-MM-DD
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month}-${day}`;
  }
  return dateStr;
}
