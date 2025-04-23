export interface SensorData {
  sensor_1: number;
  sensor_2: number;
  sensor_3: number;
  sensor_4: number;
  sensor_5: number;
  sensor_6: number;
  sensor_7: number;
  sensor_8: number;
  label: string;
}

export interface SensorResult {
  similarity: number;
  data: SensorData;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  lastReading: SensorData;
  history: SensorResult[];
}

export interface Doctor {
  location: null;
  experience: null;
  description: null;
  reviews: never[];
  rating: null;
  country: null;
  id: string;
  name: string;
  email: string;
  imageUrl: string;
  specialization: string;
}

export interface Notification {
  id: string;
  patientId: string;
  patientName: string;
  type: 'consultation' | 'emergency' | 'reading';
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: string;
  message: string;
}