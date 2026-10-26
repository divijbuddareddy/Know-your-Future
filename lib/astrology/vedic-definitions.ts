export interface ZodiacSign {
  id: number;
  sanskrit: string;
  english: string;
  lord: string;
  element: 'Fire' | 'Earth' | 'Air' | 'Water';
  quality: 'Movable' | 'Fixed' | 'Dual';
}

export const ZODIAC_SIGNS: ZodiacSign[] = [
  { id: 0, sanskrit: 'Mesha', english: 'Aries', lord: 'Mars (Mangala)', element: 'Fire', quality: 'Movable' },
  { id: 1, sanskrit: 'Vrishabha', english: 'Taurus', lord: 'Venus (Shukra)', element: 'Earth', quality: 'Fixed' },
  { id: 2, sanskrit: 'Mithuna', english: 'Gemini', lord: 'Mercury (Budha)', element: 'Air', quality: 'Dual' },
  { id: 3, sanskrit: 'Karka', english: 'Cancer', lord: 'Moon (Chandra)', element: 'Water', quality: 'Movable' },
  { id: 4, sanskrit: 'Simha', english: 'Leo', lord: 'Sun (Surya)', element: 'Fire', quality: 'Fixed' },
  { id: 5, sanskrit: 'Kanya', english: 'Virgo', lord: 'Mercury (Budha)', element: 'Earth', quality: 'Dual' },
  { id: 6, sanskrit: 'Tula', english: 'Libra', lord: 'Venus (Shukra)', element: 'Air', quality: 'Movable' },
  { id: 7, sanskrit: 'Vrishchika', english: 'Scorpio', lord: 'Mars (Mangala)', element: 'Water', quality: 'Fixed' },
  { id: 8, sanskrit: 'Dhanu', english: 'Sagittarius', lord: 'Jupiter (Guru)', element: 'Fire', quality: 'Dual' },
  { id: 9, sanskrit: 'Makara', english: 'Capricorn', lord: 'Saturn (Shani)', element: 'Earth', quality: 'Movable' },
  { id: 10, sanskrit: 'Kumbha', english: 'Aquarius', lord: 'Saturn (Shani)', element: 'Air', quality: 'Fixed' },
  { id: 11, sanskrit: 'Meena', english: 'Pisces', lord: 'Jupiter (Guru)', element: 'Water', quality: 'Dual' },
];

export interface Nakshatra {
  id: number;
  name: string;
  lord: string;
  startDegree: number;
  endDegree: number;
}

export const NAKSHATRAS: string[] = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
];

export const NAKSHATRA_LORDS = [
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu',
  'Jupiter', 'Saturn', 'Mercury'
]; // Cycles 3 times through 27 nakshatras

export const DASHA_YEARS: Record<string, number> = {
  'Ketu': 7,
  'Venus': 20,
  'Sun': 6,
  'Moon': 10,
  'Mars': 7,
  'Rahu': 18,
  'Jupiter': 16,
  'Saturn': 19,
  'Mercury': 17
};

export const DASHA_ORDER = [
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'
];

export const BHAVA_TITLES = [
  { bhava: 1, name: 'Tanu Bhava (1st House)', themes: 'Self, Physical Body, Vitality, Complexion, General Destiny' },
  { bhava: 2, name: 'Dhana Bhava (2nd House)', themes: 'Wealth, Speech, Family, Food, Early Education, Assets' },
  { bhava: 3, name: 'Sahaja Bhava (3rd House)', themes: 'Siblings, Courage, Communication, Short Travel, Initiative' },
  { bhava: 4, name: 'Sukha Bhava (4th House)', themes: 'Mother, Home, Vehicles, Inner Peace, Property, Land' },
  { bhava: 5, name: 'Putra Bhava (5th House)', themes: 'Children, Intelligence, Purva Punya (Past Karma), Creativity' },
  { bhava: 6, name: 'Ari Bhava (6th House)', themes: 'Health/Diseases, Enemies, Debts, Service, Daily Work' },
  { bhava: 7, name: 'Yuvati Bhava (7th House)', themes: 'Spouse, Marriage, Business Partnerships, Public Interactions' },
  { bhava: 8, name: 'Randhra Bhava (8th House)', themes: 'Longevity, Transformation, Hidden Knowledge, Obstacles, Inheritance' },
  { bhava: 9, name: 'Dharma Bhava (9th House)', themes: 'Higher Learning, Father, Luck (Bhagya), Morals, Long Journeys' },
  { bhava: 10, name: 'Karma Bhava (10th House)', themes: 'Career, Profession, Status, Public Image, Leadership, Father' },
  { bhava: 11, name: 'Labha Bhava (11th House)', themes: 'Gains, Aspirations, Elder Siblings, Professional Network' },
  { bhava: 12, name: 'Vyaya Bhava (12th House)', themes: 'Expenses, Foreign Travel, Isolation, Subconscious, Moksha' },
];
