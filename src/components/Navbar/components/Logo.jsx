import { Link } from "react-router-dom";

export const Logo = () => (
  <Link to="/" className="flex items-center">
    <div className="group relative h-14 w-14 overflow-hidden rounded-full border-2 border-white bg-white shadow-sm sm:h-16 sm:w-16">
      <img
        src="/imagen/logocuadrado.png"
        alt="MSG Repuestos"
        className="h-full w-full object-cover scale-[1.35]"
      />
      <span
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.5) 48%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0.5) 52%, transparent 70%)",
          backgroundSize: "300% 100%",
          animation: "shimmer 0.8s ease-in-out",
        }}
      />
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  </Link>
);