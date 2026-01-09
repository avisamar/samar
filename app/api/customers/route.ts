import { NextRequest, NextResponse } from "next/server";
import { crmRepository } from "@/lib/crm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { fullName, emailPrimary, primaryMobile, cityOfResidence } = body;

    // Validate required fields
    if (!fullName || typeof fullName !== "string" || fullName.trim() === "") {
      return NextResponse.json(
        { error: "Full name is required" },
        { status: 400 }
      );
    }

    if (!primaryMobile || typeof primaryMobile !== "string" || primaryMobile.trim() === "") {
      return NextResponse.json(
        { error: "Primary mobile is required" },
        { status: 400 }
      );
    }

    // Create the customer
    const customer = await crmRepository.createCustomer({
      fullName: fullName.trim(),
      emailPrimary: emailPrimary?.trim() || null,
      primaryMobile: primaryMobile.trim(),
      cityOfResidence: cityOfResidence?.trim() || null,
    });

    return NextResponse.json({
      success: true,
      customer,
    });
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 }
    );
  }
}
