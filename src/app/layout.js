import "./globals.css";
import { ThemeProvider } from '../lib/ThemeContext';
import DynamicFavicon from '../components/DynamicFavicon';

export const metadata = {
  title: "NextStore",
  description: "Online Cashier",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased" style={{ fontFamily: "'Inter', sans-serif", letterSpacing: "-0.01em" }}>
        <ThemeProvider>
          <DynamicFavicon />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

