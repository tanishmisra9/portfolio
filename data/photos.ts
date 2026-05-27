export interface Photo {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
  duetWith?: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
  };
}

export interface PhotoCollection {
  slug: string;
  title: string;
  description: string;
  coverImage: string;
  photos: Photo[];
}

export interface RandomPhotoCandidate {
  src: string;
  alt: string;
  caption?: string;
  collectionTitle: string;
  collectionSlug: string;
}

export const collections: PhotoCollection[] = [
  {
    slug: "campus",
    title: "Purdue grounds",
    description: "Quads, towers, banners—four seasons on West Lafayette brick",
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
        width: 1024,
        height: 1536,
      },
      {
        src: "/photos/campus/img-1809.jpeg",
        alt: "Low-angle view from the road looking up at the Purdue University gateway arch with white serif lettering, stone pillars and lanterns, bare trees and snow patches under a bright winter sky",
        caption: "Arch-ived this moment",
        width: 2846,
        height: 2846,
      },
      {
        src: "/photos/campus/img-1111.jpeg",
        alt: "Black Purdue University banner with gold motion P and white serif text, hung from a black lamppost against a pale gray winter sky and thin bare branches",
        caption: "Same campus, different light",
        width: 3596,
        height: 4795,
      },
      {
        src: "/photos/campus/IMG_3118.jpeg",
        alt: "The Purdue University bell tower as an airplane flies overhead.",
        caption: "Flying through",
        width: 2798,
        height: 3731,
      },
      {
        src: "/photos/campus/img-1112.jpeg",
        alt: "Tall building banner on red brick: navy field with white words Persistently Pursuing Giant Leaps beside a photo of a gymnast mid-motion, seen from a low angle with glass windows above",
        caption: "Marketing department understood the assignment",
        width: 3024,
        height: 4032,
      },
      {
        src: "/photos/campus/img-8653.jpg",
        alt: "Weathered dark bronze Unfinished P campus sculpture framed by soft green leaves in the foreground, white van and lamppost beyond under sunlit trees and blue sky",
        caption: "Peeking through the hedges at a landmark",
        width: 3024,
        height: 3024,
      },
      {
        src: "/photos/campus/img-8675.jpg",
        alt: "Night view of a slender brick clock tower with glowing white clock faces and lit belfry, rising above warm streetlamps and silhouetted tree branches against deep blue sky",
        caption: "Office hours extended to midnight",
        width: 1525,
        height: 1525,
      },
      {
        src: "/photos/campus/img-8750.jpg",
        alt: "Bronze statue of young Neil Armstrong seated on a stone ledge with his name carved in the plinth, flight jacket and thoughtful pose, modern glass building and green trees behind",
        caption: "Before the moon, there was homework",
        width: 2299,
        height: 2299,
      },
      {
        src: "/photos/campus/img-2249.jpeg",
        alt: "Abstract night photograph of vertical green, white, and red light columns blurred into soft waves with scattered multicolor bokeh, like reflections on wet glass or rippled water",
        caption: "Everyone's a Ferrari fan",
        width: 2485,
        height: 3314,
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
        width: 3024,
        height: 4032,
      },
    ],
  },
  {
    slug: "snowfall",
    title: "Snowfall",
    description: "West Lafayette winters",
    coverImage: "/photos/snowfall/img-1125.jpeg",
    photos: [
      // TODO: alt — describe scene
      {
        src: "/photos/snowfall/driftin-snow.jpeg",
        alt: "",
        caption: "Driftin' snow",
        width: 2838,
        height: 3785,
      },
      {
        src: "/photos/snowfall/img-1125.jpeg",
        alt: "Busy paved plaza during falling snow: students in winter coats crossing slushy stone, bike racks and bare trees, grey sky and reduced visibility",
        caption: "Snow did most of the work",
      },
      {
        src: "/photos/snowfall/img-1260.jpeg",
        alt: "Ground-level night shot along an icy snow-covered path, sparkling granular frost in focus while bare trees and warm streetlight bokeh blur ahead",
        caption: "All it takes is a new angle",
        width: 3844,
        height: 5126,
      },
      {
        src: "/photos/snowfall/img-9895.jpg",
        alt: "Purdue University brick gateway arch with white PURDUE UNIVERSITY lettering, holiday wreaths and string lights on the span, snow on walks and piled at the pillars, red brick halls beyond",
        caption: "Let the snow fall",
        width: 3024,
        height: 4032,
      },
      {
        src: "/photos/snowfall/img-9926.jpg",
        alt: "Medium shot of the Purdue Unfinished P sculpture with smooth dark upper stroke and rough stone base, bronze hammer and chisel on the plinth, light snow on surfaces and soft-focus snowy campus behind",
        caption: "Icy P",
        width: 3024,
        height: 4032,
      },
    ],
  },
  {
    slug: "uk-2025",
    title: "UK",
    description: "Pit lanes, shop windows, and one very loud afternoon at Silverstone",
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
        width: 3024,
        height: 4032,
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
        width: 3024,
        height: 4032,
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
    title: "New York",
    description: "The city that never sleeps... or changes",
    coverImage: "/photos/new-york/img-4825.jpeg",
    photos: [
      {
        src: "/photos/new-york/img-4815.jpeg",
        alt: "Worm's-eye view of Manhattan towers leaning inward around a patch of blue sky; glass facades and older masonry, with Foot Locker and H&M signs visible on one building",
        caption: "One slice of sky",
        width: 2770,
        height: 3691,
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
      {
        src: "/photos/new-york/IMG_3674.jpeg",
        alt: "Sunlight streaming through a tall glass-walled interior with diagonal structural beams, casting long shadows across a seated crowd and the floor below",
        caption: "Terminal velocity",
      },
      {
        src: "/photos/new-york/IMG_3683.jpeg",
        alt: "Empire State Building centered between modern towers at dusk, viewed above a rooftop deck with a glowing neon sign reading 'The City That Never Sleeps' and empty swings in the foreground",
        caption: "The skyline backed it up",
      },
      {
        src: "/photos/new-york/IMG_3751.jpeg",
        alt: "Blurred black prancing horse emblem mounted on a glossy red storefront facade, with reflections of nearby buildings and parked cars at the edges of the frame",
        caption: "Closest I'm getting to one",
      },
      {
        src: "/photos/new-york/IMG_3830.jpeg",
        alt: "Street-level view looking up at a pencil-thin Midtown tower against a blue sky streaked with thin clouds, framed by darker glass and tan residential buildings",
        caption: "They ran out of width",
      },
      {
        src: "/photos/new-york/IMG_3899.jpeg",
        alt: "Bow Bridge arcing over the lake in Central Park beneath bright spring trees and a wide blue sky filled with soft white clouds",
        caption: "Eight hundred acres of not thinking about anything",
      },
      {
        src: "/photos/new-york/IMG_3901.jpeg",
        alt: "Slender supertall tower rising beyond Central Park trees and a dark rock outcrop, with leafy branches framing the blue sky above",
        caption: "Two New Yorks, one frame",
      },
      {
        src: "/photos/new-york/IMG_3924.jpeg",
        alt: "Pigeons gathered on a path scattered with birdseed, one sharply detailed in the foreground while another stands softly out of focus behind it",
        caption: "The real locals",
      },
      {
        src: "/photos/new-york/IMG_4008.jpeg",
        alt: "Crowded Times Square at night beneath towering digital billboards, neon storefront signs, and green traffic lights glowing over the packed intersection",
        caption: "City at full volume",
      },
      {
        src: "/photos/new-york/IMG_4081.jpeg",
        alt: "Long-exposure Midtown sidewalk scene with pedestrians blurred into motion, the Chrysler Building in the distance, and glass office facades reflecting the blue sky",
        caption: "Nobody stopped for the photo",
      },
      {
        src: "/photos/new-york/IMG_4100.jpeg",
        alt: "Across-the-river skyline view of Midtown Manhattan under dramatic layered clouds, with glassy high-rises stacked along the waterfront",
        caption: "Glass and ambition",
      },
    ],
  },
  {
    slug: "smokies",
    title: "The Smokies",
    description: "The Great Smoky Mountains for a reason",
    coverImage: "/photos/smokies/img-7046.jpg",
    photos: [
      {
        src: "/photos/smokies/img-6991.jpeg",
        alt: "Forearm with a smartwatch showing elevation about 6,666 feet and compass data, above a blue observation railing; dense gray fog and dark evergreen treetops beyond",
        caption: "Somewhere high up",
        width: 3024,
        height: 4032,
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
    title: "Winter Holidays",
    description: "December lights",
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
        width: 2983,
        height: 3978,
      },
      {
        src: "/photos/holidays-2025/img-0347.jpg",
        alt: "Huge rectangular holiday sign glowing red with the words Frisco Square in bright white lights, stars on either side, trees and night sky behind",
        caption: "Frisco square",
        width: 3024,
        height: 4032,
      },
      {
        src: "/photos/holidays-2025/img-0374.jpg",
        alt: "View through a long arched tunnel of rainbow-colored LED strings toward a giant walk-through sphere of white lights; large yellow star displays to the right",
        caption: "Rainbow colored tunnel",
        width: 3024,
        height: 4032,
      },
      {
        src: "/photos/holidays-2025/img-0379.jpg",
        alt: "Tall outdoor Christmas tree dense with warm white lights, red spiral garland, and a big red bow on top, reflected in rippling water with people at its base",
        caption: "I'm seeing double",
        width: 2686,
        height: 3580,
      },
    ],
  },
  {
    slug: "new-year",
    title: "New Year",
    description: "Ringing it in",
    coverImage: "/photos/new-year/img-0687.jpg",
    photos: [
      {
        src: "/photos/new-year/img-0646.jpg",
        alt: "Nighttime crowd silhouettes facing a giant outdoor LED screen showing 2026 and Happy New Year with stylized fireworks",
        caption: "The countdown till 2026",
        width: 3024,
        height: 3024,
      },
      {
        src: "/photos/new-year/img-0671.jpg",
        alt: "Bright lime-green fireworks bursting over a black sky while a silhouetted crowd watches; one person holds up a glowing phone to record",
        caption: "Neon confetti",
        width: 3024,
        height: 3024,
      },
      {
        src: "/photos/new-year/img-0673.jpg",
        alt: "Gold and white fireworks with red spark tips above a dark crowd; a raised smartphone lights up in the foreground",
        caption: "One sky, a hundred tiny replays",
        width: 3024,
        height: 3024,
      },
      {
        src: "/photos/new-year/img-0677.jpg",
        alt: "Close-up of a large spherical red firework burst, hundreds of red sparks on black night sky",
        caption: "Ringing it in red",
        width: 4284,
        height: 4284,
      },
      {
        src: "/photos/new-year/img-0682.jpg",
        alt: "Purple, pink, and white layered fireworks over spectators' silhouettes; distant horizon lights and bare trees",
        caption: "Fireworks layer cake",
        width: 3022,
        height: 3022,
      },
      {
        src: "/photos/new-year/img-0687.jpg",
        alt: "Huge white and gold firework burst and lit smoke cloud as a crowd films the show on bright phone screens",
        caption: "Capturing the show overhead",
        width: 3022,
        height: 3022,
      },
    ],
  },
  {
    slug: "standalone",
    title: "Standalones",
    description: "One-offs and favorites",
    coverImage: "/photos/standalone/squirrel.jpeg",
    photos: [
      // TODO: alt — describe scene
      {
        src: "/photos/standalone/squirrel.jpeg",
        alt: "",
        caption: "A squirrel fur real",
        width: 3264,
        height: 3264,
      },
      // TODO: alt — describe scene
      {
        src: "/photos/standalone/blink-and-youll-miss-it.jpeg",
        alt: "",
        caption: "Blink and it's gone",
        width: 3271,
        height: 3271,
      },
      {
        src: "/photos/campus/img-2432.jpeg",
        alt: "Busy airport arrivals corridor with motion-blurred travelers; large blue wall reading Welcome to Dallas and And Wide Open Minds, red Baggage Claim sign and exit lighting ahead",
        caption: "Back home",
      },
      {
        src: "/photos/standalone/green-heart.jpeg",
        alt: "Green heart-shaped leaves",
        width: 3024,
        height: 3024,
      },
      {
        src: "/photos/standalone/macro-flower.jpg",
        alt: "Macro flower after rain",
        caption: "After the rain",
        width: 3024,
        height: 4032,
      },
      {
        src: "/photos/standalone/img-9572.jpg",
        alt: "Northern lights effect",
        caption: "Aurora borealis",
        width: 2264,
        height: 3018,
      },
      {
        src: "/photos/moonography/img-0764.jpg",
        alt: "Moon in the sky",
        caption: "Lunar closeup",
        width: 2432,
        height: 3243,
      },
      {
        src: "/photos/moonography/img-2184.jpeg",
        alt: "Moon photograph",
        caption: "Through the branches",
        width: 2405,
        height: 3206,
      },
    ],
  },
  {
    slug: "super-max",
    title: "Super Max",
    description: "He makes me believe the odds don't matter",
    coverImage: "/photos/super-max/US_25.JPG",
    photos: [
      {
        src: "/photos/super-max/Stock_1.jpg",
        alt: "Max Verstappen portrait, Red Bull Racing livery",
        width: 920,
        height: 1211,
        duetWith: {
          src: "/photos/super-max/Stock_2.jpg",
          alt: "Max Verstappen portrait, studio shot",
          width: 894,
          height: 1174,
        },
      },
      {
        src: "/photos/super-max/RB19.JPG",
        alt: "Tanish holding Max Verstappen's helmet alongside the dominant RB19",
        caption: "I met RB19",
        width: 3024,
        height: 3737,
      },
      {
        src: "/photos/super-max/Austria_24.jpg",
        alt: "Max Verstappen, 2024 Austrian Grand Prix",
        caption: "Lion-eyed",
      },
      {
        src: "/photos/super-max/Brazil_24.jpg",
        alt: "Max Verstappen, 2024 Brazilian Grand Prix",
        caption: "P17 to P1",
        width: 1800,
        height: 1200,
      },
      {
        src: "/photos/super-max/Vegas_24.JPG",
        alt: "Max Verstappen, 2024 Las Vegas Grand Prix",
        caption: "Four in a row",
        width: 3024,
        height: 2726,
      },
      {
        src: "/photos/super-max/Miami_25.jpg",
        alt: "Max Verstappen, 2025 Miami Grand Prix",
        caption: "Still got it, even with 2 kids at home",
        width: 1167,
        height: 1697,
      },
      {
        src: "/photos/super-max/Imola_25.JPG",
        alt: "Max Verstappen, 2025 Emilia Romagna Grand Prix at Imola",
        caption: "One move at Tamburello",
        width: 3024,
        height: 2474,
      },
      {
        src: "/photos/super-max/Belgium_25_Sprint.JPG",
        alt: "Max Verstappen, 2025 Belgian Grand Prix Sprint Race",
        caption: "New era starting with a win",
      },
      {
        src: "/photos/super-max/Monza_25.JPG",
        alt: "Max Verstappen, 2025 Italian Grand Prix at Monza",
        caption: "The fastest in F1",
        width: 3024,
        height: 2742,
      },
      {
        src: "/photos/super-max/Baku_25.JPG",
        alt: "Max Verstappen, 2025 Azerbaijan Grand Prix",
        caption: "When it rains, Max reigns",
        width: 3024,
        height: 1961,
      },
      {
        src: "/photos/super-max/Race_suit.JPG",
        alt: "I bought a Red Bull race suit and wore it to classes.",
        caption: "Officially Red Bull bound",
        width: 3024,
        height: 3259,
      },
      {
        src: "/photos/super-max/US_25.JPG",
        alt: "Max Verstappen, 2025 United States Grand Prix at COTA",
        caption: "Lone-star pace",
        width: 3024,
        height: 2955,
      },
      {
        src: "/photos/super-max/Vegas_25.JPG",
        alt: "Max Verstappen, 2025 Las Vegas Grand Prix",
        caption: "What happens in Vegas...",
      },
      {
        src: "/photos/super-max/Abu_dhabi_25.jpeg",
        alt: "Max Verstappen, 2025 Abu Dhabi Grand Prix",
        caption: "Always chase till the end",
        width: 1169,
        height: 1417,
      },
      {
        src: "/photos/super-max/2026_intro.jpeg",
        alt: "Max Verstappen, 2026 season introduction",
        caption: "Start of #MV3",
        width: 3024,
        height: 2991,
      },
      {
        src: "/photos/super-max/24hQualifiers.jpeg",
        alt: "Max Verstappen racing the ADAC 24h Nürburgring Qualifiers in April 2026",
        caption: "Taking on the Green Hell",
        width: 1273,
        height: 1601,
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

export function getRandomPhotoCandidates(): RandomPhotoCandidate[] {
  return collections
    .filter((collection) => collection.slug !== "super-max")
    .flatMap((collection) =>
    collection.photos.flatMap((photo) => {
      const primary: RandomPhotoCandidate = {
        src: photo.src,
        alt: photo.alt,
        caption: photo.caption,
        collectionTitle: collection.title,
        collectionSlug: collection.slug,
      };

      return photo.duetWith
        ? [
            primary,
            {
              src: photo.duetWith.src,
              alt: photo.duetWith.alt,
              collectionTitle: collection.title,
              collectionSlug: collection.slug,
            },
          ]
        : [primary];
    }),
  );
}
