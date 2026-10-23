export interface DishImage {
  ImageUrl: string;
  IsThumbnail: boolean;
}

export interface DishCategory {
  id: string;
  BIT247635_Id: string;
  BIT247635_Name: string;
  BIT247635_Description: string;
}

export interface Dish {
  id: string;
  BIT247635_Id: string;
  BIT247635_Name: string;
  BIT247635_Price: number;
  BIT247635_PreparationTime: number;
  BIT247635_IsAvailable: boolean;
  BIT247635_Description: string;
  BIT247635_DishCategoryId: string;
  BIT247635_DishImage: DishImage[];
}

export type RootStackParamList = {
  DishList: undefined;
  DishDetail: { dishId: string; categories: DishCategory[]; refresh: () => Promise<void> };
  DishForm: { editDish?: Dish; categories?: DishCategory[]; refresh: () => Promise<void> };
  CategoryManagement: { refresh: () => Promise<void> };
  CategoryForm: { category?: DishCategory; refresh: () => Promise<void> };
};