import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@example.com";
  const adminPass = "Admin123!";

  // Admin oluştur veya varsa güncelleme
  const passHash = await bcrypt.hash(adminPass, 10);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: passHash, // şemadaki alanın adı "password"
      role: "ADMIN",
    },
  });
  console.log(`✅ Admin hazır: ${admin.email} / ${adminPass}`);

  // Kursları oluştur veya varsa güncelleme
  const courses = ["Mathematics", "Physics", "Programming 101"];
  for (const name of courses) {
    await prisma.course.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    console.log(`📘 Course seeded: ${name}`);
  }

  console.log("🎉 Seeding tamamlandı.");
}

main()
  .catch((e) => {
    console.error("❌ Seeding hatası:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
