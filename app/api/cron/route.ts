import { NextResponse } from "next/server";

// Handling GET requests
export const revalidate = 0;
export async function GET() {
  console.log("Cron job or frontend request invoked this API!");

  // You can add your cron job logic or any other logic here.
  return NextResponse.json({ message: "Job successfully invoked!" });
}
