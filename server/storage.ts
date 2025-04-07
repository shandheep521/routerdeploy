import { users, type User, type InsertUser } from "@shared/schema";
import { products, type Product, type InsertProduct } from "@shared/schema";
import { categories, type Category, type InsertCategory } from "@shared/schema";
import { bids, type Bid, type InsertBid } from "@shared/schema";
import { watchlists, type Watchlist, type InsertWatchlist } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Storage interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  
  // Category methods
  getCategories(): Promise<Category[]>;
  getCategoryById(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<Category>): Promise<Category | undefined>;
  
  // Product methods
  getProducts(filter?: {
    categoryId?: number;
    sellerId?: number;
    isActive?: boolean;
    status?: string;
  }): Promise<Product[]>;
  getProductById(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<Product>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  
  // Bid methods
  getBidsByProductId(productId: number): Promise<Bid[]>;
  getBidsByUserId(userId: number): Promise<Bid[]>;
  createBid(bid: InsertBid): Promise<Bid>;
  
  // Watchlist methods
  getWatchlistByUserId(userId: number): Promise<Watchlist[]>;
  getWatchlistItem(userId: number, productId: number): Promise<Watchlist | undefined>;
  createWatchlistItem(watchlist: InsertWatchlist): Promise<Watchlist>;
  deleteWatchlistItem(userId: number, productId: number): Promise<boolean>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private products: Map<number, Product>;
  private bids: Map<number, Bid>;
  private watchlists: Map<number, Watchlist>;
  
  // Current IDs for auto-increment
  private userId: number;
  private categoryId: number;
  private productId: number;
  private bidId: number;
  private watchlistId: number;
  
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.products = new Map();
    this.bids = new Map();
    this.watchlists = new Map();
    
    this.userId = 1;
    this.categoryId = 1;
    this.productId = 1;
    this.bidId = 1;
    this.watchlistId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24h
    });
    
    // Add seed data
    this.seedData();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id, createdAt: new Date(), isAdmin: false };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Category methods
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }
  
  async getCategoryById(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }
  
  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.categoryId++;
    const category: Category = { ...insertCategory, id, itemCount: 0 };
    this.categories.set(id, category);
    return category;
  }
  
  async updateCategory(id: number, categoryData: Partial<Category>): Promise<Category | undefined> {
    const category = this.categories.get(id);
    if (!category) return undefined;
    
    const updatedCategory = { ...category, ...categoryData };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }
  
  // Product methods
  async getProducts(filter?: {
    categoryId?: number;
    sellerId?: number;
    isActive?: boolean;
    status?: string;
  }): Promise<Product[]> {
    let products = Array.from(this.products.values());
    
    if (filter) {
      if (filter.categoryId !== undefined) {
        products = products.filter(p => p.categoryId === filter.categoryId);
      }
      
      if (filter.sellerId !== undefined) {
        products = products.filter(p => p.sellerId === filter.sellerId);
      }
      
      if (filter.isActive !== undefined) {
        products = products.filter(p => p.isActive === filter.isActive);
      }
      
      if (filter.status !== undefined) {
        products = products.filter(p => p.status === filter.status);
      }
    }
    
    return products;
  }
  
  async getProductById(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }
  
  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.productId++;
    const product: Product = { 
      ...insertProduct, 
      id, 
      isActive: true, 
      isSold: false, 
      createdAt: new Date(),
      bidCount: 0,
      status: 'upcoming'
    };
    
    this.products.set(id, product);
    
    // Update category item count
    const category = this.categories.get(product.categoryId);
    if (category) {
      this.categories.set(
        category.id, 
        { ...category, itemCount: category.itemCount + 1 }
      );
    }
    
    return product;
  }
  
  async updateProduct(id: number, productData: Partial<Product>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    const updatedProduct = { ...product, ...productData };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }
  
  async deleteProduct(id: number): Promise<boolean> {
    const product = this.products.get(id);
    if (!product) return false;
    
    // Update category item count
    const category = this.categories.get(product.categoryId);
    if (category) {
      this.categories.set(
        category.id, 
        { ...category, itemCount: Math.max(0, category.itemCount - 1) }
      );
    }
    
    return this.products.delete(id);
  }
  
  // Bid methods
  async getBidsByProductId(productId: number): Promise<Bid[]> {
    return Array.from(this.bids.values())
      .filter(bid => bid.productId === productId)
      .sort((a, b) => {
        // Sort by amount descending
        return b.amount - a.amount;
      });
  }
  
  async getBidsByUserId(userId: number): Promise<Bid[]> {
    return Array.from(this.bids.values())
      .filter(bid => bid.userId === userId)
      .sort((a, b) => {
        // Sort by createdAt descending (newest first)
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
  }
  
  async createBid(insertBid: InsertBid): Promise<Bid> {
    // Get the product first to verify it exists and the bid is valid
    const product = this.products.get(insertBid.productId);
    if (!product) {
      throw new Error('Product not found');
    }
    
    // Check if the auction is active or upcoming (allowing bids on upcoming auctions)
    const now = new Date();
    if (product.status !== 'active' && product.status !== 'upcoming') {
      throw new Error('This auction is not active or upcoming');
    }
    
    // Verify the bid amount is greater than the current price
    if (insertBid.amount <= product.currentPrice) {
      throw new Error(`Bid amount must be higher than the current price of $${product.currentPrice}`);
    }
    
    // Create the bid
    const id = this.bidId++;
    const bid: Bid = { ...insertBid, id, createdAt: new Date() };
    this.bids.set(id, bid);
    
    // Update product current price and bid count
    const updatedProduct = { 
      ...product, 
      currentPrice: bid.amount,
      bidCount: product.bidCount + 1 
    };
    
    // If it's time to start the auction, set status to active
    if (product.status === 'upcoming' && now >= product.startDate) {
      updatedProduct.status = 'active';
    }
    
    this.products.set(product.id, updatedProduct);
    
    return bid;
  }
  
  // Watchlist methods
  async getWatchlistByUserId(userId: number): Promise<Watchlist[]> {
    return Array.from(this.watchlists.values())
      .filter(watchlist => watchlist.userId === userId);
  }
  
  async getWatchlistItem(userId: number, productId: number): Promise<Watchlist | undefined> {
    return Array.from(this.watchlists.values())
      .find(watchlist => watchlist.userId === userId && watchlist.productId === productId);
  }
  
  async createWatchlistItem(insertWatchlist: InsertWatchlist): Promise<Watchlist> {
    const id = this.watchlistId++;
    const watchlist: Watchlist = { ...insertWatchlist, id, createdAt: new Date() };
    this.watchlists.set(id, watchlist);
    return watchlist;
  }
  
  async deleteWatchlistItem(userId: number, productId: number): Promise<boolean> {
    const watchlist = Array.from(this.watchlists.values())
      .find(watchlist => watchlist.userId === userId && watchlist.productId === productId);
    
    if (!watchlist) return false;
    return this.watchlists.delete(watchlist.id);
  }

  // Seed data for testing/demo
  private seedData() {
    // Seed categories
    const categories: InsertCategory[] = [
      { 
        name: 'Electronics', 
        description: 'Electronic devices and gadgets',
        imageUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="%2338B2AC"/><text x="150" y="150" font-size="24" fill="%23FFFFFF" text-anchor="middle" dominant-baseline="middle">Electronics</text></svg>'
      },
      { 
        name: 'Collectibles', 
        description: 'Collectible items and memorabilia',
        imageUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="%234A5568"/><text x="150" y="150" font-size="24" fill="%23FFFFFF" text-anchor="middle" dominant-baseline="middle">Collectibles</text></svg>'
      },
      { 
        name: 'Art', 
        description: 'Artwork and artistic creations',
        imageUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="%23805AD5"/><text x="150" y="150" font-size="24" fill="%23FFFFFF" text-anchor="middle" dominant-baseline="middle">Art</text></svg>'
      },
      { 
        name: 'Jewelry', 
        description: 'Jewelry and precious items',
        imageUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="%23F6AD55"/><text x="150" y="150" font-size="24" fill="%23FFFFFF" text-anchor="middle" dominant-baseline="middle">Jewelry</text></svg>'
      }
    ];
    
    categories.forEach(category => {
      this.createCategory(category);
    });

    // Seed users with pre-hashed passwords
    const users: InsertUser[] = [
      {
        username: 'seller1',
        // Password: password123.seller1
        // This is a pre-hashed password to avoid dependency issues with auth.ts
        password: '5c65645a7a25fbd09ef5546f0bced933431ef8150e36a6b2809f7c338d1ab8d93fab7eba14fec59b544ac582411d49c8a02d2fd6f287eba62bbb8dfc973dcecb.cc40d481ac9b8cde6212df13196c8949',
        email: 'seller1@example.com',
        fullName: 'John Seller',
        phone: '555-123-4567',
        address: '123 Main St, Anytown, USA',
        isSeller: true
      },
      {
        username: 'bidder1',
        // Password: password123.bidder1
        // This is a pre-hashed password to avoid dependency issues with auth.ts
        password: 'ed9f77a816efd478b97fa1754ec0c98af7789bf32430df9cc3ca7d8ddd482056def7b4c750ae5e769954e948ed0b7bcf792f42bfd8c9a23b8225d955a7a31069.4ae1be9c2c9fbc41fe45f73c1b298256',
        email: 'bidder1@example.com',
        fullName: 'Jane Bidder',
        phone: '555-987-6543',
        address: '456 Oak Ave, Somewhere, USA',
        isSeller: false
      }
    ];

    let seller = null;
    users.forEach(user => {
      const createdUser = this.createUser(user);
      if (user.isSeller) {
        seller = createdUser;
      }
    });

    // Only seed products if we have a seller
    if (seller) {
      // Get category IDs
      const categoryIds = Array.from(this.categories.values()).map(cat => cat.id);
      
      // Create sample auction products
      const now = new Date();
      const oneDay = 24 * 60 * 60 * 1000; // milliseconds in one day
      
      const products: InsertProduct[] = [
        {
          title: 'Vintage Camera Collection',
          description: 'A rare collection of vintage cameras from the 1950s. Includes 5 cameras in working condition with original cases and manuals.',
          imageUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="%23718096"/><text x="400" y="300" font-size="48" fill="%23FFFFFF" text-anchor="middle" dominant-baseline="middle">Vintage Camera Collection</text></svg>',
          categoryId: categoryIds[0], // Electronics
          sellerId: seller.id,
          initialPrice: 250,
          currentPrice: 250,
          increment: 10,
          startDate: new Date(now.getTime() - oneDay), // Started yesterday
          endDate: new Date(now.getTime() + 6 * oneDay), // Ends in 6 days
          status: 'active',
          isActive: true,
          isSold: false,
          auctionType: 'traditional',
          bidCount: 0
        },
        {
          title: 'Limited Edition Comic Book Set',
          description: 'Complete set of limited edition Marvel comic books from the early 2000s. Mint condition and never opened.',
          imageUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="%234A5568"/><text x="400" y="300" font-size="48" fill="%23FFFFFF" text-anchor="middle" dominant-baseline="middle">Comic Book Collection</text></svg>',
          categoryId: categoryIds[1], // Collectibles
          sellerId: seller.id,
          initialPrice: 500,
          currentPrice: 500,
          increment: 25,
          startDate: new Date(now.getTime() - 2 * oneDay), // Started 2 days ago
          endDate: new Date(now.getTime() + 5 * oneDay), // Ends in 5 days
          status: 'active',
          isActive: true,
          isSold: false,
          auctionType: 'traditional',
          bidCount: 0
        },
        {
          title: 'Original Abstract Painting',
          description: 'Original abstract painting by emerging artist. Acrylic on canvas, 36" x 48". Signed and comes with certificate of authenticity.',
          imageUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="%23805AD5"/><text x="400" y="300" font-size="48" fill="%23FFFFFF" text-anchor="middle" dominant-baseline="middle">Abstract Painting</text></svg>',
          categoryId: categoryIds[2], // Art
          sellerId: seller.id,
          initialPrice: 1200,
          currentPrice: 1200,
          increment: 50,
          startDate: new Date(now.getTime() - 3 * oneDay), // Started 3 days ago
          endDate: new Date(now.getTime() + 4 * oneDay), // Ends in 4 days
          status: 'active',
          isActive: true,
          isSold: false,
          auctionType: 'traditional',
          bidCount: 0
        },
        {
          title: 'Vintage Gold Watch',
          description: 'Elegant vintage gold watch from the 1960s. Recently serviced and in excellent working condition. Includes original box and papers.',
          imageUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="%23F6AD55"/><text x="400" y="300" font-size="48" fill="%23FFFFFF" text-anchor="middle" dominant-baseline="middle">Vintage Gold Watch</text></svg>',
          categoryId: categoryIds[3], // Jewelry
          sellerId: seller.id,
          initialPrice: 800,
          currentPrice: 800,
          increment: 25,
          startDate: new Date(now.getTime() + oneDay), // Starts tomorrow
          endDate: new Date(now.getTime() + 8 * oneDay), // Ends in 8 days
          status: 'upcoming',
          isActive: false,
          isSold: false,
          auctionType: 'traditional',
          bidCount: 0
        }
      ];
      
      products.forEach(product => {
        this.createProduct(product);
      });
    }
  }
}

export const storage = new MemStorage();
