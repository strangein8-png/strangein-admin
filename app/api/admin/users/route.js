import { NextResponse } from 'next/server';
import { isAdmin } from '../../../../lib/adminSession';
import { fetchAdminData } from '../../../../lib/strangeinBackend';

export const dynamic = 'force-dynamic';

// Returns { users, feedback, issues, warnings }
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  try {
    return NextResponse.json(await fetchAdminData());
  } catch (err) {
    console.error('Admin data fetch failed:', err.message);
    return NextResponse.json({ message: err.message || 'Failed to load data' }, { status: 502 });
  }
}