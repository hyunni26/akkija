import {
  Utensils, Coffee, Bus, House, Smartphone, ShoppingBag, Stethoscope, Ticket, Gift,
  CircleEllipsis, Wallet, Coins, PiggyBank, Plane, Car, Fuel, GraduationCap, Baby,
  Dog, Dumbbell, Shirt, Receipt, Zap, BookOpen, Heart, Sparkles, Beer, Pill,
  Scissors, Wifi, Gamepad2, Cake,
} from 'lucide-react'

export const ICONS = {
  utensils: Utensils, coffee: Coffee, bus: Bus, house: House, smartphone: Smartphone,
  'shopping-bag': ShoppingBag, stethoscope: Stethoscope, ticket: Ticket, gift: Gift,
  etc: CircleEllipsis, wallet: Wallet, coins: Coins, 'piggy-bank': PiggyBank,
  plane: Plane, car: Car, fuel: Fuel, 'graduation-cap': GraduationCap, baby: Baby,
  dog: Dog, dumbbell: Dumbbell, shirt: Shirt, receipt: Receipt, zap: Zap,
  book: BookOpen, heart: Heart, sparkles: Sparkles, beer: Beer, pill: Pill,
  scissors: Scissors, wifi: Wifi, gamepad: Gamepad2, cake: Cake,
}

export const COLORS = {
  sage:   { fg: '#0F6E56', bg: '#E1F5EE' },
  coral:  { fg: '#993C1D', bg: '#FAECE7' },
  amber:  { fg: '#854F0B', bg: '#FAEEDA' },
  blue:   { fg: '#185FA5', bg: '#E6F1FB' },
  purple: { fg: '#534AB7', bg: '#EEEDFE' },
  pink:   { fg: '#993556', bg: '#FBEAF0' },
  green:  { fg: '#3B6D11', bg: '#EAF3DE' },
  red:    { fg: '#A32D2D', bg: '#FCEBEB' },
  gray:   { fg: '#5F5E5A', bg: '#F1EFE8' },
}

export const DEFAULT_CATEGORIES = [
  { type: 'expense', name: '식비',   icon: 'utensils',     color: 'coral' },
  { type: 'expense', name: '카페',   icon: 'coffee',       color: 'amber' },
  { type: 'expense', name: '교통',   icon: 'bus',          color: 'blue' },
  { type: 'expense', name: '주거',   icon: 'house',        color: 'sage' },
  { type: 'expense', name: '통신',   icon: 'smartphone',   color: 'purple' },
  { type: 'expense', name: '쇼핑',   icon: 'shopping-bag', color: 'pink' },
  { type: 'expense', name: '의료',   icon: 'stethoscope',  color: 'red' },
  { type: 'expense', name: '문화',   icon: 'ticket',       color: 'purple' },
  { type: 'expense', name: '경조사', icon: 'gift',         color: 'pink' },
  { type: 'expense', name: '기타',   icon: 'etc',          color: 'gray' },
  { type: 'income',  name: '급여',   icon: 'wallet',       color: 'sage' },
  { type: 'income',  name: '부수입', icon: 'coins',        color: 'green' },
  { type: 'income',  name: '기타',   icon: 'etc',          color: 'gray' },
].map((c, i) => ({ ...c, sort_order: i }))

export const PAYMENT_LABEL = { card: '카드', cash: '현금' }
