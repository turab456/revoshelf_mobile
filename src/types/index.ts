export type BookCondition = 'New' | 'Like New' | 'Very Good' | 'Good' | 'Acceptable';

export interface User {
  id: string;
  name: string;
  email: string;
  college: string;
  department: string;
  semester: number;
  avatar: string;
  rating: number;
  reviewsCount: number;
  joinedDate: string;
  isVerified?: boolean;
  isEmailVerified?: boolean;
  spamScore?: number;
  scamScore?: number;
  flagged?: boolean;
  blocked?: boolean;
  blockReason?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  coordinates?: { lat: number; lng: number };
  institutionName?: string;
  educationLevel?: string;
  academicDetails?: Record<string, any>;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  condition: BookCondition;
  price: number;
  originalPrice: number;
  description: string;
  images: string[];
  sellerId: string;
  sellerName: string;
  sellerRating: number;
  sellerAvatar: string;
  college: string;
  department: string;
  semester: number;
  pickupLocation: string;
  createdAt: string;
  isFeatured: boolean;
  isPopular: boolean;
  status: 'active' | 'sold' | 'pending' | 'risky';
  salePending?: boolean;
  sellerSpamScore?: number;
  sellerScamScore?: number;
  sellerVerified?: boolean;
  metadata?: Record<string, any>;
  distanceKm?: number;
  isNearMe?: boolean;
  sellerReviewsCount?: number;
  isDeleted?: boolean;
  pickupCoordinates?: { lat: number; lng: number } | null;
}

export interface Review {
  id: string;
  reviewerName: string;
  reviewerAvatar: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export interface Chat {
  id: string;
  bookId: string;
  bookTitle: string;
  bookImage: string;
  bookPrice: number;
  buyerId: string;
  sellerId: string;
  otherParticipant: {
    id: string;
    name: string;
    avatar: string;
    rating: number;
    reviewsCount?: number;
    college: string;
    flagged?: boolean;
    blocked?: boolean;
  };
  lastMessage?: string;
  lastMessageTime?: string;
  unread: boolean;
  bookIsSold?: boolean;
  buyerConfirmedReceipt?: boolean;
  salePending?: boolean;
  bookIsDeleted?: boolean;
  pickupLocation?: string;
  pickupCoordinates?: { lat: number; lng: number } | null;
}

export interface SearchFilters {
  query: string;
  category: string;
  condition: BookCondition[];
  minPrice: number;
  maxPrice: number;
  college: string;
  sort: string;
  nearMe: boolean;
}

export interface Banner {
  _id?: string;
  id?: string;
  badge?: string;
  title: string;
  subtitle?: string;
  description?: string;
  ctaText?: string;
  ctaLink?: string;
  gradientFrom?: string;
  gradientTo?: string;
  bgColor?: string;
  textColor?: string;
  imageUrl?: string;
  bannerType?: 'image' | 'custom' | 'normal';
  priority?: number;
  isActive?: boolean;
}

// React Navigation Types
export type RootStackParamList = {
  MainTabs: undefined;
  ListingDetail: { id: string };
  CreateListing: undefined;
  EditListing: { id: string };
  SellerProfile: { id: string };
  ChatDetail: { chatId: string; bookId?: string; otherUserName?: string };
  MyListings: undefined;
  Settings: undefined;
  Messages: undefined;
  Search: { category?: string; query?: string } | undefined;
  Login: { returnTo?: string } | undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token?: string } | undefined;
  VerifyEmail: { token?: string; id?: string } | undefined;
  AboutUs: undefined;
  ContactUs: undefined;
  HelpCenter: undefined;
  Faq: undefined;
  SafetyTips: undefined;
  ReportIssue: { bookId?: string; sellerId?: string } | undefined;
  PrivacyPolicy: undefined;
  TermsConditions: undefined;
  CommunityGuidelines: undefined;
  HowItWorks: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  ChatTab: undefined;
  SellTab: undefined;
  SavedTab: undefined;
  ProfileTab: undefined;
  SearchTab?: { category?: string; query?: string } | undefined;
};
