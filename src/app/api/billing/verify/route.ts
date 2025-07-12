import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { CREDIT_PACKAGES } from "@/config/credits";

export async function GET(request: Request) {
  try {
    console.log("=== Payment Verification Started ===");
    
    const session = await getServerSession(authOptions);
    console.log("Session:", session?.user?.email);
    
    if (!session?.user?.email) {
      console.log("No session or email found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");
    console.log("Session ID:", sessionId);

    if (!sessionId) {
      console.log("No session ID provided");
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    // Retrieve the checkout session from Stripe
    console.log("Retrieving session from Stripe...");
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
    console.log("Checkout session:", {
      id: checkoutSession.id,
      payment_status: checkoutSession.payment_status,
      customer_email: checkoutSession.customer_email,
      amount_total: checkoutSession.amount_total,
      metadata: checkoutSession.metadata,
    });

    if (!checkoutSession) {
      console.log("Session not found in Stripe");
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check if payment was successful
    if (checkoutSession.payment_status !== "paid") {
      console.log("Payment not completed, status:", checkoutSession.payment_status);
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    }

    // Get package details from metadata
    const packageId = checkoutSession.metadata?.packageId;
    console.log("Package ID from metadata:", packageId);
    
    const creditPackage = CREDIT_PACKAGES.find(pkg => pkg.id === packageId);

    if (!creditPackage) {
      console.log("Package not found for ID:", packageId);
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    const totalCredits = creditPackage.credits + creditPackage.bonus;
    console.log("Verification successful, returning:", {
      amount: checkoutSession.amount_total,
      creditsAdded: totalCredits,
      packageName: creditPackage.name,
    });

    return NextResponse.json({
      status: "success",
      amount: checkoutSession.amount_total || 0,
      creditsAdded: totalCredits,
      packageName: creditPackage.name,
      sessionId: checkoutSession.id,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { 
        error: "Failed to verify payment", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}
