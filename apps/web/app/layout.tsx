import "@cg/ui/styles.css";
export const metadata = {
  title: "web" === "web" ? "Emerald Play Demo" : "Emerald Operations",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
