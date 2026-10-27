import { expect, type Page, test } from '@playwright/test';

const dates = ['2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31'];
const forecast = {
  timezone: 'America/Sao_Paulo',
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
    temperature_2m: 0,
    apparent_temperature: -2,
    weather_code: 0,
    relative_humidity_2m: 65,
    wind_speed_10m: 10,
    precipitation: 0,
    pressure_msl: 1015,
  },
  daily: {
    time: dates,
    weather_code: [0, 2, 61, 3, 0],
    temperature_2m_min: [-2, 0, 1, 2, 3],
    temperature_2m_max: [10, 11, 12, 13, 14],
    precipitation_probability_max: [0, 20, 80, 30, 10],
  },
};

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-27T15:05:00Z'));
  await page.route('https://**/*', (route) => route.abort());
  await page.route('https://geocoding-api.open-meteo.com/**', (route) =>
    route.fulfill({
      json: {
        results: [
          {
            id: 3448439,
            name: 'São Paulo',
            admin1: 'São Paulo',
            country: 'Brasil',
            latitude: -23.5475,
            longitude: -46.6361,
          },
        ],
      },
    }),
  );
  await page.route('https://api.open-meteo.com/**', (route) => route.fulfill({ json: forecast }));
});

for (const mobile of [false, true]) {
  test(`busca e converte 0 °C em 32 °F${mobile ? ' em 375x812' : ''}`, async ({ page }) => {
    if (mobile) await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.getByRole('searchbox', { name: 'Cidade' }).fill('São Paulo');
    await page.getByRole('button', { name: 'Buscar', exact: true }).click();

    await selectCity(page);
    const current = page.getByRole('region', { name: 'São Paulo', exact: true });
    const days = page.getByRole('region', { name: 'Previsão de 5 dias' });
    await expect(current.getByRole('heading', { name: 'São Paulo', exact: true })).toBeVisible();
    await expect(current.getByText('0,0 °C', { exact: true })).toBeVisible();
    await expect(days).toBeVisible();
    await expect(days.getByRole('article')).toHaveCount(5);

    await page.getByRole('button', { name: '°F', exact: true }).click();
    await expect(current.getByText('32,0 °F', { exact: true })).toBeVisible();
    await expect(current.getByText('Sensação térmica: 28,4 °F')).toBeVisible();
    await expect(days.getByText('50,0 °F', { exact: true })).toBeVisible();
    await expect(current.getByText('0 mm', { exact: true })).toBeVisible();
  });
}

test('geocoding sem results mostra vazio, não consulta forecast e permite nova busca', async ({
  page,
}) => {
  const forecastRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().startsWith('https://api.open-meteo.com/')) {
      forecastRequests.push(request.url());
    }
  });
  await page.route(
    'https://geocoding-api.open-meteo.com/**',
    (route) => route.fulfill({ json: {} }),
    { times: 1 },
  );
  await page.goto('/');
  const input = page.getByRole('searchbox', { name: 'Cidade' });
  await input.fill('Inexistente');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Nenhum resultado encontrado' })).toBeVisible();
  await expect(input).toBeEnabled();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByRole('article')).toHaveCount(0);
  expect(forecastRequests).toEqual([]);

  await input.fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await selectCity(page);
  await expect(page.getByRole('region', { name: 'São Paulo', exact: true })).toBeVisible();
  expect(forecastRequests).toHaveLength(1);
});

for (const failure of ['http', 'partial', 'empty-current', 'offline'] as const) {
  test(`forecast com falha ${failure} remove dados anteriores e permite retry em Fahrenheit`, async ({
    page,
  }) => {
    const requests = countRequests(page);
    await page.goto('/');
    await page.getByLabel('Cidade', { exact: true }).fill('São Paulo');
    await page.getByRole('button', { name: 'Buscar', exact: true }).click();
    await selectCity(page);
    await expect(page.getByRole('article')).toHaveCount(5);

    await page.route(
      'https://api.open-meteo.com/**',
      (route) =>
        failure === 'offline'
          ? route.abort('internetdisconnected')
          : route.fulfill(
              failure === 'http'
                ? { status: 503, json: {} }
                : { json: { ...forecast, current: failure === 'empty-current' ? {} : undefined } },
            ),
      { times: 1 },
    );
    await selectCity(page);
    await expect(page.getByRole('alert')).toContainText(
      failure === 'http'
        ? 'Não foi possível consultar o serviço meteorológico.'
        : failure === 'offline'
          ? 'Não foi possível conectar ao serviço meteorológico. Verifique sua conexão e tente novamente.'
          : 'O serviço retornou uma resposta incompleta ou inválida.',
    );
    await expect(page.getByRole('article')).toHaveCount(0);
    await expect(page.getByRole('region', { name: 'São Paulo', exact: true })).toHaveCount(0);

    await page.getByRole('button', { name: '°F', exact: true }).click();
    await page.getByRole('button', { name: 'Tentar novamente' }).click();
    await expect(
      page
        .getByRole('region', { name: 'São Paulo', exact: true })
        .getByText('32,0 °F', { exact: true }),
    ).toBeVisible();
    await expect(page.getByRole('article')).toHaveCount(5);
    await expect(page.getByRole('alert')).toHaveCount(0);
    expect(requests.geocoding).toHaveLength(1);
    expect(requests.forecast).toHaveLength(3);
  });
}

test('campos nulos são indisponíveis e valores válidos continuam convertíveis', async ({
  page,
}) => {
  await page.route('https://api.open-meteo.com/**', (route) =>
    route.fulfill({
      json: {
        ...forecast,
        current: { ...forecast.current, precipitation: null, apparent_temperature: null },
        daily: { ...forecast.daily, temperature_2m_max: [null, 11, 12, 13, 14] },
      },
    }),
  );
  await page.goto('/');
  await page.getByLabel('Cidade', { exact: true }).fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await selectCity(page);
  const current = page.getByRole('region', { name: 'São Paulo', exact: true });
  await expect(current.getByText('Indisponível', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '°F', exact: true }).click();
  await expect(current.getByText('32,0 °F', { exact: true })).toBeVisible();
  await expect(current.getByText('Sensação térmica: Indisponível')).toBeVisible();
  await expect(current.getByText('0 mm', { exact: true })).toHaveCount(0);
  const firstDay = page.getByRole('article', { name: 'Previsão para ter., 27/10' });
  await expect(firstDay.getByText('Indisponível', { exact: true })).toBeVisible();
  await expect(firstDay.getByText('28,4 °F', { exact: true })).toBeVisible();
});

async function selectCity(page: Page) {
  await page
    .getByRole('region', { name: 'Selecione uma cidade' })
    .getByRole('button', { name: 'São Paulo, São Paulo, Brasil', exact: true })
    .click();
}

async function search(page: Page, query = 'São Paulo') {
  await page.getByRole('searchbox', { name: 'Cidade' }).fill(query);
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
}

function countRequests(page: Page) {
  const requests = { geocoding: [] as URL[], forecast: [] as URL[] };
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.hostname === 'geocoding-api.open-meteo.com') requests.geocoding.push(url);
    if (url.hostname === 'api.open-meteo.com') requests.forecast.push(url);
  });
  return requests;
}

for (const query of ['', '   ', ' ab ', 'W'.repeat(101)]) {
  test(`busca inválida ${JSON.stringify(query)} orienta sem requests`, async ({ page }) => {
    const requests = countRequests(page);
    await page.goto('/');
    await search(page, query);
    await expect(page.getByRole('alert')).toContainText('3 a 100 caracteres');
    await expect(page.getByRole('searchbox', { name: 'Cidade' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(requests.geocoding).toHaveLength(0);
    expect(requests.forecast).toHaveLength(0);
  });
}

test('lista no máximo dez homônimos na ordem recebida e seleciona coordenadas do segundo', async ({
  page,
}) => {
  const requests = countRequests(page);
  const cities = Array.from({ length: 12 }, (_, index) => ({
    id: index + 1,
    name: 'São Paulo',
    admin1: 'São Paulo',
    country: 'Brasil',
    latitude: -23.5475 + index,
    longitude: -46.6361 + index,
  }));
  await page.route('https://geocoding-api.open-meteo.com/**', (route) =>
    route.fulfill({ json: { results: cities } }),
  );
  await page.goto('/');
  await search(page, ' São Paulo ');
  const options = page.getByRole('region', { name: 'Selecione uma cidade' }).getByRole('button');
  const names = cities
    .slice(0, 10)
    .map((city) => `São Paulo, São Paulo, Brasil (${city.latitude}, ${city.longitude})`);
  await expect(options).toHaveCount(10);
  await expect(options).toHaveText(names);
  await expect(page.getByRole('article')).toHaveCount(0);
  expect(requests.forecast).toHaveLength(0);
  expect(requests.geocoding[0].searchParams.get('name')).toBe('São Paulo');
  await page.getByRole('button', { name: names[1], exact: true }).click();
  await expect(page.getByRole('article')).toHaveCount(5);
  expect(requests.forecast).toHaveLength(1);
  expect(requests.forecast[0].searchParams.get('latitude')).toBe(String(cities[1].latitude));
  expect(requests.forecast[0].searchParams.get('longitude')).toBe(String(cities[1].longitude));
});

test('retry de geocoding refaz apenas busca e exige selecionar a cidade', async ({ page }) => {
  const requests = countRequests(page);
  await page.route(
    'https://geocoding-api.open-meteo.com/**',
    (route) => route.fulfill({ status: 503, json: {} }),
    { times: 1 },
  );
  await page.goto('/');
  await search(page);
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Nenhum resultado encontrado' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('region', { name: 'Selecione uma cidade' })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByRole('article')).toHaveCount(0);
  expect(requests.geocoding).toHaveLength(2);
  expect(requests.forecast).toHaveLength(0);
  await selectCity(page);
  await expect(page.getByRole('article')).toHaveCount(5);
  expect(requests.forecast).toHaveLength(1);
});

test('unidade persiste no reload sem persistir cidade nem iniciar consultas', async ({ page }) => {
  const requests = countRequests(page);
  await page.goto('/');
  await search(page);
  await selectCity(page);
  await expect(page.getByRole('article')).toHaveCount(5);
  await page.getByRole('button', { name: '°F', exact: true }).click();
  expect(await page.evaluate(() => localStorage.getItem('weather-unit'))).toBe('fahrenheit');
  await page.reload();
  await expect(page.getByRole('button', { name: '°F', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('heading', { name: 'Consulte o clima de uma cidade' })).toBeVisible();
  await expect(page.getByRole('searchbox', { name: 'Cidade' })).toHaveValue('');
  await expect(page.getByRole('region', { name: 'Selecione uma cidade' })).toHaveCount(0);
  await expect(page.getByRole('article')).toHaveCount(0);
  expect(requests.geocoding).toHaveLength(1);
  expect(requests.forecast).toHaveLength(1);
  await search(page);
  await selectCity(page);
  await expect(
    page
      .getByRole('region', { name: 'São Paulo', exact: true })
      .getByText('32,0 °F', { exact: true }),
  ).toBeVisible();
});

test('Atualizar refaz apenas forecast e renova horário de consulta sem alterar observação', async ({
  page,
}) => {
  const requests = countRequests(page);
  await page.goto('/');
  await search(page);
  await selectCity(page);
  const consulted = page.getByText(/^Última consulta bem-sucedida:/);
  const current = page.getByRole('region', { name: 'São Paulo', exact: true });
  await expect(consulted).toContainText('12:05:00');
  await expect(current.getByText(/^Observação:/)).toContainText('12:00');
  await page.clock.setFixedTime(new Date('2026-10-27T15:10:00Z'));
  await page.getByRole('button', { name: 'Atualizar', exact: true }).click();
  await expect(consulted).toContainText('12:10:00');
  await expect(current.getByText(/^Observação:/)).toContainText('12:00');
  expect(requests.geocoding).toHaveLength(1);
  expect(requests.forecast).toHaveLength(2);
  expect(requests.forecast[1].searchParams.get('latitude')).toBe(
    requests.forecast[0].searchParams.get('latitude'),
  );
  expect(requests.forecast[1].searchParams.get('longitude')).toBe(
    requests.forecast[0].searchParams.get('longitude'),
  );
});

test('três datas parciais preenchem cinco cards a partir de hoje local com duas indisponíveis', async ({
  page,
}) => {
  await page.route('https://api.open-meteo.com/**', (route) =>
    route.fulfill({
      json: {
        ...forecast,
        daily: {
          time: dates.slice(1, 4),
          weather_code: [2, 61, 3],
          temperature_2m_min: [0, 1, 2],
          temperature_2m_max: [11, 12, 13],
          precipitation_probability_max: [20, 80, 30],
        },
      },
    }),
  );
  await page.goto('/');
  await search(page);
  await selectCity(page);
  const region = page.getByRole('region', { name: 'Previsão de 5 dias' });
  await expect(region.getByRole('article')).toHaveCount(5);
  await expect(
    region.getByText('Cobertura incompleta: 2 dia(s) sem previsão disponível.'),
  ).toBeVisible();
  for (const day of ['ter., 27/10', 'sáb., 31/10']) {
    const card = region.getByRole('article', { name: `Previsão para ${day}` });
    await expect(card).toBeVisible();
    await expect(card.getByText('Indisponível', { exact: true })).toHaveCount(4);
  }
  await expect(
    region
      .getByRole('article', { name: 'Previsão para qua., 28/10' })
      .getByText('11,0 °C', { exact: true }),
  ).toBeVisible();
  await expect(
    region
      .getByRole('article', { name: 'Previsão para qui., 29/10' })
      .getByText('12,0 °C', { exact: true }),
  ).toBeVisible();
  await expect(
    region
      .getByRole('article', { name: 'Previsão para sex., 30/10' })
      .getByText('13,0 °C', { exact: true }),
  ).toBeVisible();
});

for (const [time, stale] of [
  ['2026-10-27T10:05', false],
  ['2026-10-27T10:04', true],
] as const) {
  test(`observação ${time} só fica desatualizada acima de duas horas`, async ({ page }) => {
    await page.route('https://api.open-meteo.com/**', (route) =>
      route.fulfill({ json: { ...forecast, current: { ...forecast.current, time } } }),
    );
    await page.goto('/');
    await search(page);
    await selectCity(page);
    const current = page.getByRole('region', { name: 'São Paulo', exact: true });
    await expect(current.getByText(/^Observação:/)).toContainText(time.slice(11));
    await expect(current.getByText('Desatualizado', { exact: true })).toHaveCount(stale ? 1 : 0);
  });
}

test('não atualiza automaticamente após trinta minutos nem ao voltar à página', async ({
  page,
}) => {
  const requests = countRequests(page);
  await page.clock.install({ time: new Date('2026-10-27T15:05:00Z') });
  await page.goto('/');
  await search(page);
  await selectCity(page);
  await expect(page.getByRole('article')).toHaveCount(5);
  await page.clock.fastForward('30:00');
  await page.evaluate(() => {
    window.dispatchEvent(new Event('blur'));
    window.dispatchEvent(new Event('focus'));
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.getByText(/^Última consulta bem-sucedida:/)).toContainText('12:05:00');
  expect(requests.geocoding).toHaveLength(1);
  expect(requests.forecast).toHaveLength(1);
});

test('busca concorrente mantém B quando resposta A chega atrasada', async ({ page }) => {
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  const recife = {
    id: 3390760,
    name: 'Recife',
    admin1: 'Pernambuco',
    country: 'Brasil',
    latitude: -8.05,
    longitude: -34.9,
  };
  await page.route('https://geocoding-api.open-meteo.com/**', async (route) => {
    if (new URL(route.request().url()).searchParams.get('name') === 'São Paulo') {
      await pending;
      await route.fulfill({
        json: { results: [{ ...recife, id: 3448439, name: 'São Paulo', admin1: 'São Paulo' }] },
      });
    } else {
      await route.fulfill({ json: { results: [recife] } });
    }
  });
  await page.goto('/');
  const lateResponse = page.waitForResponse(
    (response) =>
      response.url().includes('geocoding-api') &&
      new URL(response.url()).searchParams.get('name') === 'São Paulo',
  );
  try {
    await search(page);
    await expect(page.getByRole('status')).toBeVisible();
    await expect(page.getByRole('searchbox', { name: 'Cidade' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Buscar', exact: true })).toBeEnabled();
    await search(page, 'Recife');
    await expect(
      page.getByRole('button', { name: 'Recife, Pernambuco, Brasil', exact: true }),
    ).toBeVisible();
  } finally {
    release();
  }
  await (await lateResponse).finished();
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await expect(
    page.getByRole('button', { name: 'São Paulo, São Paulo, Brasil', exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Recife, Pernambuco, Brasil', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(0);
});

test('forecast tardio da cidade A não substitui clima da cidade B', async ({ page }) => {
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  const cities = [
    {
      id: 3448439,
      name: 'São Paulo',
      admin1: 'São Paulo',
      country: 'Brasil',
      latitude: -23.5475,
      longitude: -46.6361,
    },
    {
      id: 3390760,
      name: 'Recife',
      admin1: 'Pernambuco',
      country: 'Brasil',
      latitude: -8.05,
      longitude: -34.9,
    },
  ];
  await page.route('https://geocoding-api.open-meteo.com/**', (route) =>
    route.fulfill({ json: { results: cities } }),
  );
  await page.route('https://api.open-meteo.com/**', async (route) => {
    const first =
      new URL(route.request().url()).searchParams.get('latitude') === String(cities[0].latitude);
    if (first) await pending;
    await route.fulfill({
      json: { ...forecast, current: { ...forecast.current, temperature_2m: first ? 0 : 25 } },
    });
  });
  await page.goto('/');
  await search(page);
  const lateResponse = page.waitForResponse(
    (response) =>
      response.url().includes('api.open-meteo.com/v1/forecast') &&
      new URL(response.url()).searchParams.get('latitude') === String(cities[0].latitude),
  );
  try {
    await selectCity(page);
    await expect(page.getByRole('status')).toBeVisible();
    await expect(page.getByRole('searchbox', { name: 'Cidade' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Buscar', exact: true })).toBeEnabled();
    await search(page, 'Recife');
    await page.getByRole('button', { name: 'Recife, Pernambuco, Brasil', exact: true }).click();
    await expect(
      page
        .getByRole('region', { name: 'Recife', exact: true })
        .getByText('25,0 °C', { exact: true }),
    ).toBeVisible();
  } finally {
    release();
  }
  await (await lateResponse).finished();
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await expect(
    page.getByRole('region', { name: 'Recife', exact: true }).getByText('25,0 °C', { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('region', { name: 'São Paulo', exact: true })).toHaveCount(0);
  await expect(page.getByRole('article')).toHaveCount(5);
});
