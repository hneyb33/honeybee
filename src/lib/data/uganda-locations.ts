export interface LocationPoint {
  area: string;
  city: string;
  latitude: number;
  longitude: number;
}

export const UGANDA_LOCATIONS: LocationPoint[] = [
  { area: "Kololo", city: "Kampala", latitude: 0.332, longitude: 32.594 },
  { area: "Nakasero", city: "Kampala", latitude: 0.323, longitude: 32.578 },
  { area: "Bugolobi", city: "Kampala", latitude: 0.313, longitude: 32.61 },
  { area: "Naguru", city: "Kampala", latitude: 0.338, longitude: 32.612 },
  { area: "Ntinda", city: "Kampala", latitude: 0.353, longitude: 32.615 },
  { area: "Bukoto", city: "Kampala", latitude: 0.348, longitude: 32.59 },
  { area: "Kamwokya", city: "Kampala", latitude: 0.34, longitude: 32.585 },
  { area: "Kisaasi", city: "Kampala", latitude: 0.37, longitude: 32.6 },
  { area: "Najjera", city: "Kampala", latitude: 0.378, longitude: 32.63 },
  { area: "Kyaliwajjala", city: "Kampala", latitude: 0.385, longitude: 32.64 },
  { area: "Kyanja", city: "Kampala", latitude: 0.375, longitude: 32.61 },
  { area: "Namugongo", city: "Kampala", latitude: 0.395, longitude: 32.65 },
  { area: "Munyonyo", city: "Kampala", latitude: 0.24, longitude: 32.625 },
  { area: "Muyenga", city: "Kampala", latitude: 0.295, longitude: 32.61 },
  { area: "Kabalagala", city: "Kampala", latitude: 0.298, longitude: 32.6 },
  { area: "Kansanga", city: "Kampala", latitude: 0.285, longitude: 32.605 },
  { area: "Lubowa", city: "Kampala", latitude: 0.248, longitude: 32.56 },
  { area: "Entebbe", city: "Entebbe", latitude: 0.064, longitude: 32.443 },
  { area: "Jinja", city: "Jinja", latitude: 0.424, longitude: 33.204 },
  { area: "Mukono", city: "Mukono", latitude: 0.353, longitude: 32.755 },
  { area: "Mbarara", city: "Mbarara", latitude: -0.607, longitude: 30.655 },
  { area: "Gulu", city: "Gulu", latitude: 2.775, longitude: 32.299 },
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
