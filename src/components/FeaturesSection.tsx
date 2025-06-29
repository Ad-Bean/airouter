import { motion } from "framer-motion";
import { Zap, Shield, Camera, Globe, Palette, Brain } from "lucide-react";

const featuresData = [
  {
    icon: <Zap className="w-8 h-8" />,
    title: "Lightning Fast",
    description:
      "Optimized routing ensures your requests reach the fastest available model with minimal latency.",
    color: "from-yellow-500 to-orange-500",
  },
  {
    icon: <Shield className="w-8 h-8" />,
    title: "99.9% Uptime",
    description:
      "Automatic failover across multiple providers ensures your applications never go down.",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: <Camera className="w-8 h-8" />,
    title: "Image First",
    description:
      "Purpose-built for vision tasks: OCR, object detection, image analysis, and generation.",
    color: "from-teal-500 to-emerald-500",
  },
  {
    icon: <Globe className="w-8 h-8" />,
    title: "Global Edge",
    description:
      "Deployed across 50+ regions worldwide for the lowest possible latency to your users.",
    color: "from-cyan-500 to-blue-500",
  },
  {
    icon: <Palette className="w-8 h-8" />,
    title: "Smart Routing",
    description:
      "AI-powered model selection based on your specific use case and performance requirements.",
    color: "from-violet-500 to-purple-500",
  },
  {
    icon: <Brain className="w-8 h-8" />,
    title: "Cost Optimized",
    description:
      "Dynamic pricing and model selection to minimize costs while maintaining quality.",
    color: "from-indigo-500 to-blue-500",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="px-6 py-16">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Why Choose AIRouter?
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Built for developers who need reliable, fast, and cost-effective
            multimodal AI
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuresData.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group p-6 rounded-xl border border-slate-200/50 dark:border-slate-700 hover:border-teal-300 dark:hover:border-slate-600 transition-all duration-300 hover:shadow-xl hover:bg-white/50 dark:hover:bg-slate-800/50 backdrop-blur-sm"
            >
              <div
                className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}
              >
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
