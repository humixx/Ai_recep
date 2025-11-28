import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs"

export default async function Home() {
  const { userId } = await auth()

  if (userId) {
    redirect("/dashboard")
  } else {
    redirect("/onboard")
  }
}

