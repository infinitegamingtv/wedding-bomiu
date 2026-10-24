import InvitationUI from '@/components/InvitationUI';
import { getWeddingData } from '@/lib/data';
import { publicWedding } from '@/lib/wedding';
import { notFound } from 'next/navigation';

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const data = await getWeddingData();
  const guest = data?.links?.find(link => link.slug === slug);
  const groom = data?.invitation?.groom || 'Quang Trưởng';
  const bride = data?.invitation?.bride || 'Hồng Nhung';
  const coverImage = data?.invitation?.heroBgUrl || '/optimized/uploads/TVBA9926-2.webp';
  const title = guest?.guestName
    ? `Thân mời ${guest.guestName} — Thiệp Cưới ${groom} & ${bride}`
    : `Thiệp Cưới ${groom} & ${bride}`;
  const description = guest?.guestName
    ? `Trân trọng kính mời ${guest.guestName} tới dự bữa tiệc chung vui cùng gia đình ${groom} & ${bride}.`
    : `Trân trọng kính mời tới dự lễ thành hôn của ${groom} và ${bride}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'vi_VN',
      images: [{ url: coverImage, width: 1200, height: 800, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [coverImage],
    },
  };
}

export default async function GuestInvitation({ params }) {
  const data = await getWeddingData();
  
  if (!data) return <div>Failed to load invitation data.</div>;
  
  const { slug } = await params;
  const guest = data.links?.find(link => link.slug === slug);
  if (!guest) notFound();
  const guestName = guest ? guest.guestName : null;
  
  return <InvitationUI data={publicWedding(data)} guestName={guestName} guestSlug={slug} initialEventId={guest.eventId} />;
}
