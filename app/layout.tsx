import "./globals.css";
import Navbar from "./navbar/navbar";
export const metadata = {
  title: "Ticketsystem - Pixelmanufaktur",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}