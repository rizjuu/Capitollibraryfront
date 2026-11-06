/**
 * Misamis Oriental Provincial Library Details
 * Derived from official LMS PROVINCIAL LIBRARY DETAILS (Republic Act No. 7743)
 * Provincial Capitol Compound, Velez Street, Cagayan de Oro City
 */

export const PROVINCIAL_LIBRARY_INFO = {
  republic: "Republic of the Philippines",
  province: "PROVINCE OF MISAMIS ORIENTAL",
  office: "OFFICE OF THE PROVINCIAL LIBRARIAN",
  name: "Misamis Oriental Provincial Library",
  legalBasis: "Republic Act No. 7743",
  mandate: "Misamis Oriental Provincial Library provides free and equitable access to library services which meet the changing needs of the community.",
  businessHours: {
    schedule: "8:00 AM – 5:00 PM, Monday – Friday",
    closure: "Closed on Saturday, Sunday & Holiday",
    openTime: "08:00",
    closeTime: "17:00",
    days: "Monday – Friday"
  },
  collection: {
    totalPrintedResources: 9951,
    totalVolumes: 9951,
    sections: [
      { name: "Reference Section", titles: 3644, volumes: 3644, floor: "2nd Floor (Theses & Dissertations: 3rd Floor)" },
      { name: "Circulation Section", titles: 2900, volumes: 2900, floor: "2nd Floor (Fiction: Ground Floor)" },
      { name: "Periodical Section", titles: 1518, volumes: 1518, floor: "Ground Floor" },
      { name: "Filipiniana Section", titles: 1119, volumes: 1119, floor: "2nd Floor" },
      { name: "Special Collection Section", titles: 491, volumes: 491, floor: "2nd Floor" },
      { name: "Reserved Section", titles: 279, volumes: 279, floor: "2nd Floor" }
    ],
    weedingPolicy: "The collection consists largely of donated materials. Due to limited allocated budget for collection development in public libraries, no weeding-out activities are currently conducted. All 9,951 printed library resources remain active in circulation.",
    damagedPolicy: "Inventory is conducted on a quarterly or yearly basis. An average of 10 to 15 books are found dilapidated or damaged due to age per year."
  },
  operationalBenchmarks: {
    manualProcessing: "15–20 minutes per book (stamping of ownership, accessioning, cataloging & classification, cards/pockets/due date slips, plastic acetate covering)",
    shelfSearch: "5–10 minutes at most (books are segregated and categorized by section and subject)",
    quantityReport: "15–20 minutes (processed books already encoded)",
    bibliographicReport: "Approximately 3 days per section (detailed bibliographic records)",
    collectionTally: "30–40 minutes with 3–4 staff (total volume count)",
    physicalAudit: "1 to 2 weeks at most (physical verification of actual titles and quantities)"
  },
  libraryServices: [
    {
      category: "Reading Services",
      description: "Dedicated physical reading spaces and segregated collections across library floors.",
      items: [
        "Circulation Section (2nd Floor)",
        "Filipiniana Section (2nd Floor)",
        "Reference Section (2nd Floor)",
        "Reserved Section (2nd Floor)",
        "Fiction & Periodical Section (Ground Floor)",
        "Theses & Dissertation Section (3rd Floor)"
      ]
    },
    {
      category: "Online and Electronic Services",
      description: "Digital hub and e-governance processing access for all citizens.",
      items: [
        "Tech4Ed Center (Transform & Empower)",
        "eGov Services: DFA Online Passport New & Renewal, NBI Online, PSA Online (NSO Birth/Marriage/Cenomar/Death Certificates), PRC Online Application",
        "Free Wi-Fi for All (Strictly for research purposes; free 2–3 pages printing & photocopying with client-provided bond paper)",
        "Online Storytelling"
      ]
    },
    {
      category: "Public Library Services",
      description: "Evaluation and assessment among Public Libraries in Misamis Oriental with the National Library of the Philippines."
    },
    {
      category: "Other Programs and Activities",
      description: "Annual cultural literacy, book drives, and reading celebrations.",
      items: [
        "World Read Aloud Day (February 4)",
        "67th Public Library Day (March 9)",
        "National Book Week (November 24–30)",
        "National Arts Month (February)",
        "Summer Reading Program (May 26 – Culmination June 20 at SM CDO Downtown Premier Event Hall)",
        "Mindanao Book Fair - CDO"
      ]
    }
  ],
  personnel: {
    preparedBy: {
      name: "MERALUNA T. PELIGRO, RL",
      title: "Librarian I"
    },
    notedBy: {
      name: "RICHEL I. PAJARA, RL, MLIS",
      title: "Provincial Librarian"
    }
  }
};

export const OFFICIAL_SECTIONS = [
  {
    id: "circulation",
    name: "Circulation Section",
    code: "CIR",
    floor: "2nd Floor",
    sublocation: "Circulation Section, 2nd Floor",
    description: "Contains the library’s main collection of books (fiction, elementary/high school/college textbooks, and general reading) that users can borrow or check out.",
    categories: [
      "Science & Technology",
      "Medicine - Health",
      "Communication - Grammar",
      "Language - Literature",
      "Information & Communication Technology",
      "Commerce - Mathematics",
      "General Circulation",
      "Fictions (Ground Floor)"
    ]
  },
  {
    id: "filipiniana",
    name: "Filipiniana Section",
    code: "FIL",
    floor: "2nd Floor",
    sublocation: "Filipiniana Section, 2nd Floor",
    description: "Houses collections related to the Philippines, including books, documents, and studies on Filipino history, culture, literature, government, and local authors.",
    categories: [
      "Ensiklopedya - Wika",
      "Bokabularyo - Diksyunaryo",
      "Balarila - Ingles - Panitikan",
      "Florante at Laura",
      "Rizaliana",
      "Ibong Adarna",
      "Kasaysayan",
      "General Filipinana",
      "About Philippines"
    ]
  },
  {
    id: "reference",
    name: "Reference Section",
    code: "REF",
    floor: "2nd Floor",
    sublocation: "Reference Section, 2nd Floor",
    description: "Houses collections of materials for quick facts and background information, such as dictionaries, encyclopedias, atlases, and manuals. For in-library use only.",
    categories: [
      "Encyclopedia",
      "Handbooks - Manuals",
      "Dictionaries",
      "Almanacs - Atlas",
      "General References",
      "Theses & Dissertations (3rd Floor)"
    ]
  },
  {
    id: "reserved",
    name: "Reserved Section",
    code: "RES",
    floor: "2nd Floor",
    sublocation: "Reserved Section, 2nd Floor",
    description: "Contains high-demand and restricted course materials placed on reserve for in-library reading.",
    categories: [
      "M.R Books"
    ]
  },
  {
    id: "periodical",
    name: "Periodical Section",
    code: "PER",
    floor: "Ground Floor",
    sublocation: "Periodical Section, Ground Floor",
    description: "Contains collections of regularly published materials like newspapers, magazines, journals, and newsletters for current news and research updates.",
    categories: [
      "Journals - Arts",
      "Journals - Science & Technology",
      "Journals - Law",
      "Journals - Reader's Digest",
      "Journals - Food",
      "Journals - Philippine Government Matters",
      "Journals - Philippine SONA & Development Plan",
      "Assorted Journals",
      "Newspapers",
      "Magazines",
      "Leaflets, Brochures & Clippings"
    ]
  },
  {
    id: "special_collection",
    name: "Special Collection Section",
    code: "SC",
    floor: "2nd Floor",
    sublocation: "Special Collection Section, 2nd Floor",
    description: "Houses materials that are unique, important, or specifically collected for their cultural, historical, social, or community value, including municipal heritage and records.",
    categories: [
      "Law Books",
      "GAD Corner",
      "Peace & Order Corner",
      "Children's Corner",
      "Governor's Collection"
    ]
  }
];

export function resolveSectionCode(section) {
  const s = String(section || "").toLowerCase();
  if (s.includes("filipiniana")) return "FIL";
  if (s.includes("reference")) return "REF";
  if (s.includes("periodical")) return "PER";
  if (s.includes("special")) return "SC";
  if (s.includes("reserved") || s.includes("m.r")) return "RES";
  return "CIR";
}

export function resolveSublocation(section, category, shelf) {
  const s = String(section || "").toLowerCase();
  const c = String(category || "").toLowerCase();

  if (c.includes("theses") || c.includes("dissertation")) {
    return "Reference Section, 3rd Floor";
  }
  if (c.includes("fiction")) {
    return "Circulation Section, Ground Floor";
  }
  if (s.includes("periodical")) {
    return "Periodical Section, Ground Floor";
  }
  if (s.includes("filipiniana")) {
    return "Filipiniana Section, 2nd Floor";
  }
  if (s.includes("reference")) {
    return "Reference Section, 2nd Floor";
  }
  if (s.includes("special")) {
    return "Special Collection Section, 2nd Floor";
  }
  if (s.includes("reserved")) {
    return "Reserved Section, 2nd Floor";
  }
  return "Circulation Section, 2nd Floor";
}

export function resolveDeweyDecimal(category, section, title) {
  const text = `${category || ""} ${title || ""} ${section || ""}`.toLowerCase();

  if (text.includes("earth science") || text.includes("geology")) return "550";
  if (text.includes("volcano") || text.includes("seismology")) return "551.21";
  if (text.includes("weather") || text.includes("climate") || text.includes("meteorolog")) return "551.6";
  if (text.includes("ocean") || text.includes("marine")) return "551.46";
  if (text.includes("ecology") || text.includes("ecosystem") || text.includes("environment")) return "577";
  if (text.includes("plant") || text.includes("botan")) return "580";
  if (text.includes("animal") || text.includes("zoolog")) return "590";
  if (text.includes("human anatomy") || text.includes("anatomy")) return "611";
  if (text.includes("health and wellness") || text.includes("wellness")) return "613";
  if (text.includes("medicine") || text.includes("health") || text.includes("nursing") || text.includes("medical")) return "610";
  if (text.includes("physics")) return "530";
  if (text.includes("chemistry")) return "540";
  if (text.includes("mathematics") || text.includes("algebra") || text.includes("calculus") || text.includes("geometry") || text.includes("trigonometry")) return "510";
  if (text.includes("engineering")) return "620";
  if (text.includes("information & communication") || text.includes("computer") || text.includes("programming") || text.includes("ict")) return "004";

  if (text.includes("law") || text.includes("constitution") || text.includes("penal") || text.includes("statute") || text.includes("jurisprudence")) return "340";
  if (text.includes("commerce") || text.includes("business") || text.includes("accounting") || text.includes("management")) return "650";
  if (text.includes("economics")) return "330";
  if (text.includes("government") || text.includes("governor") || text.includes("sona")) return "352";
  if (text.includes("peace") || text.includes("gender") || text.includes("gad") || text.includes("social")) return "360";

  if (text.includes("rizal") || text.includes("rizaliana")) return "920";
  if (text.includes("florante") || text.includes("ibong adarna") || text.includes("panitikan")) return "899.21";
  if (text.includes("kasaysayan") || text.includes("philippines") || text.includes("filipiniana")) return "959.9";

  if (text.includes("dictionary") || text.includes("diksyunaryo") || text.includes("bokabularyo")) return "423";
  if (text.includes("grammar") || text.includes("balarila") || text.includes("wika") || text.includes("language")) return "400";
  if (text.includes("encyclopedia") || text.includes("ensiklopedya")) return "030";
  if (text.includes("handbook") || text.includes("manual")) return "030";
  if (text.includes("almanac") || text.includes("atlas")) return "912";
  if (text.includes("theses") || text.includes("dissertation")) return "378";

  if (text.includes("periodical") || text.includes("journal") || text.includes("magazine") || text.includes("newspaper") || text.includes("digest")) return "050";

  if (text.includes("children") || text.includes("kids")) return "028.5";
  if (text.includes("arts") || text.includes("music") || text.includes("drawing") || text.includes("painting")) return "700";
  if (text.includes("fiction") || text.includes("novel") || text.includes("literature")) return "813";

  const s = String(section || "").toLowerCase();
  if (s.includes("filipiniana")) return "959.9";
  if (s.includes("reference")) return "030";
  if (s.includes("periodical")) return "050";
  if (s.includes("special")) return "340";
  if (s.includes("reserved")) return "020";
  return "500";
}

export function generateCutterNumber(author, title) {
  const cleanAuthor = String(author || "Unknown").replace(/[^a-zA-Z]/g, "");
  const authorInitial = (cleanAuthor[0] || "A").toUpperCase();

  let hashNum = 0;
  for (let i = 0; i < cleanAuthor.length; i++) {
    hashNum = (hashNum * 37 + cleanAuthor.charCodeAt(i)) % 890;
  }
  const digits = String(100 + Math.abs(hashNum)).slice(0, 3);

  const cleanTitle = String(title || "Book").replace(/[^a-zA-Z]/g, "");
  const titleLetter = (cleanTitle[0] || "b").toLowerCase();

  return `${authorInitial}${digits}${titleLetter}`;
}

export function generateCallNumber(book = {}) {
  const prefix = resolveSectionCode(book.section);
  const ddc = resolveDeweyDecimal(book.category, book.section, book.title);
  const cutter = generateCutterNumber(book.author, book.title);
  const year =
    book.publicationYear ||
    book.publication_year ||
    (book.dateAdded || book.date_added
      ? new Date(book.dateAdded || book.date_added).getFullYear()
      : 2020);

  return `${prefix} ${ddc} ${cutter} ${year}`;
}
