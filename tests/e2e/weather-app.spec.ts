import { expect, test } from '@playwright/test';
import { mockWeatherData } from '../../src/mocks/weatherData';

const { city, current, days } = mockWeatherData;

function readContrast(element: Element) {
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
  const style = getComputedStyle(element);
  const placeholder = getComputedStyle(element, '::placeholder');
  return {
    border: contrast(style.borderTopColor, style.backgroundColor),
    focus: contrast(style.outlineColor, style.backgroundColor),
    text: contrast(style.color, style.backgroundColor),
    placeholder: contrast(placeholder.color, style.backgroundColor),
  };
}

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
  await page.clock.setFixedTime(new Date('2026-10-27T15:05:00Z'));
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
  [1024, 768, 5],
  [1440, 900, 5],
  [1920, 1080, 5],
]) {
  test(`layout sem overflow em ${width}px com ${columns} colunas`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Weather App' })).toBeVisible();
    await page.getByRole('searchbox', { name: 'Cidade' }).fill('São Paulo');
    await page.getByRole('searchbox', { name: 'Cidade' }).press('Enter');
    await page.getByRole('button', { name: 'São Paulo, São Paulo, Brasil', exact: true }).click();
    await expect(page.getByRole('article')).toHaveCount(5);
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    const forecastRegion = page.getByRole('region', { name: 'Previsão de 5 dias' });
    const grid = forecastRegion.getByRole('list');
    await expect
      .poll(() =>
        grid.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length),
      )
      .toBe(columns);
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
      .toBe(true);
    await page.getByRole('button', { name: '°F' }).click();
    const currentRegion = page.getByRole('region', { name: city.name, exact: true });
    await expect(currentRegion.getByText('77,7 °F', { exact: true })).toBeVisible();
    await expect(
      forecastRegion
        .getByRole('article', { name: 'Previsão para ter., 27/10' })
        .getByText('81,5 °F', { exact: true }),
    ).toBeVisible();
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
  const input = page.getByRole('searchbox', { name: 'Cidade' });
  try {
    await input.fill(' São Paulo ');
    await input.press('Enter');
    await expect(page.getByRole('status')).toBeVisible();
    await expect(input).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Buscar', exact: true })).toBeEnabled();
  } finally {
    release();
  }
  await expect(page.getByRole('heading', { name: 'Nenhum resultado encontrado' })).toBeVisible();
  await input.press('Enter');
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(0);
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('region', { name: 'Selecione uma cidade' })).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(0);
  await page.getByRole('button', { name: 'São Paulo, São Paulo, Brasil', exact: true }).click();
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

  const input = page.getByRole('searchbox', { name: 'Cidade' });
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button', { name: '°F' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button', { name: '°C' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button', { name: 'Buscar', exact: true })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(input).toBeFocused();
  await expect(input).toHaveCSS('outline-style', 'solid');
  await expect(input).toHaveCSS('outline-width', '2px');
  await input.fill('Recife');
  await input.press('Enter');
  const results = page.getByRole('region', { name: 'Resultados da consulta' });
  await expect(results).toBeFocused();
  await expect(page.getByRole('region', { name: 'Selecione uma cidade' })).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(0);
  const cityButton = page.getByRole('button', {
    name: 'São Paulo, São Paulo, Brasil',
    exact: true,
  });
  await page.keyboard.press('Tab');
  await expect(cityButton).toBeFocused();
  await expect(cityButton).toHaveCSS('outline-style', 'solid');
  await cityButton.press('Enter');
  await expect(page.getByRole('article')).toHaveCount(5);
  await expect(results).toBeFocused();
  await page.route(
    'https://api.open-meteo.com/**',
    async (route) => {
      await route.fulfill({ status: 503, json: {} });
    },
    { times: 1 },
  );
  await page.keyboard.press('Tab');
  await expect(cityButton).toBeFocused();
  await cityButton.press('Enter');
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(results).toBeFocused();
  const retry = page.getByRole('button', { name: 'Tentar novamente' });
  await page.keyboard.press('Tab');
  await expect(cityButton).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(retry).toBeFocused();
  await expect(retry).toHaveCSS('outline-style', 'solid');
  await retry.press('Enter');
  await expect(results).toBeFocused();
  await expect(page.getByRole('article')).toHaveCount(5);
  await expect(results).toBeFocused();
});

test('consulta longa cabe em 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Cidade' }).fill('W'.repeat(100));
  await page.getByRole('searchbox', { name: 'Cidade' }).press('Enter');
  await page.getByRole('button', { name: 'São Paulo, São Paulo, Brasil', exact: true }).click();
  await expect(page.getByRole('article')).toHaveCount(5);
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);
  await expect(page.getByRole('article', { name: 'Previsão para ter., 27/10' })).toBeVisible();
});

test('input, texto dos botões e foco têm contraste suficiente', async ({ page }) => {
  await page.goto('/');
  const input = page.getByRole('searchbox', { name: 'Cidade' });
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Pular para o conteúdo' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(input).toBeFocused();
  await expect(input).toHaveCSS('outline-style', 'solid');
  await expect
    .poll(async () => (await input.evaluate(readContrast)).border)
    .toBeGreaterThanOrEqual(3);
  await expect
    .poll(async () => (await input.evaluate(readContrast)).focus)
    .toBeGreaterThanOrEqual(3);
  await expect
    .poll(async () => (await input.evaluate(readContrast)).text)
    .toBeGreaterThanOrEqual(4.5);
  await expect
    .poll(async () => (await input.evaluate(readContrast)).placeholder)
    .toBeGreaterThanOrEqual(4.5);

  await input.fill('São Paulo');
  const search = page.getByRole('button', { name: 'Buscar', exact: true });
  await expect(search).toBeEnabled();
  await expect
    .poll(async () => (await search.evaluate(readContrast)).text)
    .toBeGreaterThanOrEqual(4.5);
  await search.hover();
  await expect
    .poll(async () => (await search.evaluate(readContrast)).text)
    .toBeGreaterThanOrEqual(4.5);
});
