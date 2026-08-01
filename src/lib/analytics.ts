const GA_ID = process.env.NEXT_PUBLIC_GA_ID || '';
const GSC_ID = process.env.NEXT_PUBLIC_GSC_ID || '';

export function getGAId(): string {
  return GA_ID;
}

export function getGSCId(): string {
  return GSC_ID;
}
