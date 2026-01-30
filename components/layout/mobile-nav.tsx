'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { X, ChevronRight, ExternalLink, Wallet, Sun, Moon, Shield } from 'lucide-react';
import { Logo } from '@/components/common/logo';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { NAV_LINKS } from '@/lib/constants';

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
}

/**
 * MobileNav Component
 * Slide-out navigation drawer for mobile devices
 */
export function MobileNav({ open, onClose, theme, onThemeToggle }: MobileNavProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when open
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:w-80">
        <SheetHeader className="text-left">
          <SheetTitle>
            <Logo />
          </SheetTitle>
        </SheetHeader>

        <nav className="mt-8 flex flex-col gap-2" aria-label="Mobile navigation">
          {/* Main navigation links */}
          {NAV_LINKS.main.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className="flex items-center justify-between rounded-md px-3 py-3 text-lg font-medium transition-colors hover:bg-accent"
            >
              {link.label}
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Link>
          ))}

          <Separator className="my-2" />

          {/* Products accordion */}
          <Accordion type="single" collapsible>
            <AccordionItem value="products" className="border-none">
              <AccordionTrigger className="px-3 py-3 text-lg font-medium hover:bg-accent hover:no-underline [&[data-state=open]]:bg-accent">
                Products
              </AccordionTrigger>
              <AccordionContent className="pb-0">
                <div className="flex flex-col gap-1 pl-4">
                  {NAV_LINKS.products.map((product) => (
                    <Link
                      key={product.href}
                      href={product.href}
                      onClick={onClose}
                      className={`rounded-md px-3 py-2 transition-colors ${
                        product.disabled
                          ? 'pointer-events-none opacity-50'
                          : 'hover:bg-accent'
                      }`}
                    >
                      <span className="font-medium">{product.label}</span>
                      <p className="text-sm text-muted-foreground">{product.description}</p>
                    </Link>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Separator className="my-2" />

          {/* Additional links */}
          <Link
            href="/how-it-works"
            onClick={onClose}
            className="flex items-center justify-between rounded-md px-3 py-3 text-lg font-medium transition-colors hover:bg-accent"
          >
            How It Works
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>
          <Link
            href="https://docs.zklaim.io"
            onClick={onClose}
            className="flex items-center justify-between rounded-md px-3 py-3 text-lg font-medium transition-colors hover:bg-accent"
          >
            Documentation
            <ExternalLink className="h-5 w-5 text-muted-foreground" />
          </Link>

          <Separator className="my-2" />

          {/* Connect Wallet Button */}
          <Button className="mt-2 w-full gap-2" size="lg">
            <Wallet className="h-5 w-5" />
            Connect Wallet
          </Button>

          {/* Theme toggle */}
          <Button
            variant="outline"
            className="mt-2 w-full gap-2"
            size="lg"
            onClick={onThemeToggle}
          >
            {theme === 'light' ? (
              <>
                <Moon className="h-5 w-5" />
                Dark Mode
              </>
            ) : (
              <>
                <Sun className="h-5 w-5" />
                Light Mode
              </>
            )}
          </Button>

          {/* Trust indicator */}
          <div className="mt-6 flex items-center gap-2 rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
            <Shield className="h-5 w-5 text-accent" />
            <span>Your data never leaves your device</span>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
