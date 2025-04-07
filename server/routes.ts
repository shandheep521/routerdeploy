import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  insertCategorySchema, 
  insertProductSchema, 
  insertBidSchema, 
  insertWatchlistSchema, 
  auctionTypeEnum 
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Category routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (err) {
      res.status(500).json({ message: "Error fetching categories" });
    }
  });

  app.get("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.getCategoryById(id);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(category);
    } catch (err) {
      res.status(500).json({ message: "Error fetching category" });
    }
  });

  // Product routes
  app.get("/api/products", async (req, res) => {
    try {
      const filter: any = {};
      
      if (req.query.categoryId) {
        filter.categoryId = parseInt(req.query.categoryId as string);
      }
      
      if (req.query.sellerId) {
        filter.sellerId = parseInt(req.query.sellerId as string);
      }
      
      if (req.query.isActive) {
        filter.isActive = req.query.isActive === 'true';
      }
      
      if (req.query.status) {
        filter.status = req.query.status as string;
      }
      
      const products = await storage.getProducts(filter);
      res.json(products);
    } catch (err) {
      res.status(500).json({ message: "Error fetching products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProductById(id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (err) {
      res.status(500).json({ message: "Error fetching product" });
    }
  });

  app.post("/api/products", checkAuth, async (req: Request, res: Response) => {
    try {
      // Validate the product data
      const productData = insertProductSchema.parse(req.body);
      
      // Create the product
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: err.errors });
      }
      res.status(500).json({ message: "Error creating product" });
    }
  });

  app.put("/api/products/:id", checkAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProductById(id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Check if the user is the seller
      if (req.user!.id !== product.sellerId && !req.user!.isAdmin) {
        return res.status(403).json({ message: "Not authorized to update this product" });
      }
      
      // Update the product
      const updatedProduct = await storage.updateProduct(id, req.body);
      res.json(updatedProduct);
    } catch (err) {
      res.status(500).json({ message: "Error updating product" });
    }
  });

  app.delete("/api/products/:id", checkAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProductById(id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Check if the user is the seller
      if (req.user!.id !== product.sellerId && !req.user!.isAdmin) {
        return res.status(403).json({ message: "Not authorized to delete this product" });
      }
      
      // Delete the product
      const success = await storage.deleteProduct(id);
      if (success) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Error deleting product" });
      }
    } catch (err) {
      res.status(500).json({ message: "Error deleting product" });
    }
  });

  // Bid routes
  app.get("/api/products/:id/bids", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const bids = await storage.getBidsByProductId(productId);
      res.json(bids);
    } catch (err) {
      res.status(500).json({ message: "Error fetching bids" });
    }
  });

  app.post("/api/bids", checkAuth, async (req: Request, res: Response) => {
    try {
      // Validate the bid data
      const bidData = insertBidSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      
      // Check if the product exists
      const product = await storage.getProductById(bidData.productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Check if the auction is active or upcoming
      if (product.status !== 'active' && product.status !== 'upcoming') {
        return res.status(400).json({ message: "Auction is not active or upcoming" });
      }
      
      // Check if the bid amount is valid
      if (bidData.amount <= product.currentPrice) {
        return res.status(400).json({ 
          message: `Bid amount must be greater than current price of $${product.currentPrice}` 
        });
      }
      
      // Check if the bid increment is valid
      if (bidData.amount < product.currentPrice + product.increment) {
        return res.status(400).json({ 
          message: `Bid amount must be at least $${product.currentPrice + product.increment}` 
        });
      }
      
      // Create the bid
      const bid = await storage.createBid(bidData);
      res.status(201).json(bid);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid bid data", errors: err.errors });
      }
      res.status(500).json({ message: "Error placing bid" });
    }
  });

  app.get("/api/users/:id/bids", checkAuth, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Check if the user is requesting their own bids
      if (req.user!.id !== userId && !req.user!.isAdmin) {
        return res.status(403).json({ message: "Not authorized to view these bids" });
      }
      
      const bids = await storage.getBidsByUserId(userId);
      res.json(bids);
    } catch (err) {
      res.status(500).json({ message: "Error fetching bids" });
    }
  });

  // Watchlist routes
  app.get("/api/users/:id/watchlist", checkAuth, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Check if the user is requesting their own watchlist
      if (req.user!.id !== userId && !req.user!.isAdmin) {
        return res.status(403).json({ message: "Not authorized to view this watchlist" });
      }
      
      const watchlist = await storage.getWatchlistByUserId(userId);
      
      // Get the product details for each watchlist item
      const watchlistWithProducts = await Promise.all(
        watchlist.map(async (item) => {
          const product = await storage.getProductById(item.productId);
          return {
            ...item,
            product
          };
        })
      );
      
      res.json(watchlistWithProducts);
    } catch (err) {
      res.status(500).json({ message: "Error fetching watchlist" });
    }
  });

  app.post("/api/watchlist", checkAuth, async (req: Request, res: Response) => {
    try {
      // Validate the watchlist data
      const watchlistData = insertWatchlistSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      
      // Check if the product exists
      const product = await storage.getProductById(watchlistData.productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Check if the item is already in the watchlist
      const existingItem = await storage.getWatchlistItem(
        watchlistData.userId, 
        watchlistData.productId
      );
      
      if (existingItem) {
        return res.status(400).json({ message: "Item already in watchlist" });
      }
      
      // Add to watchlist
      const watchlistItem = await storage.createWatchlistItem(watchlistData);
      res.status(201).json(watchlistItem);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid watchlist data", errors: err.errors });
      }
      res.status(500).json({ message: "Error adding to watchlist" });
    }
  });

  app.delete("/api/watchlist/:productId", checkAuth, async (req: Request, res: Response) => {
    try {
      const productId = parseInt(req.params.productId);
      const userId = req.user!.id;
      
      // Remove from watchlist
      const success = await storage.deleteWatchlistItem(userId, productId);
      
      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "Watchlist item not found" });
      }
    } catch (err) {
      res.status(500).json({ message: "Error removing from watchlist" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Middleware to check if user is authenticated
function checkAuth(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
}
