import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export function CTASection() {
  return (
    <section className="py-16 bg-gradient-to-r from-primary-900 to-secondary-900 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">Ready to Start Bidding or Selling?</h2>
        <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">Join thousands of users who find unique items and great deals every day on BidWise</p>
        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Link href="/auth">
            <Button className="bg-white text-primary-700 hover:bg-gray-100 px-8 py-3 rounded-md font-medium shadow-lg">
              Create Account
            </Button>
          </Link>
          <Link href="/how-it-works">
            <Button variant="outline" className="border border-white text-white hover:bg-primary-800 px-8 py-3 rounded-md font-medium shadow-lg">
              Learn More
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
