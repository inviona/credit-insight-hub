import { motion } from "framer-motion";

/** City markers as % within the map region (not the hologram base). */
const nodes = [
  { name: "Tirana", x: 44, y: 48, score: 92, status: "Optimal" as const },
  { name: "Prishtine", x: 72, y: 22, score: 88, status: "Optimal" as const },
  { name: "Durres", x: 34, y: 50, score: 85, status: "Warning" as const },
  { name: "Shkoder", x: 36, y: 28, score: 95, status: "Optimal" as const },
  { name: "Vlore", x: 34, y: 72, score: 78, status: "Warning" as const },
  { name: "Korce", x: 62, y: 68, score: 82, status: "Optimal" as const },
  { name: "Elbasan", x: 52, y: 54, score: 90, status: "Optimal" as const },
  { name: "Fier", x: 32, y: 62, score: 86, status: "Optimal" as const },
  { name: "Prizren", x: 58, y: 32, score: 91, status: "Optimal" as const },
  { name: "Gjirokaster", x: 42, y: 82, score: 88, status: "Optimal" as const },
];

export function AlbaniaNetworkMap() {
  return (
    <motion.div
      className="relative w-full max-w-[340px] sm:max-w-[380px] lg:max-w-[420px] mx-auto bg-[#070b14]"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: "easeOut" }}
    >
      {/* Ambient glow aligned with hero blue → cyan gradient */}
      <div
        className="absolute inset-[5%] rounded-full pointer-events-none opacity-80"
        style={{
          background:
            "radial-gradient(ellipse at 50% 35%, rgba(56,189,248,0.18) 0%, rgba(37,99,235,0.08) 45%, transparent 70%)",
        }}
      />

      <motion.img
        src="/albania-kosovo.png"
        alt="Albania and Kosovo digital risk network"
        className="relative w-full h-auto object-contain select-none"
        style={{
          filter: "grayscale(0.35) sepia(0.25) hue-rotate(195deg) saturate(1.3) brightness(1.08) contrast(1.05)",
        }}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: "easeOut", delay: 0.1 }}
      />

      {/* Blue tint overlay to blend warm tones into site palette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(135deg, rgba(37,99,235,0.18) 0%, rgba(56,189,248,0.08) 45%, transparent 70%)",
          mixBlendMode: "overlay",
        }}
      />

      {/* Soft vignette so edges melt into page bg #070b14 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 85% 75% at 50% 38%, transparent 50%, #070b14 100%)",
          opacity: 0.55,
        }}
      />
      <div className="absolute bottom-0 inset-x-0 h-[28%] bg-gradient-to-t from-[#070b14] via-[#070b14]/80 to-transparent pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-12 bg-gradient-to-b from-[#070b14]/40 to-transparent pointer-events-none" />

      {/* Interactive nodes — confined to the wireframe map area */}
      <div className="absolute inset-x-[10%] top-[8%] bottom-[34%]">
        {nodes.map((node, i) => (
          <div
            key={node.name}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
          >
            <div className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 peer bg-transparent cursor-pointer z-20 left-1/2 top-1/2" />

            <motion.div
              className={`w-2 h-2 rounded-full ${
                node.status === "Warning"
                  ? "bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.9)]"
                  : "bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.9)]"
              }`}
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
            />

            <div className="opacity-0 peer-hover:opacity-100 transition-opacity duration-200 absolute left-4 -top-8 bg-[#0d1323]/95 backdrop-blur-md border border-white/10 text-white rounded-lg p-3 w-40 z-30 shadow-2xl pointer-events-none transform -translate-y-2 peer-hover:-translate-y-4 font-sans">
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-sm tracking-tight">{node.name}</span>
                <div
                  className={`h-2 w-2 rounded-full ${
                    node.status === "Warning"
                      ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                      : "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                  }`}
                />
              </div>
              <div className="flex flex-col gap-1 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Risk Score:</span>
                  <span
                    className={`font-bold font-mono ${
                      node.status === "Warning" ? "text-amber-400" : "text-emerald-400"
                    }`}
                  >
                    {node.score}/100
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="text-slate-300">{node.status}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
