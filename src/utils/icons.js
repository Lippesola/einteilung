// Central icon registry (Lucide), same approach as lama-app: components refer to icons by name.
import {
  Check,
  ChevronDown,
  CircleQuestionMark,
  Ellipsis,
  Eye,
  EyeOff,
  Guitar,
  GripVertical,
  Mars,
  Moon,
  Pencil,
  Plus,
  Settings,
  Sun,
  Venus,
  WandSparkles,
  X,
  Zap,
} from '@lucide/vue';

export const iconRegistry = {
  bolt: Zap,
  check: Check,
  'chevron-down': ChevronDown,
  ellipsis: Ellipsis,
  eye: Eye,
  'eye-slash': EyeOff,
  grip: GripVertical,
  guitar: Guitar,
  mars: Mars,
  moon: Moon,
  pen: Pencil,
  plus: Plus,
  question: CircleQuestionMark,
  settings: Settings,
  sparkles: WandSparkles,
  sun: Sun,
  venus: Venus,
  xmark: X,
};

export const fallbackIcon = CircleQuestionMark;
