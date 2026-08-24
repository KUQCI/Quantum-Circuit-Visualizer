/** Static art-team tracker — structure mirrors a future Notion board. */

export type AssetPriority = "P0" | "P1" | "P2";
export type AssetStatus = "needed" | "in-progress" | "review" | "done";

export interface ArtistAssetRequirement {
  id: string;
  title: string;
  priority: AssetPriority;
  owner: string;
  dueDate: string;
  status: AssetStatus;
  notes: string;
  dimensions?: string;
}

export const ARTIST_ASSET_REQUIREMENTS: ArtistAssetRequirement[] = [
  {
    id: "quantum-journey-banner",
    title: "Quantum Journey landing banner",
    priority: "P0",
    owner: "Art team (TBD)",
    dueDate: "TBD",
    status: "needed",
    notes:
      "Hero / journey banner for the visualizer home page. Dark futuristic QCI look; room for title overlay.",
    dimensions: "Desktop 2400×800 · Tablet 1600×900 · Mobile 1200×1400",
  },
  {
    id: "gate-opening-animation",
    title: "Gate opening intro animation",
    priority: "P1",
    owner: "Art team (TBD)",
    dueDate: "TBD",
    status: "needed",
    notes: "Short motion for first-load or Learn mode entry. Keep lightweight for GitHub Pages.",
  },
  {
    id: "intro-video",
    title: "20–30 second quantum intro video",
    priority: "P1",
    owner: "Art / media (TBD)",
    dueDate: "TBD",
    status: "needed",
    notes: "Explain visualizer purpose; muted autoplay-friendly or poster + play CTA.",
    dimensions: "1920×1080 (16:9)",
  },
  {
    id: "quanta-teacher",
    title: "Quanta teacher persona",
    priority: "P0",
    owner: "Art team (TBD)",
    dueDate: "TBD",
    status: "needed",
    notes:
      "Official Quanta duck teacher style for Learn mode. Match existing Quanta silhouette until assets land.",
  },
  {
    id: "quanta-wave-loop",
    title: "Quanta 1-second waving loop",
    priority: "P1",
    owner: "Art team (TBD)",
    dueDate: "TBD",
    status: "needed",
    notes: "Looping micro-animation for welcome cards. Prefer Lottie/WebM under ~150KB.",
  },
  {
    id: "custom-visualizer-icons",
    title: "Custom visualizer icons",
    priority: "P2",
    owner: "Art team (TBD)",
    dueDate: "TBD",
    status: "needed",
    notes: "Set of UI icons (Build, Learn, Challenges, gates categories) in QCI cyan/gold system.",
  },
  {
    id: "bloch-sphere-duck",
    title: "Bloch sphere icon with Quanta duck",
    priority: "P2",
    owner: "Art team (TBD)",
    dueDate: "TBD",
    status: "needed",
    notes: "Playful-academic mark for Academy / state viz empty states.",
    dimensions: "512×512 SVG preferred",
  },
  {
    id: "responsive-banner-dims",
    title: "Responsive banner dimension pack",
    priority: "P1",
    owner: "Art team (TBD)",
    dueDate: "TBD",
    status: "needed",
    notes:
      "Export variants for desktop/tablet/mobile of the Quantum Journey banner. Document safe text zones.",
    dimensions: "See quantum-journey-banner row",
  },
];
