import { expect, test } from '@playwright/test';
import { mockWeatherData } from '../../src/mocks/weatherData';

const { city, current, days } = mockWeatherData;
const forecast = {
  timezone: mockWeatherData.timeZone,
  utc_offset_seconds: -10800,
  current_units: {
    time: 'iso8601',
    temperature_2m: '°C',
    apparent_temperature: '°C',
    weather_code: 'wmo code',
    relative_humidity_2m: '%',
    wind_speed_10m: 'km/h',
    precipitation: 'mm',
    pressure_msl: 'hPa',
  },
  daily_units: {
    time: 'iso8601',
    weather_code: 'wmo code',
    temperature_2m_max: '°C',
    temperature_2m_min: '°C',
    precipitation_probability_max: '%',
  },
  current: {
    time: '2026-10-27T12:00',
    temperature_2m: current.temperatureC,
    apparent_temperature: current.apparentTemperatureC,
    weather_code: current.condition?.code,
    relative_humidity_2m: current.relativeHumidityPercent,
    wind_speed_10m: current.windSpeedKmh,
    precipitation: current.precipitationMm,
    pressure_msl: current.pressureMslHpa,
  },
  daily: {
    time: days.map((day) => day.date),
    weather_code: days.map((day) => day.condition?.code),
    temperature_2m_max: days.map((day) => day.temperatureMaxC),
    temperature_2m_min: days.map((day) => day.temperatureMinC),
    precipitation_probability_max: days.map((day) => day.precipitationProbabilityMaxPercent),
  },
};

test.beforeEach(async ({ page }) => {
  await page.route('https://**/*', (route) => route.abort());
  await page.route('https://geocoding-api.open-meteo.com/**', (route) =>
    route.fulfill({
      json: { results: [{ ...city, id: Number(city.id), admin1: city.region }] },
    }),
  );
  await page.route('https://api.open-meteo.com/**', (route) => route.fulfill({ json: forecast }));
});

for (const [width, height, columns] of [
  [320, 740, 2],
  [375, 812, 2],
  [768, 1024, 3],
  [1440, 900, 5],
  [1920, 1080, 5],
]) {
  test(`layout sem overflow em ${width}px com ${columns} colunas`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Weather App' })).toBeVisible();
    await page.getByRole('searchbox').fill('São Paulo');
    await page.getByRole('searchbox').press('Enter');
    await expect(page.getByRole('article')).toHaveCount(5);
    const grid = page.getByRole('region', { name: 'Previsão de 5 dias' }).getByRole('list');
    expect(
      await grid.evaluate(
        (element) => getComputedStyle(element).gridTemplateColumns.split(' ').length,
      ),
    ).toBe(columns);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.getByRole('button', { name: '°F' }).click();
    await expect(page.getByText('77,7 °F', { exact: true })).toBeVisible();
    await expect(page.getByText('81,5 °F', { exact: true })).toBeVisible();
  });
}

test('busca e estados com recuperação de erro no mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Consulte o clima de uma cidade' })).toBeVisible();
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  let attempt = 0;
  await page.route('https://geocoding-api.open-meteo.com/**', async (route) => {
    attempt++;
    if (attempt === 1) {
      await pending;
      await route.fulfill({ json: { results: [] } });
    } else if (attempt === 2) {
      await route.fulfill({ status: 503, json: {} });
    } else {
      await route.fulfill({ json: { results: [{ ...city, admin1: city.region }] } });
    }
  });
  await page.getByRole('searchbox').fill(' São Paulo ');
  await page.getByRole('searchbox').press('Enter');
  await expect(page.getByRole('status')).toBeVisible();
  await expect(page.getByRole('searchbox')).toBeDisabled();
  release();
  await expect(page.getByRole('heading', { name: 'Nenhum resultado encontrado' })).toBeVisible();
  await page.getByRole('searchbox').press('Enter');
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(0);
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('article')).toHaveCount(5);
  await expect(page.getByRole('heading', { name: 'São Paulo', exact: true })).toBeVisible();
});

test('mantém foco e navegação por teclado na busca e no retry', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skipLink = page.getByRole('link', { name: 'Pular para o conteúdo' });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();

  const input = page.getByRole('searchbox');
  await input.focus();
  await expect(input).toHaveCSS('outline-style', 'solid');
  await expect(input).toHaveCSS('outline-width', '2px');
  await input.fill('Recife');
  await input.press('Enter');
  const results = page.getByRole('region', { name: 'Resultados da consulta' });
  await expect(results).toBeFocused();
  await expect(page.getByRole('article')).toHaveCount(5);
  await expect(results).toBeFocused();
  await page.route(
    'https://api.open-meteo.com/**',
    async (route) => {
      await route.fulfill({ status: 503, json: {} });
    },
    { times: 1 },
  );
  await input.press('Enter');
  await expect(page.getByRole('alert')).toBeVisible();
  const retry = page.getByRole('button', { name: 'Tentar novamente' });
  await retry.focus();
  await retry.press('Enter');
  await expect(results).toBeFocused();
  await expect(page.getByRole('article')).toHaveCount(5);
  await expect(results).toBeFocused();
});

test('consulta longa cabe em 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/');
  await page.getByRole('searchbox').fill('W'.repeat(100));
  await page.getByRole('searchbox').press('Enter');
  await expect(page.getByRole('article')).toHaveCount(5);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await expect(page.getByRole('article', { name: 'Previsão para ter., 27/10' })).toBeVisible();
});

test('input, texto dos botões e foco têm contraste suficiente', async ({ page }) => {
  await page.goto('/');
  const ratios = await page.getByRole('searchbox').evaluate((element) => {
    function luminance(color: string) {
      const channels = color.match(/[\d.]+/g);
      if (!channels || channels.length < 3) throw new Error(`Cor não suportada: ${color}`);
      const linear = channels.slice(0, 3).map((value) => {
        const channel = Number(value) / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      });
      return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
    }
    function contrast(a: string, b: string) {
      const first = luminance(a);
      const second = luminance(b);
      return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
    }
    element.focus();
    const style = getComputedStyle(element);
    const placeholder = getComputedStyle(element, '::placeholder');
    return {
      border: contrast(style.borderTopColor, style.backgroundColor),
      focus: contrast(style.outlineColor, style.backgroundColor),
      text: contrast(style.color, style.backgroundColor),
      placeholder: contrast(placeholder.color, style.backgroundColor),
      accentText: contrast('rgb(139, 155, 255)', 'rgb(11, 16, 32)'),
      hoverText: contrast('rgb(109, 124, 255)', 'rgb(11, 16, 32)'),
    };
  });
  expect(ratios.border).toBeGreaterThanOrEqual(3);
  expect(ratios.focus).toBeGreaterThanOrEqual(3);
  for (const ratio of [ratios.text, ratios.placeholder, ratios.accentText, ratios.hoverText]) {
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  }
});
