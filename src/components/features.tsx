import { Code2, Users, Trophy } from "lucide-react";

export default function FeatureSection() {
  return (
    <section className="max-w-7xl mx-auto px-6 pb-32">
      <div className="text-center mb-20">
        <h2 className="text-4xl font-bold mb-4">Engineered for Excellence</h2>
        <p className="text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">
          A platform built without compromise. Challenge your mates and climb
          the leaderboard together.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="group relative bg-[#12121A] border border-white/10 p-10 rounded-3xl hover:border-purple-500/50 transition-all duration-300">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
            <Code2 className="text-purple-400" size={24} />
          </div>
          <h3 className="text-2xl font-semibold mb-4">Adaptive Practice</h3>
          <p className="text-gray-400 leading-relaxed">
            Access a library of 500+ curated algorithmic challenges that adapt
            to your skill level. Master DP, Graphs, and Trees.
          </p>
        </div>

        <div className="group relative bg-[#12121A] border border-white/10 p-10 rounded-3xl hover:border-purple-500/50 transition-all duration-300">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
            <Users className="text-purple-400" size={24} />
          </div>
          <h3 className="text-2xl font-semibold mb-4">Private Lobbies</h3>
          <p className="text-gray-400 leading-relaxed">
            Challenge friends or colleagues in real-time, customizable rooms.
            Set your own rules, time limits, and problem sets.
          </p>
        </div>

        <div className="group relative bg-[#12121A] border border-white/10 p-10 rounded-3xl hover:border-purple-500/50 transition-all duration-300">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
            <Trophy className="text-purple-400" size={24} />
          </div>
          <h3 className="text-2xl font-semibold mb-4">Live Leaderboards</h3>
          <p className="text-gray-400 leading-relaxed">
            See where you rank globally with millisecond-precision updates.
            Climb the tiers from Novice to Grandmaster.
          </p>
        </div>
      </div>
    </section>
  );
}
