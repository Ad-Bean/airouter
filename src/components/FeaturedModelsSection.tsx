import { motion } from "framer-motion";
import { Wand2, Paintbrush, Sparkles, Brain, Eye, Scan } from "lucide-react";

const modelsData = [
  {
    name: "DALL-E 3",
    provider: "OpenAI",
    type: "Generation",
    latency: "8.2s",
    growth: "+25%",
    icon: <Wand2 className="w-6 h-6" />,
    color: "from-pink-500 to-rose-600",
  },
  {
    name: "Midjourney",
    provider: "Midjourney",
    type: "Generation",
    latency: "12.1s",
    growth: "+18%",
    icon: <Paintbrush className="w-6 h-6" />,
    color: "from-violet-500 to-indigo-600",
  },
  {
    name: "Stable Diffusion",
    provider: "Stability AI",
    type: "Generation",
    latency: "4.5s",
    growth: "+32%",
    icon: <Sparkles className="w-6 h-6" />,
    color: "from-teal-500 to-emerald-600",
  },
  {
    name: "GPT-4 Vision",
    provider: "OpenAI",
    type: "Analysis",
    latency: "1.2s",
    growth: "+15%",
    icon: <Brain className="w-6 h-6" />,
    color: "from-emerald-500 to-green-600",
  },
  {
    name: "Claude Vision",
    provider: "Anthropic",
    type: "Analysis",
    latency: "0.9s",
    growth: "+22%",
    icon: <Eye className="w-6 h-6" />,
    color: "from-orange-500 to-red-600",
  },
  {
    name: "Gemini Vision",
    provider: "Google",
    type: "Analysis",
    latency: "0.7s",
    growth: "+18%",
    icon: <Scan className="w-6 h-6" />,
    color: "from-blue-500 to-cyan-600",
  },
];

export function FeaturedModelsSection() {
  return (
    <section className="px-6 py-16 bg-slate-50/80 dark:bg-slate-800/50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Featured AI Models
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Access the latest vision and image generation models through our
            unified API
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modelsData.map((model, index) => (
            <motion.div
              key={model.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white/80 dark:bg-slate-800 rounded-xl p-6 shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-slate-200/50 dark:border-slate-700"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-10 h-10 rounded-lg bg-gradient-to-br ${model.color} flex items-center justify-center text-white`}
                >
                  {model.icon}
                </div>
                <div className="text-right">
                  <span className="text-sm text-slate-500 dark:text-slate-400 block">
                    {model.provider}
                  </span>
                  <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full">
                    {model.type}
                  </span>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                {model.name}
              </h3>
              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Avg Latency:</span>
                  <span className="font-medium">{model.latency}</span>
                </div>
                <div className="flex justify-between">
                  <span>Growth:</span>
                  <span className="font-medium text-green-600">
                    {model.growth}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
