export interface MarkerData {
  id: string;
  lat: number;
  lng: number;
  name?: string;
  apiCode?: string;
  googleMapsLink: string;
  calendarLink?: string;
  capacity?: number;
  bedrooms?: number;
  bathrooms?: number;
  zone?: string;
}
