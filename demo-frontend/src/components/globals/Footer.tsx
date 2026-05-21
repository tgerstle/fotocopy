import React from 'react';
import { Facebook, Twitter, Instagram, Linkedin, Github } from 'lucide-react';

/**
 * Footer Component
 * 
 * A Singleton Shell block for Payload CMS.
 * Acts as the global footer element within the application layout.
 * 
 * @param children - Content to be rendered within the footer container. 
 * If no children are provided, a default footer structure is rendered.
 */
interface FooterProps {
  children?: React.ReactNode;
}

const Footer: React.FC<FooterProps> = ({ children }) => {
  return (
    <footer 
      className="aa-footer csx-footer footer bg-[var(--color-black)] text-[var(--color-white)] pt-16 pb-8 transition-colors duration-300"
      aria-label="Footer"
    >
      <div className="mx-auto max-w-[calc(100%-20px)] px-5">
        {children ? (
          // If children are passed (e.g., from a Payload Block), render them directly
          <div className="footer-content-wrapper">
            {children}
          </div>
        ) : (
          // Default Footer Structure
          <div className="grid grid-cols-1 gap-12 md:grid-cols-4 lg:grid-cols-5">
            
            {/* Brand Section */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-[var(--color-main)] rounded-md" />
                <span className="text-xl font-bold tracking-tight text-[var(--color-white)]">
                  BRAND
                </span>
              </div>
              <p className="text-[var(--color-bluegray)] max-w-xs leading-relaxed">
                Building the future of digital experiences with precision and purpose. 
                Crafted with excellence and modern design principles.
              </p>
            </div>

            {/* Navigation Links */}
            <nav aria-label="Footer Navigation" className="col-span-1">
              <h3 className="text-[var(--color-white)] font-bold mb-6 uppercase tracking-wider text-sm">
                Quick Links
              </h3>
              <ul className="space-y-4">
                <li>
                  <a href="#" className="text-[var(--color-bluegray)] hover:text-[var(--color-main)] transition-colors duration-200">
                    Home
                  </a>
                </li>
                <li>
                  <a href="#" className="text-[var(--color-bluegray)] hover:text-[var(--color-main)] transition-colors duration-200">
                    Services
                  
                  </a>
                </li>
                <li>
                  <a href="#" className="text-[var(--color-bluegray)] hover:text-[var(--color-main)] transition-colors duration-200">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="text-[var(--color-bluegray)] hover:text-[var(--color-main)] transition-colors duration-200">
                    Contact
                  </a>
                </li>
              </ul>
            </nav>

            {/* Legal/Support Links */}
            <nav aria-label="Legal Navigation" className="col-span-1">
              <h3 className="text-[var(--color-white)] font-bold mb-6 uppercase tracking-wider text-sm">
                Legal
              </h3>
              <ul className="space-y-4">
                <li>
                  <a href="#" className="text-[var(--color-bluegray)] hover:text-[var(--color-main)] transition-colors duration-200">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-[var(--color-bluegray)] hover:text-[var(--color-main)] transition-colors duration-200">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="text-[var(--color-bluegray)] hover:text-[var(--color-main)] transition-colors duration-200">
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </nav>

            {/* Social Media Section */}
            <div className="col-span-1">
              <h3 className="text-[var(--color-white)] font-bold mb-6 uppercase tracking-wider text-sm">
                Follow Us
              </h3>
              <div className="flex gap-4">
                <a 
                  href="#" 
                  className="p-2 rounded-full bg-[var(--color-bluepurple)]/20 text-[var(--color-bluegray)] hover:text-[var(--color-main)] hover:bg-[var(--color-bluepurple)]/30 transition-all duration-300"
                  aria-label="Facebook"
                >
                  <Facebook size={20} />
                </a>
                <a 
                  href="#" 
                  className="p-2 rounded-full bg-[var(--color-bluepurple)]/20 text-[var(--color-bluegray)] hover:text-[var(--color-main)] hover:bg-[var(--color-bluepurple)]/30 transition-all duration-300"
                  aria-label="Twitter"
                >
                  <Twitter size={20} />
                </a>
                <a 
                  href="#" 
                  className="p-2 rounded-full bg-[var(--color-bluepurple)]/20 text-[var(--color-bluegray)] hover:text-[var(--color-main)] hover:bg-[var(--color-bluepurple)]/30 transition-all duration-300"
                  aria-label="Instagram"
                >
                  <Instagram size={20} />
                </a>
                <a 
                  href="#" 
                  className="p-2 rounded-full bg-[var(--color-bluepurple)]/20 text-[var(--color-bluegray)] hover:text-[var(--color-main)] hover:bg-[var(--color-bluepurple)]/30 transition-all duration-300"
                  aria-label="LinkedIn"
                >
                  <Linkedin size={20} />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-[var(--color-bluepurple)]/30 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[var(--color-bluegray)] text-sm">
            © {new Date().getFullYear()} Brand Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-[var(--color-bluegray)]">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--color-main)] animate-pulse" />
              System Status: Operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;