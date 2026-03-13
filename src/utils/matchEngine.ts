export const calculateMatchScore = (userSkills: string[], jobDescription: string, jobTitle: string = ''): number => {
  if (!userSkills || userSkills.length === 0) return 0;

  // Normalize inputs
  const normalize = (text: string) => text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const normalizedDesc = normalize(jobDescription);
  const normalizedTitle = normalize(jobTitle);
  
  let score = 0;
  let maxPossibleScore = 0;

  userSkills.forEach(skill => {
    const normalizedSkill = normalize(skill).trim();
    if (!normalizedSkill) return;

    // Weighting: 
    // Title match = 3 points
    // Description match = 1 point
    const titleWeight = 3;
    const descWeight = 1;

    maxPossibleScore += titleWeight; // Assuming they could match the title

    const inTitle = normalizedTitle.includes(normalizedSkill);
    const inDesc = normalizedDesc.includes(normalizedSkill);

    if (inTitle) {
      score += titleWeight;
    } else if (inDesc) {
      score += descWeight;
    }
  });

  // If no skills to match or score is 0
  if (maxPossibleScore === 0 || score === 0) return 0;

  // Calculate percentage, maxing out at 100%
  // Give a boost if it matched description but not title
  // Instead of penalizing heavily for not being in title, let's make it a fairer score
  // E.g. 5 skills in desc = 5 points out of 15 max = 33%. Let's scale it better.
  const adjustedPercentage = Math.min(100, (score / (userSkills.length * 1.5)) * 100);

  return Math.round(adjustedPercentage);
};
