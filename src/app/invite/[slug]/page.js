import InvitationUI from '@/components/InvitationUI';
import { getWeddingData } from '@/lib/data';
import { publicWedding } from '@/lib/wedding';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function GuestInvitation({ params }) {
  const data = await getWeddingData();
  
  if (!data) return <div>Failed to load invitation data.</div>;
  
  const { slug } = await params;
  const guest = data.links?.find(link => link.slug === slug);
  if (!guest) notFound();
  const guestName = guest ? guest.guestName : null;
  
  return <InvitationUI data={publicWedding(data)} guestName={guestName} guestSlug={slug} initialEventId={guest.eventId} />;
}
