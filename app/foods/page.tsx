import {FOOD_DATA} from '@/lib/food-data';
import AppNav from '@/app/app-nav';
import FoodLibrary from './food-library';
export const metadata={title:'Food library — LiftBasket',description:`Explore ${FOOD_DATA.length} foods with calories, macros and source-linked amino-acid data.`};
export default function FoodsPage(){return <main className="wrap tool-page"><AppNav/><FoodLibrary/></main>}
