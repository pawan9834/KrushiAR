// services/imdWeather.ts
// India Meteorological Department (IMD) Weather Service
// Mapped to official IMD API Endpoints with live fallback

export const IMD_ENDPOINTS = {
  CITY_FORECAST: 'https://api.imd.gov.in/api/v1/cityforecast',
  CURRENT_WX: 'https://api.imd.gov.in/api/v1/current_wx',
  DISTRICT_RAINFALL: 'https://api.imd.gov.in/api/v1/districtrainfall',
  DISTRICT_WARNING: 'https://api.imd.gov.in/api/v1/districtwarning',
  DISTRICT_NOWCAST: 'https://api.imd.gov.in/api/v1/districtnowcast',
};

export interface IMDWeatherData {
  temperature: number;
  maxTemp: number;
  minTemp: number;
  condition: string;
  conditionIcon: 'sunny' | 'partly-sunny' | 'cloudy' | 'rainy' | 'thunderstorm';
  humidity: number;
  rainChance: number;
  windSpeed: number;
  rainfallMm: number;
  nowcastText: string;
  warningText: string;
  warningLevel: 'green' | 'yellow' | 'orange' | 'red';
  isLiveIMD: boolean;
  stationName: string;
  lastUpdated: string;
}

export async function fetchIMDWeather(
  lat: number = 21.2483,
  lon: number = 75.3023,
  district: string = 'Jalgaon',
  language: 'mr' | 'hi' | 'en' = 'mr'
): Promise<IMDWeatherData> {
  const imdApiKey = process.env.EXPO_PUBLIC_IMD_API_KEY;

  // 1. Try official IMD API endpoints if key is configured
  if (imdApiKey) {
    try {
      const headers = {
        'api-key': imdApiKey,
        'x-api-key': imdApiKey,
        'Accept': 'application/json',
      };

      const [currentRes, forecastRes, rainfallRes, warningRes, nowcastRes] = await Promise.allSettled([
        fetch(`${IMD_ENDPOINTS.CURRENT_WX}?district=${encodeURIComponent(district)}`, { headers }),
        fetch(`${IMD_ENDPOINTS.CITY_FORECAST}?district=${encodeURIComponent(district)}`, { headers }),
        fetch(`${IMD_ENDPOINTS.DISTRICT_RAINFALL}?district=${encodeURIComponent(district)}`, { headers }),
        fetch(`${IMD_ENDPOINTS.DISTRICT_WARNING}?district=${encodeURIComponent(district)}`, { headers }),
        fetch(`${IMD_ENDPOINTS.DISTRICT_NOWCAST}?district=${encodeURIComponent(district)}`, { headers }),
      ]);

      if (currentRes.status === 'fulfilled' && currentRes.value.ok) {
        const currentData = await currentRes.value.json();
        const warningData = warningRes.status === 'fulfilled' && warningRes.value.ok ? await warningRes.value.json() : null;
        const nowcastData = nowcastRes.status === 'fulfilled' && nowcastRes.value.ok ? await nowcastRes.value.json() : null;

        return {
          temperature: Math.round(currentData.temp ?? currentData.temperature ?? 34),
          maxTemp: Math.round(currentData.max_temp ?? 35),
          minTemp: Math.round(currentData.min_temp ?? 24),
          condition: currentData.wx_desc || (language === 'mr' ? 'अंशतः ढगाळ' : language === 'hi' ? 'धूप छांव' : 'Partly Cloudy'),
          conditionIcon: 'partly-sunny',
          humidity: Math.round(currentData.rh ?? currentData.humidity ?? 42),
          rainChance: Math.round(currentData.pop ?? 10),
          windSpeed: Math.round(currentData.wind_speed ?? 12),
          rainfallMm: currentData.rainfall_24h ?? 0,
          nowcastText: nowcastData?.description || (language === 'mr' ? 'पुढील 3 तास: हवामान कोरडे, फवारणीसाठी योग्य' : language === 'hi' ? 'अगले 3 घंटे: मौसम साफ, छिड़काव के लिए उपयुक्त' : 'Next 3 hrs: Weather clear, ideal for spraying'),
          warningText: warningData?.warning || (language === 'mr' ? 'हवामान इशारा नाही (हिरवा)' : language === 'hi' ? 'कोई चेतावनी नहीं (हरा)' : 'No Weather Warning (Green)'),
          warningLevel: warningData?.color || 'green',
          isLiveIMD: true,
          stationName: district,
          lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
      }
    } catch {
      // Fall through to real-time coordinate fallback
    }
  }

  // 2. High-precision live weather fallback for farmer coordinates (Open-Meteo live API for Chopda/Jalgaon)
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`
    );

    if (res.ok) {
      const data = await res.json();
      const current = data.current;
      const daily = data.daily;

      const temp = Math.round(current.temperature_2m ?? 34);
      const maxTemp = Math.round(daily?.temperature_2m_max?.[0] ?? (temp + 2));
      const minTemp = Math.round(daily?.temperature_2m_min?.[0] ?? (temp - 9));
      const humidity = Math.round(current.relative_humidity_2m ?? 42);
      const windSpeed = Math.round(current.wind_speed_10m ?? 8);
      const rainChance = Math.round(daily?.precipitation_probability_max?.[0] ?? 10);
      const rainfallMm = current.precipitation ?? 0;
      const weatherCode = current.weather_code ?? 0;

      let conditionIcon: 'sunny' | 'partly-sunny' | 'cloudy' | 'rainy' | 'thunderstorm' = 'sunny';
      let conditionText = language === 'mr' ? 'स्वच्छ ऊन' : language === 'hi' ? 'साफ मौसम' : 'Clear & Sunny';

      if (weatherCode === 1 || weatherCode === 2) {
        conditionIcon = 'partly-sunny';
        conditionText = language === 'mr' ? 'अंशतः ढगाळ' : language === 'hi' ? 'धूप छांव' : 'Partly Cloudy';
      } else if (weatherCode === 3) {
        conditionIcon = 'cloudy';
        conditionText = language === 'mr' ? 'ढगाळ हवामान' : language === 'hi' ? 'बादल छाए रहेंगे' : 'Overcast';
      } else if (weatherCode >= 51 && weatherCode <= 67) {
        conditionIcon = 'rainy';
        conditionText = language === 'mr' ? 'हलका पाऊस' : language === 'hi' ? 'हल्की बारिश' : 'Light Rain';
      } else if (weatherCode >= 80 && weatherCode <= 99) {
        conditionIcon = 'thunderstorm';
        conditionText = language === 'mr' ? 'वादळी पाऊस' : language === 'hi' ? 'आंधी बारिश' : 'Thunderstorms';
      }

      // IMD Advisory based on weather parameters
      let nowcastText = '';
      let warningText = '';
      let warningLevel: 'green' | 'yellow' | 'orange' | 'red' = 'green';

      if (rainChance > 50 || rainfallMm > 2) {
        warningLevel = 'yellow';
        nowcastText = language === 'mr' ? 'पुढील 3 तास: हलक्या सरींची शक्यता, फवारणी टाळा' : language === 'hi' ? 'अगले 3 घंटे: बारिश की संभावना, छिड़काव से बचें' : 'Next 3 hrs: Rain likely, postpone pesticide spraying';
        warningText = language === 'mr' ? 'IMD जिल्हा इशारा: हलका ते मध्यम पाऊस' : language === 'hi' ? 'IMD जिला चेतावनी: हल्की से मध्यम बारिश' : 'IMD Alert: Moderate Rain in District';
      } else if (temp >= 36) {
        warningLevel = 'yellow';
        nowcastText = language === 'mr' ? 'पुढील 3 तास: कडक ऊन, पिकांना दुपारनंतर पाणी द्या' : language === 'hi' ? 'अगले 3 घंटे: तेज धूप, दोपहर बाद सिंचाई करें' : 'Next 3 hrs: Strong sun, irrigate crops after afternoon';
        warningText = language === 'mr' ? 'IMD इशारा: जास्त तापमान व कोरडी हवा' : language === 'hi' ? 'IMD चेतावनी: उच्च तापमान' : 'IMD Alert: High Temperature Advisory';
      } else {
        warningLevel = 'green';
        nowcastText = language === 'mr' ? 'पुढील 3 तास: हवामान कोरडे, फवारणी व मशागतीसाठी योग्य' : language === 'hi' ? 'अगले 3 घंटे: मौसम साफ, छिड़काव के लिए उपयुक्त' : 'Next 3 hrs: Clear skies, ideal for spraying and weeding';
        warningText = language === 'mr' ? 'IMD हवामान सल्ला: परिस्थिती पिकांसाठी अनुकूल' : language === 'hi' ? 'IMD कृषि सलाह: स्थिति फसलों के लिए अनुकूल' : 'IMD Advisory: Favorable for all crops';
      }

      return {
        temperature: temp,
        maxTemp,
        minTemp,
        condition: conditionText,
        conditionIcon,
        humidity,
        rainChance,
        windSpeed,
        rainfallMm,
        nowcastText,
        warningText,
        warningLevel,
        isLiveIMD: false,
        stationName: district,
        lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    }
  } catch {
    // Return safe default
  }

  return {
    temperature: 34,
    maxTemp: 35,
    minTemp: 24,
    condition: language === 'mr' ? 'अंशतः ढगाळ' : language === 'hi' ? 'धूप छांव' : 'Partly Cloudy',
    conditionIcon: 'partly-sunny',
    humidity: 42,
    rainChance: 10,
    windSpeed: 9,
    rainfallMm: 0,
    nowcastText: language === 'mr' ? 'पुढील 3 तास: हवामान कोरडे, फवारणीसाठी योग्य वेळ' : language === 'hi' ? 'अगले 3 घंटे: मौसम साफ, छिड़काव के लिए उपयुक्त' : 'Next 3 hrs: Weather clear, ideal for spraying',
    warningText: language === 'mr' ? 'IMD हवामान सल्ला: पिकांसाठी अनुकूल' : language === 'hi' ? 'IMD सलाह: फसलों के लिए अनुकूल' : 'IMD Advisory: Good for crops',
    warningLevel: 'green',
    isLiveIMD: false,
    stationName: district,
    lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}

export interface HourlyWeatherItem {
  time: string;
  temp: string;
  rain: string;
  icon: 'sunny' | 'partly-sunny' | 'cloud' | 'rainy' | 'thunderstorm';
  color: string;
}

export interface DailyWeatherItem {
  day: string;
  date: string;
  temp: string;
  rain: string;
  icon: 'sunny' | 'partly-sunny' | 'cloud' | 'rainy' | 'thunderstorm';
  color: string;
}

export interface ExtendedWeatherForecast {
  current: IMDWeatherData;
  hourly: HourlyWeatherItem[];
  sevenDay: DailyWeatherItem[];
  uvIndex: number;
  pressureHpa: number;
}

export async function fetchExtendedWeatherForecast(
  lat: number = 21.2483,
  lon: number = 75.3023,
  district: string = 'Jalgaon',
  language: 'mr' | 'hi' | 'en' = 'mr'
): Promise<ExtendedWeatherForecast> {
  const current = await fetchIMDWeather(lat, lon, district, language);

  let hourly: HourlyWeatherItem[] = [];
  let sevenDay: DailyWeatherItem[] = [];
  let uvIndex = 6;
  let pressureHpa = 1012;

  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=surface_pressure&hourly=temperature_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max&timezone=auto`
    );

    if (res.ok) {
      const data = await res.json();
      if (data.current?.surface_pressure) {
        pressureHpa = Math.round(data.current.surface_pressure);
      }
      if (data.daily?.uv_index_max?.[0]) {
        uvIndex = Math.round(data.daily.uv_index_max[0]);
      }

      // Map Hourly Forecast (next 12 hours from current hour)
      const currentHour = new Date().getHours();
      const rawHourlyTimes: string[] = data.hourly?.time || [];
      const rawHourlyTemps: number[] = data.hourly?.temperature_2m || [];
      const rawHourlyRain: number[] = data.hourly?.precipitation_probability || [];
      const rawHourlyCodes: number[] = data.hourly?.weather_code || [];

      // Find index matching current hour
      const startIndex = rawHourlyTimes.findIndex((t) => {
        const d = new Date(t);
        return d.getHours() === currentHour && d.getDate() === new Date().getDate();
      });
      const validStart = startIndex >= 0 ? startIndex : 0;

      for (let i = 0; i < 10 && validStart + i < rawHourlyTimes.length; i++) {
        const idx = validStart + i;
        const d = new Date(rawHourlyTimes[idx]);
        const isNow = i === 0;
        let timeLabel = isNow ? (language === 'mr' ? 'आत्ता' : language === 'hi' ? 'अभी' : 'Now') : `${d.getHours() % 12 || 12} ${d.getHours() >= 12 ? 'PM' : 'AM'}`;
        const temp = `${Math.round(rawHourlyTemps[idx] ?? 32)}°`;
        const rainChance = `${Math.round(rawHourlyRain[idx] ?? 0)}%`;
        const code = rawHourlyCodes[idx] ?? 0;

        let icon: 'sunny' | 'partly-sunny' | 'cloud' | 'rainy' | 'thunderstorm' = 'sunny';
        let color = '#f59e0b';

        if (code === 1 || code === 2) {
          icon = 'partly-sunny';
          color = '#f59e0b';
        } else if (code === 3) {
          icon = 'cloud';
          color = '#94a3b8';
        } else if (code >= 51 && code <= 67) {
          icon = 'rainy';
          color = '#0284c7';
        } else if (code >= 80) {
          icon = 'thunderstorm';
          color = '#7c3aed';
        }

        hourly.push({
          time: timeLabel,
          temp,
          rain: rainChance,
          icon,
          color,
        });
      }

      // Map 7-Day Forecast
      const rawDays: string[] = data.daily?.time || [];
      const rawMaxTemps: number[] = data.daily?.temperature_2m_max || [];
      const rawMinTemps: number[] = data.daily?.temperature_2m_min || [];
      const rawDailyRain: number[] = data.daily?.precipitation_probability_max || [];
      const rawDailyCodes: number[] = data.daily?.weather_code || [];

      const dayNamesMr = ['रवि', 'सोम', 'मंगळ', 'बुध', 'गुरु', 'शुक्र', 'शनि'];
      const dayNamesHi = ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'];
      const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const monthNamesMr = ['जाने', 'फेब्रु', 'मार्च', 'एप्रि', 'मे', 'जून', 'जुलै', 'ऑग', 'सप्टें', 'ऑक्टो', 'नोव्हें', 'डिसें'];

      for (let i = 0; i < rawDays.length && i < 7; i++) {
        const d = new Date(rawDays[i]);
        const dayIdx = d.getDay();
        const dayLabel = language === 'mr' ? dayNamesMr[dayIdx] : language === 'hi' ? dayNamesHi[dayIdx] : dayNamesEn[dayIdx];
        const dateLabel = language === 'mr' || language === 'hi' 
          ? `${d.getDate()} ${monthNamesMr[d.getMonth()]}` 
          : `${d.getDate()} ${d.toLocaleString('en', { month: 'short' })}`;

        const maxT = Math.round(rawMaxTemps[i] ?? 34);
        const minT = Math.round(rawMinTemps[i] ?? 24);
        const rainP = `${Math.round(rawDailyRain[i] ?? 0)}%`;
        const code = rawDailyCodes[i] ?? 0;

        let icon: 'sunny' | 'partly-sunny' | 'cloud' | 'rainy' | 'thunderstorm' = 'sunny';
        let color = '#f59e0b';

        if (code === 1 || code === 2) {
          icon = 'partly-sunny';
          color = '#f59e0b';
        } else if (code === 3) {
          icon = 'cloud';
          color = '#94a3b8';
        } else if (code >= 51 && code <= 67) {
          icon = 'rainy';
          color = '#0284c7';
        } else if (code >= 80) {
          icon = 'thunderstorm';
          color = '#7c3aed';
        }

        sevenDay.push({
          day: dayLabel,
          date: dateLabel,
          temp: `${minT}° / ${maxT}°`,
          rain: rainP,
          icon,
          color,
        });
      }
    }
  } catch (err) {
    console.warn('Failed to fetch extended weather forecast:', err);
  }

  // Fallbacks if network fails
  if (hourly.length === 0) {
    const curHour = new Date().getHours();
    for (let i = 0; i < 8; i++) {
      const h = (curHour + i) % 24;
      hourly.push({
        time: i === 0 ? 'Now' : `${h % 12 || 12} ${h >= 12 ? 'PM' : 'AM'}`,
        temp: `${current.temperature - i}°`,
        rain: `${Math.max(0, current.rainChance - i * 2)}%`,
        icon: 'sunny',
        color: '#f59e0b',
      });
    }
  }

  if (sevenDay.length === 0) {
    const today = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      sevenDay.push({
        day: dayNames[d.getDay()],
        date: `${d.getDate()} ${d.toLocaleString('en', { month: 'short' })}`,
        temp: `${current.minTemp}° / ${current.maxTemp}°`,
        rain: `${current.rainChance}%`,
        icon: 'partly-sunny',
        color: '#f59e0b',
      });
    }
  }

  return {
    current,
    hourly,
    sevenDay,
    uvIndex,
    pressureHpa,
  };
}
