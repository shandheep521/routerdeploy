import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-16">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Discover Unique Items, Place Your Bids
            </h1>
            <p className="text-lg mb-8 text-blue-100">
              Join thousands of users buying and selling on the most trusted auction platform.
            </p>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <Button asChild size="lg" variant="secondary">
                <Link href="/auctions">Browse Auctions</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary">
                <Link href="/auth?mode=register&seller=true">Sell Your Items</Link>
              </Button>
            </div>
          </div>
          <div className="md:w-1/2 md:pl-12">
            <img 
              src="https://images.unsplash.com/photo-1555685812-4b8f59697ef3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&h=400&q=80" 
              alt="Auction items" 
              className="rounded-lg shadow-xl w-full h-auto"
              width="600"
              height="400"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
