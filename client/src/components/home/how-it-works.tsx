import { useRef } from "react";

export default function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  
  return (
    <section ref={sectionRef} id="how-it-works" className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold mb-2 text-center">How It Works</h2>
        <p className="text-gray-600 text-center mb-12">
          Simple steps to start bidding or selling on our platform
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary bg-opacity-10 rounded-full flex items-center justify-center text-primary text-2xl font-bold mx-auto mb-4">
              1
            </div>
            <h3 className="text-lg font-semibold mb-2">Create Account</h3>
            <p className="text-gray-600">
              Register with your email and verify your identity to start buying or selling.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-primary bg-opacity-10 rounded-full flex items-center justify-center text-primary text-2xl font-bold mx-auto mb-4">
              2
            </div>
            <h3 className="text-lg font-semibold mb-2">Browse or List Items</h3>
            <p className="text-gray-600">
              Find items you're interested in or list your own items for auction.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-primary bg-opacity-10 rounded-full flex items-center justify-center text-primary text-2xl font-bold mx-auto mb-4">
              3
            </div>
            <h3 className="text-lg font-semibold mb-2">Bid or Sell</h3>
            <p className="text-gray-600">
              Place bids on items you want or manage your auctions and track bids.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
