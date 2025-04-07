import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="bg-gradient-to-r from-primary-700 to-primary-900 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Discover, Bid, Win</h1>
            <p className="text-lg text-primary-100 mb-6">The premier online auction platform for unique treasures and exceptional deals</p>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <Link href="/auctions">
                <Button className="bg-white text-primary-700 hover:bg-gray-100 px-6 py-6 rounded-md font-medium shadow-lg">
                  Browse Auctions
                </Button>
              </Link>
              <Link href="/auth?seller=true">
                <Button variant="outline" className="border border-white text-white hover:bg-primary-800 px-6 py-6 rounded-md font-medium shadow-lg">
                  Sell Your Items
                </Button>
              </Link>
            </div>
          </div>
          <div className="hidden md:block">
            <img 
              src="https://images.unsplash.com/photo-1607435339651-8692c8123a55?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80" 
              alt="Auction items" 
              className="rounded-lg shadow-xl" 
              width="600" 
              height="400" 
            />
          </div>
        </div>
      </div>
    </section>
  );
}
