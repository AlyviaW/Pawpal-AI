// Pure logic (testable)

// Deterministic seed from file-like object
export function stableFromFile(file){
  if(!file) return Math.random();
  const a = file.size % 100003;
  const b = (file.lastModified % 7919) + 1;
  const c = (file.name ? file.name.length : 1) % 97 + 1;
  return ((a*131 + b*17 + c*7) % 100000) / 100000;
}

// Build activity analysis result
export function buildActivity(file, species){
  const seed = stableFromFile(file);
  const idx = Math.min(1, Math.max(0.015, 0.015 + seed * 0.165));
  let label = "Normal";
  if (idx <= 0.035) label = "Low";
  else if (idx >= 0.12) label = "High";
  const durationSec = file ? Math.min(25, Math.max(6, Math.floor(file.size / 900000))) : null;
  return {
    species,
    activityIndex: Number(idx.toFixed(3)),
    label,
    durationSec,
    notes: "simulated"
  };
}

// Toilet scoring (simulated)
export function simulateToilet(photo){
  const seed = stableFromFile(photo);
  const score = seed < 0.1 ? 2 : (seed < 0.3 ? 3 : (seed < 0.85 ? 4 : 5));
  const issues = [];
  if (score <= 2) issues.push("Possible dehydration/constipation");
  if (score === 3) issues.push("Mild irregularity");
  const advice = score <= 2
    ? "Increase water, consider wet food; observe 24–48h; see vet if persists."
    : (score === 3 ? "Ensure fiber and hydration; observe next 24–48h."
                   : "Looks healthy. Keep routine.");
  return { score, issues, advice };
}

// Feeding estimate
export function calcDaily(species, weightKg, activity){
  if (!species || !weightKg){ return { kcal: null, grams: null }; }
  const RER = 70 * Math.pow(Number(weightKg), 0.75);
  let factor = species === "Dog" ? 1.5 : 1.4;
  if (activity === "Low") factor -= 0.2;
  if (activity === "High") factor += 0.3;
  const kcal = Math.round(RER * factor);
  const grams = Math.round(kcal / 3.6); // ~3.6kcal/g dry food
  return { kcal, grams };
}

// Hydration target (ml/day)
export function waterTargetMl(species, weightKg){
  if(!weightKg) return null;
  const w = Number(weightKg);
  if (species === "Cat") return Math.round(w * 50); // mid of 40-60
  if (species === "Dog") return Math.round(w * 55); // mid of 50-60
  return Math.round(w * 50);
}

// Meals per day
export function mealsPerDay(species, ageYears){
  if (ageYears === "" || ageYears == null) return 2;
  const a = Number(ageYears);
  if (a < 1) return 3;
  return 2;
}
