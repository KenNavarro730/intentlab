/**
 * 6 Anchor Sets for SSR Likert Mapping
 * Each set contains 5 statements corresponding to Likert ratings 1-5
 * Paper shows averaging across sets improves reliability
 */
export const ANCHOR_SETS: string[][] = [
  // Set 1: Direct intent language
  [
    "I definitely would not buy this.",
    "I probably would not buy this.",
    "I'm unsure if I'd buy this.",
    "I probably would buy this.",
    "I definitely would buy this."
  ],
  // Set 2: Interest-focused
  [
    "I have no interest in buying this.",
    "I'm not very interested in buying this.",
    "I might buy it, but I'm undecided.",
    "I'm interested and would likely buy it.",
    "I'm very interested and would buy it."
  ],
  // Set 3: Value perception
  [
    "This doesn't feel worth purchasing for me.",
    "I'd likely pass on purchasing this.",
    "I could go either way on buying it.",
    "I'd be inclined to purchase it.",
    "I'd be eager to purchase it."
  ],
  // Set 4: Consideration-based
  [
    "I wouldn't consider buying this.",
    "I don't think I'd buy this.",
    "I'm on the fence about buying it.",
    "I think I'd buy it.",
    "I'm very likely to buy it."
  ],
  // Set 5: Avoidance vs approach
  [
    "I would avoid buying this.",
    "I'd usually skip buying something like this.",
    "I'm not sure I'd buy it.",
    "I'd consider buying it.",
    "I'd almost certainly buy it."
  ],
  // Set 6: Spending intent
  [
    "I wouldn't spend money on this.",
    "I'm unlikely to purchase this.",
    "I'm neutral about purchasing this.",
    "I'm likely to purchase this.",
    "I'm very likely to purchase this."
  ]
];

export default ANCHOR_SETS;
