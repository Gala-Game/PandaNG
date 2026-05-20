import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Providers } from '../providers';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="flex h-screen overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto bg-deep-black/90 p-6">
          {children}
        </main>
      </div>
    </Providers>
  );
}
