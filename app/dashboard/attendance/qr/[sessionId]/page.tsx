import { redirect } from 'next/navigation';

export default async function QrPageRedirect({ 
  params,
  searchParams
}: { 
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { sessionId } = await params;
  const resolvedSearchParams = await searchParams;
  const dateParam = resolvedSearchParams.date ? `&date=${resolvedSearchParams.date}` : '';
  redirect(`/dashboard/attendance/${sessionId}?mode=qr${dateParam}`);
}
