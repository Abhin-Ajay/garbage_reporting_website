import './globals.css';
import Providers from './providers';

export const metadata = {
  title: 'Garbage Collector Bot',
  description: 'NITC Garbage Collector Bot',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
