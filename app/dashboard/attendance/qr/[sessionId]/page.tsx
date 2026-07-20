import { redirect } from 'next/navigation';

export default async function QrPageRedirect({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  redirect(`/dashboard/attendance/${sessionId}?mode=qr`);
}

