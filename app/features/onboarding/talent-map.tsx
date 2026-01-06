/** biome-ignore-all lint/style/noMagicNumbers: Marker sizes are based on city importance */
import type { COBEOptions } from "cobe";

import { Globe } from "~/components/ui/globe";
import { LightRays } from "~/components/ui/light-rays";
import { usePrefersReducedMotion } from "~/hooks/use-prefers-reduced-motion";

const markers: COBEOptions["markers"] = [
  // Original cities - Major global hubs
  { location: [40.7128, -74.006], size: 0.1 }, // New York
  { location: [34.0522, -118.2437], size: 0.09 }, // Los Angeles
  { location: [51.5074, -0.1278], size: 0.1 }, // London
  { location: [-33.8688, 151.2093], size: 0.08 }, // Sydney
  { location: [48.8566, 2.3522], size: 0.09 }, // Paris
  { location: [35.6762, 139.6503], size: 0.1 }, // Tokyo
  { location: [55.7558, 37.6176], size: 0.08 }, // Moscow
  { location: [39.9042, 116.4074], size: 0.1 }, // Beijing
  { location: [28.6139, 77.209], size: 0.1 }, // New Delhi
  { location: [-23.5505, -46.6333], size: 0.1 }, // São Paulo
  { location: [1.3521, 103.8198], size: 0.08 }, // Singapore
  { location: [25.2048, 55.2708], size: 0.07 }, // Dubai
  { location: [52.52, 13.405], size: 0.07 }, // Berlin
  { location: [19.4326, -99.1332], size: 0.1 }, // Mexico City
  { location: [-26.2041, 28.0473], size: 0.07 }, // Johannesburg
  // Asia-Pacific additions
  { location: [31.1978, 121.336], size: 0.1 }, // Shanghai, China
  { location: [22.305, 114.185], size: 0.08 }, // Hong Kong
  { location: [37.5665, 126.978], size: 0.09 }, // Seoul, South Korea
  { location: [19.076, 72.8777], size: 0.1 }, // Mumbai, India
  { location: [12.97, 77.56], size: 0.08 }, // Bangalore, India
  // Africa additions
  { location: [30.0444, 31.2357], size: 0.09 }, // Cairo, Egypt
  { location: [6.5244, 3.3792], size: 0.08 }, // Lagos, Nigeria
  { location: [-1.2921, 36.8219], size: 0.06 }, // Nairobi, Kenya
  { location: [-33.9249, 18.4241], size: 0.06 }, // Cape Town, South Africa
  { location: [5.6037, -0.187], size: 0.05 }, // Accra, Ghana
  // South America additions
  { location: [-34.6037, -58.3816], size: 0.08 }, // Buenos Aires, Argentina
  { location: [4.711, -74.0721], size: 0.07 }, // Bogotá, Colombia
  { location: [-33.4489, -70.6693], size: 0.06 }, // Santiago, Chile
  { location: [-12.0464, -77.0428], size: 0.06 }, // Lima, Peru
  { location: [-22.9068, -43.1729], size: 0.07 }, // Rio de Janeiro, Brazil
  { location: [10.4806, -66.9036], size: 0.05 }, // Caracas, Venezuela
  { location: [-0.1807, -78.4678], size: 0.04 }, // Quito, Ecuador
  { location: [-34.9011, -56.1645], size: 0.04 }, // Montevideo, Uruguay
  { location: [-16.5, -68.15], size: 0.04 }, // La Paz, Bolivia
  { location: [-25.2637, -57.5759], size: 0.03 }, // Asunción, Paraguay
  // Middle East additions
  { location: [32.0853, 34.7818], size: 0.06 }, // Tel Aviv, Israel
  { location: [24.4667, 54.3667], size: 0.06 }, // Abu Dhabi, UAE
  { location: [24.6408, 46.7727], size: 0.06 }, // Riyadh, Saudi Arabia
  // North America additions
  { location: [37.7749, -122.4194], size: 0.08 }, // San Francisco, USA
  { location: [43.6511, -79.3832], size: 0.08 }, // Toronto, Canada
  { location: [41.8781, -87.6298], size: 0.08 }, // Chicago, USA
  { location: [49.2827, -123.1207], size: 0.06 }, // Vancouver, Canada
  { location: [30.2672, -97.7431], size: 0.06 }, // Austin, USA
  { location: [47.6062, -122.3321], size: 0.07 }, // Seattle, USA
  { location: [42.3601, -71.0589], size: 0.07 }, // Boston, USA
  { location: [25.7617, -80.1918], size: 0.06 }, // Miami, USA
  { location: [38.9072, -77.0369], size: 0.07 }, // Washington D.C., USA
  { location: [45.5017, -73.5673], size: 0.06 }, // Montreal, Canada
  { location: [39.7392, -104.9903], size: 0.06 }, // Denver, USA
  { location: [32.7157, -117.1611], size: 0.06 }, // San Diego, USA
  { location: [33.4484, -112.074], size: 0.06 }, // Phoenix, USA
  { location: [39.9526, -75.1652], size: 0.07 }, // Philadelphia, USA
  { location: [33.749, -84.388], size: 0.07 }, // Atlanta, USA
  { location: [32.7767, -96.797], size: 0.07 }, // Dallas, USA
  { location: [29.7604, -95.3698], size: 0.07 }, // Houston, USA
  // Europe additions
  { location: [52.3676, 4.9041], size: 0.06 }, // Amsterdam, Netherlands
  { location: [59.3293, 18.0686], size: 0.05 }, // Stockholm, Sweden
  { location: [41.4, 2.15], size: 0.07 }, // Barcelona, Spain
  { location: [40.4168, -3.7038], size: 0.07 }, // Madrid, Spain
  { location: [41.9028, 12.4964], size: 0.06 }, // Rome, Italy
  { location: [47.3769, 8.5417], size: 0.05 }, // Zurich, Switzerland
  { location: [55.6761, 12.5683], size: 0.05 }, // Copenhagen, Denmark
  { location: [48.2082, 16.3738], size: 0.06 }, // Vienna, Austria
  { location: [53.3498, -6.2603], size: 0.05 }, // Dublin, Ireland
  { location: [50.8503, 4.3517], size: 0.05 }, // Brussels, Belgium
  { location: [38.7169, -9.1399], size: 0.05 }, // Lisbon, Portugal
  { location: [59.9139, 10.7522], size: 0.04 }, // Oslo, Norway
  { location: [37.9838, 23.7275], size: 0.06 }, // Athens, Greece
  { location: [60.1695, 24.9354], size: 0.04 }, // Helsinki, Finland
  { location: [52.2297, 21.0122], size: 0.06 }, // Warsaw, Poland
  { location: [50.0755, 14.4378], size: 0.05 }, // Prague, Czech Republic
  { location: [47.4979, 19.0402], size: 0.05 }, // Budapest, Hungary
  { location: [41.0082, 28.9784], size: 0.08 }, // Istanbul, Turkey
];

export function TalentMap() {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <div className="relative flex size-full items-center justify-center overflow-hidden px-40 pt-8 pb-40 md:pb-60">
      <LightRays
        count={10}
        length="120%"
        prefersReducedMotion={prefersReducedMotion}
        speed={16}
      />
      <Globe className="my-auto" config={{ markers }} />
      <div className="pointer-events-none absolute inset-0 h-full bg-[radial-gradient(circle_at_50%_200%,rgba(0,0,0,0.2),rgba(255,255,255,0))]" />
      <div className="pointer-events-none absolute inset-0 from-transparent to-70% to-background" />
    </div>
  );
}
