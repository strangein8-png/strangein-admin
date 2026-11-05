import { NextResponse } from 'next/server';
import { isAdmin } from '../../../../lib/adminSession';
import { fetchAdminData } from '../../../../lib/strangeinBackend';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { mobileNo, status } = await request.json().catch(() => ({}));
  if (!mobileNo || !['active', 'inactive'].includes(status)) {
    return NextResponse.json({ message: 'mobileNo and a valid status are required' }, { status: 400 });
  }

  try {
    await setUserBlocked(String(mobileNo), status === 'inactive');
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Status update failed:', err.message);
    return NextResponse.json({ message: err.message || 'Failed to update status' }, { status: 502 });
  }
}