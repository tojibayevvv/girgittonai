import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RestaurantStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePlanDto,
  CreateRestaurantDto,
  UpdatePlanDto,
} from './dto/super-admin.dto';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

@Injectable()
export class SuperAdminService {
  constructor(private prisma: PrismaService) {}

  // ----- Yangi restoran + uning admini -----
  async createRestaurant(dto: CreateRestaurantDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Bu email allaqachon ro‘yxatdan o‘tgan');
    }

    let slug = slugify(dto.restaurantName) || 'restoran';
    const taken = await this.prisma.restaurant.findUnique({ where: { slug } });
    if (taken) {
      slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const status = dto.status ?? 'ACTIVE';

    const restaurant = await this.prisma.restaurant.create({
      data: {
        name: dto.restaurantName,
        slug,
        phone: dto.phone,
        status,
        users: {
          create: {
            email: dto.email,
            passwordHash,
            fullName: dto.fullName,
            role: 'RESTAURANT_ADMIN',
          },
        },
      },
    });

    // Tarif tanlangan bo'lsa o'shani, bo'lmasa eng arzon faol tarifni biriktiramiz
    const plan = dto.planId
      ? await this.prisma.plan.findUnique({ where: { id: dto.planId } })
      : await this.prisma.plan.findFirst({
          where: { isActive: true },
          orderBy: { priceMonthly: 'asc' },
        });
    if (dto.planId && !plan) {
      throw new NotFoundException('Tarif topilmadi');
    }
    if (plan) {
      await this.prisma.subscription.create({
        data: {
          restaurantId: restaurant.id,
          planId: plan.id,
          status: status === 'ACTIVE' ? 'ACTIVE' : 'TRIALING',
        },
      });
    }

    return this.getRestaurant(restaurant.id);
  }

  // ----- Umumiy statistika (dashboard) -----
  async stats() {
    const [
      totalRestaurants,
      activeRestaurants,
      trialRestaurants,
      totalOrders,
      paidAgg,
    ] = await Promise.all([
      this.prisma.restaurant.count(),
      this.prisma.restaurant.count({ where: { status: 'ACTIVE' } }),
      this.prisma.restaurant.count({ where: { status: 'TRIAL' } }),
      this.prisma.order.count(),
      this.prisma.payment.aggregate({
        where: { status: 'PAID' },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalRestaurants,
      activeRestaurants,
      trialRestaurants,
      totalOrders,
      totalRevenue: paidAgg._sum.amount ?? 0,
    };
  }

  // ----- Restoranlar (mijozlar) -----
  listRestaurants() {
    return this.prisma.restaurant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        subscription: { include: { plan: true } },
        _count: { select: { products: true, tables: true, orders: true } },
      },
    });
  }

  async getRestaurant(id: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
      include: {
        subscription: { include: { plan: true, payments: true } },
        users: { select: { id: true, email: true, fullName: true, role: true } },
        _count: { select: { products: true, tables: true, orders: true } },
      },
    });
    if (!restaurant) throw new NotFoundException('Restoran topilmadi');
    return restaurant;
  }

  async setRestaurantStatus(id: string, status: RestaurantStatus) {
    await this.getRestaurant(id);
    return this.prisma.restaurant.update({
      where: { id },
      data: { status },
    });
  }

  // ----- Tariflar (plans) -----
  listPlans() {
    return this.prisma.plan.findMany({
      orderBy: { priceMonthly: 'asc' },
      include: { _count: { select: { subscriptions: true } } },
    });
  }

  createPlan(dto: CreatePlanDto) {
    return this.prisma.plan.create({ data: dto });
  }

  async updatePlan(id: string, dto: UpdatePlanDto) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Tarif topilmadi');
    return this.prisma.plan.update({ where: { id }, data: dto });
  }

  // ----- To'lovlar -----
  listPayments() {
    return this.prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        subscription: {
          include: { restaurant: { select: { id: true, name: true } } },
        },
      },
    });
  }
}
