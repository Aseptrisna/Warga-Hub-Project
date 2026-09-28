// Placeholder illustrations for the marketing page. Replace with real photos
// by swapping these components for <img> tags in LandingPage.tsx.

const C = {
  sky: '#F6EBD9',
  skyHigh: '#F3E2C7',
  cloud: '#FFF9EF',
  sun: '#E9B44C',
  hillFar: '#D3E6D9',
  hillMid: '#A7CBB3',
  field: '#7FB08F',
  fieldDark: '#5E9774',
  ground: '#E9DCC4',
  path: '#F4E8D2',
  wood: '#7A4A2C',
  woodLight: '#9A6440',
  wall: '#F7EBD6',
  roof: '#A94F20',
  roofTop: '#C4622D',
  ridge: '#6E3316',
  leaf: '#3B8565',
  leafDark: '#1F5A43',
  ink: '#1F1B16',
  skin: '#C68B59',
  skinDark: '#A8703F',
  red: '#C8322B',
  white: '#FFFFFF',
  night: '#1E2A3A',
  nightHigh: '#2A3A4F',
  lamp: '#F6C667',
};

function Person({
  x,
  y,
  shirt,
  skin = C.skin,
  s = 1,
  hat,
}: {
  x: number;
  y: number;
  shirt: string;
  skin?: string;
  s?: number;
  hat?: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-7} y={14} width={5} height={16} rx={2} fill={C.ink} opacity={0.85} />
      <rect x={2} y={14} width={5} height={16} rx={2} fill={C.ink} opacity={0.85} />
      <path d="M-10 16 Q-10 -2 0 -2 Q10 -2 10 16 Z" fill={shirt} />
      <circle cx={0} cy={-9} r={7} fill={skin} />
      {hat && <path d="M-11 -11 Q0 -22 11 -11 Z" fill={hat} />}
    </g>
  );
}

function Tree({ x, y, s = 1, dark = false }: { x: number; y: number; s?: number; dark?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-3} y={0} width={6} height={26} rx={2} fill={C.wood} />
      <circle cx={0} cy={-10} r={20} fill={dark ? C.leafDark : C.leaf} />
      <circle cx={-12} cy={0} r={13} fill={dark ? C.leafDark : C.leaf} />
      <circle cx={12} cy={-2} r={14} fill={dark ? C.leaf : C.leafDark} opacity={0.9} />
    </g>
  );
}

function Palm({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 0 Q6 -40 -2 -86" stroke={C.woodLight} strokeWidth={6} fill="none" strokeLinecap="round" />
      <g transform="translate(-2 -86)" fill={C.leaf}>
        <path d="M0 0 Q-24 -10 -42 6 Q-20 -2 0 4 Z" />
        <path d="M0 0 Q24 -12 44 4 Q22 -2 0 4 Z" />
        <path d="M0 0 Q-10 -26 -28 -32 Q-12 -14 0 2 Z" fill={C.leafDark} />
        <path d="M0 0 Q12 -26 30 -30 Q14 -12 0 2 Z" fill={C.leafDark} />
        <path d="M0 0 Q2 -28 -4 -40 Q6 -22 2 2 Z" />
      </g>
    </g>
  );
}

function Flag({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-1.5} y={-70} width={3} height={70} fill="#8B8578" />
      <rect x={1.5} y={-68} width={30} height={10} fill={C.red} />
      <rect x={1.5} y={-58} width={30} height={10} fill={C.white} />
    </g>
  );
}

/* ───────────────────────── Hero scene ───────────────────────── */

export function HeroScene({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 640 480" className={className} role="img" aria-label="Ilustrasi suasana desa: balai desa, pos ronda, dan warga">
      <defs>
        <linearGradient id="hero-sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={C.skyHigh} />
          <stop offset="1" stopColor={C.sky} />
        </linearGradient>
      </defs>
      <rect width="640" height="480" fill="url(#hero-sky)" />

      <circle cx="505" cy="112" r="64" fill={C.sun} opacity={0.18} />
      <circle cx="505" cy="112" r="42" fill={C.sun} />

      <g fill={C.cloud}>
        <ellipse cx="130" cy="96" rx="46" ry="14" />
        <ellipse cx="160" cy="86" rx="30" ry="14" />
        <ellipse cx="380" cy="64" rx="38" ry="11" />
        <ellipse cx="404" cy="56" rx="22" ry="10" />
      </g>

      <path d="M0 262 Q90 206 190 238 T380 226 T640 232 V480 H0 Z" fill={C.hillFar} />
      <path d="M0 300 Q120 250 260 286 T520 272 T640 280 V480 H0 Z" fill={C.hillMid} />

      <path d="M0 330 Q160 304 320 322 T640 316 V480 H0 Z" fill={C.field} />
      <g stroke={C.fieldDark} strokeWidth={1.5} opacity={0.5} fill="none">
        <path d="M0 348 Q160 324 320 340 T640 334" />
        <path d="M0 366 Q160 344 320 358 T640 352" />
      </g>

      <path d="M0 384 Q200 368 320 376 T640 372 V480 H0 Z" fill={C.ground} />
      <path d="M300 480 Q306 430 272 396 L300 392 Q344 430 356 480 Z" fill={C.path} />

      <Palm x={78} y={392} s={1.05} />
      <Tree x={588} y={356} s={1.1} dark />
      <Tree x={548} y={372} s={0.8} />

      {/* Balai desa (joglo) */}
      <g>
        <rect x="140" y="370" width="250" height="16" rx="2" fill="#CDB896" />
        <rect x="150" y="386" width="230" height="6" fill="#B9A27E" />
        <rect x="172" y="318" width="186" height="54" fill={C.wall} />
        <rect x="248" y="330" width="34" height="42" fill={C.woodLight} />
        <rect x="264" y="330" width="2" height="42" fill={C.wood} />
        <rect x="190" y="332" width="36" height="22" fill="#D9C7A6" />
        <rect x="304" y="332" width="36" height="22" fill="#D9C7A6" />
        <g fill={C.wood}>
          <rect x="164" y="312" width="8" height="60" />
          <rect x="358" y="312" width="8" height="60" />
        </g>
        <polygon points="124,322 406,322 366,282 164,282" fill={C.roof} />
        <polygon points="182,286 348,286 308,236 222,236" fill={C.roofTop} />
        <rect x="218" y="230" width="94" height="8" rx="2" fill={C.ridge} />
        <rect x="222" y="296" width="86" height="16" rx="2" fill={C.wall} />
        <text x="265" y="307.5" textAnchor="middle" fontSize="9" fontWeight="700" letterSpacing="1.2" fill={C.ink} fontFamily="Plus Jakarta Sans, system-ui, sans-serif">
          BALAI DESA
        </text>
      </g>

      <Flag x={412} y={372} />

      {/* Pos ronda */}
      <g>
        <rect x="452" y="352" width="4" height="36" fill={C.wood} />
        <rect x="524" y="352" width="4" height="36" fill={C.wood} />
        <rect x="456" y="366" width="68" height="6" fill={C.woodLight} />
        <polygon points="440,356 540,356 522,330 458,330" fill={C.roofTop} />
        <rect x="474" y="358" width="6" height="18" rx="3" fill={C.ridge} />
        <circle cx="508" cy="362" r="4" fill={C.lamp} />
      </g>

      <Person x={220} y={410} shirt={C.leafDark} s={1.05} />
      <Person x={244} y={414} shirt={C.roofTop} skin={C.skinDark} s={0.95} hat="#EFE3CD" />
      <Person x={420} y={416} shirt="#E9B44C" s={0.9} />
      <Person x={488} y={404} shirt="#2A3A4F" skin={C.skinDark} s={0.9} />
    </svg>
  );
}

/* ───────────────────────── "Photo" scenes ───────────────────────── */

export function KerjaBaktiScene({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 300" className={className} role="img" aria-label="Ilustrasi kerja bakti warga">
      <rect width="400" height="300" fill={C.sky} />
      <circle cx="330" cy="70" r="30" fill={C.sun} opacity={0.9} />
      <path d="M0 170 Q120 140 240 160 T400 150 V300 H0 Z" fill={C.hillMid} />
      <path d="M0 200 H400 V300 H0 Z" fill={C.ground} />
      <path d="M0 232 H400 V270 H0 Z" fill="#CFC3AC" />
      <g stroke="#F7F0E2" strokeWidth={3} strokeDasharray="18 14">
        <line x1="0" y1="251" x2="400" y2="251" />
      </g>
      <Tree x={52} y={176} s={1.2} dark />
      <Tree x={356} y={184} s={1} />
      <g>
        <rect x="112" y="196" width="72" height="44" fill={C.wall} />
        <polygon points="104,198 192,198 176,172 120,172" fill={C.roof} />
        <rect x="140" y="212" width="16" height="28" fill={C.woodLight} />
      </g>
      <Person x={228} y={214} shirt={C.leafDark} s={1.2} hat="#EFE3CD" />
      <line x1="240" y1="210" x2="262" y2="250" stroke={C.wood} strokeWidth={3} strokeLinecap="round" />
      <path d="M256 246 L272 254 L264 258 Z" fill="#B9A27E" />
      <Person x={290} y={218} shirt={C.roofTop} skin={C.skinDark} s={1.1} />
      <ellipse cx="318" cy="246" rx="12" ry="9" fill="#2A3A4F" />
      <Person x={196} y={222} shirt={C.sun} s={1} />
    </svg>
  );
}

export function RondaScene({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 300" className={className} role="img" aria-label="Ilustrasi ronda malam di pos ronda">
      <defs>
        <radialGradient id="ronda-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={C.lamp} stopOpacity="0.55" />
          <stop offset="1" stopColor={C.lamp} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="300" fill={C.night} />
      <rect width="400" height="160" fill={C.nightHigh} opacity={0.5} />
      <circle cx="70" cy="60" r="18" fill="#F3EAD3" />
      <circle cx="78" cy="54" r="16" fill={C.night} />
      <g fill="#F3EAD3">
        <circle cx="160" cy="40" r="1.6" />
        <circle cx="230" cy="70" r="1.2" />
        <circle cx="300" cy="36" r="1.8" />
        <circle cx="350" cy="90" r="1.2" />
        <circle cx="120" cy="100" r="1" />
      </g>
      <path d="M0 200 Q140 176 260 190 T400 184 V300 H0 Z" fill="#17222F" />
      <path d="M0 240 H400 V300 H0 Z" fill="#131C27" />
      <circle cx="230" cy="178" r="90" fill="url(#ronda-glow)" />
      <g>
        <rect x="170" y="172" width="5" height="66" fill="#3B2A1E" />
        <rect x="286" y="172" width="5" height="66" fill="#3B2A1E" />
        <rect x="175" y="206" width="111" height="8" fill="#5A3E2B" />
        <polygon points="150,176 310,176 284,138 176,138" fill="#7A3A18" />
        <rect x="200" y="178" width="8" height="26" rx="4" fill="#4A2A14" />
        <circle cx="258" cy="186" r="6" fill={C.lamp} />
      </g>
      <Person x={232} y={196} shirt="#3B5A7A" skin={C.skinDark} s={1.05} />
      <Person x={120} y={214} shirt="#2A6F52" s={1.1} hat="#1F1B16" />
      <path d="M130 212 L60 196 L60 236 Z" fill={C.lamp} opacity={0.25} />
    </svg>
  );
}

export function UmkmScene({ className }: { className?: string }) {
  const stripes = Array.from({ length: 8 });
  return (
    <svg viewBox="0 0 400 300" className={className} role="img" aria-label="Ilustrasi lapak UMKM warga">
      <rect width="400" height="300" fill={C.skyHigh} />
      <path d="M0 220 H400 V300 H0 Z" fill={C.ground} />
      <Tree x={352} y={186} s={1.1} dark />
      <g>
        <rect x="70" y="120" width="6" height="110" fill={C.wood} />
        <rect x="284" y="120" width="6" height="110" fill={C.wood} />
        <g>
          {stripes.map((_, i) => (
            <path
              key={i}
              d={`M${62 + i * 30} 108 h30 v26 q-15 10 -30 0 Z`}
              fill={i % 2 === 0 ? C.roofTop : C.cloud}
            />
          ))}
        </g>
        <rect x="80" y="84" width="200" height="26" rx="3" fill={C.leafDark} />
        <text x="180" y="101.5" textAnchor="middle" fontSize="12" fontWeight="700" fill={C.cloud} fontFamily="Plus Jakarta Sans, system-ui, sans-serif">
          Keripik Bu Sri
        </text>
        <rect x="76" y="186" width="208" height="44" fill="#B98A5E" />
        <rect x="76" y="186" width="208" height="6" fill="#9A6A40" />
      </g>
      <g>
        <ellipse cx="110" cy="182" rx="22" ry="9" fill="#8A5A3B" />
        <circle cx="102" cy="176" r="6" fill={C.sun} />
        <circle cx="114" cy="174" r="6" fill="#E08A3C" />
        <circle cx="122" cy="178" r="5" fill={C.sun} />
        <rect x="150" y="160" width="26" height="24" rx="3" fill="#F3D9A8" />
        <rect x="182" y="164" width="26" height="20" rx="3" fill="#E7C489" />
        <ellipse cx="248" cy="182" rx="22" ry="9" fill="#8A5A3B" />
        <circle cx="240" cy="176" r="6" fill={C.leaf} />
        <circle cx="252" cy="174" r="6" fill={C.leafDark} />
      </g>
      <Person x={180} y={150} shirt={C.roofTop} s={1.05} hat="#EFE3CD" />
      <Person x={322} y={218} shirt="#2A3A4F" skin={C.skinDark} s={1.1} />
    </svg>
  );
}

export function MusyawarahScene({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 300" className={className} role="img" aria-label="Ilustrasi musyawarah warga di balai desa">
      <rect width="400" height="300" fill="#EFE0C6" />
      <polygon points="0,0 400,0 400,60 200,20 0,60" fill={C.roof} />
      <g fill={C.wood}>
        <rect x="40" y="40" width="10" height="260" />
        <rect x="350" y="40" width="10" height="260" />
      </g>
      <rect x="150" y="66" width="100" height="58" rx="3" fill={C.white} stroke="#CDB896" strokeWidth={3} />
      <g stroke="#B9A27E" strokeWidth={3} strokeLinecap="round">
        <line x1="164" y1="84" x2="232" y2="84" />
        <line x1="164" y1="98" x2="214" y2="98" />
        <line x1="164" y1="112" x2="224" y2="112" />
      </g>
      <path d="M0 200 H400 V300 H0 Z" fill="#D9C7A6" />
      <ellipse cx="200" cy="236" rx="150" ry="40" fill="#C9A66B" />
      <g stroke="#B08850" strokeWidth={2} opacity={0.6}>
        <line x1="80" y1="236" x2="320" y2="236" />
        <line x1="110" y1="222" x2="290" y2="222" />
        <line x1="110" y1="250" x2="290" y2="250" />
      </g>
      <Person x={110} y={196} shirt={C.leafDark} s={1} hat="#1F1B16" />
      <Person x={160} y={186} shirt={C.sun} skin={C.skinDark} s={0.95} />
      <Person x={240} y={186} shirt={C.roofTop} s={0.95} />
      <Person x={290} y={196} shirt="#3B5A7A" skin={C.skinDark} s={1} hat="#EFE3CD" />
      <Person x={200} y={222} shirt="#2A6F52" s={1.05} />
    </svg>
  );
}

/* ───────────────────────── CTA silhouette ───────────────────────── */

export function VillageSilhouette({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1200 140" preserveAspectRatio="xMidYMax slice" className={className} aria-hidden>
      <g fill="currentColor">
        <path d="M0 140 V110 Q60 96 120 108 V140 Z" />
        <polygon points="120,140 120,96 150,70 180,96 180,140" />
        <circle cx="236" cy="92" r="26" />
        <rect x="233" y="92" width="6" height="48" />
        <polygon points="280,140 280,90 330,50 380,50 430,90 430,140" />
        <rect x="350" y="36" width="10" height="16" />
        <polygon points="460,140 460,100 490,78 520,100 520,140" />
        <path d="M560 140 V96 Q560 60 600 60 Q640 60 640 96 V140 Z" />
        <rect x="597" y="40" width="6" height="22" />
        <circle cx="720" cy="96" r="22" />
        <rect x="717" y="96" width="6" height="44" />
        <polygon points="760,140 760,92 800,66 840,92 840,140" />
        <polygon points="870,140 870,86 910,62 990,62 1030,86 1030,140" />
        <circle cx="1080" cy="100" r="20" />
        <rect x="1077" y="100" width="6" height="40" />
        <path d="M1110 140 V104 Q1160 92 1200 104 V140 Z" />
      </g>
    </svg>
  );
}
