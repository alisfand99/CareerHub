/**
 * Full-bleed layout: pipeline uses the viewport width (minus padding), not max-w-7xl.
 */
export default function ApplyHubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 overflow-x-clip px-4 pb-6 pt-2 sm:px-5 md:px-8 lg:px-10"
    >
      {children}
    </div>
  );
}
