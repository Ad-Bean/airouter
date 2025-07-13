import { ImageResponse } from 'next/og';

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
        }}
      >
        <svg width={32} height={32} viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
          {/* Defs for gradients */}
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#4F46E5', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#A78BFA', stopOpacity: 1 }} />
            </linearGradient>
            <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#34D399', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#A7F3D0', stopOpacity: 1 }} />
            </linearGradient>
          </defs>

          {/* Main Hexagon Body (The "Router") */}
          <g transform="translate(128, 128)">
            <path
              d="M-64 110.85 L-128 0 L-64 -110.85 L64 -110.85 L128 0 L64 110.85 Z"
              fill="url(#grad1)"
              stroke="#6D28D9"
              strokeWidth="8"
            />
          </g>

          {/* Central Icon (Represents Image/Creativity) */}
          <g
            fill="none"
            stroke="white"
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Stylized mountain and sun for "image" */}
            <path
              d="M90 160 L120 120 L140 140 L170 110 L200 150"
              fill="none"
              stroke="#A7F3D0"
              strokeWidth="12"
            />
            <circle cx="165" cy="95" r="12" fill="#A7F3D0" stroke="none" />
          </g>

          <g>
            {/* Line and Node 1 */}
            <line x1="192" y1="221.7" x2="149" y2="190" stroke="url(#grad2)" strokeWidth="6" />
            <circle cx="208" cy="238" r="14" fill="#34D399" stroke="white" strokeWidth="4" />

            {/* Line and Node 2 */}
            <line x1="64" y1="221.7" x2="107" y2="190" stroke="url(#grad2)" strokeWidth="6" />
            <circle cx="48" cy="238" r="14" fill="#34D399" stroke="white" strokeWidth="4" />

            {/* Line and Node 3 */}
            <line x1="32" y1="128" x2="80" y2="128" stroke="url(#grad2)" strokeWidth="6" />
            <circle cx="16" cy="128" r="14" fill="#34D399" stroke="white" strokeWidth="4" />

            {/* Line and Node 4 */}
            <line x1="224" y1="128" x2="176" y2="128" stroke="url(#grad2)" strokeWidth="6" />
            <circle cx="240" cy="128" r="14" fill="#34D399" stroke="white" strokeWidth="4" />

            {/* Line and Node 5 */}
            <line x1="64" y1="34.3" x2="107" y2="66" stroke="url(#grad2)" strokeWidth="6" />
            <circle cx="48" cy="18" r="14" fill="#34D399" stroke="white" strokeWidth="4" />

            {/* Line and Node 6 */}
            <line x1="192" y1="34.3" x2="149" y2="66" stroke="url(#grad2)" strokeWidth="6" />
            <circle cx="208" cy="18" r="14" fill="#34D399" stroke="white" strokeWidth="4" />
          </g>
        </svg>
      </div>
    ),
    // ImageResponse options
    {
      // For convenience, we can re-use the exported icons size metadata
      // config to also set the ImageResponse's width and height.
      ...size,
    },
  );
}
