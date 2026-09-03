import "@cg/ui/styles.css";
export const metadata = {
  title: "Emerald Operations",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
