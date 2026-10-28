import { Season, WeatherCondition } from './types';

export function getSeasonForDay(day: number): Season {
  const dayInYear = ((day - 1) % 360) + 1;
  if (dayInYear <= 90) return 'spring';
  if (dayInYear <= 180) return 'summer';
  if (dayInYear <= 270) return 'autumn';
  return 'winter';
}

export function calculateThi(temperatureC: number, relativeHumidityPct: number): number {
  // Standart THI formülü: 0.8 * T + (RH/100) * (T - 14.4) + 46.4
  const thi = 0.8 * temperatureC + (relativeHumidityPct / 100) * (temperatureC - 14.4) + 46.4;
  return Math.round(thi * 10) / 10;
}

export function generateDailyWeather(day: number, season: Season): {
  weather: WeatherCondition;
  temperatureC: number;
  relativeHumidityPct: number;
  thiIndex: number;
} {
  let baseTemp = 18;
  let humidity = 60;
  let weather: WeatherCondition = 'sunny';

  const rand = Math.random();

  switch (season) {
    case 'spring':
      baseTemp = 15 + Math.sin(day * 0.1) * 6;
      humidity = 65;
      if (rand < 0.35) weather = 'rainy';
      else if (rand < 0.6) weather = 'cloudy';
      else weather = 'sunny';
      break;

    case 'summer':
      baseTemp = 28 + Math.sin(day * 0.1) * 7;
      humidity = 55;
      if (baseTemp > 32) {
        weather = 'heatwave';
        humidity = 65; // Yüksek nem + sıcaklık = tehlikeli THI
      } else if (rand < 0.15) {
        weather = 'storm';
      } else if (rand < 0.4) {
        weather = 'cloudy';
      } else {
        weather = 'sunny';
      }
      break;

    case 'autumn':
      baseTemp = 14 + Math.cos(day * 0.1) * 5;
      humidity = 70;
      if (rand < 0.4) weather = 'rainy';
      else if (rand < 0.7) weather = 'cloudy';
      else weather = 'sunny';
      break;

    case 'winter':
      baseTemp = 2 + Math.sin(day * 0.1) * 6;
      humidity = 75;
      if (baseTemp <= 0 && rand < 0.4) weather = 'snow';
      else if (rand < 0.3) weather = 'rainy';
      else weather = 'cloudy';
      break;
  }

  const finalTemp = Math.round(baseTemp * 10) / 10;
  const thi = calculateThi(finalTemp, humidity);

  return {
    weather,
    temperatureC: finalTemp,
    relativeHumidityPct: humidity,
    thiIndex: thi,
  };
}
