import { redirect } from 'next/navigation';
import { isAdmin } from '../../lib/adminSession';
import Dashboard from '../../components/admin/Dashboard';
import './admin.css';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  if (!(await isAdmin())) redirect('/admin/login');
  return <Dashboard />;
}
