// Demo content for `npm run seed`. Times are in days before the seed runs.

interface DemoEntry {
  title: string;
  text: string;
  daysAgo: number;
}

export interface DemoUser {
  name: string;
  email: string;
  interests: string[];
  joinedDaysAgo: number;
  notes: DemoEntry[];
  posts: DemoEntry[];
}

export const demoUsers: DemoUser[] = [
  {
    name: 'Ayesha Rahman',
    email: 'ayesha@example.com',
    interests: ['reading', 'travel', 'photography'],
    joinedDaysAgo: 40,
    notes: [
      {
        title: 'Sylhet trip checklist',
        text: 'Book bus tickets for Thursday night\nRaincoat + extra phone battery\nAsk Nusrat if she still wants to join\nTea garden visit on Saturday morning',
        daysAgo: 12,
      },
      {
        title: 'Books to finish this month',
        text: 'Atomic Habits (half done)\nThe Alchemist (re-read)\nPather Panchali',
        daysAgo: 6,
      },
      {
        title: 'Camera settings for low light',
        text: 'ISO 1600, f/1.8, 1/60s. Shoot RAW, fix white balance later.',
        daysAgo: 2.5,
      },
    ],
    posts: [
      {
        title: 'Ratargul in the rain',
        text: 'Spent the morning on a boat in the swamp forest. Go during monsoon, the water is high and the trees look unreal. Bring a waterproof bag for your camera.',
        daysAgo: 9,
      },
      {
        title: 'Reading 20 pages a day actually works',
        text: 'Tried it for a month. Finished three books I had been "reading" since last year. Small and boring beats big and ambitious.',
        daysAgo: 1.2,
      },
    ],
  },
  {
    name: 'Tanvir Hasan',
    email: 'tanvir@example.com',
    interests: ['coding', 'chess', 'cricket'],
    joinedDaysAgo: 38,
    notes: [
      {
        title: 'Sprint 14 standup notes',
        text: 'Auth refactor merged\nPagination bug on /orders still open, reproduce with page=0\nAsk Imran about the Mongo index review',
        daysAgo: 4,
      },
      {
        title: 'Chess openings to practice',
        text: 'Queens Gambit Declined main line\nCaro-Kann as black against e4\nStop playing the London every single game',
        daysAgo: 10,
      },
      {
        title: 'Side project ideas',
        text: 'Bus route finder for Dhaka\nShared grocery list with offline sync\nCLI that turns notes into flashcards',
        daysAgo: 0.3,
      },
    ],
    posts: [
      {
        title: 'Compound indexes finally clicked for me',
        text: 'Equality first, then sort, then range. Rewrote one query to match the index order and it went from a full collection scan to reading 20 documents.',
        daysAgo: 3,
      },
      {
        title: 'Anyone up for blitz on Friday?',
        text: 'Looking for a few people for a small online blitz tournament. 5+3, nothing serious. Reply here if you want in.',
        daysAgo: 0.6,
      },
    ],
  },
  {
    name: 'Nusrat Jahan',
    email: 'nusrat@example.com',
    interests: ['cooking', 'travel', 'gardening'],
    joinedDaysAgo: 35,
    notes: [
      {
        title: 'Shorshe ilish (mum’s version)',
        text: 'Mustard paste: 2 tbsp yellow + 1 tbsp black, soak 15 min\nGreen chillies, mustard oil, turmeric\nSteam 12 minutes, not more',
        daysAgo: 15,
      },
      {
        title: 'Balcony garden',
        text: 'Repot the chili plant\nTomatoes need afternoon shade\nBuy neem oil for the aphids',
        daysAgo: 5,
      },
      {
        title: 'Cox’s Bazar budget',
        text: 'Hotel 3 nights ~ 9,000\nFood ~ 4,000\nTransport ~ 3,500',
        daysAgo: 1.8,
      },
    ],
    posts: [
      {
        title: 'Easiest bhuna khichuri for rainy days',
        text: 'Fry the dal before adding rice, that is the whole secret. Serve with egg bhuna and pickles. Done in 40 minutes.',
        daysAgo: 7,
      },
    ],
  },
  {
    name: 'Rafiq Islam',
    email: 'rafiq@example.com',
    interests: ['hiking', 'photography', 'travel'],
    joinedDaysAgo: 33,
    notes: [
      {
        title: 'Bandarban trek gear',
        text: 'Trekking shoes (broken in!)\nWater purification tablets\nHeadlamp + spare batteries\nPermit copies x3',
        daysAgo: 18,
      },
      {
        title: 'Photos to edit',
        text: 'Nafakhum waterfall set\nSunrise from Keokradong\nVillage market portraits',
        daysAgo: 3.5,
      },
    ],
    posts: [
      {
        title: 'Keokradong in two days',
        text: 'Started from Bogalake, slept in a local cottage, summit at sunrise. Hard climb but very doable if you go slow. Carry more water than you think.',
        daysAgo: 13,
      },
      {
        title: 'Shooting waterfalls without a tripod',
        text: 'Brace the camera on a rock, use the 2 second timer, and go for 1/4s. Not perfect, but you get the silky water look.',
        daysAgo: 2,
      },
    ],
  },
  {
    name: 'Farhana Akter',
    email: 'farhana@example.com',
    interests: ['reading', 'music', 'movies'],
    joinedDaysAgo: 30,
    notes: [
      {
        title: 'Book club - next picks',
        text: 'Norwegian Wood\nThe Midnight Library\nA Thousand Splendid Suns',
        daysAgo: 8,
      },
      {
        title: 'Guitar practice plan',
        text: 'Mon/Wed/Fri: chord changes G-C-D-Em, 15 min\nTue/Thu: fingerpicking pattern\nWeekend: learn one full song',
        daysAgo: 4.5,
      },
      {
        title: 'Movies people recommended',
        text: 'Aynabaji\nPast Lives\nThe Lunchbox',
        daysAgo: 0.9,
      },
    ],
    posts: [
      {
        title: 'Book club meets this Saturday',
        text: 'We are discussing The Midnight Library. Bring one quote you liked and one you disagreed with. New people welcome.',
        daysAgo: 2.2,
      },
    ],
  },
  {
    name: 'Imran Chowdhury',
    email: 'imran@example.com',
    interests: ['coding', 'reading', 'chess'],
    joinedDaysAgo: 28,
    notes: [
      {
        title: 'Mongo index review',
        text: 'Drop the unused createdAt index on orders\nAdd {customer: 1, _id: -1} for the history page\nCheck explain() before and after',
        daysAgo: 3.8,
      },
      {
        title: 'Interview prep',
        text: 'System design: URL shortener, rate limiter\nRevise JWT vs session cookies\nPractice explaining past projects in 2 minutes',
        daysAgo: 11,
      },
    ],
    posts: [
      {
        title: 'Read the explain() output, not your assumptions',
        text: 'Spent an hour "optimizing" a query that was already using the right index. The slow part was the $lookup without an index on the foreign field.',
        daysAgo: 5,
      },
    ],
  },
  {
    name: 'Sadia Karim',
    email: 'sadia@example.com',
    interests: ['cooking', 'gardening', 'reading'],
    joinedDaysAgo: 25,
    notes: [
      {
        title: 'Weekly meal prep',
        text: 'Sunday: chicken curry, dal, mixed veg\nPortion into 5 boxes\nMake chutney for the week',
        daysAgo: 6.5,
      },
      {
        title: 'Seeds to buy',
        text: 'Lal shak, coriander, bottle gourd, marigold',
        daysAgo: 2.8,
      },
    ],
    posts: [
      {
        title: 'Growing coriander on a windowsill',
        text: 'Crush the seeds slightly before sowing and keep the soil damp. Mine sprouted in 8 days and I have not bought coriander since.',
        daysAgo: 4,
      },
    ],
  },
  {
    name: 'Arif Hossain',
    email: 'arif@example.com',
    interests: ['cricket', 'hiking', 'movies'],
    joinedDaysAgo: 21,
    notes: [
      {
        title: 'Weekend cricket team',
        text: 'Confirm 11 players by Thursday\nBook the field for 7am\nWho has the stumps?',
        daysAgo: 1.5,
      },
      {
        title: 'Films for movie night',
        text: 'Monpura\nInterstellar\n3 Idiots',
        daysAgo: 9.5,
      },
    ],
    posts: [
      {
        title: 'Morning cricket at the park',
        text: 'We play every Saturday at 7am, tape ball, 10 overs a side. Need two more regular players. All levels welcome.',
        daysAgo: 6,
      },
    ],
  },
  {
    name: 'Maliha Sultana',
    email: 'maliha@example.com',
    interests: ['music', 'travel', 'photography', 'cooking'],
    joinedDaysAgo: 14,
    notes: [
      {
        title: 'Songs for the wedding playlist',
        text: 'Holud night: upbeat folk\nReception: soft acoustic covers\nAsk the cousins for requests',
        daysAgo: 3,
      },
      {
        title: 'Sajek day plan',
        text: 'Leave Khagrachari at 10am (army escort)\nSunset at Konglak hill\nBook a cottage with a view',
        daysAgo: 0.5,
      },
    ],
    posts: [
      {
        title: 'Sajek above the clouds',
        text: 'Woke up at 5:30 and the whole valley was covered in clouds. Worth the long jeep ride. Book your stay at least two weeks ahead on holidays.',
        daysAgo: 0.8,
      },
    ],
  },
  {
    name: 'Zubair Ahmed',
    email: 'zubair@example.com',
    interests: [],
    joinedDaysAgo: 3,
    notes: [
      {
        title: 'First note',
        text: 'Trying this out. Need to add some interests to my profile.',
        daysAgo: 2.9,
      },
    ],
    posts: [],
  },
];
