export interface Photo {
  src: string;
  alt: string;
  caption?: string;
}

export interface PhotoCollection {
  slug: string;
  title: string;
  description: string;
  coverImage: string;
  photos: Photo[];
}

export const collections: PhotoCollection[] = [
  {
    slug: "campus",
    title: "Purdue grounds",
    description: "Quads, towers, banners—four seasons on West Lafayette brick.",
    coverImage: "/photos/campus/img-1809.jpeg",
    photos: [
      {
        src: "/photos/campus/fall-colors.jpg",
        alt: "Sunny autumn campus walk: two students head away down an asphalt path flanked by red and gold maples, brown leaf litter, and red brick halls under blue sky, framed by overhanging branches",
        caption: "Watching the seasons change",
      },
      {
        src: "/photos/campus/clocktower-duality.png",
        alt: "Split vertical composite of the same tall brick clock tower—left half in daylight with blue sky and students near the base, right half at night with blue-lit clock faces and green spotlit stone arches",
        caption: "Caught it on both sides of the clock",
      },
      {
        src: "/photos/campus/img-1809.jpeg",
        alt: "Low-angle view from the road looking up at the Purdue University gateway arch with white serif lettering, stone pillars and lanterns, bare trees and snow patches under a bright winter sky",
        caption: "Arch-ived this moment",
      },
      {
        src: "/photos/campus/img-1111.jpeg",
        alt: "Black Purdue University banner with gold motion P and white serif text, hung from a black lamppost against a pale gray winter sky and thin bare branches",
        caption: "Same campus, different light",
      },
      {
        src: "/photos/campus/img-1112.jpeg",
        alt: "Tall building banner on red brick: navy field with white words Persistently Pursuing Giant Leaps beside a photo of a gymnast mid-motion, seen from a low angle with glass windows above",
        caption: "Marketing department understood the assignment",
      },
      {
        src: "/photos/campus/img-8653.jpg",
        alt: "Weathered dark bronze Unfinished P campus sculpture framed by soft green leaves in the foreground, white van and lamppost beyond under sunlit trees and blue sky",
        caption: "Peeking through the hedges at a landmark",
      },
      {
        src: "/photos/campus/img-8675.jpg",
        alt: "Night view of a slender brick clock tower with glowing white clock faces and lit belfry, rising above warm streetlamps and silhouetted tree branches against deep blue sky",
        caption: "Office hours extended to midnight",
      },
      {
        src: "/photos/campus/img-8750.jpg",
        alt: "Bronze statue of young Neil Armstrong seated on a stone ledge with his name carved in the plinth, flight jacket and thoughtful pose, modern glass building and green trees behind",
        caption: "Before the moon, there was homework",
      },
      {
        src: "/photos/campus/img-2249.jpeg",
        alt: "Abstract night photograph of vertical green, white, and red light columns blurred into soft waves with scattered multicolor bokeh, like reflections on wet glass or rippled water",
        caption: "Everyone's a Ferrari fan",
      },
      {
        src: "/photos/campus/img-2200.jpeg",
        alt: "Iced coffee in a clear plastic cup with dome lid and straw on speckled marble; black sleeve reads All The Sips with whipped cream and cinnamon dust on top, window light and cup shadow",
        caption: "First frappe at Panera",
      },
      {
        src: "/photos/campus/img-2425.jpeg",
        alt: "Purdue banner on a lamppost reading Find Your Next Giant Leap with gold motion P logo, gold pinstripes on black, bare twigs in foreground and blue sky with brick building corner",
        caption: "Sidewalk slogan motivation",
      },
      {
        src: "/photos/campus/img-2432.jpeg",
        alt: "Busy airport arrivals corridor with motion-blurred travelers; large blue wall reading Welcome to Dallas and And Wide Open Minds, red Baggage Claim sign and exit lighting ahead",
        caption: "Back home",
      },
      {
        src: "/photos/campus/img-2724.jpeg",
        alt: "Single flagpole against flat gray sky flying US flag, Indiana state flag with torch and stars, and black Purdue P flag underneath, all streaming right with bare branches lower right",
        caption: "United States of Purdue",
      },
      {
        src: "/photos/campus/img-2726.jpeg",
        alt: "Wet red herringbone brick walkway in rain, glossy puddles and ripples, green hedge and vintage lamppost left, grass and distant bare trees and stop sign fading into gray haze",
        caption: "Slipping town",
      },
      {
        src: "/photos/campus/img-2729.jpeg",
        alt: "Low angle across a shallow puddle on wet asphalt reflecting gray sky and bare branches, soft-focus brick academic building with red roof and lamppost beyond on an overcast day",
        caption: "Puddle included",
      },
    ],
  },
  {
    slug: "snowfall",
    title: "Snowfall",
    description: "West Lafayette winters.",
    coverImage: "/photos/snowfall/img-1125.jpeg",
    photos: [
      {
        src: "/photos/snowfall/img-1466.jpeg",
        alt: "Sunlit winter campus scene: cleared concrete walk between deep snowbanks, bare trees, long shadows, Adirondack chairs half-buried in snow, and brick buildings in the distance under pale blue sky",
        caption: "Plow cleared the path, the lawn kept the receipts",
      },
      {
        src: "/photos/snowfall/img-1125.jpeg",
        alt: "Busy paved plaza during falling snow: students in winter coats crossing slushy stone, bike racks and bare trees, grey sky and reduced visibility",
        caption: "Snow did most of the work",
      },
      {
        src: "/photos/snowfall/img-1130.jpeg",
        alt: "Large dark stone Purdue block-P monument during heavy snow, hammer-and-chisel detail on rough base, brick plaza and vans blurred behind large falling flakes",
        caption: "Snowy P",
      },
      {
        src: "/photos/snowfall/img-1251.jpeg",
        alt: "First-person view of feet in light sneakers on snow-dusted pavement at night; letters MV3 traced clear through the snow with nearby footprints under harsh overhead light",
        caption: "I'm snow ready for #MV3",
      },
      {
        src: "/photos/snowfall/img-1260.jpeg",
        alt: "Ground-level night shot along an icy snow-covered path, sparkling granular frost in focus while bare trees and warm streetlight bokeh blur ahead",
        caption: "All it takes is a new angle"
      },
      {
        src: "/photos/snowfall/img-9895.jpg",
        alt: "Purdue University brick gateway arch with white PURDUE UNIVERSITY lettering, holiday wreaths and string lights on the span, snow on walks and piled at the pillars, red brick halls beyond",
        caption: "Let the snow fall",
      },
      {
        src: "/photos/snowfall/img-9911.jpg",
        alt: "Curving cleared asphalt path through deep campus snow, snow-laden deciduous trees and a red brick building at right, tiny figures walking far ahead under flat overcast sky",
        caption: "The path ahead"
      },
      {
        src: "/photos/snowfall/img-9926.jpg",
        alt: "Medium shot of the Purdue Unfinished P sculpture with smooth dark upper stroke and rough stone base, bronze hammer and chisel on the plinth, light snow on surfaces and soft-focus snowy campus behind",
        caption: "Icey P",
      },
    ],
  },
  {
    slug: "uk-2025",
    title: "UK '25",
    description: "Pit lanes, shop windows, and one very loud afternoon at Silverstone.",
    coverImage: "/photos/uk-2025/img-7327.jpg",
    photos: [
      {
        src: "/photos/uk-2025/img-6703.jpeg",
        alt: "Spectators behind a fence hold phones toward the track as a Red Bull Racing car leads a papaya McLaren under storm-gray clouds; Aramco barriers and packed grandstands behind",
        caption: "Papaya hunting energy drink",
      },
      {
        src: "/photos/uk-2025/img-6769.jpg",
        alt: "Front view of the yellow Camel-liveried Lotus 99T Formula 1 show car, number 12, Senna-era nose sponsors and Honda branding, on a wood platform inside a gallery with a BOSS storefront visible through the window",
        caption: "Car go fast vroom vroom",
      },
      {
        src: "/photos/uk-2025/img-6777.jpg",
        alt: "Nigel Mansell's red racing suit on a mannequin inside a tall cylindrical glass case, embroidered name on the belt and 1980s sponsor patches including Denim, Canon, Honda, Mobil 1, and Boss",
        caption: "Williams-Honda era, dry-cleaned and under guard",
      },
      {
        src: "/photos/uk-2025/img-6781.jpg",
        alt: "Close-up of the yellow and blue front wing and nose of a Lotus 99T, number 12, with Elf and Honda logos, glossy bodywork and rivets above dark wood flooring",
        caption: "The nose knows it's 1987",
      },
      {
        src: "/photos/uk-2025/img-6787.jpg",
        alt: "Life-sized silver statue of a Formula 1 driver in race suit and detailed helmet with Mercedes star and sponsor marks, one arm raised clutching cloth like a flag; yellow race car blur to the left",
        caption: "Frozen full-send energy",
      },
      {
        src: "/photos/uk-2025/img-6790.jpg",
        alt: "Two historic F1 helmets on a wood shelf: yellow-green-blue Ayrton Senna replica in focus with visor and sponsor decals, white-and-red Nigel Mansell helmet softly blurred behind with Union Jack detail",
        caption: "Shelfmate rivalries",
      },
      {
        src: "/photos/uk-2025/img-6817.jpg",
        alt: "George Russell Mercedes-AMG Petronas Formula 1 car number 63 on a black raised platform with teal accent lighting; large screen with Adidas and Mercedes logos and team merchandise racks in a bright store",
        caption: "#63 at arm's length",
      },
      {
        src: "/photos/uk-2025/img-6993.jpg",
        alt: "Hand holding a Red Bull Racing Tour Guest laminate on a grey woven lanyard, massive silver bull logo on the glass building facade behind under clear blue sky",
        caption: "All the access",
      },
      {
        src: "/photos/uk-2025/img-7017.jpg",
        alt: "Dark gallery with a sweeping row of Oracle Red Bull Racing F1 cars and a curved LED wall showing model years, driver portraits, and season statistics",
        caption: "Red Bull family photo",
      },
      {
        src: "/photos/uk-2025/img-7318.jpg",
        alt: "Giant outdoor screen showing the Formula 1 starting grid with driver portraits for Verstappen and Piastri and a vertical top-ten list; straw hat brim along the lower edge and bright clouds above",
        caption: "#1 v. #81",
      },
      {
        src: "/photos/uk-2025/img-7327.jpg",
        alt: "Oracle Red Bull Racing F1 car on track in profile, seen through chain-link fence and metal guardrail; green Aramco track branding and a crowded white-roof grandstand under overcast sky",
        caption: "Even Max wasn't fast enough to escape my camera",
      },
      {
        src: "/photos/uk-2025/img-7337.jpg",
        alt: "Two Formula 1 cars speed past on curbing, viewed through fence and Armco barrier; Crypto.com and Aramco banners along the wall and a full grandstand under layered gray clouds",
        caption: "Same fence, different duet",
      },
      {
        src: "/photos/uk-2025/img-7352.jpg",
        alt: "Crowd on a grassy bank in team colors—McLaren orange, Ferrari red, Aston green—as a Formula 1 car streaks along the track; crypto.com barriers, distant grandstand, and big cumulus sky",
        caption: "Merch out, phones up, engines on",
      },
    ],
  },
  {
    slug: "new-york",
    title: "New York '22",
    description: "The city that never sleeps... or changes.",
    coverImage: "/photos/new-york/img-4825.jpeg",
    photos: [
      {
        src: "/photos/new-york/img-4815.jpeg",
        alt: "Worm's-eye view of Manhattan towers leaning inward around a patch of blue sky; glass facades and older masonry, with Foot Locker and H&M signs visible on one building",
        caption: "One slice of sky",
      },
      {
        src: "/photos/new-york/img-4825.jpeg",
        alt: "Pigeon on dark asphalt beside a white crosswalk strip, carrying a thin twig in its beak; cigarette butt and crumbs nearby, metal barrier blurred at top",
        caption: "Why did the pigeon cross the road?",
      },
      {
        src: "/photos/new-york/img-4831.jpg",
        alt: "Close-up of a gray pigeon on asphalt with iridescent green-purple neck feathers, eyes closed or mid-blink; thick white road line and a second pigeon softly out of focus behind",
        caption: "Street portrait, eyes on standby",
      },
      {
        src: "/photos/new-york/img-4887.jpg",
        alt: "Pale pigeon nearly all white with small dark flecks on wings and neck, pink feet and pale beak, standing on gray stone plaza; out-of-focus sparrows behind and soft golden bokeh lights above",
        caption: "Borrowed the spotlight from the skyline",
      },
      {
        src: "/photos/new-york/img-4960.jpeg",
        alt: "Street-level worm's-eye view of Lower Manhattan glass towers, including One World Trade Center, their upper floors erased by dense white fog; white ribbed Oculus structure lower right, bare winter trees along the bottom",
        caption: "Foggy skyline",
      },
    ],
  },
  {
    slug: "smokies",
    title: "The Smokies '23",
    description: "The Great Smoky Mountains for a reason.",
    coverImage: "/photos/smokies/img-7046.jpg",
    photos: [
      {
        src: "/photos/smokies/img-6991.jpeg",
        alt: "Forearm with a smartwatch showing elevation about 6,666 feet and compass data, above a blue observation railing; dense gray fog and dark evergreen treetops beyond",
        caption: "Somewhere high up",
      },
      {
        src: "/photos/smokies/img-7046.jpg",
        alt: "Person with dark wavy hair seen from behind, silhouetted against golden sunset light and long sunbeams over hazy blue layers of rolling mountains",
        caption: "Watching the light leave the Smokies",
      },
      {
        src: "/photos/smokies/img-7047.jpeg",
        alt: "Person sitting on a rough stone wall in the foreground, facing a wide valley of forested ridges with the sun low on the horizon and warm haze in the air",
        caption: "Reserved seating",
      },
      {
        src: "/photos/smokies/img-7049.jpg",
        alt: "Man and woman sitting side by side on a stone ledge at sunset, her head leaning toward his shoulder, silhouetted against bright sky and receding blue mountain layers",
        caption: "Two front-row seats",
      },
    ],
  },
  {
    slug: "holidays-2025",
    title: "Winter Holidays '25",
    description: "December lights.",
    coverImage: "/photos/holidays-2025/img-0347.jpg",
    photos: [
      {
        src: "/photos/holidays-2025/img-0286.jpg",
        alt: "Nighttime residential lawn display: Santa on a reindeer pulls a red sleigh outlined in warm white lights, with child figures, stacked gifts, and a small lit Christmas tree",
        caption: "Santa's flight plan was cut short.",
      },
      {
        src: "/photos/holidays-2025/img-0334.jpg",
        alt: "Large wire-frame reindeer wrapped in cool white lights with a red light scarf, in front of a fence of glowing stars and a tree draped in warm fairy lights",
        caption: "120 volts Rudolph",
      },
      {
        src: "/photos/holidays-2025/img-0347.jpg",
        alt: "Huge rectangular holiday sign glowing red with the words Frisco Square in bright white lights, stars on either side, trees and night sky behind",
        caption: "Frisco square",
      },
      {
        src: "/photos/holidays-2025/img-0374.jpg",
        alt: "View through a long arched tunnel of rainbow-colored LED strings toward a giant walk-through sphere of white lights; large yellow star displays to the right",
        caption: "Rainbow colored tunnel",
      },
      {
        src: "/photos/holidays-2025/img-0379.jpg",
        alt: "Tall outdoor Christmas tree dense with warm white lights, red spiral garland, and a big red bow on top, reflected in rippling water with people at its base",
        caption: "I'm seeing double",
      },
    ],
  },
  {
    slug: "new-years",
    title: "New Years '26",
    description: "Ringing it in.",
    coverImage: "/photos/new-years/img-0687.jpg",
    photos: [
      {
        src: "/photos/new-years/img-0646.jpg",
        alt: "Nighttime crowd silhouettes facing a giant outdoor LED screen showing 2026 and Happy New Year with stylized fireworks",
        caption: "The countdown till 2026",
      },
      {
        src: "/photos/new-years/img-0671.jpg",
        alt: "Bright lime-green fireworks bursting over a black sky while a silhouetted crowd watches; one person holds up a glowing phone to record",
        caption: "Neon confetti",
      },
      {
        src: "/photos/new-years/img-0673.jpg",
        alt: "Gold and white fireworks with red spark tips above a dark crowd; a raised smartphone lights up in the foreground",
        caption: "One sky, a hundred tiny replays",
      },
      {
        src: "/photos/new-years/img-0677.jpg",
        alt: "Close-up of a large spherical red firework burst, hundreds of red sparks on black night sky",
        caption: "Ringing it in red",
      },
      {
        src: "/photos/new-years/img-0682.jpg",
        alt: "Purple, pink, and white layered fireworks over spectators' silhouettes; distant horizon lights and bare trees",
        caption: "Fireworks layer cake",
      },
      {
        src: "/photos/new-years/img-0687.jpg",
        alt: "Huge white and gold firework burst and lit smoke cloud as a crowd films the show on bright phone screens",
        caption: "Capturing the show overhead",
      },
    ],
  },
  {
    slug: "standalone",
    title: "One-offs",
    description: "One-offs and favorites.",
    coverImage: "/photos/standalone/squirrel.jpeg",
    photos: [
      {
        src: "/photos/standalone/squirrel.jpeg",
        alt: "Squirrel on campus",
        caption: "A squirrel fur real",
      },
      {
        src: "/photos/standalone/blink-and-youll-miss-it.jpeg",
        alt: "Fleeting street moment",
        caption: "Blink and it's gone",
      },
      {
        src: "/photos/standalone/wet-pavement.jpeg",
        alt: "Wet pavement reflection",
        caption: "Everyone's a Ferrari fan",
      },
      {
        src: "/photos/standalone/driftin-snow.jpeg",
        alt: "Snow drifting",
        caption: "Driftin' snow",
      },
      { src: "/photos/standalone/green-heart.jpeg", alt: "Green heart-shaped leaves" },
      {
        src: "/photos/standalone/macro-flower.jpg",
        alt: "Macro flower after rain",
        caption: "After the rain",
      },
      {
        src: "/photos/standalone/img-9572.jpg",
        alt: "Northern lights effect",
        caption: "Aurora borealis",
      },
      {
        src: "/photos/moonography/img-0764.jpg",
        alt: "Moon in the sky",
        caption: "Lunar closeup",
      },
      {
        src: "/photos/moonography/img-2184.jpeg",
        alt: "Moon photograph",
        caption: "Through the branches",
      },
    ],
  },
];

export function getCollectionBySlug(slug: string): PhotoCollection | undefined {
  return collections.find((c) => c.slug === slug);
}

export function getAllCollectionSlugs(): string[] {
  return collections.map((c) => c.slug);
}
