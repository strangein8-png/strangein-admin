import { NextResponse } from 'next/server';
import { isAdmin } from '../../../../lib/adminSession';
import { fetchAllUsers } from '../../../../lib/strangeinBackend';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  try {
    const users = await fetchAllUsers();
    return NextResponse.json({ users });
  } catch (err) {
    console.error('Admin users fetch failed:', err.message);
    return NextResponse.json({ message: err.message || 'Failed to load users' }, { status: 502 });
  }
}
