import { NextRequest, NextResponse } from "next/server";
import { crmRepository } from "@/lib/crm";
import { validatePhoneNumber, validateEmail } from "@/lib/validation";

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

    // Validate and normalize phone number
    const phoneValidation = validatePhoneNumber(primaryMobile);
    if (!phoneValidation.valid) {
      return NextResponse.json(
        { error: phoneValidation.error || "Invalid phone number" },
        { status: 400 }
      );
    }

    // Validate email if provided
    if (emailPrimary) {
      const emailValidation = validateEmail(emailPrimary);
      if (!emailValidation.valid) {
        return NextResponse.json(
          { error: emailValidation.error || "Invalid email" },
          { status: 400 }
        );
      }
    }

    // Create the customer with normalized values
    const normalizedPhone = validatePhoneNumber(primaryMobile).value as string;
    const normalizedEmail = emailPrimary
      ? (validateEmail(emailPrimary).value as string | null)
      : null;

    const customer = await crmRepository.createCustomer({
      fullName: fullName.trim(),
      emailPrimary: normalizedEmail,
      primaryMobile: normalizedPhone,
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
