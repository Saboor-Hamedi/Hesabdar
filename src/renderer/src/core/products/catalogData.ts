import type { UnitType } from '../types'

export interface CatalogItem {
  id: string
  name_en: string
  name_fa: string
  name_ps: string
  unit: UnitType
  category: string
  suggested_price?: number
}

/**
 * Common goods catalog presets for quick multi-language item creation.
 * Selecting any item automatically populates English, Persian/Dari, and Pashto names and unit of measure.
 */
export const COMMON_CATALOG_ITEMS: CatalogItem[] = [
  {
    id: 'oil',
    name_en: 'Cooking Oil',
    name_fa: 'روغن خوراکی',
    name_ps: 'غوړي',
    unit: 'litre',
    category: 'Groceries',
  },
  {
    id: 'ghee',
    name_en: 'Vegetable Ghee',
    name_fa: 'روغن نباتی',
    name_ps: 'نباتی غوړي',
    unit: 'kg',
    category: 'Groceries',
  },
  {
    id: 'rice',
    name_en: 'Basmati Rice',
    name_fa: 'برنج باریک سیلای',
    name_ps: 'سیله وریژې',
    unit: 'kg',
    category: 'Grains',
  },
  {
    id: 'sugar',
    name_en: 'White Sugar',
    name_fa: 'بوره سفید',
    name_ps: 'سپینه بوره',
    unit: 'kg',
    category: 'Groceries',
  },
  {
    id: 'flour',
    name_en: 'Wheat Flour',
    name_fa: 'آرد گندم',
    name_ps: 'د غنمو اوړه',
    unit: 'kg',
    category: 'Grains',
  },
  {
    id: 'tea-green',
    name_en: 'Green Tea',
    name_fa: 'چای سبز',
    name_ps: 'شنه چای',
    unit: 'kg',
    category: 'Beverages',
  },
  {
    id: 'tea-black',
    name_en: 'Black Tea',
    name_fa: 'چای سیاه',
    name_ps: 'توره چای',
    unit: 'kg',
    category: 'Beverages',
  },
  {
    id: 'milk',
    name_en: 'Fresh Milk',
    name_fa: 'شیر تازه',
    name_ps: 'تازه شیدې',
    unit: 'litre',
    category: 'Dairy',
  },
  {
    id: 'powder-milk',
    name_en: 'Dry Milk Powder',
    name_fa: 'شیر خشک',
    name_ps: 'وچې شیدې',
    unit: 'pack',
    category: 'Dairy',
  },
  {
    id: 'eggs',
    name_en: 'Farm Eggs',
    name_fa: 'تخم مرغ',
    name_ps: 'هګۍ',
    unit: 'pcs',
    category: 'Dairy',
  },
  {
    id: 'salt',
    name_en: 'Table Salt',
    name_fa: 'نمک طعام',
    name_ps: 'مالګه',
    unit: 'kg',
    category: 'Spices',
  },
  {
    id: 'lentils',
    name_en: 'Red Lentils (Dal)',
    name_fa: 'دال سرخ / عدس',
    name_ps: 'سرخ دال',
    unit: 'kg',
    category: 'Legumes',
  },
  {
    id: 'chickpeas',
    name_en: 'White Chickpeas',
    name_fa: 'نخود سفید',
    name_ps: 'سپین نخود',
    unit: 'kg',
    category: 'Legumes',
  },
  {
    id: 'beans-kidney',
    name_en: 'Red Kidney Beans',
    name_fa: 'لوبیا سرخ',
    name_ps: 'سره لوبیا',
    unit: 'kg',
    category: 'Legumes',
  },
  {
    id: 'tomato-paste',
    name_en: 'Tomato Paste',
    name_fa: 'رب رومی',
    name_ps: 'د رومي بانجانو رب',
    unit: 'pcs',
    category: 'Canned Goods',
  },
  {
    id: 'detergent',
    name_en: 'Washing Powder',
    name_fa: 'پودر لباسشویی',
    name_ps: 'د کالیو پریمنځلو پوډر',
    unit: 'pack',
    category: 'Cleaning',
  },
  {
    id: 'dish-soap',
    name_en: 'Dishwashing Liquid',
    name_fa: 'مایع ظرفشویی',
    name_ps: 'د لوښو مینځلو مایع',
    unit: 'litre',
    category: 'Cleaning',
  },
  {
    id: 'soap',
    name_en: 'Bath Soap',
    name_fa: 'صابون دست و صورت',
    name_ps: 'صابون',
    unit: 'pcs',
    category: 'Personal Care',
  },
  {
    id: 'shampoo',
    name_en: 'Hair Shampoo',
    name_fa: 'شامپو موی سر',
    name_ps: 'شامپو',
    unit: 'pcs',
    category: 'Personal Care',
  },
  {
    id: 'water',
    name_en: 'Mineral Water',
    name_fa: 'آب معدنی',
    name_ps: 'معدني اوبه',
    unit: 'pcs',
    category: 'Beverages',
  },
  {
    id: 'biscuits',
    name_en: 'Sweet Biscuits',
    name_fa: 'بیسکویت',
    name_ps: 'بیسکویټ',
    unit: 'pack',
    category: 'Snacks',
  },
  {
    id: 'macaroni',
    name_en: 'Macaroni / Pasta',
    name_fa: 'ماکارونی',
    name_ps: 'ماکروني',
    unit: 'pack',
    category: 'Grains',
  },
  {
    id: 'potatoes',
    name_en: 'Fresh Potatoes',
    name_fa: 'کچالو',
    name_ps: 'کچالو',
    unit: 'kg',
    category: 'Vegetables',
  },
  {
    id: 'onions',
    name_en: 'Dry Onions',
    name_fa: 'پیاز خشک',
    name_ps: 'پیاز',
    unit: 'kg',
    category: 'Vegetables',
  },
  {
    id: 'soda',
    name_en: 'Soft Drink (Cola)',
    name_fa: 'نوشابه گازدار',
    name_ps: 'ګاز لرونکې څښاک',
    unit: 'pcs',
    category: 'Beverages',
  },
  {
    id: 'juice',
    name_en: 'Natural Fruit Juice',
    name_fa: 'آب میوه طبیعی',
    name_ps: 'د میوې اوبه',
    unit: 'pcs',
    category: 'Beverages',
  },
  {
    id: 'matches',
    name_en: 'Matchbox',
    name_fa: 'گوگرد / کبریت',
    name_ps: 'اورلګیت',
    unit: 'pack',
    category: 'Household',
  },
  {
    id: 'tissues',
    name_en: 'Facial Tissues',
    name_fa: 'دستمال کاغذی',
    name_ps: 'کاغذي رومال',
    unit: 'pack',
    category: 'Household',
  },
]

/**
 * Searches the catalog by query against English, Persian, or Pashto names.
 */
export function findCatalogItemByQuery(query: string): CatalogItem | undefined {
  if (!query || !query.trim()) return undefined
  const q = query.trim().toLowerCase()

  return COMMON_CATALOG_ITEMS.find(
    (it) =>
      it.id.toLowerCase() === q ||
      it.name_en.toLowerCase().includes(q) ||
      it.name_fa.toLowerCase().includes(q) ||
      it.name_ps.toLowerCase().includes(q)
  )
}
