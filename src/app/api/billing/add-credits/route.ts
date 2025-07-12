import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

// Test endpoint to manually add credits after payment
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await req.json();
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    console.log('🧪 Manual credit addition - Session ID:', sessionId);

    // Get the Stripe session
    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (stripeSession.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    const userId = stripeSession.metadata?.userId;
    const credits = parseInt(stripeSession.metadata?.credits || '0');
    const packageId = stripeSession.metadata?.packageId;

    if (!userId || !credits) {
      return NextResponse.json({ error: 'Invalid session metadata' }, { status: 400 });
    }

    // Check if user matches session user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.email !== session.user.email) {
      return NextResponse.json({ error: 'User mismatch' }, { status: 403 });
    }

    // Check if credits were already added
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        userId,
        type: 'purchase',
        stripePaymentId: stripeSession.payment_intent as string
      }
    });

    if (existingTransaction) {
      return NextResponse.json({ 
        message: 'Credits already added',
        creditsAdded: existingTransaction.amount,
        newBalance: user.credits,
        transactionId: existingTransaction.id
      });
    }

    // Add credits to user account
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        credits: {
          increment: credits,
        },
        // TODO: Add userType: 'paid' after schema is updated
      },
    });

    // Create transaction record
    await prisma.transaction.create({
      data: {
        userId,
        type: 'purchase',
        amount: credits,
        balanceAfter: updatedUser.credits,
        description: `Purchased ${credits} credits (manual addition)`,
        stripePaymentId: stripeSession.payment_intent as string,
        metadata: {
          packageId,
          sessionId: stripeSession.id,
          manualAddition: true
        },
      },
    });

    console.log(`✅ Manually added ${credits} credits to user ${userId}`);

    return NextResponse.json({ 
      success: true,
      creditsAdded: credits,
      newBalance: updatedUser.credits,
      message: 'Credits added successfully'
    });

  } catch (error) {
    console.error('❌ Error in manual credit addition:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
