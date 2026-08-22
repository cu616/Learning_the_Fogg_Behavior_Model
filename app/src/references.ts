// 从内置参考库 JSON 加载书中的只读参考数据。

import celebrationsRaw from "./references/庆祝方式库.json";
import recipesRaw from "./references/微习惯配方库.json";
import affirmationsRaw from "./references/肯定成功方式库.json";

export interface CelebrationRef {
  id: number;
  text: string;
}

export interface RecipeRef {
  id: number;
  recipe: string;
}

export interface RecipeCategory {
  name: string;
  items: RecipeRef[];
}

export interface AffirmationRef {
  id: string;
  text: string;
}

export const CELEBRATIONS: CelebrationRef[] = (
  celebrationsRaw as { items: CelebrationRef[] }
).items;

export const RECIPE_CATEGORIES: RecipeCategory[] = (
  recipesRaw as { categories: RecipeCategory[] }
).categories;

export const AFFIRMATIONS: AffirmationRef[] = (
  affirmationsRaw as { items: AffirmationRef[] }
).items;

// 从配方库提炼的常见锚点模板（「在我___之后」），供第 5 步选用。
export const ANCHOR_TEMPLATES: string[] = [
  "刷完牙之后",
  "吃完午饭之后",
  "吃完早饭之后",
  "打开花洒之后",
  "起床双脚落地之后",
  "启动咖啡机之后",
  "整理好床铺之后",
  "下班到家之后",
  "打开电脑之后",
  "关上电视之后",
  "喝完咖啡之后",
  "洗完澡之后",
  "坐到工位之后",
  "爬进被窝之后",
  "系好安全带之后",
];
