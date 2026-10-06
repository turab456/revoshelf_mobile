import type { Book, User, Chat, Message, Review } from '../types';

export const SEED_BOOKS: Book[] = [
  {
    id: 'b1',
    title: 'Introduction to Algorithms (CLRS)',
    author: 'Thomas H. Cormen, Charles E. Leiserson',
    category: 'books',
    condition: 'Very Good',
    price: 650,
    originalPrice: 1200,
    description: 'Third edition. Extremely helpful for DSA (Data Structures & Algorithms) classes and interview preparations. The pages have very minimal highlighting. Binding is perfectly intact.',
    images: [
      'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80'
    ],
    sellerId: 'u2',
    sellerName: 'Aarav Sharma',
    sellerRating: 4.8,
    sellerAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    college: 'RV College of Engineering (RVCE), Bangalore',
    department: 'Computer Science & Engineering',
    semester: 5,
    pickupLocation: 'Sardar Patel Block, Campus Hostel',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    isFeatured: true,
    isPopular: true,
    status: 'active'
  },
  {
    id: 'b2',
    title: 'Casio FX-991EX Scientific Calculator',
    author: 'Casio',
    category: 'calculators',
    condition: 'Like New',
    price: 900,
    originalPrice: 1695,
    description: 'ClassWiz edition with 552 functions. Allowed in all university examinations. Pristine condition with solar panel working flawlessly. Battery replaced 2 months ago.',
    images: [
      'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&auto=format&fit=crop&q=80'
    ],
    sellerId: 'u3',
    sellerName: 'Neha Reddy',
    sellerRating: 4.5,
    sellerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    college: 'RV College of Engineering (RVCE), Bangalore',
    department: 'Electronics & Communication Engineering',
    semester: 3,
    pickupLocation: 'ECE Department Block Floor 2',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    isFeatured: true,
    isPopular: true,
    status: 'active'
  },
  {
    id: 'b3',
    title: 'Hero Sprint 21-Speed Gear Bicycle',
    author: 'Hero Cycles',
    category: 'cycles',
    condition: 'Good',
    price: 3200,
    originalPrice: 7500,
    description: 'Perfect for campus commuting between hostel and departments. Shimano gears, front disc brakes, includes heavy-duty cable lock and LED tail light. Serviced last month.',
    images: [
      'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&auto=format&fit=crop&q=80'
    ],
    sellerId: 'u4',
    sellerName: 'Vikram Joshi',
    sellerRating: 4.9,
    sellerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    college: 'RV College of Engineering (RVCE), Bangalore',
    department: 'Mechanical Engineering',
    semester: 7,
    pickupLocation: 'Hostel Block 4 Cycle Stand',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    isFeatured: false,
    isPopular: true,
    status: 'active'
  },
  {
    id: 'b4',
    title: 'Arduino Uno Ultimate Starter Kit + Sensors',
    author: 'Elegoo / Arduino',
    category: 'project-components',
    condition: 'New',
    price: 1100,
    originalPrice: 2200,
    description: 'Complete with Arduino Uno R3, breadboard, jumper wires, ultrasonic sensor, servo motor, LCD display 1602, RFID module and 50+ accessories. Unopened in plastic box.',
    images: [
      'https://images.unsplash.com/photo-1553406830-ef2513450d76?w=800&auto=format&fit=crop&q=80'
    ],
    sellerId: 'u2',
    sellerName: 'Aarav Sharma',
    sellerRating: 4.8,
    sellerAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    college: 'RV College of Engineering (RVCE), Bangalore',
    department: 'Computer Science & Engineering',
    semester: 5,
    pickupLocation: 'CS Department Library',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    isFeatured: true,
    isPopular: false,
    status: 'active'
  }
];

export const SEED_USERS: User[] = [
  {
    id: 'u1',
    name: 'Student User',
    email: 'user@college.edu',
    college: 'RV College of Engineering (RVCE), Bangalore',
    department: 'Computer Science & Engineering',
    semester: 6,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    rating: 4.9,
    reviewsCount: 14,
    joinedDate: '2023-08-15T00:00:00.000Z',
    isVerified: true,
    isEmailVerified: true
  },
  {
    id: 'u2',
    name: 'Aarav Sharma',
    email: 'aarav.cs21@rvce.edu.in',
    college: 'RV College of Engineering (RVCE), Bangalore',
    department: 'Computer Science & Engineering',
    semester: 5,
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    rating: 4.8,
    reviewsCount: 8,
    joinedDate: '2023-09-01T00:00:00.000Z',
    isVerified: true
  }
];

let storedBooks = [...SEED_BOOKS];
let storedWishlist: string[] = ['b1'];

export const getStoredBooks = () => storedBooks;
export const getStoredWishlist = () => storedWishlist;
export const saveStoredWishlist = (list: string[]) => { storedWishlist = list; };
