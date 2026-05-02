/* eslint-disable react-refresh/only-export-components */
import type { CSSProperties } from 'react';
import type { LucideIcon, LucideProps } from 'lucide-react';
import {
  BookOpen,
  Box,
  Briefcase,
  Bus,
  Coffee,
  Gamepad2,
  Globe,
  HeartPulse,
  Music,
  Pill,
  Pizza,
  ShoppingBag,
  ShoppingCart,
  Train,
  Tv,
  Utensils,
  Zap,
} from 'lucide-react';
import type { Category, Transaction } from '../../domain/types';

export const CAT_ICON: Record<Category, LucideIcon> = {
  餐飲: Utensils,
  交通: Bus,
  購物: ShoppingBag,
  娛樂: Gamepad2,
  帳單: Zap,
  健康: HeartPulse,
  教育: BookOpen,
  其他: Box,
  收入: Briefcase,
};

export const ITEM_ICON: Record<string, LucideIcon> = {
  '午餐・拉麵': Utensils,
  全聯採購: ShoppingCart,
  薪資入帳: Briefcase,
  悠遊卡加值: Train,
  路易莎咖啡: Coffee,
  Netflix: Tv,
  電費: Zap,
  Spotify: Music,
  診所掛號: Pill,
  Udemy課程: BookOpen,
  '外送・披薩': Pizza,
  高鐵票: Train,
  網域費用: Globe,
};

export const getIC = (tx: Pick<Transaction, 'name' | 'cat'>): LucideIcon => ITEM_ICON[tx.name] || CAT_ICON[tx.cat] || Box;

type IcoProps = {
  C?: LucideIcon;
  size?: number;
  color?: string;
  sw?: number;
  style?: CSSProperties;
};

export const Ico = ({ C, size = 18, color, sw = 1.75, style = {} }: IcoProps) => (C ? <C size={size} color={color} strokeWidth={sw} style={style as LucideProps['style']} /> : null);

export { Box };
