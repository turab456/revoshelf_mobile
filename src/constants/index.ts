import type { BookCondition } from '../types';

export const CATEGORIES = [
  { id: 'books', name: 'Books', icon: 'book-outline', feather: 'book' },
  { id: 'calculators', name: 'Calculators', icon: 'calculator-outline', feather: 'grid' },
  { id: 'electronics', name: 'Electronics', icon: 'laptop-outline', feather: 'smartphone' },
  { id: 'lab-equipment', name: 'Lab Equipment', icon: 'flask-outline', feather: 'shield' },
  { id: 'notes', name: 'Notes', icon: 'document-text-outline', feather: 'file-text' },
  { id: 'cycles', name: 'Cycles', icon: 'bicycle-outline', feather: 'compass' },
  { id: 'hostel-essentials', name: 'Hostel Essentials', icon: 'home-outline', feather: 'home' },
  { id: 'project-components', name: 'Project Components', icon: 'hardware-chip-outline', feather: 'cpu' },
  { id: 'stationery', name: 'Stationery', icon: 'create-outline', feather: 'edit-2' }
];

export const CONDITIONS: { value: BookCondition; label: string; description: string }[] = [
  { value: 'New', label: 'New', description: 'Brand new, never used, in original packaging if applicable.' },
  { value: 'Like New', label: 'Like New', description: 'Looks brand new, no visible wear, pages are completely clean.' },
  { value: 'Very Good', label: 'Very Good', description: 'Minimal wear, small creases, no notes or highlighting.' },
  { value: 'Good', label: 'Good', description: 'Average wear, minor highlighting/notes on a few pages.' },
  { value: 'Acceptable', label: 'Acceptable', description: 'Significant wear, notes/highlighting present, but completely readable.' }
];

export const COLLEGES = [
  'Indian Institute of Technology (IIT), Delhi',
  'Indian Institute of Technology (IIT), Bombay',
  'National Institute of Technology (NIT), Trichy',
  'Birla Institute of Technology and Science (BITS), Pilani',
  'RV College of Engineering (RVCE), Bangalore',
  'PES University, Bangalore',
  'Manipal Institute of Technology (MIT), Manipal',
  'Delhi Technological University (DTU), Delhi',
  'Bangalore Medical College and Research Institute (BMCRI)',
  'Kasturba Medical College (KMC), Manipal'
];

export const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Information Science & Engineering',
  'Electronics & Communication Engineering',
  'Electrical & Electronics Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Biotechnology',
  'MBBS',
  'BDS',
  'MBA (Finance)',
  'MBA (Marketing)',
  'BSc (Basic Sciences)',
  'BCom (Commerce)'
];

export const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export const SORT_OPTIONS = [
  { value: 'recent', label: 'Recently Listed' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'condition_desc', label: 'Condition: Best First' }
];
