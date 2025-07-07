import { getUser } from '@/app/lib/db/queries';

export async function GET() {
  const user = await getUser();
  return Response.json(user);
}
