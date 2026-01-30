'use client';

import Link from 'next/link';
import { Twitter, Github, MessageCircle, ExternalLink } from 'lucide-react';
import { Logo } from '@/components/common/logo';
import { Separator } from '@/components/ui/separator';
import { NAV_LINKS, SOCIAL_LINKS, SITE_NAME } from '@/lib/constants';

/**
 * Footer Component
 * Site-wide footer with navigation, legal links, and social connections
 */
export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    { title: 'Product', links: NAV_LINKS.footer.product },
    { title: 'Resources', links: NAV_LINKS.footer.resources },
    { title: 'Company', links: NAV_LINKS.footer.company },
    { title: 'Legal', links: NAV_LINKS.footer.legal },
  ];

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {/* Main footer content */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          {/* Logo and tagline column */}
          <div className="col-span-2 md:col-span-1">
            <Logo />
            <p className="mt-4 text-sm text-muted-foreground">
              Privacy-preserving insurance powered by zero-knowledge proofs on Aleo.
            </p>

            {/* Social links */}
            <div className="mt-6 flex gap-4">
              <a
                href={SOCIAL_LINKS.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href={SOCIAL_LINKS.discord}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Discord"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
              <a
                href={SOCIAL_LINKS.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Navigation columns */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
              <ul className="mt-4 space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    {'external' in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        {/* Bottom row */}
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} {SITE_NAME}. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              Built on{' '}
              <a
                href="https://aleo.org"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground hover:underline"
              >
                Aleo
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
