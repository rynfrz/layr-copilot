import './globals.css';
export const metadata = { title: 'Layr Copilot — Admin', robots: { index: false } };
export default function RootLayout({ children }) {
  return (<html lang="en"><body>{children}</body></html>);
}
