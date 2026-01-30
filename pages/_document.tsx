import { Html, Head, Main, NextScript } from 'next/document';

/**
 * Custom Document
 * Augments the application's <html> and <body> tags
 */
export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
