import type { AppProps } from 'next/app';
import '@/styles/globals.css';
import { AleoWalletProvider } from '@/components/providers/wallet-provider';

/**
 * ZKLAIM Application Root
 * Wraps all pages with global providers and styles
 */
export default function App({ Component, pageProps }: AppProps) {
  return (
    <AleoWalletProvider>
      <Component {...pageProps} />
    </AleoWalletProvider>
  );
}
