export function toISODateTime(dateString: string){
  const date = new Date(dateString);
  return date.toISOString();
}