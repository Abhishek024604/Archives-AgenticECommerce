import { Link } from "react-router-dom";

const COMMUNITIES = [
  {
    title: "Entrepreneur Mindset",
    members: "12.4K Members",
    image: "https://images.unsplash.com/photo-1556761175-5973dc0f32d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    avatars: [
      "https://randomuser.me/api/portraits/men/32.jpg",
      "https://randomuser.me/api/portraits/women/44.jpg",
      "https://randomuser.me/api/portraits/men/68.jpg",
    ]
  },
  {
    title: "Sustainable Living",
    members: "8.7K Members",
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    avatars: [
      "https://randomuser.me/api/portraits/women/65.jpg",
      "https://randomuser.me/api/portraits/men/11.jpg",
      "https://randomuser.me/api/portraits/women/12.jpg",
    ]
  },
  {
    title: "Streetwear Culture",
    members: "18.1K Members",
    image: "https://images.unsplash.com/photo-1523398002811-999aa8095e1e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    avatars: [
      "https://randomuser.me/api/portraits/men/22.jpg",
      "https://randomuser.me/api/portraits/women/33.jpg",
      "https://randomuser.me/api/portraits/men/44.jpg",
    ]
  },
  {
    title: "Design & Creativity",
    members: "15.3K Members",
    image: "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    avatars: [
      "https://randomuser.me/api/portraits/women/21.jpg",
      "https://randomuser.me/api/portraits/men/25.jpg",
      "https://randomuser.me/api/portraits/women/28.jpg",
    ]
  }
];

export default function PlatformCommunitiesSection() {
  return (
    <section className="bg-stone-50 py-24">
      <div className="mx-auto max-w-[1536px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col xl:flex-row gap-12 items-start justify-between">
          
          {/* Left Text */}
          <div className="w-full xl:w-64 shrink-0 mt-8">
            <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-stone-500 mb-4">
              Stronger Together
            </p>
            <h2 className="font-headline text-4xl lg:text-5xl text-stone-950 mb-6">
              Communities
            </h2>
            <p className="text-xs text-stone-500 font-light mb-8 max-w-xs leading-relaxed">
              Join interest-based communities, share knowledge and collaborate with like-minded members.
            </p>
            <Link
              to="/communities"
              className="inline-flex bg-stone-950 text-white px-6 py-3 text-[11px] font-bold uppercase tracking-widest transition-transform hover:bg-stone-800"
            >
              Discover Communities
            </Link>
          </div>

          {/* Right Cards */}
          <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-5">
            {COMMUNITIES.map((community, idx) => (
              <div 
                key={idx} 
                className="group relative h-[380px] xl:h-[450px] w-full overflow-hidden rounded-md cursor-pointer"
              >
                {/* Background Image */}
                <div className="absolute inset-0 z-0 bg-stone-800">
                  <img
                    src={community.image}
                    alt={community.title}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-70 group-hover:opacity-60"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-stone-950/90"></div>
                </div>

                {/* Content */}
                <div className="absolute inset-0 z-10 flex flex-col justify-end p-5">
                  <h3 className="font-headline text-xl text-white mb-1 drop-shadow-md">
                    {community.title}
                  </h3>
                  <p className="text-[10px] font-medium text-stone-300 mb-4 tracking-wider uppercase drop-shadow-md">
                    {community.members}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    {/* Avatars */}
                    <div className="flex -space-x-2">
                      {community.avatars.map((avatar, i) => (
                        <img 
                          key={i} 
                          src={avatar} 
                          alt="Member" 
                          className="h-7 w-7 rounded-full border border-stone-800 object-cover"
                        />
                      ))}
                    </div>
                    
                    {/* Action Button */}
                    <button className="h-8 w-8 rounded-full bg-white text-stone-950 flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg">
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Slider dots indicator for design consistency */}
        <div className="mt-12 flex items-center justify-center gap-3">
          <button className="h-1.5 w-6 bg-stone-950 rounded-full transition-all" aria-label="Slide 1"></button>
          <button className="h-1.5 w-1.5 border border-stone-400 rounded-full transition-all hover:bg-stone-950" aria-label="Slide 2"></button>
          <button className="h-1.5 w-1.5 border border-stone-400 rounded-full transition-all hover:bg-stone-950" aria-label="Slide 3"></button>
          <button className="h-1.5 w-1.5 border border-stone-400 rounded-full transition-all hover:bg-stone-950" aria-label="Slide 4"></button>
        </div>
      </div>
    </section>
  );
}
