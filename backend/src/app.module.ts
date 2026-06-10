import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { TablesModule } from './tables/tables.module';
import { OrdersModule } from './orders/orders.module';
import { PublicModule } from './public/public.module';
import { SuperAdminModule } from './super-admin/super-admin.module';
import { UploadsModule } from './uploads/uploads.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    RestaurantsModule,
    CategoriesModule,
    ProductsModule,
    TablesModule,
    OrdersModule,
    PublicModule,
    SuperAdminModule,
    UploadsModule,
  ],
})
export class AppModule {}
