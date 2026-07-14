/** Official Oromia Region zones and districts (woredas). */
export type OromiaZone = {
  name: string;
  districts: string[];
};

export const OROMIA_REGION_NAME = "Oromia" as const;

export const OROMIA_ZONES: OromiaZone[] = [
  {
    "name": "West Wellega Zone",
    "districts": [
      "Menesibu",
      "Nejo",
      "Gimbi",
      "Lalo Asabi",
      "Kiltu Kara",
      "Boji Dirmeji",
      "Guliso",
      "Jarso",
      "Kondala",
      "Boji Chekorsa",
      "Babo Gambel",
      "Yubdo",
      "Genji",
      "Haru",
      "Nole Kaba",
      "Begi",
      "Gimbi",
      "Seyo Nole",
      "Homa",
      "Ayira"
    ]
  },
  {
    "name": "East Wellega Zone",
    "districts": [
      "Limu",
      "Ibantu",
      "Gida Kiremu",
      "Haro Limu",
      "Boneya Bushe",
      "Wayu Tuka",
      "Gudeya Bila",
      "Gobu Seyo",
      "Sibu Sire",
      "Diga",
      "Sasiga",
      "Leka Dulecha",
      "Guto Gida",
      "Jima Arjo",
      "Nunu Kumba",
      "Wama Hagelo",
      "Nekemte"
    ]
  },
  {
    "name": "Illu Aba Bora Zone",
    "districts": [
      "Darimu",
      "Alge Sachi",
      "Chora",
      "Dega",
      "Dabo Hana",
      "Gechi",
      "Borecha",
      "Dedesa",
      "Yayu",
      "Metu Zuria",
      "Ale",
      "Bure",
      "Nono Sele",
      "Bicho",
      "Bilo Nopha",
      "Hurumu",
      "Didu",
      "Mako",
      "Huka /Halu",
      "Metu",
      "Bedele",
      "Bedele Zuria",
      "Chewaka",
      "Doreni"
    ]
  },
  {
    "name": "Jimma Zone",
    "districts": [
      "Limu Seka",
      "Limu Kosa",
      "Sokoru",
      "Tiro Afeta",
      "Kersa",
      "Mana",
      "Gomma",
      "Gera",
      "Seka Chekorsa",
      "Dedo",
      "Omonada",
      "Sigamo",
      "Setema",
      "Shebe Senbo",
      "Chora Botor",
      "Guma",
      "Agaro"
    ]
  },
  {
    "name": "West Shewa Zone",
    "districts": [
      "Ginde Beret",
      "Jeldu",
      "Ambo Zuria",
      "Midakegn",
      "Cheliya",
      "Bako Tibe",
      "Dano",
      "Nono",
      "Tikur Enchini",
      "Dendi",
      "Ejere",
      "Wolmera",
      "Ada Berga",
      "Meta Robi",
      "Ambo",
      "Abuna Gindeberet",
      "Toke Kutayu",
      "Jibat",
      "Elfata",
      "Holeta"
    ]
  },
  {
    "name": "North Shewa Zone",
    "districts": [
      "Were Jarso",
      "Dera",
      "Hidabu Abote",
      "Kuyu",
      "Degem",
      "Girar Jarso",
      "Debere Libanos",
      "Wuchale",
      "Abichuna Gnaa",
      "Kimbibit",
      "Bereh",
      "Sululta",
      "Fiche",
      "Yaya Gulele",
      "Jida",
      "Mulo",
      "Aleltu",
      "Sendafa"
    ]
  },
  {
    "name": "East Shewa Zone",
    "districts": [
      "Fentale",
      "Boset",
      "Adama",
      "Lome",
      "Gimbichu",
      "Ada A",
      "Dugda",
      "Adami Tulu Jido Kombolcha",
      "Bishoftu",
      "Bora",
      "Liben",
      "Akaki",
      "Ziway"
    ]
  },
  {
    "name": "Arsi Zone",
    "districts": [
      "Merti",
      "Aseko",
      "Gololcha-Wewreda",
      "Jeju",
      "Dodota",
      "Ziway Dugda",
      "Hitosa",
      "Sude",
      "Chole",
      "Amigna",
      "Seru",
      "Robe",
      "Tena",
      "Shirka",
      "Digluna Tijo",
      "Tiyo",
      "Munesa",
      "Limuna Bilbilo",
      "Guna",
      "Sire",
      "Lude Hitosa",
      "Deksis",
      "Bale Gasegar",
      "Enkelo Wabe",
      "Asela"
    ]
  },
  {
    "name": "West Hararge Zone",
    "districts": [
      "Mieso",
      "Doba",
      "Tulo",
      "Mesela",
      "Chiro",
      "Anchar",
      "Guba Koricha",
      "Habro",
      "Daro Lebu",
      "Boke",
      "Kuni",
      "Gemches",
      "Chiro Zuria",
      "Bedesa"
    ]
  },
  {
    "name": "East Hararge Zone",
    "districts": [
      "Kombolcha",
      "Jarso",
      "Gursum",
      "Babile",
      "Fedis",
      "Haro Maya",
      "Kurfa Chele",
      "Kersa",
      "Meta",
      "Goro Gutu",
      "Deder",
      "Melka Belo",
      "Bedeno",
      "Midga Tola",
      "Chinaksan",
      "Girawa",
      "Gola Oda",
      "Meyu"
    ]
  },
  {
    "name": "Bale Zone",
    "districts": [
      "Agarfa",
      "Gololcha",
      "Gasera",
      "Legehida",
      "Ginir",
      "Sinana",
      "Goba",
      "Harena Buluk",
      "Dolo Mena",
      "Meda Welabu",
      "Berbere",
      "Guradamole",
      "Goro",
      "Rayitu",
      "Seweyna",
      "Robe",
      "Goba",
      "Dawe Kachen",
      "Dinsho",
      "Dawe Serer"
    ]
  },
  {
    "name": "Borena Zone",
    "districts": [
      "Bule Hora",
      "Yabelo",
      "Arero",
      "Moyale",
      "Dire",
      "Teletele",
      "Abaya",
      "Dugida Dawa",
      "Miyu",
      "Gelana"
    ]
  },
  {
    "name": "South West Shewa Zone",
    "districts": [
      "Ameya",
      "Wonchi",
      "Woliso",
      "Dawo",
      "Ilu",
      "Sebeta Hawas",
      "Kersa Ena Malima",
      "Tole",
      "Becho",
      "Seden Sodo",
      "Woliso",
      "Goro",
      "Sodo Dacha",
      "Sebeta"
    ]
  },
  {
    "name": "Guji Zone",
    "districts": [
      "Uraga",
      "Bore",
      "Adola",
      "Wadera",
      "Odo Shakiso",
      "Kercha",
      "Liben",
      "Dima",
      "Hambela Wamena",
      "Girja",
      "Negele",
      "Adola"
    ]
  },
  {
    "name": "Adama Special Zone",
    "districts": [
      "Adama"
    ]
  },
  {
    "name": "Jima Special Zone",
    "districts": [
      "Jima"
    ]
  },
  {
    "name": "West Arsi Zone",
    "districts": [
      "Siraro",
      "Shala",
      "Arsi Negele",
      "Kofele",
      "Kore",
      "Gedeb Asasa",
      "Dodola",
      "Kokosa",
      "Nensebo",
      "Adaba",
      "Shashemene",
      "Shashemene Zuria"
    ]
  },
  {
    "name": "Kelem Welega Zone",
    "districts": [
      "Hawa Gelan",
      "Yemalogi Welel",
      "Dale Wabera",
      "Gawo Kebe",
      "Seyo",
      "Denbi Dollo",
      "Anfilo",
      "Dale Sadi",
      "Gidami",
      "Jimma Horo",
      "Lalo Kile"
    ]
  },
  {
    "name": "Horo Gudru Welega Zone",
    "districts": [
      "Horo",
      "Shambu",
      "Guduru",
      "Hababo Guduru",
      "Abey Chomen",
      "Jima Genete",
      "Jima Rare",
      "Jardega Jarte",
      "Amuru",
      "Abe Dongoro"
    ]
  },
  {
    "name": "Burayu Special Zone",
    "districts": [
      "Burayu Special Wereda"
    ]
  }
];

export function getDistrictsForZone(zoneName: string): string[] {
  const zone = OROMIA_ZONES.find((z) => z.name === zoneName);
  if (!zone) return [];
  return [...new Set(zone.districts)].sort((a, b) => a.localeCompare(b));
}

export function getOromiaZoneNames(): string[] {
  return OROMIA_ZONES.map((z) => z.name);
}
