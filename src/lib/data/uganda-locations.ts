export interface LocationPoint {
  country: string;
  area: string;
  city: string;
  latitude: number;
  longitude: number;
}

export interface EastAfricanCountry {
  name: string;
  callingCode: string;
  cities: string[];
}

export const EAST_AFRICAN_COUNTRIES: EastAfricanCountry[] = [
  {
    name: "Uganda",
    callingCode: "+256",
    cities: ["Kampala", "Entebbe", "Jinja", "Mukono", "Mbarara", "Gulu", "Mbale", "Fort Portal", "Masaka", "Hoima", "Arua"],
  },
  {
    name: "Kenya",
    callingCode: "+254",
    cities: ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Thika", "Naivasha", "Malindi"],
  },
  {
    name: "Tanzania",
    callingCode: "+255",
    cities: ["Dar es Salaam", "Dodoma", "Arusha", "Mwanza", "Zanzibar City", "Mbeya", "Morogoro", "Tanga"],
  },
  {
    name: "Democratic Republic of the Congo",
    callingCode: "+243",
    cities: ["Kinshasa", "Lubumbashi", "Goma", "Bukavu", "Kisangani", "Mbuji-Mayi", "Matadi"],
  },
  {
    name: "Rwanda",
    callingCode: "+250",
    cities: ["Kigali", "Huye", "Musanze", "Rubavu", "Muhanga", "Rusizi"],
  },
  {
    name: "Burundi",
    callingCode: "+257",
    cities: ["Bujumbura", "Gitega", "Ngozi", "Rumonge", "Muyinga", "Bururi"],
  },
  {
    name: "South Sudan",
    callingCode: "+211",
    cities: ["Juba", "Wau", "Malakal", "Bor", "Yei", "Aweil"],
  },
];

const CITY_COORDINATES: Record<string, [number, number]> = {
  Entebbe: [0.064, 32.443],
  Jinja: [0.424, 33.204],
  Mukono: [0.353, 32.755],
  Mbarara: [-0.607, 30.655],
  Gulu: [2.775, 32.299],
  "Fort Portal": [0.671, 30.275],
  Mbale: [1.078, 34.175],
  Masaka: [-0.333, 31.734],
  Hoima: [1.432, 31.352],
  Arua: [3.02, 30.911],
  Kampala: [0.347596, 32.58252],
  Nairobi: [-1.286, 36.817],
  Mombasa: [-4.043, 39.668],
  Kisumu: [-0.102, 34.761],
  Nakuru: [-0.303, 36.08],
  Eldoret: [0.514, 35.269],
  Thika: [-1.033, 37.069],
  Naivasha: [-0.717, 36.431],
  Malindi: [-3.219, 40.117],
  "Dar es Salaam": [-6.792, 39.208],
  Dodoma: [-6.163, 35.751],
  Arusha: [-3.386, 36.683],
  Mwanza: [-2.516, 32.917],
  "Zanzibar City": [-6.165, 39.199],
  Mbeya: [-8.91, 33.46],
  Morogoro: [-6.823, 37.662],
  Tanga: [-5.068, 39.098],
  Kinshasa: [-4.322, 15.307],
  Lubumbashi: [-11.664, 27.479],
  Goma: [-1.679, 29.223],
  Bukavu: [-2.508, 28.86],
  Kisangani: [0.516, 25.191],
  "Mbuji-Mayi": [-6.136, 23.589],
  Matadi: [-5.817, 13.45],
  Kigali: [-1.944, 30.061],
  Huye: [-2.596, 29.739],
  Musanze: [-1.499, 29.635],
  Rubavu: [-1.678, 29.263],
  Muhanga: [-2.085, 29.752],
  Rusizi: [-2.484, 28.907],
  Bujumbura: [-3.382, 29.36],
  Gitega: [-3.427, 29.925],
  Ngozi: [-2.907, 29.83],
  Rumonge: [-3.973, 29.438],
  Muyinga: [-2.845, 30.342],
  Bururi: [-3.948, 29.624],
  Juba: [4.859, 31.571],
  Wau: [7.701, 27.996],
  Malakal: [9.533, 31.66],
  Bor: [6.208, 31.56],
  Yei: [4.095, 30.678],
  Aweil: [8.77, 27.397],
};

const UGANDA_NEIGHBORHOODS: LocationPoint[] = [
  { country: "Uganda", area: "Kawempe", city: "Kampala", latitude: 0.404, longitude: 32.566 },
  { country: "Uganda", area: "Kololo", city: "Kampala", latitude: 0.332, longitude: 32.594 },
  { country: "Uganda", area: "Nakasero", city: "Kampala", latitude: 0.323, longitude: 32.578 },
  { country: "Uganda", area: "Bugolobi", city: "Kampala", latitude: 0.313, longitude: 32.61 },
  { country: "Uganda", area: "Naguru", city: "Kampala", latitude: 0.338, longitude: 32.612 },
  { country: "Uganda", area: "Ntinda", city: "Kampala", latitude: 0.353, longitude: 32.615 },
  { country: "Uganda", area: "Bukoto", city: "Kampala", latitude: 0.348, longitude: 32.59 },
  { country: "Uganda", area: "Kamwokya", city: "Kampala", latitude: 0.34, longitude: 32.585 },
  { country: "Uganda", area: "Kisaasi", city: "Kampala", latitude: 0.37, longitude: 32.6 },
  { country: "Uganda", area: "Najjera", city: "Kampala", latitude: 0.378, longitude: 32.63 },
  { country: "Uganda", area: "Kyaliwajjala", city: "Kampala", latitude: 0.385, longitude: 32.64 },
  { country: "Uganda", area: "Kyanja", city: "Kampala", latitude: 0.375, longitude: 32.61 },
  { country: "Uganda", area: "Namugongo", city: "Kampala", latitude: 0.395, longitude: 32.65 },
  { country: "Uganda", area: "Munyonyo", city: "Kampala", latitude: 0.24, longitude: 32.625 },
  { country: "Uganda", area: "Muyenga", city: "Kampala", latitude: 0.295, longitude: 32.61 },
  { country: "Uganda", area: "Kabalagala", city: "Kampala", latitude: 0.298, longitude: 32.6 },
  { country: "Uganda", area: "Kansanga", city: "Kampala", latitude: 0.285, longitude: 32.605 },
  { country: "Uganda", area: "Lubowa", city: "Kampala", latitude: 0.248, longitude: 32.56 },
];

export const EAST_AFRICA_LOCATIONS: LocationPoint[] = [
  ...EAST_AFRICAN_COUNTRIES.flatMap((country) =>
    country.cities.map((city) => {
      const [latitude, longitude] = CITY_COORDINATES[city] ?? [0, 0];
      const area = city === "Kampala" ? "Central" : city;
      return { country: country.name, area, city, latitude, longitude };
    })
  ),
  ...UGANDA_NEIGHBORHOODS,
];

export const UGANDA_LOCATIONS: LocationPoint[] = [
  ...UGANDA_NEIGHBORHOODS,
  ...EAST_AFRICA_LOCATIONS.filter((location) => location.country === "Uganda" && location.city !== "Kampala"),
];

export const SERVICE_CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "female", label: "Women" },
  { value: "male", label: "Men" },
  { value: "bi-sexual", label: "Bi-sexual" },
  { value: "service", label: "Specialists & Services" },
];

export const SERVICE_TYPES: Record<string, string> = {
  all: "All Services",
  private_chef: "Private Chef",
  home_laundry: "Home Laundry",
  private_massage: "Private Massage",
  companionship: "Social Companionship",
  dinner_date: "Dinner & Events",
  erotic_massage: "Relaxing Massage",
};
