export const getJournalImage = (article) => {
  if (article?.coverImage && !article.coverImage.includes('unsplash.com')) {
    return article.coverImage;
  }
  
  const theme = (article?.theme || "").toLowerCase();
  
  if (theme.includes('sustainab')) return "/assets/journalPage/sustainable.png";
  if (theme.includes('craft') || theme.includes('design')) return "/assets/journalPage/artCraft.png";
  if (theme.includes('horology') || theme.includes('watch')) return "/assets/journalPage/horology.png";
  if (theme.includes('luxury')) return "/assets/communityPage/minimalist.png";
  if (theme.includes('fragrance')) return "/assets/clean_hero3.png";
  if (theme.includes('culture')) return "/assets/communityPage/classicalIndian.png";
  
  return "/assets/clean_hero1.png";
};

export const getThemeImage = (themeName) => {
  const theme = (themeName || "").toLowerCase();
  
  if (theme.includes('sustainab')) return "/assets/journalPage/sustainable.png";
  if (theme.includes('craft') || theme.includes('design')) return "/assets/journalPage/artCraft.png";
  if (theme.includes('horology') || theme.includes('watch')) return "/assets/journalPage/horology.png";
  if (theme.includes('luxury')) return "/assets/communityPage/minimalist.png";
  if (theme.includes('fragrance')) return "/assets/clean_hero3.png";
  if (theme.includes('culture')) return "/assets/communityPage/classicalIndian.png";
  
  return "/assets/clean_hero2.png";
};
