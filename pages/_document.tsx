import { Html, Head, Main, NextScript } from 'next/document';

/**
 * Custom Document
 * Augments the application's <html> and <body> tags
 */
export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Favicon and app icons */}
        <link rel="icon" href="/logo.jpeg" />
        <link rel="apple-touch-icon" href="/logo.jpeg" />
        <link rel="shortcut icon" href="/logo.jpeg" />

        {/* Meta tags for branding */}
        <meta name="theme-color" content="#0f172a" />
        <meta name="application-name" content="ZKLAIM" />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
