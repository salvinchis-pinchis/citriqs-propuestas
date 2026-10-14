import "./globals.css";
import Nav from "@/components/Nav";

export const metadata = {
  title: "Citriq · Propuestas",
  description: "Generador de propuestas comerciales de Citriq",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <Nav />
        <main className="wrap">{children}</main>
      </body>
    </html>
  );
}
