import { geocodeLocation, getHourlyWeather, get7DayWeatherForecast } from '../services/weather.service.js';
import { getSolarDataList } from '../services/solarData.service.js';
import { sendSuccess } from '../utils/response.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Validates coordinate numbers and boundaries
 */
const validateCoordinates = (latitude, longitude) => {
  if (latitude === undefined || latitude === null || latitude === '' || longitude === undefined || longitude === null || longitude === '') {
    throw ApiError.unprocessableEntity('Both latitude and longitude query parameters are required.');
  }

  const lat = parseFloat(latitude);
  const lon = parseFloat(longitude);

  if (isNaN(lat) || isNaN(lon)) {
    throw ApiError.unprocessableEntity('Latitude and longitude must be valid numbers.');
  }

  if (lat < -90 || lat > 90) {
    throw ApiError.unprocessableEntity('Latitude must be between -90 and 90 degrees.');
  }

  if (lon < -180 || lon > 180) {
    throw ApiError.unprocessableEntity('Longitude must be between -180 and 180 degrees.');
  }

  return { lat, lon };
};

export const geocode = asyncHandler(async (req, res) => {
  const query = req.query.q;
  if (!query || typeof query !== 'string' || query.trim().length < 2) {
    throw ApiError.badRequest('Location query "q" must be at least 2 characters long.', 'VALIDATION_ERROR');
  }

  const results = await geocodeLocation(query);
  return sendSuccess(res, { results }, 200);
});

export const getCurrentWeather = asyncHandler(async (req, res) => {
  const { lat, lon } = validateCoordinates(req.query.latitude, req.query.longitude);

  const todayStr = new Date().toISOString().split('T')[0];
  const weather = await getHourlyWeather(lat, lon, todayStr);
  const curHour = new Date().getUTCHours();
  const current = weather.hourly[curHour] || weather.hourly[0];

  return sendSuccess(
    res,
    {
      current,
      location: {
        latitude: lat,
        longitude: lon,
        timezone: weather.timezone,
      },
      source: weather.source,
      fetchedAt: weather.fetchedAt,
    },
    200
  );
});

export const getForecastWeather = asyncHandler(async (req, res) => {
  const { lat, lon } = validateCoordinates(req.query.latitude, req.query.longitude);

  if (req.query.days === '7' || req.query.horizon === '7') {
    const capacityKw = req.query.capacityKw ? parseFloat(req.query.capacityKw) : (req.user?.preferences?.defaultCapacityKw || 25);
    const forecast7Day = await get7DayWeatherForecast(lat, lon, req.query.timezone || 'UTC', capacityKw);
    return sendSuccess(
      res,
      {
        location: {
          latitude: lat,
          longitude: lon,
          timezone: forecast7Day.timezone,
        },
        daily: forecast7Day.daily,
        model: forecast7Day.model,
        source: forecast7Day.source,
        fetchedAt: forecast7Day.fetchedAt,
      },
      200
    );
  }

  const dateStr = req.query.date || new Date().toISOString().split('T')[0];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr) || isNaN(new Date(dateStr).getTime())) {
    throw ApiError.unprocessableEntity('Date must be in valid YYYY-MM-DD format.');
  }

  const weather = await getHourlyWeather(lat, lon, dateStr);
  return sendSuccess(res, weather, 200);
});

/**
 * General weather endpoint: GET /api/weather
 * Supports coordinates directly or location query 'q'
 */
export const getWeather = asyncHandler(async (req, res) => {
  let lat;
  let lon;
  let locationName = req.query.location || req.query.name || null;

  if (req.query.q && (req.query.latitude === undefined || req.query.longitude === undefined)) {
    const geoResults = await geocodeLocation(req.query.q);
    if (!geoResults || geoResults.length === 0) {
      throw ApiError.notFound(`Location "${req.query.q}" could not be resolved.`);
    }
    lat = geoResults[0].latitude;
    lon = geoResults[0].longitude;
    locationName = `${geoResults[0].name}${geoResults[0].country ? ', ' + geoResults[0].country : ''}`;
  } else {
    const coords = validateCoordinates(req.query.latitude, req.query.longitude);
    lat = coords.lat;
    lon = coords.lon;
  }

  const dateStr = req.query.date || new Date().toISOString().split('T')[0];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr) || isNaN(new Date(dateStr).getTime())) {
    throw ApiError.unprocessableEntity('Date must be in valid YYYY-MM-DD format.');
  }

  const weather = await getHourlyWeather(lat, lon, dateStr);
  const curHour = new Date().getUTCHours();
  const current = weather.hourly[curHour] || weather.hourly[0];

  return sendSuccess(
    res,
    {
      location: {
        name: locationName,
        latitude: lat,
        longitude: lon,
        timezone: weather.timezone,
      },
      current,
      hourly: weather.hourly,
      source: weather.source,
      fetchedAt: weather.fetchedAt,
    },
    200
  );
});

export const getSolarData = asyncHandler(async (req, res) => {
  const result = await getSolarDataList(req.query);
  return sendSuccess(res, { records: result.records }, 200, result.meta);
});
