import "./globals.css";

export const metadata = {
  title: "TransitOps - Smart Transport Operations Platform",
  description: "A centralized platform to manage vehicles, drivers, dispatching, maintenance logs, expenses, and real-time operational insights.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        {children}
      </body>
    </html>
  );
}
