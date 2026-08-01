const VALUE_ITEMS = [
  {
    icon: "verified",
    title: "Authentic Luxury",
    subtitle: "100% Original Products",
  },
  {
    icon: "local_shipping",
    title: "Complimentary Shipping",
    subtitle: "On orders above ₹4999",
  },
  {
    icon: "published_with_changes",
    title: "Easy 14-Day Returns",
    subtitle: "Hassle-free returns",
  },
  {
    icon: "shield_lock",
    title: "Secure Payments",
    subtitle: "100% Protected",
  },
  {
    icon: "card_giftcard",
    title: "Luxury Packaging",
    subtitle: "Premium unboxing",
  },
];

export default function ValueBadges() {
  return (
    <section className="bg-[#F9F9F8] py-8 border-b border-stone-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 text-center md:text-left">
          {VALUE_ITEMS.map((item) => (
            <div key={item.title} className="flex items-center gap-3 justify-center md:justify-start">
              <span className="material-symbols-outlined text-2xl text-stone-700 shrink-0">
                {item.icon}
              </span>
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-[0.08em] text-stone-900 leading-tight">
                  {item.title}
                </h4>
                <p className="mt-0.5 text-[10px] text-stone-500">
                  {item.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
