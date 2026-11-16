export interface PartRule {
  id: string;
  name: string;
  km: number;
  days: number;
  icon: string;
}

export interface BikeMasterTemplate {
  id: string;
  brand: string;
  cc: string;
  optionalModel?: string;
  parts: PartRule[];
}

export const BD_BRTA_BRANDS = [
  'Yamaha', 'Honda', 'Suzuki', 'TVS', 'Bajaj', 'Hero', 'Kawasaki', 'KTM', 'Royal Enfield'
];

export const INITIAL_CC_LIST = [
  '80cc', '100cc', '110cc', '125cc', '135cc', '150cc', '155cc', '160cc', '200cc', '250cc', '300cc', '350cc'
];

// ডিফল্ট স্ট্যান্ডার্ড পার্টস লাইফস্প্যান রুলস
export const DEFAULT_PARTS_RULES: PartRule[] = [
  { id: 'engine_oil', name: 'ইঞ্জিন অয়েল', km: 2500, days: 90, icon: '🛢️' },
  { id: 'oil_filter', name: 'অয়েল ফিল্টার', km: 2500, days: 90, icon: '⚙️' },
  { id: 'air_filter', name: 'এয়ার ফিল্টার', km: 9000, days: 180, icon: '💨' },
  { id: 'chain_lube', name: 'চেইন লুব', km: 500, days: 30, icon: '⛓️' },
  { id: 'spark_plug', name: 'স্পার্ক প্লাগ', km: 12000, days: 365, icon: '⚡' },
  { id: 'tire_gel', name: 'টায়ার জেল', km: 0, days: 365, icon: '🛡️' }
];

// প্রি-কনফিগারড মাস্টার বাইক ও মডেল লিস্ট (কোডের মধ্যে পার্মানেন্টলি যুক্ত)
export const INITIAL_BIKE_MODELS_MASTER: Record<string, string[]> = {
  'Yamaha': ['R15 V4', 'R15 V3', 'MT-15', 'FZS V3', 'FZS V2', 'FZ-X', 'Saluto'],
  'Honda': ['CBR 150R', 'CB Hornet 160R', 'XBlade', 'Livo', 'Dream Neo'],
  'Suzuki': ['Gixxer SF', 'Gixxer Monoshock', 'Access 125', 'Intruder'],
  'TVS': ['Apache RTR 4V', 'Apache RTR 2V', 'Raider 125', 'Metro Plus'],
  'Bajaj': ['Pulsar NS160', 'Pulsar 150', 'Discover 125', 'CT 100'],
  'Hero': ['Hunk 150', 'Splendor Plus', 'Ignitor', 'Glamour'],
  'Kawasaki': ['Ninja 125', 'Kawasaki KLX'],
  'KTM': ['Duke 125', 'Duke 250', 'RC 125'],
  'Royal Enfield': ['Classic 350', 'Hunter 350', 'Bullet 350']
};

// মাস্টার টেমপ্লেট লিস্ট
export const INITIAL_MASTER_TEMPLATES: BikeMasterTemplate[] = [
  {
    id: 'Yamaha_155cc_R15 V4',
    brand: 'Yamaha',
    cc: '155cc',
    optionalModel: 'R15 V4',
    parts: DEFAULT_PARTS_RULES
  },
  {
    id: 'Honda_160cc_CBR 150R',
    brand: 'Honda',
    cc: '160cc',
    optionalModel: 'CBR 150R',
    parts: DEFAULT_PARTS_RULES
  }
];