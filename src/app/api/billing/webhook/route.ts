import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  console.log('🔔 WEBHOOK RECEIVED - Starting webhook processing');
  
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get('stripe-signature');

  console.log('📋 Webhook details:', {
    bodyLength: body.length,
    hasSignature: !!sig,
    endpointSecretExists: !!endpointSecret
  });

  let event: Stripe.Event;

  try {
    if (endpointSecret && sig) {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
      console.log('✅ Webhook signature verified successfully');
    } else {
      console.log('⚠️ No webhook secret configured, parsing event without verification');
      event = JSON.parse(body);
    }
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
  }

  console.log('📨 Processing event:', {
    type: event.type,
    id: event.id,
    created: event.created
  });

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('💳 Checkout session completed:', session.id);
      await handleCheckoutCompleted(session);
      break;
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log('💰 Payment intent succeeded:', paymentIntent.id);
      await handlePaymentSucceeded(paymentIntent);
      break;
    default:
      console.log(`⚠️ Unhandled event type ${event.type}`);
  }

  console.log('✅ Webhook processing completed');
  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    console.log('🛒 Processing checkout completion for session:', session.id);
    
    const userId = session.metadata?.userId;
    const credits = parseInt(session.metadata?.credits || '0');
    const packageId = session.metadata?.packageId;

    console.log('📊 Session metadata:', {
      userId,
      credits,
      packageId,
      allMetadata: session.metadata
    });

    if (!userId || !credits) {
      console.error('❌ Missing metadata in checkout session:', { userId, credits });
      return;
    }

    // Check if credits were already added
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        userId,
        stripePaymentId: session.payment_intent as string,
        type: 'purchase'
      }
    });

    if (existingTransaction) {
      console.log('⚠️ Credits already added for this payment:', {
        transactionId: existingTransaction.id,
        paymentId: session.payment_intent
      });
      return;
    }

    console.log('💰 Adding credits to user account...');
    
    // Add credits to user account
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        credits: {
          increment: credits,
        },
        // TODO: Add userType: 'paid' after schema is updated
      },
    });

    console.log('✅ Credits added successfully:', {
      userId,
      creditsAdded: credits,
      newBalance: user.credits
    });

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        type: 'purchase',
        amount: credits,
        balanceAfter: user.credits,
        description: `Purchased ${credits} credits`,
        stripePaymentId: session.payment_intent as string,
        metadata: {
          packageId,
          sessionId: session.id,
        },
      },
    });

    console.log('📝 Transaction record created:', {
      transactionId: transaction.id,
      amount: credits,
      balanceAfter: user.credits
    });

    console.log(`✅ Successfully added ${credits} credits to user ${userId}`);
  } catch (error) {
    console.error('❌ Error handling checkout completion:', error);
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    // Update transaction with payment intent details if needed
    await prisma.transaction.updateMany({
      where: {
        stripePaymentId: paymentIntent.id,
      },
      data: {
        metadata: {
          paymentIntentStatus: paymentIntent.status,
          amount: paymentIntent.amount,
        },
      },
    });

    console.log(`Payment succeeded: ${paymentIntent.id}`);
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}
