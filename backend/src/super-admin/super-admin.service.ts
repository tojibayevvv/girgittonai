import { Injectable, NotFoundException } from '@nestjs/common';
import { RestaurantStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePlanDto,
  UpdatePlanDto,
} from './dto/super-admin.dto';

@Injectable()
export class SuperAdminService {
  constructor(private prisma: PrismaService) {}

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
