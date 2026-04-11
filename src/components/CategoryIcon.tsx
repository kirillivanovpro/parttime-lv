import { CategoryType } from '@/types';

const icons: Record<CategoryType, string> = {
  cleaning: '🧹',
  dog_walking: '🐕',
  tutoring: '📚',
  photo_video: '📷',
  delivery: '📦',
  repairs: '🔧',
};

export default function CategoryIcon({
  category,
  size = 'md',
}: {
  category: CategoryType;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClasses = { sm: 'text-lg', md: 'text-2xl', lg: 'text-4xl' };
  return <span className={sizeClasses[size]}>{icons[category]}</span>;
}
