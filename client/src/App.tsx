import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import AuctionsPage from "@/pages/auctions-page";
import AuctionDetailsPage from "@/pages/auction-details-page";
import UserDashboard from "@/pages/user-dashboard";
import SellerDashboard from "@/pages/seller-dashboard";
import CreateAuctionPage from "@/pages/create-auction-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/auctions" component={AuctionsPage} />
      <Route path="/auctions/:id" component={AuctionDetailsPage} />
      <ProtectedRoute path="/dashboard" component={UserDashboard} />
      <ProtectedRoute path="/seller" component={SellerDashboard} />
      <ProtectedRoute path="/create-auction" component={CreateAuctionPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
