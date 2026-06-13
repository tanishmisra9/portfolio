export interface QuoteEntry {
  id: string;
  text: string;
  attribution?: string;
  /** Biases the size tier: 3 = can land in the largest tier. Defaults to 1. */
  emphasis?: 1 | 2 | 3;
}

export const quotes: QuoteEntry[] = [
  {
    id: "jobs-1",
    text: "The people who are crazy enough to think they can change the world are the ones who do.",
    attribution: "Steve Jobs",
    emphasis: 1,
  },
  {
    id: "jobs-2",
    text: "Think different.",
    attribution: "Steve Jobs",
    emphasis: 3,
  },
  {
    id: "max-1",
    text: "I am the best driver because I believe that I am the best, because every driver needs to think like that, otherwise it's better to stay at home.",
    attribution: "Max Verstappen",
    emphasis: 1,
  },
  {
    id: "max-2",
    text: "Simply lovely.",
    attribution: "Max Verstappen",
    emphasis: 3,
  },
  {
    id: "max-3",
    text: "He can call me Chucky.",
    attribution: "Max Verstappen",
    emphasis: 2,
  },
  {
    id: "gu-1",
    text: "Train like you've never won, fight like you've never lost.",
    attribution: "Eileen Gu",
    emphasis: 2,
  },
  {
    id: "pre-1",
    text: "Somebody may beat me, but they are going to have to bleed to do it.",
    attribution: "Steve Prefontaine",
    emphasis: 2,
  },
  {
    id: "lauda-1",
    text: "I think I was born without fear.",
    attribution: "Niki Lauda",
    emphasis: 3,
  },
  {
    id: "lauda-2",
    text: "Winning is one thing, but out of losing I always learned more for the future.",
    attribution: "Niki Lauda",
    emphasis: 1,
  },
  {
    id: "jobs-3",
    text: "Here's to the crazy ones.",
    attribution: "Steve Jobs",
    emphasis: 3,
  },
  {
    id: "jobs-4",
    text: "Stay hungry. Stay foolish.",
    attribution: "Steve Jobs",
    emphasis: 3,
  },
  {
    id: "larson-1",
    text: "Give so much time to the improvement of yourself that you have no time to criticize others.",
    attribution: "Christian D. Larson",
    emphasis: 2,
  },
  {
    id: "federer-1",
    text: "To be a champion, you have to believe in yourself when nobody else does.",
    attribution: "Roger Federer",
    emphasis: 1,
  },
  {
    id: "federer-2",
    text: "Under pressure I can see things very clear.",
    attribution: "Roger Federer",
    emphasis: 2,
  },
  {
    id: "ellison-1",
    text: "I have had all the disadvantages required for success.",
    attribution: "Larry Ellison",
    emphasis: 2,
  },
  {
    id: "grove-1",
    text: "Only the paranoid survive.",
    attribution: "Andy Grove",
    emphasis: 3,
  },
  {
    id: "miles-1",
    text: "Anyone can wear the mask.",
    attribution: "Miles Morales",
    emphasis: 3,
  },
  {
    id: "davis-1",
    text: "Don't play what's there; play what's not there.",
    attribution: "Miles Davis",
    emphasis: 2,
  },
  {
    id: "max-4",
    text: "Maybe God is with him, but he is not God.",
    attribution: "Max Verstappen",
    emphasis: 2,
  },
  {
    id: "jobs-5",
    text: "People don't know what they want until you show it to them.",
    attribution: "Steve Jobs",
    emphasis: 1,
  },
  {
    id: "kobe-1",
    text: "Job's not finished.",
    attribution: "Kobe Bryant",
    emphasis: 3,
  },
  {
    id: "jordan-1",
    text: "Limits, like fear, are often just an illusion.",
    attribution: "Michael Jordan",
    emphasis: 2,
  },
  {
    id: "bolt-1",
    text: "I don't think limits.",
    attribution: "Usain Bolt",
    emphasis: 3,
  },
  {
    id: "rosberg-1",
    text: "I have climbed my mountain, I am on the peak, so this feels right.",
    attribution: "Nico Rosberg",
    emphasis: 1,
  },
  {
    id: "vettel-1",
    text: "Never lift. Never stop believing.",
    attribution: "Sebastian Vettel",
    emphasis: 2,
  },
  {
    id: "hamilton-1",
    text: "I want to crush everyone. I want to outsmart everyone.",
    attribution: "Lewis Hamilton",
    emphasis: 2,
  },
  {
    id: "hunt-1",
    text: "The closer you are to death, the more alive you feel.",
    attribution: "James Hunt",
    emphasis: 2,
  },
  {
    id: "vettel-2",
    text: "It's correct that I'm a bad loser.",
    attribution: "Sebastian Vettel",
    emphasis: 2,
  },
  {
    id: "seneca-1",
    text: "Luck is what happens when preparation meets opportunity.",
    attribution: "Seneca",
    emphasis: 2,
  },
  {
    id: "napoleon-1",
    text: "Imagination governs the world.",
    attribution: "Napoleon Bonaparte",
    emphasis: 3,
  },
  {
    id: "dyer-1",
    text: "You cannot be lonely if you like the person you're alone with.",
    attribution: "Wayne Dyer",
    emphasis: 1,
  },
  {
    id: "senna-1",
    text: "To me, being second is a failure.",
    attribution: "Ayrton Senna",
    emphasis: 2,
  },
];
