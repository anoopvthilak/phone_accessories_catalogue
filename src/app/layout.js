import "./globals.css";

export const metadata = {
  title: "Phone Accessories Catalogue",
  description: "Internal catalogue for retail store phone accessories management",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#0b0f19] text-slate-100 selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
