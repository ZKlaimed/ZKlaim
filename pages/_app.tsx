import type { AppProps } from 'next/app';
import '@/styles/globals.css';

/**
 * ZKLAIM Application Root
 * Wraps all pages with global providers and styles
 */
export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
