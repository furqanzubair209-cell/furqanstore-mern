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
    { name: "Mobiles", slug: "mobiles", icon: "smartphone" },
    { name: "Gaming", slug: "gaming", icon: "gamepad" },
    { name: "Watches", slug: "watches", icon: "watch" },
    { name: "Home & Kitchen", slug: "home-kitchen", icon: "home" },
    { name: "Beauty", slug: "beauty", icon: "sparkles" },
    { name: "Books", slug: "books", icon: "book" },
    { name: "Toys", slug: "toys", icon: "blocks" },
    { name: "Furniture", slug: "furniture", icon: "sofa" },
  ];
  for (const c of categoryData) {
    await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c });
  }

  const catalog: [string, string, string, number, number, string, "NONE" | "NEW" | "HOT" | "SALE" | "BEST", number, number][] = [
    ["electronics", "MacBook Pro M3", "Professional laptop for creators and developers.", 450000, 15, "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600", "BEST", 4.3, 123],
    ["footwear", "Nike Air Max", "Comfortable and stylish athletic footwear.", 35000, 30, "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600", "HOT", 4.0, 306],
    ["audio", "Wireless Headphones", "Noise-cancelling over-ear headphones.", 75000, 22, "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600", "BEST", 4.8, 229],
    ["electronics", "PlayStation 5", "Next-generation gaming console.", 165000, 10, "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=600", "HOT", 4.8, 86],
    ["mobiles", "iPhone 15 Pro", "Titanium design with the A17 Pro chip and pro camera system.", 320000, 25, "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600", "NEW", 4.6, 210],
    ["mobiles", "Samsung Galaxy S24", "Flagship Android phone with a bright AMOLED display.", 260000, 30, "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600", "HOT", 4.5, 174],
    ["gaming", "Wireless Game Controller", "Ergonomic controller with low-latency wireless play.", 18000, 50, "https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=600", "SALE", 4.4, 98],
    ["gaming", "Gaming Headset", "Surround sound headset with a noise-cancelling mic.", 22000, 35, "https://images.unsplash.com/photo-1599669454699-248893623440?w=600", "NONE", 4.2, 67],
    ["watches", "Classic Chronograph Watch", "Stainless steel chronograph with a leather strap.", 45000, 20, "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600", "BEST", 4.7, 152],
    ["watches", "Smart Fitness Watch", "Heart-rate, sleep and workout tracking with a week of battery.", 28000, 40, "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600", "NEW", 4.3, 121],
    ["home-kitchen", "Stainless Steel Cookware Set", "Ten-piece non-stick cookware set for everyday cooking.", 32000, 18, "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600", "NONE", 4.4, 88],
    ["home-kitchen", "Espresso Coffee Maker", "Compact espresso machine with a milk frother.", 55000, 12, "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600", "HOT", 4.5, 76],
    ["beauty", "Luxury Perfume 100ml", "Long-lasting woody and floral fragrance.", 15000, 45, "https://images.unsplash.com/photo-1541643600914-78b084683601?w=600", "BEST", 4.6, 133],
    ["beauty", "Skincare Gift Set", "Cleanser, serum and moisturizer for daily care.", 12000, 60, "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600", "NEW", 4.2, 59],
    ["books", "The Art of Programming", "A practical guide to writing clean and reliable code.", 3500, 100, "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600", "NONE", 4.8, 240],
    ["books", "Classic Novel Collection", "Boxed set of timeless classics in hardcover.", 6500, 70, "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600", "SALE", 4.5, 112],
    ["toys", "Building Blocks Set", "500-piece creative building set for ages 6 and up.", 7500, 55, "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=600", "HOT", 4.7, 190],
    ["toys", "Remote Control Car", "Rechargeable off-road RC car with a 2.4GHz remote.", 9500, 40, "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=600", "NONE", 4.1, 64],
    ["furniture", "Modern Lounge Sofa", "Three-seater fabric sofa with solid wood legs.", 120000, 8, "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600", "NEW", 4.4, 45],
    ["furniture", "Ergonomic Office Chair", "Adjustable lumbar support and breathable mesh back.", 38000, 22, "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=600", "BEST", 4.6, 101],
  ];

  for (const [slug, name, description, price, stock, imageUrl, badge, rating, reviews] of catalog) {
    const category = await prisma.category.findUniqueOrThrow({ where: { slug } });
    const exists = await prisma.product.findFirst({ where: { name, vendorId: vendor.id } });
    if (exists) continue;
    await prisma.product.create({
      data: {
        name, description, price, stock, imageUrl, badge, rating, reviews,
        categoryId: category.id, vendorId: vendor.id, status: "ACTIVE",
      },
    });
  }

  console.log("Seed complete. Demo password for every account: Password123!");
}

main().finally(() => prisma.$disconnect());
