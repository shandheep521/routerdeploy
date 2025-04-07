import { Link } from "wouter";
import { Facebook, Instagram, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">BidVista</h3>
            <p className="text-gray-400">The trusted platform for online auctions. Connect with buyers and sellers worldwide.</p>
            <div className="mt-4 flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-white">
                <span className="sr-only">Facebook</span>
                <Facebook className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <span className="sr-only">Instagram</span>
                <Instagram className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <span className="sr-only">Twitter</span>
                <Twitter className="h-6 w-6" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link href="/" className="text-gray-400 hover:text-white">Home</Link></li>
              <li><Link href="/auctions" className="text-gray-400 hover:text-white">Auctions</Link></li>
              <li><Link href="/#how-it-works" className="text-gray-400 hover:text-white">How It Works</Link></li>
              <li><Link href="/#about" className="text-gray-400 hover:text-white">About Us</Link></li>
              <li><Link href="/#contact" className="text-gray-400 hover:text-white">Contact</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Categories</h3>
            <ul className="space-y-2">
              <li><Link href="/auctions?category=1" className="text-gray-400 hover:text-white">Art</Link></li>
              <li><Link href="/auctions?category=2" className="text-gray-400 hover:text-white">Electronics</Link></li>
              <li><Link href="/auctions?category=3" className="text-gray-400 hover:text-white">Collectibles</Link></li>
              <li><Link href="/auctions?category=4" className="text-gray-400 hover:text-white">Jewelry</Link></li>
              <li><Link href="/auctions?category=5" className="text-gray-400 hover:text-white">Antiques</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Stay Updated</h3>
            <p className="text-gray-400 mb-4">Subscribe to our newsletter for the latest auctions and news.</p>
            <form className="flex flex-col sm:flex-row gap-2">
              <Input
                type="email"
                placeholder="Your email"
                className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
              />
              <Button type="submit" className="whitespace-nowrap">
                Subscribe
              </Button>
            </form>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} BidVista. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
