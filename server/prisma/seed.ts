import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("Password123!", 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@furqanstore.com" },
    update: {},
    create: {
      fullName: "Super Admin", email: "superadmin@furqanstore.com", phone: "03000000000",
      password, role: "SUPER_ADMIN", status: "ACTIVE",
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@furqanstore.com" },
    update: {},
    create: {
      fullName: "Admin User", email: "admin@furqanstore.com", phone: "03000000001",
      password, role: "ADMIN", status: "ACTIVE",
    },
  });

  const vendor = await prisma.user.upsert({
    where: { email: "vendor@furqanstore.com" },
    update: {},
    create: {
      fullName: "Nike Store Owner", email: "vendor@furqanstore.com", phone: "03000000002",
      password, role: "VENDOR", status: "ACTIVE", vendorName: "Nike Store",
    },
  });

  await prisma.user.upsert({
    where: { email: "customer@furqanstore.com" },
    update: {},
    create: {
      fullName: "Demo Customer", email: "customer@furqanstore.com", phone: "03000000003",
      password, role: "CUSTOMER", status: "ACTIVE",
    },
  });

  await prisma.commissionSetting.deleteMany();
  await prisma.commissionSetting.create({
    data: { rate: 10, active: true, changedById: superAdmin.id },
  });

  const categoryData = [
    { name: "Electronics", slug: "electronics", icon: "laptop" },
    { name: "Fashion", slug: "fashion", icon: "shirt" },
    { name: "Footwear", slug: "footwear", icon: "footprints" },
    { name: "Audio", slug: "audio", icon: "headphones" },
    { name: "Appliances", slug: "appliances", icon: "blender" },
    { name: "Sports", slug: "sports", icon: "bike" },
  ];
  for (const c of categoryData) {
    await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c });
  }
  const electronics = await prisma.category.findUniqueOrThrow({ where: { slug: "electronics" } });
  const footwear = await prisma.category.findUniqueOrThrow({ where: { slug: "footwear" } });
  const audio = await prisma.category.findUniqueOrThrow({ where: { slug: "audio" } });

  const existingProducts = await prisma.product.count();
  if (existingProducts === 0) {
    await prisma.product.createMany({
      data: [
        {
          name: "MacBook Pro M3", description: "Professional laptop for creators and developers.",
          price: 450000, stock: 15, imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600",
          categoryId: electronics.id, vendorId: vendor.id, rating: 4.3, reviews: 123, badge: "BEST", status: "ACTIVE",
        },
        {
          name: "Nike Air Max", description: "Comfortable and stylish athletic footwear.",
          price: 35000, stock: 30, imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600",
          categoryId: footwear.id, vendorId: vendor.id, rating: 4.0, reviews: 306, badge: "HOT", status: "ACTIVE",
        },
        {
          name: "Wireless Headphones", description: "Noise-cancelling over-ear headphones.",
          price: 75000, stock: 22, imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600",
          categoryId: audio.id, vendorId: vendor.id, rating: 4.8, reviews: 229, badge: "BEST", status: "ACTIVE",
        },
        {
          name: "PlayStation 5", description: "Next-generation gaming console.",
          price: 165000, stock: 10, imageUrl: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=600",
          categoryId: electronics.id, vendorId: vendor.id, rating: 4.8, reviews: 86, badge: "HOT", status: "ACTIVE",
        },
      ],
    });
  }

  console.log("Seed complete. Demo password for every account: Password123!");
}

main().finally(() => prisma.$disconnect());
