import InvitationUI from '@/components/InvitationUI';
import { getWeddingData } from '@/lib/data';
import { publicWedding } from '@/lib/wedding';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const data = await getWeddingData();
  
  if (!data) return <div>Failed to load invitation data.</div>;
  
  return <InvitationUI data={publicWedding(data)} />;
}
