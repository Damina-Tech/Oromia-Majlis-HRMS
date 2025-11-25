import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

async function seedIdCardTemplates() {
  console.log("🪪 Seeding employee ID card templates...");
  
  // Get admin user
  const adminUser = await prisma.user.findFirst({
    where: { email: "admin@ciro.gov.et" },
  });

  if (!adminUser) {
    console.error("❌ Admin user not found! Please run the main seed first.");
    process.exit(1);
  }

  // Delete existing templates to force recreation
  const deleted = await prisma.employeeIdTemplate.deleteMany({});
  console.log(`🗑️  Deleted ${deleted.count} existing templates`);

  const templates = [
    {
      name: "Standard ID",
      description: "Default landscape employee ID card with photo on left",
      isDefault: true,
      settings: {
        size: "ID1",
        background: { type: "color", value: "#ffffff" },
        border: { width: 2, color: "#111827", radius: 20 },
        text: { color: "#0f172a", fontFamily: "Inter, sans-serif", fontSize: 14, headingSize: 22 },
        layout: "PHOTO_LEFT",
        fieldVisibility: {
          showEmployeeName: true,
          showJobTitle: true,
          showDepartment: true,
          showEmployeeCode: true,
          showPhoto: true,
          showCompanyLogo: true,
          showIssueDate: true,
          showExpiryDate: false,
          showBarcode: true,
          showSignature: false,
          showStamp: false,
        },
        codeType: "QR",
        extraLines: ["{{department}}", "ID: {{employeeCode}}"],
        assets: {},
      },
    },
    {
      name: "Professional ID",
      description: "Portrait-style ID card with photo on top",
      isDefault: false,
      settings: {
        size: "ID3",
        background: { type: "color", value: "#f8fafc" },
        border: { width: 3, color: "#1e40af", radius: 15 },
        text: { color: "#1e293b", fontFamily: "Arial, sans-serif", fontSize: 12, headingSize: 20 },
        layout: "PHOTO_TOP",
        fieldVisibility: {
          showEmployeeName: true,
          showJobTitle: true,
          showDepartment: true,
          showEmployeeCode: true,
          showPhoto: true,
          showCompanyLogo: true,
          showIssueDate: true,
          showExpiryDate: true,
          showBarcode: true,
          showSignature: true,
          showStamp: false,
        },
        codeType: "BARCODE",
        extraLines: ["{{department}}", "Employee ID: {{employeeCode}}"],
        assets: {},
      },
    },
    {
      name: "Compact ID",
      description: "Compact ID card with photo on right, minimal design",
      isDefault: false,
      settings: {
        size: "ID2",
        background: { type: "color", value: "#ffffff" },
        border: { width: 1, color: "#64748b", radius: 10 },
        text: { color: "#0f172a", fontFamily: "Roboto, sans-serif", fontSize: 13, headingSize: 18 },
        layout: "PHOTO_RIGHT",
        fieldVisibility: {
          showEmployeeName: true,
          showJobTitle: true,
          showDepartment: true,
          showEmployeeCode: true,
          showPhoto: true,
          showCompanyLogo: false,
          showIssueDate: true,
          showExpiryDate: false,
          showBarcode: true,
          showSignature: false,
          showStamp: false,
        },
        codeType: "QR",
        extraLines: ["{{department}}"],
        assets: {},
      },
    },
  ];

  for (const template of templates) {
    await prisma.employeeIdTemplate.create({
      data: {
        name: template.name,
        description: template.description,
        isDefault: template.isDefault,
        settings: template.settings as Prisma.InputJsonValue,
        createdById: adminUser.id,
        updatedById: adminUser.id,
      },
    });
  }
  
  console.log(`✅ Seeded ${templates.length} employee ID card templates`);
  console.log("   - Standard ID (Default)");
  console.log("   - Professional ID");
  console.log("   - Compact ID");
}

seedIdCardTemplates()
  .then(() => {
    console.log("\n🎉 Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

