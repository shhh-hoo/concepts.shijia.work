const viewport = document.getElementById("viewport");
const scene = document.getElementById("scene");
const stage = document.getElementById("stage");
const projectWorld = document.getElementById("projectWorld");
const projectScroll = document.getElementById("projectScroll");
const scanWorld = document.getElementById("scanWorld");
const scanKicker = document.getElementById("scanKicker");
const scanTitle = document.getElementById("scanTitle");
const scanStatement = document.getElementById("scanStatement");
const backBtn = document.getElementById("backBtn");

/*
  Frontpage rebuilt from the uploaded redesigned Figma frame.
  1536 × 1024 fixed composition, then uniformly scaled to viewport.
*/

const visualRules = [
  [347.6618,   0,      50,       415],
  [494.0982, 257,      89,       814],
  [894.7728,   0,     212,       975.1006],
  [994.9783, 254,     576,       852.3630],
  [1225.9783,377,     807,       975.3630],
  [1528.9783,278,    1110,       876.3630],
];

/*
  Same lines, extended mathematically for invisible hit regions and clipping.
  Order: intro | WSS | BLOCK/NET/CHAIN | FOUNDRY | CUELAYER | AIDRB | 9701
*/
const boundaries = visualRules.map(([x1,y1,x2,y2]) => ({x1,y1,x2,y2}));

const intro = [
  ["EDUCATION MEETS", 11, 21],
  ["AI AS PRODUCT,", 11, 61],
  ["CONCEPT, AND", 11, 101],
  ["METHODOLOGY", 11, 141],
  ["TAKE FORM.", 11, 181],
];

const blocks = [
  {
    num:"01",
    lines:[
      ["WSS / WSS2", 249.6722, 142],
      ["A QUIZ", 193.6556, 222],
      ["COMPETITION WHERE", 165.6473, 262],
      ["QUESTIONS, VISUAL", 137.6390, 302],
      ["IDENTITY,", 109.6307, 342],
      ["STAGECRAFT AND", 81.6224, 382],
      ["INTERACTION", 53.6141, 422],
      ["BECOME THE SHOW.", 25.6058, 462],
    ]
  },
  {
    num:"02",
    lines:[
      ["BLOCK, NET,", 521.1328, 226],
      ["CHAIN", 493.1245, 266],
      ["A TEACHING", 437.1079, 346],
      ["METHODOLOGY", 409.0996, 386],
      ["THAT MOVES", 381.0913, 426],
      ["FROM", 353.0830, 466],
      ["BUILDING", 325.0747, 506],
      ["KNOWLEDGE", 297.0664, 546],
      ["TO", 269.0581, 586],
      ["CONNECTING", 241.0498, 626],
      ["IT TO", 213.0415, 666],
      ["USING IT", 185.0332, 706],
      ["IN", 157.0249, 746],
      ["SEQUENCES", 129.0166, 786],
      ["OF", 101.0083, 826],
      ["REASONING", 73, 866],
    ]
  },
  {
    num:"03",
    lines:[
      ["FOUNDRY", 853.6971, 65],
      ["AN AI LEARNING", 797.6805, 145],
      ["PLATFORM THAT", 769.6722, 185],
      ["SELECTS AND", 741.6639, 225],
      ["ADAPTS THE", 713.6556, 265],
      ["RIGHT LEARNING", 685.6473, 305],
      ["ASSET FOR EACH", 657.6390, 345],
      ["STUDENT WITHIN", 629.6307, 385],
      ["AN", 601.6224, 425],
      ["EXPERT-DEFINED", 573.6141, 465],
      ["CURRICULUM", 545.6058, 505],
    ]
  },
  {
    num:"04",
    lines:[
      ["CUELAYER", 975.6888, 289],
      ["A LIVE AI LAYER", 919.6722, 369],
      ["OVER TEACHING", 891.6639, 409],
      ["THAT GIVES FORM", 863.6556, 449],
      ["TO THE LESSON AS", 835.6473, 489],
      ["IT UNFOLDS,", 807.6390, 529],
      ["THROUGH VISUAL", 779.6307, 569],
      ["CUES, CONNECTIONS,", 751.6224, 609],
      ["AND", 723.6141, 649],
      ["TRANSFORMATIONS.", 695.6058, 689],
    ]
  },
  {
    num:"05",
    lines:[
      ["AIDRB", 1283.7054, 304],
      ["AN", 1227.6888, 384],
      ["AI-NATIVE", 1199.6805, 424],
      ["TEACHING", 1171.6722, 464],
      ["RESOURCE", 1143.6639, 504],
      ["SYSTEM FOR", 1115.6556, 544],
      ["COLLECTING,", 1087.6473, 584],
      ["CURATING,", 1059.6307, 624],
      ["TRANSFORMIN", 1031.6224, 664],
      ["G AND", 1003.6141, 704],
      ["RECOMPOSING", 975.6058, 744],
      ["MATERIAL.", 947.6058, 784],
    ]
  },
  {
    num:"06",
    lines:[
      ["9701.shijia.work", 1241.6639, 704],
      ["A CHEMISTRY LEARNING", 1185.6473, 784],
      ["SYSTEM OF REACTIONS,", 1157.6390, 824],
      ["MECHANISMS AND", 1129.6307, 864],
      ["PRACTICE, BUILT AS A", 1101.6224, 904],
      ["WORLD OF CONNECTED", 1073.6141, 944],
      ["TRANSFORMATIONS.", 1045.6058, 984],
    ]
  }
];

const indices = [
  ["01", 320, 126],
  ["02", 598, 199],
  ["03", 928, 31],
  ["04", 1090, 218],
  ["05", 1408, 171],
  ["06", 1387, 664],
];

const projects = [
  {
    num:"01",
    slug:"wss",
    title:"WSS / WSS2",
    label:"LIVE QUIZ SHOW",
    accent:"#FF6B4A",
    statement:"A quiz competition where questions, visual identity, stagecraft and interaction become the show."
  },
  {
    num:"02",
    slug:"bnc",
    title:"BLOCK, NET, CHAIN",
    label:"TEACHING METHODOLOGY",
    accent:"#7EA7FF",
    statement:"A teaching methodology that moves from building knowledge to connecting it to using it in sequences of reasoning."
  },
  {
    num:"03",
    slug:"foundry",
    title:"FOUNDRY",
    label:"AI LEARNING PLATFORM",
    accent:"#8CFFB0",
    statement:"An AI learning platform that selects and adapts the right learning asset for each student within an expert-defined curriculum."
  },
  {
    num:"04",
    slug:"cuelayer",
    title:"CUELAYER",
    label:"LIVE AI LAYER",
    accent:"#E9FF4F",
    statement:"A live AI layer over teaching that gives form to the lesson as it unfolds, through visual cues, connections and transformations."
  },
  {
    num:"05",
    slug:"aidrb",
    title:"AIDRB",
    label:"TEACHING RESOURCE SYSTEM",
    accent:"#F36B4B",
    statement:"An AI-native teaching resource system for collecting, curating, transforming and recomposing material."
  },
  {
    num:"06",
    slug:"9701",
    title:"9701.shijia.work",
    label:"CHEMISTRY LEARNING SYSTEM",
    accent:"#FF8EE7",
    statement:"A chemistry learning system of reactions, mechanisms and practice, built as a world of connected transformations."
  },
];
