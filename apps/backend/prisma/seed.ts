import { PrismaClient, VoiceTone, SummaryChannel } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")

  // Create demo user
  const user = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      phone: "+1234567890",
    },
  })

  console.log("Created user:", user.email)

  // Create demo business (salon)
  const business = await prisma.business.upsert({
    where: { clerkUserId: "demo-clerk-user-id" },
    update: {},
    create: {
      userId: user.id,
      clerkUserId: "demo-clerk-user-id",
      name: "Demo Hair Salon",
      phoneNumber: "+1234567890",
      email: "demo@salon.com",
      address: "123 Main St, City, State 12345",
      businessType: "salon",
      services: [
        { name: "Haircut", duration: 30, price: 25 },
        { name: "Hair Color", duration: 120, price: 80 },
        { name: "Hair Styling", duration: 45, price: 40 },
        { name: "Manicure", duration: 30, price: 20 },
      ],
      hours: {
        monday: { open: "09:00", close: "18:00", closed: false },
        tuesday: { open: "09:00", close: "18:00", closed: false },
        wednesday: { open: "09:00", close: "18:00", closed: false },
        thursday: { open: "09:00", close: "18:00", closed: false },
        friday: { open: "09:00", close: "18:00", closed: false },
        saturday: { open: "10:00", close: "16:00", closed: false },
        sunday: { open: "10:00", close: "16:00", closed: true },
      },
      pricing: {
        currency: "USD",
        taxRate: 0.08,
      },
      faqs: [
        {
          question: "What are your operating hours?",
          answer: "We're open Monday-Friday 9am-6pm, Saturday 10am-4pm, closed Sundays.",
        },
        {
          question: "Do you accept walk-ins?",
          answer: "Yes, but appointments are recommended to ensure availability.",
        },
        {
          question: "What payment methods do you accept?",
          answer: "We accept cash, credit cards, and digital payments.",
        },
      ],
      voiceTone: VoiceTone.friendly,
      summaryChannel: SummaryChannel.whatsapp,
      bookingRules: {
        slots: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"],
        leadTime: 2, // hours
        maxAdvanceDays: 30,
      },
      timezone: "America/New_York",
    },
  })

  console.log("Created business:", business.name)

  // Create sample calls
  const sampleCalls = [
    {
      businessId: business.id,
      callerName: "John Doe",
      callerPhone: "+1987654321",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      transcript: "Customer called to book a haircut appointment. Preferred time: tomorrow at 2pm. Confirmed appointment.",
      summary: {
        intent: "book appointment",
        details: {
          customerName: "John Doe",
          service: "Haircut",
          preferredTime: "tomorrow at 2pm",
        },
        action: "booking",
      },
      status: "completed" as const,
      duration: 180,
    },
    {
      businessId: business.id,
      callerName: "Jane Smith",
      callerPhone: "+1555555555",
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      transcript: "Customer inquired about hair coloring services and pricing. Asked about availability next week.",
      summary: {
        intent: "inquire about services",
        details: {
          customerName: "Jane Smith",
          service: "Hair Color",
          inquiry: "pricing and availability",
        },
        action: "quote",
      },
      status: "completed" as const,
      duration: 240,
    },
  ]

  for (const callData of sampleCalls) {
    const call = await prisma.call.create({
      data: callData,
    })
    console.log("Created call:", call.id)
  }

  console.log("✅ Seeding completed!")
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

