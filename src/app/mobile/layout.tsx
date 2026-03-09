import MobileTabBar from '@/components/shared/MobileTabBar';

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <MobileTabBar />
    </>
  );
}
