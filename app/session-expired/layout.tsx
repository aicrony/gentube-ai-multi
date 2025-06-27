// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export default function SessionExpiredLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">{children}</div>
  );
}