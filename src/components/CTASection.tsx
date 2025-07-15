import { motion } from 'framer-motion';
import { ChevronRight, ArrowRight } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AuthModal } from '@/components/AuthModal';

export function CTASection() {
  const { data: session } = useSession();
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('register');

  const handleStartFreeTrial = () => {
    if (!session) {
      setAuthModalTab('register');
      setShowAuthModal(true);
      return;
    }
    router.push('/chat');
  };

  return (
    <section className="bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-16">
      <div className="mx-auto max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
            Ready to Build the Future?
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-teal-100">
            Join thousands of developers already using AIRouter to power their multimodal
            applications
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-lg font-semibold text-teal-600 shadow-lg transition-all hover:bg-teal-50"
              onClick={handleStartFreeTrial}
            >
              Start Free Trial
              <ChevronRight className="h-5 w-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center gap-2 rounded-xl border-2 border-white/20 px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-white/10"
            >
              View Documentation
              <ArrowRight className="h-5 w-5" />
            </motion.button>
          </div>
        </motion.div>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={() => {
            setShowAuthModal(false);
            router.push('/chat');
          }}
          defaultTab={authModalTab}
        />
      </div>
    </section>
  );
}
