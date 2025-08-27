// Auctions API functions
import { apiRequest } from './base';

export interface Auction {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  startingPrice: number;
  currentPrice: number;
  reservePrice?: number;
  minimumBidIncrement: number;
  startTime: string;
  endTime: string;
  status: 'draft' | 'active' | 'paused' | 'ended' | 'cancelled' | 'sold';
  category: string;
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  location: string;
  images: string[];
  views: number;
  totalBids: number;
  uniqueBidders: number;
  isReserveMet: boolean;
  winnerId?: string;
  winningBidAmount?: number;
  autoExtend: boolean;
  tags?: string[];
  shippingInfo?: string;
  returnPolicy?: string;
  createdAt: string;
  updatedAt: string;
  seller?: {
    id: string;
    fullName: string;
    email: string;
    profilePicture?: string;
    location?: string;
  };
  bids?: Array<{
    id: string;
    bidAmount: number;
    createdAt: string;
  }>;
  isWatching?: boolean;
  isFollowingSeller?: boolean;
  userBid?: {
    bidAmount: number;
    isWinningBid: boolean;
    status: string;
  };
}

export interface CreateAuctionData {
  title: string;
  description: string;
  startingPrice: number;
  reservePrice?: number;
  minimumBidIncrement: number;
  startTime: string;
  endTime: string;
  category: string;
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  location: string;
  images?: File[];
  autoExtend: boolean;
  tags?: string[];
  shippingInfo?: string;
  returnPolicy?: string;
}

export interface Bid {
  id: string;
  auctionId: string;
  bidderId: string;
  bidAmount: number;
  isAutoBid: boolean;
  maxAutoBidAmount?: number;
  isWinningBid: boolean;
  status: string;
  createdAt: string;
  bidder?: {
    id: string;
    fullName: string;
    username: string;
    profilePicture?: string;
  };
}

// Get auctions with filtering and pagination
export async function getAuctions(params?: {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  search?: string;
  sortBy?: 'currentPrice' | 'endTime' | 'totalBids' | 'views';
  sortOrder?: 'ASC' | 'DESC';
}) {
  const searchParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
  }
  
  return apiRequest(`/auctions?${searchParams.toString()}`);
}

// Get auction categories
export async function getAuctionCategories() {
  return apiRequest('/auctions/categories');
}

// Get a specific auction
export async function getAuction(auctionId: string) {
  return apiRequest(`/auction/${auctionId}`);
}

// Create a new auction (seller only)
export async function createAuction(auctionData: CreateAuctionData) {
  const formData = new FormData();
  
  // Add text fields
  Object.entries(auctionData).forEach(([key, value]) => {
    if (key !== 'images' && value !== undefined) {
      if (key === 'tags' && Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value.toString());
      }
    }
  });
  
  // Add image files
  if (auctionData.images) {
    auctionData.images.forEach((file) => {
      formData.append('images', file);
    });
  }
  
  return apiRequest('/auctions', {
    method: 'POST',
    body: formData,
    headers: {
      // Remove Content-Type to let browser set it with boundary for FormData
    },
  });
}

// Place a bid on an auction
export async function placeBid(auctionId: string, bidData: {
  bidAmount: number;
  isAutoBid?: boolean;
  maxAutoBidAmount?: number;
}) {
  return apiRequest(`/auction/${auctionId}/bid`, {
    method: 'POST',
    body: JSON.stringify(bidData),
  });
}

// Toggle watch on an auction
export async function toggleWatchAuction(auctionId: string) {
  return apiRequest(`/auction/${auctionId}/watch`, {
    method: 'POST',
  });
}

// Update an auction (seller only)
export async function updateAuction(auctionId: string, auctionData: Partial<CreateAuctionData>) {
  const formData = new FormData();
  
  // Add text fields
  Object.entries(auctionData).forEach(([key, value]) => {
    if (key !== 'images' && value !== undefined) {
      if (key === 'tags' && Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value.toString());
      }
    }
  });
  
  // Add image files
  if (auctionData.images) {
    auctionData.images.forEach((file) => {
      formData.append('images', file);
    });
  }
  
  return apiRequest(`/auction/${auctionId}`, {
    method: 'PUT',
    body: formData,
    headers: {
      // Remove Content-Type to let browser set it with boundary for FormData
    },
  });
}

// Cancel an auction (seller only)
export async function cancelAuction(auctionId: string) {
  return apiRequest(`/auction/${auctionId}`, {
    method: 'DELETE',
  });
}

// Get user's auctions
export async function getUserAuctions(params?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  const searchParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
  }
  
  return apiRequest(`/user/auctions?${searchParams.toString()}`);
}

// Get user's bids
export async function getUserBids(params?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  const searchParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
  }
  
  return apiRequest(`/user/bids?${searchParams.toString()}`);
} 