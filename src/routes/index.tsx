import { createFileRoute } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  ArrowUp,
  BedDouble,
  BookOpen,
  Check,
  ChevronDown,
  Droplets,
  ExternalLink,
  Facebook,
  Instagram,
  Mail,
  Menu,
  MapPin,
  AlertTriangle,
  Phone,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
  WashingMachine,
  Wifi,
  X,
  Zap,
} from "lucide-react";
import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import aboutBuilding from "@/assets/about-building.png";
import siteLogo from "@/assets/logo-mark.png";
import { supabase } from "@/integrations/supabase/client";
import {
  GALLERY_IMAGE_BUCKET,
  buildGalleryImages,
  getDefaultGalleryImages,
  type GalleryAsset,
} from "@/lib/gallery-config";
import {
  buildRoomCards,
  getDefaultRoomCards,
  ROOM_IMAGE_BUCKET,
  type RoomCard,
} from "@/lib/room-config";
import {
  buildHeroMedia,
  filterHomepageGalleryRows,
  getDefaultHeroMedia,
  pickHeroMediaRow,
  SITE_MEDIA_BUCKET,
  type SiteMediaAsset,
} from "@/lib/site-media-config";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Safe & Comfortable PG Near MIT ADT Pune | Elite Stay PG" },
      {
        name: "description",
        content:
          "Affordable single, twin & triple sharing rooms for students and professionals near MIT Pune with high-speed Wi-Fi, daily cleaning, CCTV security, and power backup.",
      },
      { property: "og:title", content: "Safe & Comfortable PG Near MIT ADT Pune | Elite Stay PG" },
      {
        property: "og:description",
        content:
          "Student-friendly accommodation near MIT Pune with fully furnished rooms, modern amenities, and a peaceful environment for focused living.",
      },
    ],
  }),
  component: Landing,
});

const CONTACT_ADDRESS = "Chintamani Park, Vishay Company Road, Kadamwak Wasti, Maharashtra 412201";
const CONTACT_EMAIL = "elitestay.loni@gmail.com";
const CONTACT_PHONE_DISPLAY = "09553961076";
const CONTACT_PHONE_RAW = "919553961076";
const MAINTENANCE_BANNER_HEIGHT = 48;
const NAV_HEIGHT = 80;
const SITE_HEADER_HEIGHT = MAINTENANCE_BANNER_HEIGHT + NAV_HEIGHT;
const MAP_LAT = "18.4920676";
const MAP_LNG = "74.0211766";
const GOOGLE_REVIEWS_URL =
  "https://www.google.com/maps/place/ELITE+STAY+PG+SERVICES/@18.4920676,74.0211766,17z/data=!4m8!3m7!1s0x3bc2e9001568664b:0xa73c4876566f41fb!8m2!3d18.4920676!4d74.0211766!9m1!1b1!16s%2Fg%2F11xmftx783!18m1!1e1?entry=ttu&g_ep=EgoyMDI2MDUxMS4wIKXMDSoASAFQAw%3D%3D";
const WHATSAPP = `https://wa.me/${CONTACT_PHONE_RAW}?text=${encodeURIComponent(
  "Hi Elite Stay, I'd like to enquire about a room.",
)}`;
const MAP_EMBED =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3596.594348694596!2d74.02117659999999!3d18.4920676!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc2e9001568664b%3A0xa73c4876566f41fb!2sELITE%20STAY%20PG%20SERVICES!5e1!3m2!1sen!2sin!4v1778690642439!5m2!1sen!2sin";
const MAPS_DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${MAP_LAT},${MAP_LNG}`;

const ABOUT_POINTS = [
  "Near MIT ADT Pune and just 5 mins from MIT.",
  "Safe, clean, and fully maintained accommodation for students and professionals.",
  "Affordable single, twin & triple sharing rooms for students and professionals.",
  "Modern amenities, security, and a peaceful atmosphere for focused living.",
];

const FACILITY_ITEMS = [
  {
    icon: Wifi,
    label: "High-Speed Wi-Fi",
    detail: "Reliable internet for study, work, and everyday connectivity.",
    note: "Always connected",
  },
  {
    icon: Sparkles,
    label: "Daily Cleaning",
    detail: "Regular cleaning keeps rooms and common spaces fresh and hygienic.",
    note: "Clean daily",
  },
  {
    icon: ShieldCheck,
    label: "CCTV Security",
    detail: "Round-the-clock security helps maintain a safe living environment.",
    note: "Secure stay",
  },
  {
    icon: Droplets,
    label: "24/7 Water Supply",
    detail: "Reliable water availability supports a smooth and comfortable routine.",
    note: "Everyday comfort",
  },
  {
    icon: Zap,
    label: "Power Backup",
    detail: "Power backup keeps essentials running during unexpected outages.",
    note: "No interruptions",
  },
  {
    icon: BookOpen,
    label: "Study-Friendly Environment",
    detail: "A calm atmosphere designed for focused study and productive living.",
    note: "Focused living",
  },
  {
    icon: BedDouble,
    label: "Fully Furnished Rooms",
    detail: "Move-in ready rooms designed for comfortable student and professional life.",
    note: "Ready to move",
  },
  {
    icon: Droplets,
    label: "RO Drinking Water",
    detail: "Clean drinking water is available for convenient daily use.",
    note: "Safe water",
  },
  {
    icon: WashingMachine,
    label: "Laundry Support",
    detail: "Easy laundry support helps residents manage everyday upkeep.",
    note: "Simple laundry",
  },
  {
    icon: MapPin,
    label: "Parking Facility",
    detail: "Convenient parking access adds extra comfort for residents and visitors.",
    note: "Easy access",
  },
] as const;

const FOOD_ITEMS = [
  {
    icon: Sparkles,
    title: "Freshly Prepared Meals",
    text: "Wholesome meals are prepared daily to support healthy student living.",
  },
  {
    icon: ShieldCheck,
    title: "Hygienic Food Standards",
    text: "Clean cooking and serving practices help ensure safe and reliable meals.",
  },
  {
    icon: Droplets,
    title: "RO Water with Meals",
    text: "Clean drinking water is available throughout the day for every resident.",
  },
] as const;

const WHY_CHOOSE_ITEMS = [
  {
    icon: ShieldCheck,
    title: "Safe & Secure",
    text: "CCTV monitoring and strict safety rules for a secure living environment.",
  },
  {
    icon: Sparkles,
    title: "Clean & Hygienic",
    text: "Regular cleaning and well-maintained rooms for comfortable living.",
  },
  {
    icon: MapPin,
    title: "Prime Location",
    text: "Conveniently located near MIT Pune with easy access to transport and essentials.",
  },
  {
    icon: BookOpen,
    title: "Peaceful Environment",
    text: "A calm and focused atmosphere designed for students and professionals.",
  },
];

const TESTIMONIALS = [
  {
    reviewer: "AlmightY GamerZ",
    meta: "1 review",
    date: "2 months ago",
    text:
      "Management is very good. You will feel like family here, though you may face mosquitoes in summer, just like any hostel season-wise in Chintamani Park. For service:\n- 24/7 kitchen available\n- Daily basis cleaning\n- 24/7 electricity\n- 24/7 water availability\n- Fridge available\n- Gym available\n- 24/7 CCTV footage\nYou will not usually get a gym and fridge at this price in Chintamani Park. If these things are in your preferences, consider visiting once for a personal experience.",
  },
  {
    reviewer: "Devansh Tripathi",
    meta: "1 review",
    date: "2 months ago",
    text:
      "I genuinely like the place, with all possible facilities. Also, the distance between my college and this PG is much less compared to other residencies. The best thing about this place is that the price is very affordable and negotiable based on your needs.",
  },
  {
    reviewer: "Topaz",
    meta: "1 review",
    date: "2 months ago",
    text:
      "Wifi works, it is really close to all necessities and college, hot and cold water are provided, and the rooms are nice and spacious. Overall, a good hostel.",
  },
  {
    reviewer: "Prince Panchal",
    meta: "2 reviews / 2 photos",
    date: "2 months ago",
    text:
      "I had a great experience in this PG. It gives you every facility like a washing machine, Wi-Fi, and more. The biggest advantage is that it is near the university.",
  },
  {
    reviewer: "RUSHIKESH BHOYAR",
    meta: "1 review",
    date: "2 months ago",
    text:
      "It is the best PG, with air-conditioned rooms and many other facilities. It also provides a gym.",
  },
  {
    reviewer: "Prachi Bhoyar",
    meta: "1 review",
    date: "2 months ago",
    text:
      "Elite PG is the best PG in Chintamani Park because it has many facilities compared to other PGs, including a gym.",
  },
  {
    reviewer: "Gaurav Khandelwal",
    meta: "2 reviews",
    date: "4 months ago",
    text: "The services are pretty good, but the location is bad because it is near a cement factory.",
  },
  {
    reviewer: "Dark Evil",
    meta: "1 review",
    date: "2 months ago",
    text: "It feels like home and the owner is a very humble person.",
  },
  {
    reviewer: "YASH LOYA",
    meta: "2 reviews",
    date: "2 months ago",
    text: "Staying here for the last 8 months, I have faced no issues.",
  },
  {
    reviewer: "Krushna Bhujbal",
    meta: "1 review",
    date: "4 months ago",
    text: "Nice PG.",
  },
  {
    reviewer: "Yash Kaushik",
    meta: "1 review",
    date: "2 months ago",
    text:
      "Good PG and better than most nearby options. The owner is nice and everything is well managed. I have not faced any issues here.",
  },
  {
    reviewer: "mokshi reddy",
    meta: "",
    date: "a week ago",
    text: "",
  },
  {
    reviewer: "Harsh Sharma",
    meta: "2 reviews",
    date: "2 months ago",
    text: "",
  },
  {
    reviewer: "Mohsin Raza",
    meta: "",
    date: "3 months ago",
    text: "",
  },
  {
    reviewer: "Om Kalaskar",
    meta: "1 photo",
    date: "4 months ago",
    text: "",
  },
  {
    reviewer: "Prasad Zarad",
    meta: "2 reviews / 13 photos",
    date: "8 months ago",
    text: "",
  },
  {
    reviewer: "Ankeshwar Yadav",
    meta: "2 reviews / 1 photo",
    date: "9 months ago",
    text: "",
  },
  {
    reviewer: "sai krupa elite pg",
    meta: "",
    date: "10 months ago",
    text: "",
  },
  {
    reviewer: "Avinash Reddy",
    meta: "Local Guide / 2 reviews / 7 photos",
    date: "10 months ago",
    text: "",
  },
] as const;

const PARENT_TRUST_ITEMS = [
  {
    icon: ShieldCheck,
    title: "Safety-First Environment",
    text: "CCTV monitoring and clear rules help maintain secure student accommodation.",
  },
  {
    icon: Sparkles,
    title: "Clean & Managed Property",
    text: "Regular housekeeping and active management keep daily living comfortable.",
  },
  {
    icon: Phone,
    title: "Responsive Support",
    text: "Parents and residents can connect quickly with the team whenever needed.",
  },
] as const;

function getTestimonialsPerView(viewportWidth: number) {
  if (viewportWidth >= 1024) {
    return 3;
  }

  if (viewportWidth >= 768) {
    return 2;
  }

  return 1;
}

function chunkTestimonials<T>(items: readonly T[], size: number) {
  const pages: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    pages.push([...items.slice(index, index + size)]);
  }

  return pages;
}

const PRIMARY_NAV_LINKS = [
  { label: "About", href: "#about" },
  { label: "Rooms", href: "#rooms" },
  { label: "Facilities", href: "#facilities" },
  { label: "Food", href: "#food" },
  { label: "Gallery", href: "#gallery" },
  { label: "Location", href: "#location" },
  { label: "Contact", href: "#contact" },
] as const;

const RULES = [
  {
    question: "ID Proof Mandatory",
    answer:
      "Government-issued ID proof and address proof must be submitted during admission for all residents.",
  },
  {
    question: "No Outsiders Allowed",
    answer:
      "Unauthorized guests or outsiders are not allowed inside rooms or for overnight stays without prior permission. Delivery services are not allowed upstairs.",
  },
  {
    question: "Security Deposit",
    answer:
      "A refundable Rs 10,000 security deposit must be paid during registration. It is returned after proper room handover and damage inspection.",
  },
  {
    question: "Refund Policy",
    answer:
      "PG or hostel fees must be paid in advance and are non-refundable if a resident leaves before the agreed stay period.",
  },
  {
    question: "Zero Tolerance for Ragging",
    answer:
      "Ragging or any form of harassment is strictly prohibited inside the premises, and strict disciplinary action will be taken against offenders.",
  },
  {
    question: "CCTV Monitoring",
    answer:
      "The property is under CCTV surveillance for the safety and security of all residents, and everyone is expected to maintain cleanliness and responsible behavior.",
  },
  {
    question: "Smoking and Alcohol",
    answer:
      "Smoking, alcohol consumption, and illegal activity inside the premises are strictly prohibited and may lead to parent notification, eviction, and loss of refund eligibility.",
  },
];

type RoomCategoryImageRow = {
  slug: string;
  image_path: string | null;
  image_paths?: string[] | null;
};

function isMissingImagePathsColumnError(message: string) {
  const normalized = message.toLowerCase();

  return normalized.includes("image_paths") && (normalized.includes("schema cache") || normalized.includes("column"));
}

async function loadRoomCategoryRows() {
  const roomResponse = await supabase.from("room_categories").select("slug, image_path, image_paths");

  if (!roomResponse.error) {
    return (roomResponse.data ?? []) as RoomCategoryImageRow[];
  }

  if (!isMissingImagePathsColumnError(roomResponse.error.message)) {
    return null;
  }

  const legacyRoomResponse = await supabase.from("room_categories").select("slug, image_path");

  if (legacyRoomResponse.error) {
    return null;
  }

  return (legacyRoomResponse.data ?? []).map((row) => ({
    ...row,
    image_paths: row.image_path ? [row.image_path] : [],
  }));
}

function Landing() {
  const [heroMedia, setHeroMedia] = useState<SiteMediaAsset>(() => getDefaultHeroMedia());
  const [rooms, setRooms] = useState<RoomCard[]>(() => getDefaultRoomCards());
  const [galleryImages, setGalleryImages] = useState<GalleryAsset[]>(() => getDefaultGalleryImages());

  useEffect(() => {
    let active = true;

    const loadHomepageContent = async () => {
      const [roomRows, galleryResponse] = await Promise.all([
        loadRoomCategoryRows(),
        supabase
          .from("gallery_images")
          .select("id, image_path, alt_text, created_at")
          .order("created_at", { ascending: true }),
      ]);

      if (!active) {
        return;
      }

      if (roomRows) {
        setRooms(
          buildRoomCards(roomRows, (imagePath) =>
            supabase.storage.from(ROOM_IMAGE_BUCKET).getPublicUrl(imagePath).data.publicUrl,
          ),
        );
      }

      if (!galleryResponse.error) {
        const publicUrlForGallery = (imagePath: string) =>
          supabase.storage.from(GALLERY_IMAGE_BUCKET).getPublicUrl(imagePath).data.publicUrl;

        setGalleryImages([
          ...getDefaultGalleryImages(),
          ...buildGalleryImages(filterHomepageGalleryRows(galleryResponse.data), publicUrlForGallery),
        ]);
        setHeroMedia(
          buildHeroMedia(
            pickHeroMediaRow(galleryResponse.data),
            (imagePath) => supabase.storage.from(SITE_MEDIA_BUCKET).getPublicUrl(imagePath).data.publicUrl,
          ),
        );
      }
    };

    void loadHomepageContent();

    return () => {
      active = false;
    };
  }, []);

  const roomGalleryImages = rooms.map((room) => ({
    id: `room-${room.slug}`,
    src: room.img,
    alt: `${room.name} room at Elite Stay`,
    imagePath: room.imagePath,
    isDefault: !room.imagePath,
  }));
  const allGalleryImages = dedupeGalleryImages([
    ...galleryImages,
    ...roomGalleryImages,
    {
      id: `hero-image-${heroMedia.imagePath ?? "default"}`,
      src: heroMedia.src,
      alt: heroMedia.alt,
      imagePath: heroMedia.imagePath,
      isDefault: heroMedia.isDefault,
    },
  ]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <MaintenanceBanner />
      <Nav />
      <Hero heroImage={heroMedia} />
      <Stats />
      <About images={allGalleryImages} />
      <Rooms rooms={rooms} />
      <Facilities />
      <Food />
      <Gallery images={allGalleryImages} />
      <WhyChooseUs />
      <ParentTrust />
      <Location />
      <Testimonials />
      <Rules />
      <Contact roomOptions={rooms.map((room) => room.name)} />
      <Footer />
      <FloatingActions />
    </div>
  );
}

function dedupeGalleryImages(images: GalleryAsset[]) {
  const seen = new Set<string>();

  return images.filter((image) => {
    if (seen.has(image.src)) {
      return false;
    }

    seen.add(image.src);
    return true;
  });
}

function BrandLogo({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <img
      src={siteLogo}
      alt="Elite Stay"
      className={`${className} object-contain`}
      width={312}
      height={312}
      loading="eager"
    />
  );
}

function WhatsAppIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden="true">
      <path d="M13.601 2.326A7.854 7.854 0 0 0 1.93 12.56L0 16l3.692-.97a7.854 7.854 0 0 0 3.909 1.042h.003A7.855 7.855 0 0 0 13.6 2.326Zm-5.997 12.07a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.194.576.587-2.14-.156-.225a6.556 6.556 0 0 1-1.007-3.505 6.557 6.557 0 0 1 11.2-4.634 6.556 6.556 0 0 1-4.636 11.19Z" />
      <path d="M11.012 9.848c-.184-.092-1.087-.536-1.255-.597-.168-.061-.29-.092-.411.092-.121.184-.468.597-.574.719-.105.123-.21.138-.395.046-.184-.092-.778-.286-1.482-.912-.547-.486-.916-1.087-1.023-1.271-.106-.184-.011-.284.08-.375.082-.081.184-.21.276-.314.092-.105.123-.184.184-.307.061-.123.03-.23-.015-.322-.046-.092-.411-.99-.564-1.355-.149-.358-.3-.31-.411-.315-.105-.005-.23-.007-.352-.007a.678.678 0 0 0-.49.23c-.168.184-.643.628-.643 1.53 0 .902.659 1.774.75 1.896.092.123 1.298 2.104 3.229 2.89.464.2.826.32 1.109.41.465.149.889.128 1.224.078.373-.056 1.087-.444 1.24-.873.153-.429.153-.797.107-.873-.046-.077-.168-.123-.352-.215Z" />
    </svg>
  );
}

function MaintenanceBanner() {
  return (
    <div className="fixed inset-x-0 top-0 z-[60] border-b border-[#c9d8e5] bg-[linear-gradient(90deg,#f5f8fc_0%,#eef5fb_100%)] text-[#16304f] shadow-[0_12px_32px_-24px_rgba(16,32,51,0.35)]">
      <div className="mx-auto flex h-12 max-w-7xl items-center justify-between gap-3 px-4 sm:px-5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#1E3A5F]/10 text-[#1E3A5F]">
            <AlertTriangle className="h-4 w-4" />
          </span>
          <p className="text-[11px] font-medium leading-tight text-[#16304f] sm:text-sm">
            <span className="hidden sm:inline">
              Site is under maintenance, still you can reach through WhatsApp
            </span>
            <span className="sm:hidden">Maintenance mode. WhatsApp open.</span>
          </p>
        </div>
        <a
          href={WHATSAPP}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#25D366] px-3 py-1.5 text-[11px] font-semibold text-white transition hover:scale-[1.02] hover:bg-[#1fb85a]"
        >
          <WhatsAppIcon className="h-3.5 w-3.5" />
          WhatsApp
        </a>
      </div>
    </div>
  );
}

function Nav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    const onResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    };
  }, [mobileMenuOpen]);

  return (
    <header
      className="fixed left-0 right-0 z-50 border-b border-white/10 bg-[#1E3A5F]/96 shadow-sm backdrop-blur"
      style={{ top: MAINTENANCE_BANNER_HEIGHT }}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-3 px-5">
        <a
          href="#home"
          onClick={() => setMobileMenuOpen(false)}
          className="flex shrink-0 items-center gap-3"
        >
          <BrandLogo className="h-11 w-11 rounded-2xl shadow-[var(--shadow-soft)] sm:h-12 sm:w-12" />
          <span className="font-display text-xl font-semibold tracking-[0.04em] text-white sm:text-2xl">
            Elite Stay
          </span>
        </a>

        <div className="flex items-center gap-2 md:hidden">
          <a
            href={WHATSAPP}
            target="_blank"
            rel="noreferrer"
            aria-label="Chat on WhatsApp"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[var(--shadow-soft)] transition hover:scale-[1.03] hover:bg-[#1fb85a]"
          >
            <WhatsAppIcon className="h-[18px] w-[18px]" />
          </a>
          <button
            type="button"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-menu"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/14 bg-white/8 text-white transition hover:bg-white/14"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <nav aria-label="Primary navigation" className="hidden flex-1 justify-center md:flex">
          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/6 p-1">
            {PRIMARY_NAV_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-full px-3 py-2 text-xs font-medium text-white/84 transition hover:bg-white/10 hover:text-white lg:px-4 lg:text-sm"
              >
                {item.label}
              </a>
            ))}
          </div>
        </nav>

        <div className="hidden shrink-0 items-center gap-3 md:flex">
          <a
            href={WHATSAPP}
            target="_blank"
            rel="noreferrer"
            className="hidden h-11 items-center gap-1.5 rounded-full bg-[#25D366] px-4 py-2.5 text-xs font-semibold text-white transition hover:scale-[1.02] hover:bg-[#1fb85a] lg:inline-flex xl:px-5 xl:text-sm"
          >
            <WhatsAppIcon className="h-4 w-4" /> WhatsApp
          </a>
          <a
            href="#contact-form"
            className="group inline-flex h-11 items-center gap-1.5 rounded-full bg-white px-4 text-xs font-semibold text-[#1E3A5F] transition hover:scale-[1.02] lg:px-5 lg:text-sm"
          >
            Book Now
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </a>
        </div>
      </div>

      {mobileMenuOpen ? (
        <>
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-x-0 bottom-0 bg-[#0f2238]/52 backdrop-blur-[2px] md:hidden"
            style={{ top: SITE_HEADER_HEIGHT }}
          />
          <motion.div
            id="mobile-nav-menu"
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
            className="absolute inset-x-4 top-[calc(100%-0.35rem)] rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,#18385b_0%,#122b46_100%)] p-4 shadow-[0_24px_70px_rgba(7,15,27,0.4)] md:hidden"
          >
            <div className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/58">
              Explore Elite Stay
            </div>
            <div className="grid grid-cols-2 gap-2">
              {PRIMARY_NAV_LINKS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-[1.15rem] border border-white/8 bg-white/6 px-4 py-3 text-sm font-medium text-white/88 transition hover:bg-white/12"
                >
                  {item.label}
                </a>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
              <a
                href="#contact-form"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex items-center justify-center gap-2 rounded-[1.2rem] bg-white px-4 py-3 text-sm font-semibold text-[#1E3A5F] transition hover:scale-[1.01]"
              >
                Book Now
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href={WHATSAPP}
                target="_blank"
                rel="noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex items-center justify-center gap-2 rounded-[1.2rem] bg-[#25D366] px-4 py-3 text-sm font-semibold text-white transition hover:scale-[1.01] hover:bg-[#1fb85a]"
              >
                <WhatsAppIcon className="h-4 w-4" />
                WhatsApp
              </a>
            </div>
          </motion.div>
        </>
      ) : null}
    </header>
  );
}

function Hero({ heroImage }: { heroImage: SiteMediaAsset }) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, 120]);

  return (
    <section id="home" className="relative min-h-[100svh] w-full scroll-mt-32 overflow-hidden">
      <motion.div style={{ y }} className="absolute inset-0">
        <img
          src={heroImage.src}
          alt={heroImage.alt}
          className="h-full w-full object-cover"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#102033]/72 via-[#102033]/56 to-[#102033]/80" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-[radial-gradient(140%_120%_at_50%_100%,rgba(186,212,245,0.4)_0%,rgba(186,212,245,0)_62%),linear-gradient(0deg,rgba(240,246,255,0.92)_0%,rgba(240,246,255,0)_88%)]" />
      </motion.div>

      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-center px-5 pb-24 pt-44">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="glass-dark inline-flex rounded-full px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-white/90">
            <span className="mr-2 h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            Near MIT ADT Pune
          </span>
          <h1 className="mt-6 max-w-4xl font-display text-5xl leading-[1.02] font-bold text-white sm:text-6xl lg:text-7xl">
            Safe & Comfortable PG Near MIT Pune
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white/82">
            Fully furnished single, twin & triple sharing rooms designed for students and working
            professionals.
          </p>
          <p className="mt-5 max-w-2xl text-sm uppercase tracking-[0.2em] text-white/72 sm:text-[0.82rem]">
            High-Speed Wi-Fi • Daily Cleaning • CCTV Security • Power Backup
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm text-white/70">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-3 py-1.5">
              <MapPin className="h-4 w-4" /> Near MIT ADT Pune
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-3 py-1.5">
              <Star className="h-4 w-4" /> 5 mins from MIT
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-3 py-1.5">
              <BookOpen className="h-4 w-4" /> Student-friendly accommodation near MIT Pune
            </span>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#rooms"
              className="group inline-flex items-center gap-2 rounded-2xl bg-accent px-6 py-3.5 font-semibold text-accent-foreground shadow-xl transition hover:scale-[1.03]"
            >
              Explore Rooms
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </a>
            <a
              href={WHATSAPP}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#25D366] px-6 py-3.5 font-semibold text-white shadow-xl transition hover:scale-[1.03] hover:bg-[#1fb85a]"
            >
              <WhatsAppIcon className="h-5 w-5" />
              WhatsApp Enquiry
            </a>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/18 bg-white/8 px-6 py-3.5 font-semibold text-white shadow-xl transition hover:scale-[1.03] hover:bg-white/14"
            >
              <MapPin className="h-4 w-4" />
              Schedule a Visit
            </a>
          </div>
        </motion.div>
      </div>

      <motion.a
        href="#trust-bar"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 z-10 inline-flex -translate-x-1/2 flex-col items-center gap-2 text-xs uppercase tracking-[0.25em] text-white/80"
      >
        Scroll
        <ChevronDown className="h-4 w-4" />
      </motion.a>
    </section>
  );
}

function Stats() {
  const items = [
    {
      icon: MapPin,
      value: "Near MIT ADT Pune",
      label: "Student-friendly accommodation near MIT Pune",
    },
    { icon: Star, value: "5 mins from MIT", label: "Quick campus access for daily convenience" },
    { icon: Wifi, value: "High-Speed Wi-Fi", label: "Reliable internet for study and work" },
    { icon: Sparkles, value: "Daily Cleaning", label: "Clean and fully maintained living spaces" },
    { icon: ShieldCheck, value: "CCTV Security", label: "Safe and secure PG environment" },
    { icon: Zap, value: "Power Backup", label: "Comfortable daily living without interruption" },
    {
      icon: BedDouble,
      value: "Sharing Options",
      label: "Affordable single, twin & triple sharing rooms",
    },
    { icon: BookOpen, value: "Study-Friendly", label: "A peaceful environment for focused living" },
  ];
  const marqueeItems = [...items, ...items];

  return (
    <section id="trust-bar" className="section-bg-soft-blue relative pb-7 pt-8 sm:pb-8 sm:pt-10">
      <div className="mx-auto max-w-7xl px-5 text-center">
        <SectionLabel>TRUST BAR</SectionLabel>
        <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
          Trusted by Students & Parents
        </h2>
      </div>
      <div className="mt-6 px-3 sm:px-5 lg:px-6">
        <div className="section-bg-light-wave relative overflow-hidden rounded-[2.2rem] border border-[#d9e4ee] px-3 py-3 shadow-[0_24px_70px_-42px_rgba(16,32,51,0.38)] sm:px-4 sm:py-4">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top,_rgba(30,58,95,0.08),_transparent_72%)]" />
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-14 bg-gradient-to-r from-[#eef4f9] via-[#eef4f9]/94 to-transparent sm:w-18" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-14 bg-gradient-to-l from-[#eef4f9] via-[#eef4f9]/94 to-transparent sm:w-18" />

          <div className="relative overflow-hidden fade-mask-x">
            <div className="amenity-marquee-track flex items-stretch gap-3 py-1 sm:gap-4">
              {marqueeItems.map((item, index) => (
                <div
                  key={`${item.value}-${index}`}
                  className="group flex w-[230px] shrink-0 items-center gap-3 rounded-[1.6rem] border border-[#d7e2ec] bg-white px-4 py-3.5 shadow-[0_14px_32px_-24px_rgba(16,32,51,0.28)] transition duration-300 hover:-translate-y-1 hover:border-primary/16 hover:shadow-[0_20px_44px_-24px_rgba(16,32,51,0.34)] sm:w-[255px] sm:px-5"
                >
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[1rem] bg-[linear-gradient(180deg,#edf3f8_0%,#e5edf6_100%)] text-primary ring-1 ring-[#d8e2ec] transition duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-display text-[1.08rem] leading-[1.08] font-bold text-foreground sm:text-[1.18rem]">
                      {item.value}
                    </div>
                    <div className="mt-1.5 line-clamp-2 text-[11px] leading-4.5 text-muted-foreground sm:text-xs">
                      {item.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function About({ images }: { images: GalleryAsset[] }) {
  const marqueeImages = [...images, ...images];

  return (
    <section id="about" className="section-bg-dot-light relative scroll-mt-32 pb-8 pt-18 sm:pb-10 sm:pt-20">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-stretch lg:gap-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="min-w-0 max-w-xl rounded-[2rem] border border-border/70 bg-[linear-gradient(180deg,#ffffff_0%,#f5f8fb_100%)] p-6 shadow-[var(--shadow-glow)] sm:p-8 lg:flex lg:h-full lg:max-w-none lg:flex-col lg:gap-7"
        >
          <div>
            <SectionLabel>ABOUT ELITE STAY PG</SectionLabel>
            <h2 className="mt-4 font-display text-4xl leading-tight font-bold sm:text-5xl">
              A Peaceful Place to Stay, Study & Grow
            </h2>
            <p className="mt-5 text-justify text-[1.02rem] leading-8 text-muted-foreground sm:text-[1.05rem]">
              Elite Stay PG offers safe, clean, and fully maintained accommodation near MIT Pune.
              Designed for students and professionals, our rooms provide a comfortable environment
              with modern amenities, security, and a peaceful atmosphere for focused living.
            </p>
            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-primary/75">
              Everything you need for a secure and comfortable stay
            </p>
          </div>
          <ul className="mt-6 space-y-3 lg:mt-0">
            {ABOUT_POINTS.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <span className="mt-1 grid h-5 w-5 place-items-center rounded-md bg-primary/10 text-primary">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span className="text-justify text-[1.02rem] leading-7 text-foreground/90 sm:text-[1.05rem]">
                  {point}
                </span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="min-w-0 overflow-hidden rounded-[2rem] border border-border/80 bg-white/92 p-5 shadow-[var(--shadow-glow)] lg:h-full"
        >
          <div className="flex h-full flex-col rounded-[1.6rem] bg-muted/55 p-5">
            <div className="relative overflow-hidden rounded-[1.5rem] border border-white/80 bg-[linear-gradient(180deg,#95b4e6_0%,#d9e6f5_100%)] shadow-[var(--shadow-soft)]">
              <img
                src={aboutBuilding}
                alt="Elite Stay building exterior"
                className="h-[20rem] w-full object-contain object-center sm:h-[24rem] lg:h-[30rem]"
                loading="lazy"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#102033]/78 via-[#102033]/38 to-transparent px-5 py-5 text-white">
                <div className="inline-flex rounded-full bg-white/14 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/90 backdrop-blur">
                  Building exterior
                </div>
                <div className="mt-3 max-w-md font-display text-2xl font-bold sm:text-[1.75rem]">
                  Student-friendly accommodation near MIT Pune.
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Near MIT ADT Pune", "5 mins from MIT", "Student-friendly living"].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-primary/12 bg-white/80 px-3 py-1 text-xs font-medium text-foreground/80 shadow-sm"
                >
                  {item}
                </span>
              ))}
            </div>
            <div className="mt-4 flex min-h-[11rem] items-center overflow-hidden rounded-[1.4rem] fade-mask-x lg:min-h-[15rem]">
              <div className="marquee-track flex items-center gap-4 py-1">
                {marqueeImages.map((image, index) => (
                  <div
                    key={`${image.id}-${index}`}
                    className="h-32 w-48 shrink-0 overflow-hidden rounded-[1.2rem] bg-white shadow-[var(--shadow-soft)] sm:h-36 sm:w-52 lg:h-40 lg:w-60"
                  >
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function RoomCardCarousel({ room }: { room: RoomCard }) {
  const [api, setApi] = useState<CarouselApi>();
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    if (!api) {
      return;
    }

    const updateActiveSlide = () => {
      setActiveSlide(api.selectedScrollSnap());
    };

    updateActiveSlide();
    api.on("select", updateActiveSlide);
    api.on("reInit", updateActiveSlide);

    return () => {
      api.off("select", updateActiveSlide);
      api.off("reInit", updateActiveSlide);
    };
  }, [api]);

  return (
    <div className="relative h-56 overflow-hidden">
      <Carousel setApi={setApi} opts={{ align: "start", loop: true }} className="h-full">
        <CarouselContent className="ml-0 h-full">
          {room.images.map((image, index) => (
            <CarouselItem key={`${room.slug}-image-${index}`} className="pl-0">
              <img
                src={image}
                alt={`${room.name} room view ${index + 1}`}
                className="h-56 w-full object-cover transition duration-700 group-hover:scale-110"
                loading="lazy"
              />
            </CarouselItem>
          ))}
        </CarouselContent>

        <div className="absolute left-3 top-3 z-10 flex gap-2">
          <span className="rounded-full bg-white/92 px-2.5 py-1 text-[11px] font-medium text-foreground backdrop-blur">
            {room.tag}
          </span>
          <span className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground">
            {room.status}
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-3 z-10 flex items-center justify-between px-3">
          <CarouselPrevious
            variant="secondary"
            className="static h-9 w-9 translate-y-0 border border-white/70 bg-white/90 text-foreground shadow-sm hover:bg-white"
          />
          <div className="flex items-center gap-1.5">
            {room.images.map((_, index) => (
              <span
                key={`${room.slug}-indicator-${index}`}
                className={`h-2 rounded-full transition-all ${
                  index === activeSlide ? "w-6 bg-white" : "w-2 bg-white/55"
                }`}
              />
            ))}
          </div>
          <CarouselNext
            variant="secondary"
            className="static h-9 w-9 translate-y-0 border border-white/70 bg-white/90 text-foreground shadow-sm hover:bg-white"
          />
        </div>
      </Carousel>
    </div>
  );
}

function Rooms({ rooms }: { rooms: RoomCard[] }) {
  return (
    <section
      id="rooms"
      className="section-bg-soft-blue relative scroll-mt-32 pb-14 pt-10 sm:pb-16 sm:pt-12"
    >
      <div className="mx-auto max-w-7xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <SectionLabel>ROOM OPTIONS</SectionLabel>
          <h2 className="mt-3 font-display text-4xl font-bold sm:text-5xl">Choose Your Perfect Stay</h2>
          <p className="mt-4 text-muted-foreground">
            Affordable single, twin & triple sharing rooms for students and professionals.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room, index) => (
            <motion.article
              key={room.slug}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group relative overflow-hidden rounded-3xl surface-card transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[var(--shadow-glow)]"
            >
              <RoomCardCarousel room={room} />
              <div className="p-6">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-display text-xl font-bold">{room.name}</h3>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">starting</div>
                    <div className="font-display text-lg font-bold">
                      {room.price}
                      <span className="text-xs font-normal text-muted-foreground">/mo</span>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{room.description}</p>
                <ul className="mt-4 space-y-2">
                  {room.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-primary" /> {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex gap-2">
                  <a
                    href="#contact-form"
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:scale-[1.02]"
                  >
                    Book Now
                  </a>
                  <a
                    href={`${WHATSAPP}%20(${encodeURIComponent(room.name)})`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Chat on WhatsApp about ${room.name}`}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[var(--shadow-soft)] transition hover:scale-[1.05] hover:bg-[#1fb85a]"
                  >
                    <WhatsAppIcon className="h-[18px] w-[18px]" />
                  </a>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Facilities() {
  return (
    <section
      id="facilities"
      className="section-bg-light-wave relative scroll-mt-32 overflow-hidden pb-10 pt-12 sm:pb-12 sm:pt-14"
    >
      <div className="absolute inset-x-0 top-12 -z-10 mx-auto h-72 max-w-5xl rounded-full bg-[radial-gradient(circle,_rgba(30,58,95,0.12),_transparent_68%)] blur-3xl" />
      <div className="absolute left-0 top-1/3 -z-10 h-56 w-56 rounded-full bg-[radial-gradient(circle,_rgba(30,58,95,0.08),_transparent_70%)] blur-3xl" />

      <div className="mx-auto max-w-7xl px-5">
        <div className="relative overflow-hidden rounded-[2rem] border border-border/80 bg-white/92 px-6 py-6 shadow-[var(--shadow-glow)] backdrop-blur-sm sm:px-8 sm:py-7 lg:px-10 lg:py-8">
          <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_top_right,_rgba(30,58,95,0.14),_transparent_65%)] lg:block" />
          <div className="relative max-w-3xl">
            <SectionLabel>FACILITIES</SectionLabel>
            <h2 className="mt-4 font-display text-4xl leading-tight font-bold sm:text-5xl lg:text-6xl">
              Everything You Need for Comfortable Living
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              High-speed Wi-Fi, daily cleaning, CCTV security, 24/7 water supply, power backup,
              and other essentials designed for safe, student-friendly living.
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {FACILITY_ITEMS.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.05 }}
              className="group relative overflow-hidden rounded-[1.7rem] border border-[#d8e2ec] bg-[linear-gradient(160deg,#ffffff_0%,#fbfdff_52%,#eef4f9_100%)] p-5 shadow-[0_18px_38px_-28px_rgba(16,32,51,0.32)] transition-all duration-500 hover:-translate-y-1.5 hover:border-primary/18 hover:shadow-[0_28px_54px_-30px_rgba(16,32,51,0.34)]"
            >
              <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/28 to-transparent" />
              <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[radial-gradient(circle,_rgba(30,58,95,0.12),_transparent_68%)] transition duration-500 group-hover:scale-110" />
              <div className="absolute bottom-0 right-0 h-20 w-20 rounded-tl-[2.5rem] bg-[linear-gradient(135deg,rgba(30,58,95,0.06),rgba(30,58,95,0.01))]" />

              <div className="relative flex min-h-[220px] flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-[1.1rem] bg-primary text-primary-foreground ring-1 ring-primary/20 shadow-[0_10px_24px_-14px_rgba(16,32,51,0.6)] transition duration-300 group-hover:scale-105">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-full border border-primary/8 bg-white/78 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/78 backdrop-blur">
                      Included
                    </span>
                  </div>
                </div>

                <h3 className="mt-4 font-display text-[1.55rem] leading-[1.08] font-bold text-foreground">
                  {item.label}
                </h3>
                <p className="mt-2 line-clamp-3 text-[13.5px] leading-5 text-muted-foreground">
                  {item.detail}
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <span className="inline-flex rounded-full bg-[#edf4fa] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                    {item.note}
                  </span>
                  <span className="h-px flex-1 bg-gradient-to-r from-primary/18 to-transparent" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Food() {
  return (
    <section id="food" className="section-bg-light-gray relative scroll-mt-32 py-18 sm:py-20">
      <div className="mx-auto max-w-7xl px-5">
        <div className="mx-auto max-w-3xl text-center">
          <SectionLabel>FOOD</SectionLabel>
          <h2 className="mt-3 font-display text-4xl font-bold sm:text-5xl">
            Healthy & Hygienic Food Served Daily
          </h2>
          <p className="mt-4 text-muted-foreground">
            Nutritious, clean, and consistent meal support for a comfortable student routine.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {FOOD_ITEMS.map((item, index) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.07 }}
              className="rounded-3xl border border-border/80 bg-white p-6 shadow-[var(--shadow-soft)]"
            >
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-primary-foreground">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-2xl font-bold">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.text}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyChooseUs() {
  return (
    <section id="why-choose-us" className="section-bg-soft-blue relative scroll-mt-32 py-18 sm:py-20">
      <div className="mx-auto max-w-7xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <SectionLabel>WHY ELITE STAY PG</SectionLabel>
          <h2 className="mt-3 font-display text-4xl font-bold sm:text-5xl">Why Students Choose Elite Stay</h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {WHY_CHOOSE_ITEMS.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              className="rounded-[1.8rem] border border-border/80 bg-white p-6 shadow-[var(--shadow-soft)]"
            >
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-2xl font-bold">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ParentTrust() {
  return (
    <section id="parent-trust" className="section-bg-light-wave relative scroll-mt-32 py-18 sm:py-20">
      <div className="mx-auto max-w-7xl px-5">
        <div className="mx-auto max-w-3xl text-center">
          <SectionLabel>PARENT TRUST</SectionLabel>
          <h2 className="mt-3 font-display text-4xl font-bold sm:text-5xl">
            Trusted by Parents for Safe Living
          </h2>
          <p className="mt-4 text-muted-foreground">
            A secure, disciplined, and well-managed environment that gives families confidence.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {PARENT_TRUST_ITEMS.map((item, index) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.07 }}
              className="rounded-3xl border border-border/80 bg-white p-6 shadow-[var(--shadow-soft)]"
            >
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-primary-foreground">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-2xl font-bold">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.text}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Location() {
  return (
    <section id="location" className="section-bg-mint relative scroll-mt-32 py-18 sm:py-20">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-2">
        <div>
          <SectionLabel>LOCATION</SectionLabel>
          <h2 className="mt-3 font-display text-4xl font-bold sm:text-5xl">
            Conveniently Located Near MIT ADTU
          </h2>
          <p className="mt-4 text-muted-foreground">
            Elite Stay PG is close to campus, daily essentials, and local transport for easier
            student life.
          </p>

          <div className="mt-8 space-y-4">
            <ContactRow icon={MapPin} title="Address" detail={CONTACT_ADDRESS} />
            <ContactRow icon={Star} title="Distance" detail="Around 5 minutes from MIT campus" />
            <ContactRow icon={BookOpen} title="Nearby Access" detail="Shops, transport, and daily essentials" />
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={MAPS_DIRECTIONS_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition hover:scale-[1.03]"
            >
              <MapPin className="h-4 w-4" />
              Get Directions
            </a>
            <a
              href={WHATSAPP}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#25D366] px-5 py-3 font-semibold text-white shadow-[var(--shadow-soft)] transition hover:scale-[1.03] hover:bg-[#1fb85a]"
            >
              <WhatsAppIcon className="h-5 w-5" /> WhatsApp Enquiry
            </a>
          </div>
        </div>

        <div id="visit-map" className="scroll-mt-32 overflow-hidden rounded-3xl surface-card">
          <iframe
            title="Elite Stay location map"
            src={MAP_EMBED}
            className="h-[360px] w-full border-0 lg:h-full"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </section>
  );
}

function Gallery({ images }: { images: GalleryAsset[] }) {
  const [open, setOpen] = useState<{ src: string; alt: string } | null>(null);

  return (
    <section id="gallery" className="section-bg-navy relative scroll-mt-32 pb-18 pt-10 sm:pb-20 sm:pt-12">
      <div className="mx-auto max-w-7xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <SectionLabel tone="light">OUR GALLERY</SectionLabel>
          <h2 className="mt-3 font-display text-4xl font-bold text-white sm:text-5xl">Explore Elite Stay PG</h2>
          <p className="mt-4 text-white/78">
            Explore our clean rooms, modern facilities, and comfortable living spaces.
          </p>
        </div>
        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {images.map((image, index) => (
            <motion.button
              key={`${image.id}-${index}`}
              type="button"
              onClick={() => setOpen({ src: image.src, alt: image.alt })}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="group block overflow-hidden rounded-3xl border border-white/14 bg-white/8 p-2 text-left backdrop-blur-sm"
            >
              <div className="aspect-[4/3] overflow-hidden rounded-[1.15rem]">
                <img
                  src={image.src}
                  alt={image.alt}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                  loading="lazy"
                />
              </div>
            </motion.button>
          ))}
        </div>
      </div>
      {open && (
        <div
          onClick={() => setOpen(null)}
          className="fixed inset-0 z-[100] grid cursor-zoom-out place-items-center bg-black/80 p-6 backdrop-blur-md"
        >
          <img
            src={open.src}
            alt={open.alt}
            className="max-h-[90vh] max-w-[92vw] rounded-3xl shadow-2xl"
          />
        </div>
      )}
    </section>
  );
}

function Testimonials() {
  const [api, setApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [snapCount, setSnapCount] = useState(1);
  const [cardsPerView, setCardsPerView] = useState(1);
  const testimonialPages = chunkTestimonials(TESTIMONIALS, cardsPerView);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const updateCardsPerView = () => {
      setCardsPerView((current) => {
        const next = getTestimonialsPerView(window.innerWidth);
        return current === next ? current : next;
      });
    };

    updateCardsPerView();
    window.addEventListener("resize", updateCardsPerView);

    return () => {
      window.removeEventListener("resize", updateCardsPerView);
    };
  }, []);

  useEffect(() => {
    if (!api) {
      return;
    }

    const updateCurrentSlide = () => {
      setCurrentSlide(api.selectedScrollSnap());
      setSnapCount(api.scrollSnapList().length);
    };

    updateCurrentSlide();
    api.on("select", updateCurrentSlide);
    api.on("reInit", updateCurrentSlide);

    return () => {
      api.off("select", updateCurrentSlide);
      api.off("reInit", updateCurrentSlide);
    };
  }, [api]);

  useEffect(() => {
    if (!api) {
      return;
    }

    const intervalId = window.setInterval(() => {
      api.scrollNext();
    }, 4800);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [api]);

  return (
    <section id="reviews" className="section-bg-light-gray relative py-18 sm:py-20">
      <div className="mx-auto max-w-7xl px-5">
        <div className="mx-auto flex max-w-5xl flex-col gap-5 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
          <div className="mx-auto max-w-2xl sm:mx-0">
            <SectionLabel>TESTIMONIALS</SectionLabel>
            <h2 className="mt-3 font-display text-4xl font-bold sm:text-5xl">What Our Residents Say</h2>
            <p className="mt-3 text-muted-foreground">
              Real feedback from students and professionals staying at Elite Stay.
            </p>
          </div>
          <a
            href={GOOGLE_REVIEWS_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 self-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:scale-[1.02] sm:self-auto"
          >
            View All Reviews
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        <div className="relative mt-10 px-2 sm:px-12">
          <Carousel
            key={`testimonial-pages-${cardsPerView}`}
            setApi={setApi}
            opts={{ align: "start", loop: testimonialPages.length > 1 }}
          >
            <CarouselContent>
              {testimonialPages.map((page, pageIndex) => (
                <CarouselItem key={`testimonial-page-${pageIndex}`}>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {page.map((testimonial, cardIndex) => (
                      <motion.div
                        key={`${testimonial.reviewer}-${testimonial.date}-${cardIndex}`}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.5,
                          delay: (pageIndex * cardsPerView + cardIndex) * 0.05,
                        }}
                        className="flex h-full min-h-[24rem] flex-col rounded-[1.8rem] border border-border/80 bg-white p-6 shadow-[var(--shadow-soft)] sm:min-h-[25rem]"
                      >
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
                          <Quote className="h-5 w-5" />
                        </div>
                        <div className="mt-5 flex items-center gap-1 text-[#D4A373]">
                          {Array.from({ length: 5 }).map((_, starIndex) => (
                            <Star key={starIndex} className="h-5 w-5 fill-current" />
                          ))}
                        </div>
                        <p className="testimonial-copy-clamp mt-4 text-sm leading-7 text-muted-foreground">
                          "
                          {testimonial.text || "Shared a 5-star rating on Google."}
                          "
                        </p>
                        <div className="mt-auto border-t border-border/70 pt-4">
                          <div className="min-h-7 font-semibold text-foreground">
                            {testimonial.reviewer}
                          </div>
                          <div className="mt-1 min-h-10 line-clamp-2 text-xs leading-5 text-muted-foreground">
                            {[testimonial.meta, testimonial.date].filter(Boolean).join(" / ")}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-0 h-11 w-11 border border-border bg-white text-foreground shadow-[var(--shadow-soft)] hover:bg-muted sm:-left-4" />
            <CarouselNext className="right-0 h-11 w-11 border border-border bg-white text-foreground shadow-[var(--shadow-soft)] hover:bg-muted sm:-right-4" />
          </Carousel>

          <div className="mt-6 flex items-center justify-center gap-2">
            {Array.from({ length: snapCount }).map((_, index) => (
              <button
                key={`testimonial-dot-${index}`}
                type="button"
                onClick={() => api?.scrollTo(index)}
                aria-label={`Go to testimonial ${index + 1}`}
                className={`h-2.5 rounded-full transition-all ${
                  currentSlide === index ? "w-8 bg-primary" : "w-2.5 bg-primary/25"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Rules() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="rules" className="section-bg-soft-blue relative py-18 sm:py-20">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <SectionLabel>HOUSE RULES</SectionLabel>
          <h2 className="mt-3 font-display text-4xl font-bold sm:text-5xl">Calm, Safe & Well-Managed Living</h2>
          <p className="mt-4 text-muted-foreground">
            Simple rules to ensure a peaceful and comfortable stay for everyone.
          </p>

          <div className="mt-8 rounded-3xl surface-card p-6">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Key policies
            </div>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl bg-muted px-4 py-4 text-sm leading-7 text-foreground/88">
                Government-issued ID proof and address proof are required during admission.
              </div>
              <div className="rounded-2xl bg-muted px-4 py-4 text-sm leading-7 text-foreground/88">
                Rs 10,000 refundable security deposit after proper handover and inspection.
              </div>
              <div className="rounded-2xl bg-muted px-4 py-4 text-sm leading-7 text-foreground/88">
                No outsiders, ragging, smoking, alcohol, or illegal activity inside the premises.
              </div>
            </div>
            <a
              href="#location"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:gap-3"
            >
              View location section
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="space-y-3 lg:col-span-3">
          {RULES.map((rule, index) => (
            <div key={rule.question} className="overflow-hidden rounded-2xl surface-card">
              <button
                type="button"
                onClick={() => setOpenIdx(openIdx === index ? null : index)}
                className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-muted"
              >
                <span className="font-medium">{rule.question}</span>
                <ChevronDown
                  className={`h-4 w-4 transition ${
                    openIdx === index ? "rotate-180 text-primary" : "text-muted-foreground"
                  }`}
                />
              </button>
              <motion.div
                initial={false}
                animate={{ height: openIdx === index ? "auto" : 0, opacity: openIdx === index ? 1 : 0 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 text-sm leading-7 text-muted-foreground">{rule.answer}</div>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Contact({ roomOptions }: { roomOptions: string[] }) {
  const defaultRoomType = roomOptions[0] ?? "Single";
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    room_type: defaultRoomType,
    message: "",
  });
  const [state, setState] = useState<"idle" | "loading" | "sent" | "error">("idle");

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setState("loading");

    const { error } = await supabase.from("enquiries").insert([form]);

    if (error) {
      setState("error");
      return;
    }

    setState("sent");
    setForm({
      name: "",
      phone: "",
      email: "",
      room_type: defaultRoomType,
      message: "",
    });
    setTimeout(() => setState("idle"), 4000);
  };

  return (
    <section id="contact" className="section-bg-mint relative scroll-mt-32 pb-20 pt-18 sm:pb-22 sm:pt-20">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-2">
        <div>
          <SectionLabel>CONTACT US</SectionLabel>
          <h2 className="mt-3 font-display text-4xl font-bold sm:text-5xl">Book Your Stay Today</h2>
          <p className="mt-4 text-muted-foreground">
            Looking for a safe and comfortable PG near MIT Pune? Contact us for room availability
            and bookings.
          </p>

          <div className="mt-8 space-y-4">
            <ContactRow icon={MapPin} title="Visit Us" detail={CONTACT_ADDRESS} />
            <ContactRow icon={Phone} title="Call" detail={CONTACT_PHONE_DISPLAY} />
            <ContactRow icon={Mail} title="Email" detail={CONTACT_EMAIL} />
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={`tel:+${CONTACT_PHONE_RAW}`}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition hover:scale-[1.03]"
            >
              <Phone className="h-5 w-5" /> Call Now
            </a>
            <a
              href={WHATSAPP}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#25D366] px-5 py-3 font-semibold text-white shadow-[var(--shadow-soft)] transition hover:scale-[1.03] hover:bg-[#1fb85a]"
            >
              <WhatsAppIcon className="h-5 w-5" /> WhatsApp Enquiry
            </a>
            <a
              href="#location"
              className="inline-flex items-center gap-2 rounded-2xl border border-border bg-white px-5 py-3 font-semibold text-foreground transition hover:scale-[1.03]"
            >
              <MapPin className="h-4 w-4" />
              Get Location
            </a>
          </div>
        </div>

        <form
          id="contact-form"
          onSubmit={onSubmit}
          className="scroll-mt-32 space-y-4 self-start rounded-3xl surface-card p-7"
        >
          <Field
            label="Name"
            value={form.name}
            onChange={(value) => setForm({ ...form, name: value })}
            placeholder="Your full name"
            required
          />
          <Field
            label="Phone"
            value={form.phone}
            onChange={(value) => setForm({ ...form, phone: value })}
            placeholder="+91 ..."
            required
          />
          <Field
            label="Email"
            type="email"
            value={form.email}
            onChange={(value) => setForm({ ...form, email: value })}
            placeholder="you@email.com"
          />
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Room Type</label>
            <select
              value={form.room_type}
              onChange={(event) => setForm({ ...form, room_type: event.target.value })}
              className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 outline-none focus:border-primary/50"
            >
              {roomOptions.map((room) => (
                <option key={room}>{room}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Message</label>
            <textarea
              rows={4}
              value={form.message}
              onChange={(event) => setForm({ ...form, message: event.target.value })}
              placeholder="Tell us a little about what you're looking for..."
              className="mt-2 w-full resize-none rounded-xl border border-input bg-background px-4 py-3 outline-none focus:border-primary/50"
            />
          </div>
          <button
            type="submit"
            disabled={state === "loading"}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 font-semibold text-primary-foreground transition hover:scale-[1.01] disabled:opacity-60"
          >
            {state === "loading"
              ? "Sending..."
              : state === "sent"
                ? "Sent - we'll be in touch"
                : state === "error"
                  ? "Something went wrong"
                  : "Send Enquiry"}
          </button>
        </form>
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 outline-none placeholder:text-muted-foreground/60 focus:border-primary/50"
      />
    </div>
  );
}

function ContactRow({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof MapPin;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-2xl surface-card p-4">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{title}</div>
        <div className="font-medium">{detail}</div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="section-bg-footer relative mt-6 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(107,147,194,0.22),transparent_45%)]" />
      <div className="relative mx-auto max-w-7xl px-5 py-6 sm:py-8">
        <div className="rounded-2xl border border-white/14 bg-[#0b274a]/72 px-5 py-5 backdrop-blur-sm sm:px-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-[1.15fr_0.8fr_0.95fr_0.7fr]">
            <div>
              <div className="flex items-center gap-2.5">
                <BrandLogo className="h-9 w-9 rounded-lg shadow-[0_14px_28px_rgba(0,0,0,0.24)]" />
                <div className="font-display text-lg font-bold">Elite Stay</div>
              </div>
              <p className="mt-3 max-w-xs text-xs leading-6 text-white/76">
                Elite Stay PG - Safe • Comfortable • Student-Friendly Living
              </p>
            </div>

            <FooterCol title="Quick Links" links={[...PRIMARY_NAV_LINKS]} />

            <div>
              <div className="mb-3 text-sm font-semibold text-white">Contact Info</div>
              <ul className="space-y-2.5 text-xs text-white/78">
                <li className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5" />
                  <a href={`tel:+${CONTACT_PHONE_RAW}`} className="transition hover:text-white">
                    +91 95539 61076
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" />
                  <a href={`mailto:${CONTACT_EMAIL}`} className="transition hover:text-white">
                    {CONTACT_EMAIL}
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" />
                  <a
                    href={MAPS_DIRECTIONS_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="transition hover:text-white"
                  >
                    Loni Kalbhor, Pune
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <div className="mb-3 text-sm font-semibold text-white">Follow Us</div>
              <div className="flex items-center gap-2">
                <a
                  href={WHATSAPP}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="WhatsApp"
                  className="grid h-8 w-8 place-items-center rounded-full border border-white/20 bg-white/8 text-white transition hover:bg-white/16"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="grid h-8 w-8 place-items-center rounded-full border border-white/20 bg-white/8 text-white transition hover:bg-white/16"
                >
                  <Instagram className="h-4 w-4" />
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                  className="grid h-8 w-8 place-items-center rounded-full border border-white/20 bg-white/8 text-white transition hover:bg-white/16"
                >
                  <Facebook className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-white/14 pt-3 text-center text-[11px] text-white/72">
            © {new Date().getFullYear()} Elite Stay PG Services. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
function FooterCol({
  title,
  links,
}: {
  title: string;
  links: Array<{ label: string; href: string; external?: boolean }>;
}) {
  return (
    <div>
      <div className="mb-3 text-sm font-semibold text-white">{title}</div>
      <ul className="space-y-1.5 text-xs text-white/78">
        {links.map((link) => (
          <li key={`${link.label}-${link.href}`}>
            <a
              href={link.href}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noreferrer" : undefined}
              className="transition hover:text-white"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FloatingActions() {
  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="grid h-12 w-12 place-items-center rounded-full surface-card transition hover:text-primary"
      >
        <ArrowUp className="h-5 w-5" />
      </button>
      <a
        href={`tel:+${CONTACT_PHONE_RAW}`}
        className="grid h-12 w-12 place-items-center rounded-full surface-card transition hover:text-primary"
      >
        <Phone className="h-5 w-5" />
      </a>
      <a
        href={WHATSAPP}
        target="_blank"
        rel="noreferrer"
        className="grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-xl transition hover:scale-110 hover:bg-[#1fb85a]"
      >
        <WhatsAppIcon className="h-7 w-7" />
      </a>
    </div>
  );
}

function SectionLabel({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "light" }) {
  const style =
    tone === "light"
      ? "bg-white/12 text-white/88 border border-white/20"
      : "bg-muted text-muted-foreground";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${style}`}
    >
      <span className="h-1 w-1 rounded-full bg-primary" /> {children}
    </span>
  );
}

