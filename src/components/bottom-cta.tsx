import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function BottomCTA() {
  return (
    <section className="relative max-w-4xl mx-auto px-6 py-40 text-center overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-600/10 blur-[100px] rounded-full -z-10" />

      <div className="relative z-10">
        <h2 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight text-white">
          Ready to debug your potential?
        </h2>

        <p className="text-gray-400 text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
          Join the developers honing their skills daily. It's free to start, and
          challenging to master.
        </p>
        <Link href="/login">
          <Button className="bg-purple-600 cursor-pointer hover:bg-purple-700 text-white rounded-2xl h-16 px-12 text-xl font-bold shadow-[0_0_30px_rgba(147,51,234,0.3)] hover:shadow-[0_0_50px_rgba(147,51,234,0.5)] transition-all duration-300 hover:-translate-y-1">
            Start Coding Now
          </Button>
        </Link>
      </div>
    </section>
  );
}
