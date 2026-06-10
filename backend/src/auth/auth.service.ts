import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterRestaurantDto } from './dto/auth.dto';
import { JwtPayload } from './jwt.strategy';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  private sign(user: {
    id: string;
    email: string;
    role: UserRole;
    restaurantId: string | null;
  }) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurantId,
    };
    return {
      accessToken: this.jwt.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        restaurantId: user.restaurantId,
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Email yoki parol noto‘g‘ri');
    }

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Email yoki parol noto‘g‘ri');
    }

    return this.sign(user);
  }

  // Yangi restoran + uning admini. Trial obuna ham yaratiladi.
  async registerRestaurant(dto: RegisterRestaurantDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Bu email allaqachon ro‘yxatdan o‘tgan');
    }

    let slug = slugify(dto.restaurantName) || 'restoran';
    // slug noyob bo'lishini ta'minlash
    const taken = await this.prisma.restaurant.findUnique({ where: { slug } });
    if (taken) {
      slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const restaurant = await this.prisma.restaurant.create({
      data: {
        name: dto.restaurantName,
        slug,
        phone: dto.phone,
        status: 'TRIAL',
        users: {
          create: {
            email: dto.email,
            passwordHash,
            fullName: dto.fullName,
            role: 'RESTAURANT_ADMIN',
          },
        },
      },
      include: { users: true },
    });

    // Default (Free) tarif bo'lsa — trial obuna yaratamiz
    const freePlan = await this.prisma.plan.findFirst({
      where: { isActive: true },
      orderBy: { priceMonthly: 'asc' },
    });
    if (freePlan) {
      await this.prisma.subscription.create({
        data: {
          restaurantId: restaurant.id,
          planId: freePlan.id,
          status: 'TRIALING',
        },
      });
    }

    return this.sign(restaurant.users[0]);
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        restaurantId: true,
        restaurant: { select: { id: true, name: true, slug: true, status: true } },
      },
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
