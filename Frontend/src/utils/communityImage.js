export const getCommunityImage = (community) => {
  if (community?.communityImage && !community.communityImage.includes('unsplash.com')) {
    return community.communityImage;
  }
  
  const cat = (community?.category || "").toLowerCase();
  const name = (community?.name || "").toLowerCase();
  
  if (name.includes('western')) return "/assets/communityPage/westernwear.png";
  if (name.includes('street')) return "/assets/communityPage/streetwear.png";
  if (name.includes('formal')) return "/assets/communityPage/formal.png";
  if (name.includes('indian') || cat === 'culture') return "/assets/communityPage/classicalIndian.png";
  if (cat === 'art & design' || name.includes('minimal')) return "/assets/communityPage/minimalist.png";
  if (cat === 'collectibles' || name.includes('vintage')) return "/assets/communityPage/vintage.png";
  if (cat === 'fashion') return "/assets/communityPage/streetwear.png";
  
  return "/assets/communityPage/streetwear.png";
};
