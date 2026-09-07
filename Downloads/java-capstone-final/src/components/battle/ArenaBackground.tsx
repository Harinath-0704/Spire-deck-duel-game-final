import { motion } from 'framer-motion';
import { useMemo } from 'react';

export function ArenaBackground() {
  // Generate random particles for magical embers/energy
  const particles = useMemo(() => {
    return Array.from({ length: 50 }).map((_, i) => {
      const colors = ['bg-orange-500', 'bg-amber-400', 'bg-yellow-300', 'bg-red-400'];
      return {
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 5 + 2,
        duration: Math.random() * 4 + 4,
        delay: Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
      };
    });
  }, []);

  const runes = useMemo(() => {
    return Array.from({ length: 8 }).map((_, i) => ({
      id: i,
      x: Math.random() * 80 + 10,
      y: Math.random() * 80 + 10,
      duration: Math.random() * 15 + 15,
      delay: Math.random() * 5,
      scale: Math.random() * 0.5 + 0.5,
    }));
  }, []);

  // Floating background cards
  const floatingCards = useMemo(() => {
    return Array.from({ length: 6 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100 + 100, // start below screen
      duration: Math.random() * 20 + 25,
      delay: Math.random() * 10,
      scale: Math.random() * 0.4 + 0.4,
      rotateZ: Math.random() * 360,
    }));
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none bg-black perspective-[1000px]">
      {/* Deep Ash / Charcoal Base Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,_#1a0500_0%,_#000000_100%)]"></div>
      
      {/* Dynamic Flames / Nebula */}
      <motion.div 
        className="absolute inset-0 opacity-40"
        style={{ backgroundImage: 'radial-gradient(circle at 40% 60%, rgba(234, 88, 12, 0.4) 0%, transparent 60%)' }}
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div 
        className="absolute inset-0 opacity-50"
        style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, rgba(245, 158, 11, 0.3) 0%, transparent 50%)' }}
        animate={{ 
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.5, 0.2]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Floating Ancient Fire Runes */}
      {runes.map((r) => (
        <motion.div
          key={`rune-${r.id}`}
          className="absolute text-orange-400/30 font-serif font-bold pointer-events-none select-none text-6xl mix-blend-screen"
          style={{ left: `${r.x}%`, top: `${r.y}%`, transform: `scale(${r.scale})` }}
          animate={{
            y: [0, -80, 0],
            rotate: [0, 180, 360],
            opacity: [0.1, 0.4, 0.1]
          }}
          transition={{
            duration: r.duration,
            repeat: Infinity,
            ease: "linear",
            delay: r.delay
          }}
        >
          ✧
        </motion.div>
      ))}

      {/* Floating 3D Cards Background */}
      {floatingCards.map((c) => (
        <motion.div
          key={`card-${c.id}`}
          className="absolute w-32 h-48 rounded-xl border border-orange-500/40 bg-gradient-to-br from-orange-900/30 to-black/90 backdrop-blur-md shadow-[0_0_30px_rgba(245,158,11,0.15)] mix-blend-screen"
          style={{ 
            left: `${c.x}%`, 
            top: '100%', 
            transformOrigin: 'center center' 
          }}
          animate={{
            y: ['0vh', '-150vh'],
            rotateX: [0, 360],
            rotateY: [0, 360],
            rotateZ: [c.rotateZ, c.rotateZ + 180],
            scale: [c.scale, c.scale * 1.2, c.scale],
            opacity: [0, 0.6, 0]
          }}
          transition={{
            duration: c.duration,
            repeat: Infinity,
            ease: "linear",
            delay: c.delay
          }}
        >
          <div className="absolute inset-2 border border-orange-400/20 rounded-lg"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-amber-500/30 blur-md"></div>
        </motion.div>
      ))}

      {/* 3D Floor Grid with sweeping lava scanner */}
      <div className="absolute bottom-0 left-0 right-0 h-[50vh]" style={{ transform: 'perspective(1000px) rotateX(75deg)', transformOrigin: 'bottom' }}>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f59e0b33_2px,transparent_2px),linear-gradient(to_bottom,#f59e0b33_2px,transparent_2px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        <motion.div 
          className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-500/30 to-transparent h-40"
          animate={{ y: ['-100%', '300%'] }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Intense Glowing Lava Core */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[800px] aspect-square rounded-full bg-orange-600/15 blur-[120px] opacity-80 animate-pulse mix-blend-screen"></div>

      {/* High Visibility Fire Embers */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className={`absolute rounded-full ${p.color} shadow-[0_0_20px_currentColor]`}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [0, -400 - Math.random() * 200],
            x: [0, (Math.random() - 0.5) * 200],
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0]
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeOut"
          }}
        />
      ))}
      
      {/* Heavy Foreground Vignette for dramatic game feel */}
      <div className="absolute inset-0 shadow-[inset_0_0_200px_rgba(0,0,0,1)] mix-blend-multiply"></div>
    </div>
  );
}
