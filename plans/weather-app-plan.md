# Plano Técnico — Aplicação de Previsão do Tempo

## Architecture

Aplicação SPA sem backend próprio. A camada de interface é responsável pela apresentação; um hook local coordena busca, seleção, consulta e preferências; um serviço isola HTTP, validação e normalização do Open-Meteo. Funções puras tratam conversão de temperatura e códigos meteorológicos.

```mermaid
flowchart LR
  Components[components: apresentação] --> Hook[hooks: useWeatherApp]
  Hook --> Service[services: OpenMeteoClient]
  Service --> Geo[Open-Meteo Geocoding]
  Service --> Forecast[Open-Meteo Forecast]
  Hook --> Storage[localStorage: unidade]
  Service --> Lib[lib: funções puras]
  Hook --> Lib
  Components --> Lib
```

Uma única chamada ao endpoint Forecast solicita clima atual e previsão diária; isso mantém as duas seções coerentes e reduz chamadas. Geocoding é uma chamada separada por busca válida. Não introduzir estado global, backend, cache remoto ou biblioteca de data fetching para este escopo.

## Tech Stack

| Área | Decisão | Justificativa |
| --- | --- | --- |
| Linguagem e build | TypeScript strict, Vite | Já configurados; build existente executa `tsc -b` antes do bundle. |
| Interface | React 19 | Dependência existente e adequada à SPA de uma tela principal. |
| Estilos | Tailwind CSS 3 | Já instalado e consistente com a stack do projeto. |
| HTTP | `fetch` nativo | Open-Meteo não exige chave; não há necessidade de adicionar cliente HTTP. |
| Estado | `useReducer` encapsulado em hook | Mantém transições relacionadas em um só lugar, sem biblioteca global. |
| Persistência | `localStorage` somente para unidade | Requisito explícito; não persistir cidade, dados ou informação pessoal. |
| Testes | Vitest, Testing Library, Playwright | Já configurados para unitários/componentes e E2E. |
| Qualidade | Biome | Lint e formatação já configurados. |

Não adicionar dependências para ícones, datas, estado ou requests sem necessidade demonstrada durante a implementação.

## Project Structure

Estrutura proposta; `src/` e `tests/` ainda precisam ser criados.

```text
src/
  main.tsx
  App.tsx
  components/
    CitySearch.tsx
    CurrentWeather.tsx
    ForecastList.tsx
    TemperatureUnitControl.tsx
    RequestStatus.tsx
  hooks/
    useWeatherApp.ts
  services/
    openMeteoClient.ts
  lib/
    searchQuery.ts
    temperature.ts
    weatherCodes.ts
    dateTime.ts
  types/
    weather.ts
tests/
  unit/
    services/openMeteoClient.test.ts
    lib/searchQuery.test.ts
    lib/temperature.test.ts
    lib/weatherCodes.test.ts
    lib/dateTime.test.ts
    hooks/useWeatherApp.test.ts
  components/
    CitySearch.test.tsx
    WeatherViews.test.tsx
  e2e/
    weather-app.spec.ts
```

### Responsabilidades e dependências entre camadas

- **`components/` — apresentação:** componentes React recebem dados, estados e callbacks por props e cuidam de renderização, interação e acessibilidade. Não fazem `fetch`, não conhecem o formato bruto da Open-Meteo e não mantêm cópias paralelas do estado da aplicação.
- **Busca reutilizável:** `SearchBar.tsx` implementa o formulário acessível da busca com `onSearch(city: string)` e `disabled?: boolean`. Mantém apenas o texto digitado, aplica `trim` e bloqueia envios vazios/desabilitados. A validação de 3–100 caracteres permanece na orquestração prevista em T-02/T-07; resultados e estados de requisição pertencem à composição de T-08.
- **Controle de unidade:** `UnitToggle.tsx` fornece a apresentação prevista em T-10 com `unit: Unit` e `onChange(unit: Unit)`. Os botões °C/°F expõem `aria-pressed` dentro de um grupo nomeado, com navegação nativa por Tab/Shift+Tab e ativação por Enter/Espaço. O componente é controlado; conversão e persistência continuam na orquestração.
- **`hooks/` — orquestração e estado:** `useWeatherApp` coordena busca, seleção, consulta, atualização manual, concorrência, loading/erro/vazio e preferência de unidade. Chama contratos do serviço e entrega estado/ações prontos à tela; mantém a política de estado fora dos componentes.
- **`services/` — acesso a dados:** `openMeteoClient` constrói URLs e parâmetros, executa `fetch` com timeout/cancelamento, valida o payload externo e converte-o para os tipos internos. Não contém estado React nem lógica de apresentação.
- **`lib/` — funções puras reutilizáveis:** validação da consulta, conversão/formatação de temperatura, mapeamento de códigos WMO e operações de data/hora sem I/O ou dependência de React. Entradas e saídas explícitas tornam as regras previsíveis.
- **`types/` — contratos compartilhados:** tipos do modelo interno e dos erros usados entre camadas. A resposta externa não deve atravessar o serviço até a interface sem validação e normalização.

O fluxo principal é `components → hooks → services → Open-Meteo`; `lib` fornece funções puras às camadas que precisem delas, e `types` define os contratos. As dependências devem apontar para dentro desses contratos: componentes não importam serviços, serviços não importam hooks/componentes, e `lib` não depende de React, rede ou estado global. Não criar uma camada de repositório ou domínio separada enquanto houver somente uma fonte e um fluxo.

### Como a separação facilita os testes

- **`lib`:** testes unitários diretos de entradas, saídas e limites, sem mocks de rede ou renderização.
- **`services`:** testar URLs, parâmetros, validação e normalização com `fetch` mockado; cobrir falhas HTTP, rede, timeout e payload inválido sem depender do provedor externo.
- **`hooks`:** testar transições de estado e orquestração substituindo o cliente por um mock, incluindo respostas fora de ordem e erro/retentativa.
- **`components`:** testar renderização, acessibilidade e interação por roles/labels com estado e callbacks controlados, sem acoplar os testes à API.
- **Fluxo integrado/E2E:** verificar o caminho busca → seleção → previsão e as principais recuperações com as rotas externas interceptadas.

Assim, cada suíte valida uma responsabilidade em isolamento, enquanto os testes de fluxo cobrem a integração sem tornar os testes unitários lentos ou dependentes da disponibilidade da Open-Meteo.

## Data Model

Contratos TypeScript conceituais, não implementação final. Respostas externas devem ser validadas e convertidas para estes tipos antes de chegarem à UI.

```ts
export type TemperatureUnit = "celsius" | "fahrenheit";

export interface City {
  id: string;
  name: string;
  region: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
}

export interface WeatherCondition {
  code: number;
  labelPtBr: string;
}

export interface CurrentWeather {
  temperatureC: number | null;
  apparentTemperatureC: number | null;
  condition: WeatherCondition | null;
  relativeHumidityPercent: number | null;
  windSpeedKmh: number | null;
  precipitationMm: number | null;
  pressureMslHpa: number | null;
  observedAt: string | null; // instante ISO-8601 normalizado pelo serviço
}

export interface DailyForecast {
  date: string; // YYYY-MM-DD no fuso da localidade
  condition: WeatherCondition | null;
  temperatureMinC: number | null;
  temperatureMaxC: number | null;
  precipitationProbabilityMaxPercent: number | null;
}

export interface WeatherReport {
  city: City;
  timeZone: string;
  fetchedAt: string; // instante ISO-8601 em que a resposta válida foi recebida
  current: CurrentWeather;
  days: DailyForecast[]; // até cinco itens; pode haver cobertura parcial
}

export type RequestErrorCode =
  | "network"
  | "timeout"
  | "http"
  | "invalid-response";

export interface RequestError {
  code: RequestErrorCode;
  messagePtBr: string;
}

export interface OpenMeteoClient {
  searchCities(query: string, signal?: AbortSignal): Promise<City[]>;
  getWeather(city: City, signal?: AbortSignal): Promise<WeatherReport>;
}
```

`City.id` é identificador estável no cliente, derivado do ID do provedor quando disponível ou das coordenadas. `null` representa campo ausente; zero é um valor válido e não deve ser usado como fallback. Temperaturas são mantidas em Celsius no modelo interno; conversão e arredondamento a uma casa decimal ocorrem na apresentação. `weatherCodes.ts` mapeia códigos WMO para rótulos pt-BR e ícones, com fallback neutro para códigos desconhecidos.

O hero `CurrentWeather.tsx` recebe `city`, `current` e `unit`, usa `lib/temperature.ts` e `lib/weatherCodes.ts` e apresenta condição, sensação térmica, umidade, vento, precipitação em mm e pressão ao nível do mar em hPa. Campos nulos aparecem como “Indisponível”. Não consulta rede nem relógio; estados de requisição e indicação temporal continuam sob responsabilidade da composição/orquestração.

Para uso na UI, `src/types/weather.ts` também exporta os aliases `Unit = TemperatureUnit`, `ForecastDay = DailyForecast` e `WeatherData = WeatherReport`, sem duplicar os contratos. O objeto `mockWeatherData`, em `src/mocks/weatherData.ts`, fornece dados fictícios de São Paulo e cinco dias consecutivos para desenvolvimento sem API. Suas datas são fixas, não representam dados atuais e podem acionar a futura indicação de observação desatualizada; o mock não é conectado automaticamente à aplicação.

Em `src/lib/temperature.ts`, `unitLabel(unit)` retorna `°C` ou `°F` e é reutilizada por `formatTemperature`, mantendo uma casa decimal em pt-BR. A cobertura adicional em `tests/unit/temperature.test.ts` verifica 0 °C → 32 °F, 100 °C → 212 °F, -40 °C → -40 °F, preservação de Celsius, precisão interna, arredondamento, símbolos e valores ausentes.

## Data Flow

```mermaid
flowchart TD
  Input["Input de busca"] --> HookSearch["Hook: valida consulta e inicia busca"]
  HookSearch --> GeoService["Service de geocoding"]
  GeoService --> GeoAPI["Open-Meteo Geocoding"]
  GeoAPI -->|resultados| HookResults["Hook: atualiza resultados"]
  HookResults --> ResultsUI["UI: lista de cidades"]
  ResultsUI -->|seleção| HookSelect["Hook: guarda cidade selecionada"]
  HookSelect --> ForecastService["Service de forecast"]
  ForecastService --> ForecastAPI["Open-Meteo Forecast"]
  ForecastAPI -->|dados válidos normalizados| HookWeather["Hook: atualiza estado meteorológico"]
  HookWeather --> WeatherUI["Componentes de UI: clima atual e previsão"]

  GeoAPI -->|lista vazia| HookEmpty["Hook: estado vazio"]
  HookEmpty --> EmptyUI["UI: nenhum resultado"]
  GeoService -->|erro HTTP, rede ou timeout| HookGeoError["Hook: erro de geocoding"]
  GeoAPI -->|resposta inválida| HookGeoError
  HookGeoError --> GeoErrorUI["UI: erro de busca e ação para tentar novamente"]

  ForecastService -->|erro HTTP, rede, timeout ou payload inválido| HookForecastError["Hook: erro de forecast"]
  ForecastAPI -->|resposta inválida| HookForecastError
  HookForecastError --> ForecastErrorUI["UI: erro meteorológico e ação para tentar novamente"]
```

1. A pessoa digita uma consulta. Remover espaços externos; rejeitar menos de 3 ou mais de 100 caracteres sem chamar a API.
2. `useWeatherApp` inicia geocoding, expõe loading e associa a resposta a um identificador de requisição. Apenas a busca mais recente atualiza resultados.
3. Selecionar um resultado guarda a `City` em memória e chama `getWeather(city)` com latitude/longitude.
4. O serviço solicita dados atuais e diários em uma resposta Forecast, valida campos e normaliza unidades, datas e horário para `WeatherReport`.
5. A interface renderiza clima atual e até cinco dias. Campos ou datas ausentes são identificados, sem inferir valores.
6. Alternar unidade atualiza a apresentação de todas as temperaturas e grava a preferência no `localStorage`. O modelo permanece em Celsius.
7. “Atualizar” refaz a consulta da localidade ativa. Não há atualização automática nem persistência da cidade.

## External APIs

Sem API key, autenticação ou backend intermediário. Respeitar termos e limites de uso publicados pelo Open-Meteo; não assumir SLA do provedor.

**Geocoding**

A implementação incremental está em `src/services/weatherService.ts`: `searchCities(name: string): Promise<City[]>` aplica `trim`, retorna `[]` sem rede para nome vazio e usa `encodeURIComponent` no nome. Exporta `WeatherServiceError`, compatível com `RequestError`, preservando causa e status HTTP quando aplicáveis. Valida o payload antes de mapear, limita a dez cidades e usa timeout de 10 s. O App a consome via `useWeather`; o adaptador `OpenMeteoClient` com cancelamento externo permanece em T-06.

- Endpoint: `GET https://geocoding-api.open-meteo.com/v1/search`
- Parâmetros: `name` (texto já validado), `count=10`, `language=pt`, `format=json`.
- Exemplo de URL: `https://geocoding-api.open-meteo.com/v1/search?name=S%C3%A3o%20Paulo&count=10&language=pt&format=json`.
- Exemplo resumido de resposta:

```json
{
  "results": [
    {
      "id": 3448439,
      "name": "São Paulo",
      "latitude": -23.5475,
      "longitude": -46.63611,
      "admin1": "São Paulo",
      "country": "Brasil"
    }
  ],
  "generationtime_ms": 0.2
}
```

- Mapear cada item de `results` para `City`: converter `id` para `string`; `name` para `name`; `admin1` para `region`; `country` para `country`; e preservar `latitude` e `longitude` como números. Campos de região, país ou ID que não vierem devem seguir as regras do modelo (`null` para região/país; ID derivado das coordenadas se ausente). Ignorar metadados não usados, como `generationtime_ms`. Uma resposta válida sem resultados é normalizada para `[]`; resposta incompatível com o formato esperado é `invalid-response`.

**Forecast atual e diário**

- Endpoint: `GET https://api.open-meteo.com/v1/forecast`
- Parâmetros: `latitude` e `longitude` da cidade selecionada; `current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation,pressure_msl`; `daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max`; `temperature_unit=celsius`; `wind_speed_unit=kmh`; `precipitation_unit=mm`; `timezone=auto`; `forecast_days=5`.
- Exemplo de URL: `https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.419&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation,pressure_msl&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=celsius&wind_speed_unit=kmh&precipitation_unit=mm&timezone=auto&forecast_days=5`.
- `current` pede os valores meteorológicos da observação atual. `daily` pede séries diárias; cada posição de `daily.time` corresponde à mesma posição nos demais arrays. `timezone=auto` faz o provedor determinar o fuso pelas coordenadas e devolver as datas/horas locais; cinco dias atendem a previsão de hoje e dos quatro dias seguintes.
- Exemplo resumido de resposta (valores e unidades ilustrativos):

```json
{
  "latitude": 52.52,
  "longitude": 13.419,
  "utc_offset_seconds": 7200,
  "timezone": "Europe/Berlin",
  "current_units": {
    "time": "iso8601",
    "temperature_2m": "°C",
    "relative_humidity_2m": "%",
    "apparent_temperature": "°C",
    "weather_code": "wmo code",
    "wind_speed_10m": "km/h",
    "precipitation": "mm",
    "pressure_msl": "hPa"
  },
  "current": {
    "time": "2026-06-15T12:15",
    "temperature_2m": 21.4,
    "relative_humidity_2m": 58,
    "apparent_temperature": 21.0,
    "weather_code": 2,
    "wind_speed_10m": 12.3,
    "precipitation": 0.0,
    "pressure_msl": 1015.2
  },
  "daily_units": {
    "time": "iso8601",
    "weather_code": "wmo code",
    "temperature_2m_max": "°C",
    "temperature_2m_min": "°C",
    "precipitation_probability_max": "%"
  },
  "daily": {
    "time": ["2026-06-15", "2026-06-16", "2026-06-17", "2026-06-18", "2026-06-19"],
    "weather_code": [2, 3, 1, 61, 2],
    "temperature_2m_max": [24.1, 22.8, 25.0, 19.2, 23.6],
    "temperature_2m_min": [15.2, 14.7, 16.1, 13.4, 15.0],
    "precipitation_probability_max": [10, 25, 5, 65, 20]
  }
}
```

- Mapear `timezone` para `WeatherReport.timeZone` e a cidade selecionada para `WeatherReport.city`; gerar `fetchedAt` como instante ISO-8601 no cliente quando a resposta válida for recebida. Mapear `current.temperature_2m`, `apparent_temperature`, `relative_humidity_2m` e `wind_speed_10m` para os campos correspondentes de `CurrentWeather` em Celsius, percentual e km/h. `current.weather_code` alimenta `condition.code`; obter `condition.labelPtBr` pelo mapeamento WMO. Converter `current.time` de horário local em instante ISO-8601 para `observedAt`, usando o fuso/offset retornado (`timezone` e `utc_offset_seconds`).
- Para cada índice de `daily.time`, criar um `DailyForecast`: `time` → `date` (`YYYY-MM-DD` local), `weather_code` → `condition` (mesmo mapeamento WMO), `temperature_2m_min` → `temperatureMinC`, `temperature_2m_max` → `temperatureMaxC` e `precipitation_probability_max` → `precipitationProbabilityMaxPercent`. Descartar elementos depois dos cinco dias previstos.
- Mapear `current.precipitation` → `precipitationMm` em mm e `current.pressure_msl` → `pressureMslHpa` em hPa, conferindo `current_units`; ausência ou `null` vira `null`, preservando zero.
- Validar os arrays e seus valores antes de normalizar. A ausência de um campo meteorológico opcional, incluindo probabilidade de precipitação, vira `null`, nunca zero; aplicar às temperaturas internas as unidades explicitamente solicitadas e conferidas em `current_units`/`daily_units`. As datas de `daily.time` permanecem datas locais, não timestamps UTC. Resposta estruturalmente malformada é `invalid-response`.

Cada request tem timeout de 10 s e suporta `AbortSignal`. O formato e as unidades retornados devem ser validados; não confiar em rótulos/unidades implícitos. Se a API alterar seu contrato, os testes do adaptador devem falhar sem propagar resposta incompatível à UI.

O helper exportado `fetchWithTimeout(url)` em `weatherService.ts` retorna JSON como `unknown`, usando `AbortController` com timer de 10 s que abrange fetch e leitura do corpo. Executa `clearTimeout` no `finally` em todos os caminhos. AbortError/timeout gera `WeatherServiceError` com código `timeout` e informa o limite de 10 s; falha de rede gera código `network` com orientação para verificar a conexão e tentar novamente. Erros HTTP e JSON malformado preservam seus códigos específicos.

Em `weatherService.ts`, `getWeather(city): Promise<WeatherData>` reutiliza o transporte de geocoding e exige os objetos `current` e `daily` e unidades coerentes. `current` sem nenhum campo meteorológico válido rejeita `invalid-response`; timestamp sozinho não caracteriza consulta disponível. A data D é calculada a partir do relógio no `timezone` retornado. São aceitas de uma a cinco datas ordenadas, dentro de D..D+4, incluindo lacunas. Arrays presentes devem estar alinhados a `daily.time`; duplicatas, ordem inválida, datas fora da janela e séries incompatíveis rejeitam `invalid-response`. A saída contém exatamente cinco registros D..D+4; os dias ausentes têm todos os campos meteorológicos nulos. Séries opcionais ausentes também se tornam `null`, nunca zero. `observedAt` usa `utc_offset_seconds` para normalizar a hora local; `fetchedAt` é gerado após validação.

## State Management

### Hook incremental `useWeather`

`src/hooks/useWeather.ts` expõe `status` (`idle/loading/choosing/success/error/empty`), `data`, `cities`, `error`, `query`, `selectedCity` e ações assíncronas `search`, `selectCity`, `retry`, `refresh`. A busca aplica trim e valida 3–100 caracteres com a função compartilhada `validateCityQuery`, sem rede em caso inválido; busca no máximo dez localidades em ordem e encerra em `choosing` sem consultar forecast. Lista vazia encerra em `empty`. Seleção explícita preserva lista/consulta e carrega exatamente as coordenadas da cidade escolhida. O formulário continua disponível durante loading para permitir uma nova busca.

Retry repete a última operação: geocoding, seleção ou atualização; antes de qualquer ação é no-op. `refresh` chama somente forecast para a cidade selecionada, nunca repete geocoding. Durante atualização, o relatório anterior e `fetchedAt` permanecem em memória, inclusive em falha, mas a UI não apresenta esses valores como dados atuais. Apenas um sucesso substitui o relatório e o horário da consulta. IDs de operação ignoram sucessos/erros obsoletos e impedem atualização após desmontagem, sem cancelar a rede (o timeout do serviço permanece ativo). Não existe polling de rede.

### Integração incremental da UI

A navegação por teclado inclui link “Pular para o conteúdo”. Busca e retry transferem o foco para uma região de resultados estável antes de desabilitar/remover o controle acionado, sem roubar foco novamente no fim da espera; a região expõe `aria-busy` enquanto aguarda. Estados vazio/inicial e sucesso são anunciados por uma live region persistente; loading e erro mantêm `status`/`alert`. Cards têm nomes acessíveis por data. A borda do input usa `slate-400` para delimitação contrastante; consultas longas quebram linha sem ampliar a viewport.

`App.tsx` consome `useWeather` e inicia em `idle`, sem chamadas automáticas. SearchBar informa erros de validação associados ao campo, inclusive vazio/espaços, sem enviar a busca inválida. `CityResults` oferece opções nativas por botão na ordem recebida, com cidade/região/país; homônimos indistinguíveis incluem coordenadas. Busca, seleção, retry e atualização transferem o foco para a região estável. `RefreshWeather` mostra `fetchedAt` no fuso da cidade e oferece “Atualizar”. Os painéis só são renderizados em sucesso com `data`. `useTemperatureUnit` restaura/persiste somente `weather-unit` no `localStorage`, com Celsius como padrão, valor corrompido descartado e falhas de armazenamento explicitadas por alerta sem bloquear o app. Cidade e resultados não são persistidos. Os testes usam serviços mockados e rotas interceptadas, nunca a API real.

`ForecastCard.tsx` usa `lib/format.ts` para rótulos pt-BR de datas locais, sem depender do fuso do navegador, e os helpers existentes de temperatura/ícone. `ForecastList.tsx` ordena uma cópia dos dias, limita a cinco e usa `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5`; sinaliza a quantidade de dias sem métricas enquanto cada data faltante mostra campos indisponíveis. `CurrentWeather` apresenta `observedAt` no fuso da cidade, ou “Indisponível”; mais de duas horas gera “Desatualizado” (exatamente duas horas ainda não). Um único timeout agenda a mudança visual na fronteira de frescor, sem consultas de rede e com cleanup ao desmontar/trocar observação. Os componentes reutilizáveis de estado ficam em `components/states/`: loading com status, erro com mensagem e retry, vazio com título e dica.

Estado local em `useWeatherApp`, com `useReducer` para transições relacionadas:

- Busca: texto, resultados, estado `idle | loading | success | empty | error` e erro associado.
- Consulta meteorológica: cidade selecionada, relatório mais recente, estado `idle | loading | success | error` e erro associado.
- Preferência: `TemperatureUnit`, carregada de `localStorage`; valor ausente ou inválido resulta em Celsius.
- Concorrência: `AbortController` cancela a busca anterior quando possível; um request ID impede que respostas antigas atualizem o estado mesmo se o cancelamento não evitar a resposta.

Manter loading e erro independentes por fluxo. Em falha de atualização, manter a última resposta armazenada em memória com seu timestamp, mas indicar falha e nunca rotulá-la como consulta atual recém-sucedida. Não persistir cidade nem relatório.

## Error Handling

| Situação | Estado e resposta da interface |
| --- | --- |
| Entrada inválida | Validar localmente; nenhum request; instrução em pt-BR. |
| Geocoding com lista vazia | Estado `empty`; permitir editar e buscar novamente; não consultar Forecast. |
| Erro HTTP/rede | Estado `error` da operação afetada; mensagem recuperável e ação manual de retry. |
| Timeout | Abortar após 10 s; limpar loading e mostrar erro. Sem retry automático. |
| Resposta inválida | Não renderizar campos incompatíveis; informar indisponibilidade, registrar erro técnico sem dados pessoais. |
| Campo Open-Meteo ausente/nulo | O adaptador normaliza métricas e condições opcionais para `null`; séries diárias ausentes produzem campos nulos por data. A UI exibe “Indisponível” para valor ausente/não finito, preservando zero como dado válido. Datas, fuso e estrutura obrigatória inválidos continuam sendo erro, não fallback numérico. |
| Previsão com menos de cinco datas | Mostrar dias recebidos, indicar dias ausentes e que a previsão está incompleta. |
| Observação atual com mais de 2 h | Exibir horário e rótulo “Desatualizado”; não apresentá-la como atual. |
| Falha ao atualizar | Preservar relatório anterior em memória com timestamp, exibir falha da atualização e não alterar `fetchedAt`. |
| Unidade ausente/corrompida no storage | Usar Celsius; falha de `localStorage` não deve impedir consulta ou renderização. |

Erros de geocoding, clima atual e previsão devem ser diferenciados de uma resposta válida sem resultados. Erro de rede não apaga a seleção da cidade. Todas as mensagens visíveis são pt-BR.

## Testing Strategy

- **Funções puras (Vitest):** testar normalização e limites da busca; conversão Celsius/Fahrenheit e arredondamento, incluindo valores negativos e ausentes; códigos WMO conhecidos/desconhecidos; datas locais, fuso e classificação de observação acima de duas horas. Verificar entradas de fronteira e saídas exatas, sem mocks.
- **Services (Vitest):** mockar `fetch`; verificar URL/parâmetros dos endpoints, codificação de caracteres acentuados, mapeamento de geocoding/Forecast e validação de payload/unidades. Cobrir lista vazia, campos opcionais ausentes ou nulos, arrays diários incompletos, payload malformado, HTTP não-2xx, rede, timeout e cancelamento. Nenhum teste chama a API real.
- **Hooks (Vitest + Testing Library):** substituir `OpenMeteoClient` por mock e verificar transições loading/success/empty/error, seleção antes do Forecast, retry, unidade default/persistida e proteção contra respostas obsoletas. Confirmar que erro de atualização não altera a última consulta bem-sucedida nem apresenta dados antigos como recém-atualizados.
- **Componentes (Vitest + Testing Library):** usar estado/props controlados e cobrir loading, erro, vazio e sucesso para busca e painéis. Testar input 0/2/3/100/101 caracteres, seleção de homônimos, dados ausentes, previsão parcial, unidade e atualização; verificar roles/labels, teclado e anúncio de estado. Componentes não dependem de `fetch`.
- **E2E (Playwright):** interceptar rotas Open-Meteo com fixtures determinísticas. Validar busca → resultados → seleção → clima atual e cinco dias → Fahrenheit → reload preservando unidade → atualização manual. Cobrir busca inválida sem request, nenhum resultado sem chamada de Forecast, erro/timeout recuperável, resposta parcial e resposta fora de ordem.
- **Responsividade (Playwright):** verificar 320, 375 e 768 CSS px (mobile estreito, mobile comum e tablet), além de 1024 e 1440 px. No mobile de 375 px, executar ao menos o fluxo principal; em todos, verificar ausência de rolagem horizontal, corte de conteúdo essencial e controles inacessíveis. Preferir asserções de layout observáveis a snapshots visuais frágeis.
- **Requisitos não funcionais:** validar teclado e estados anunciados com testes automatizados e inspeção de acessibilidade; executar a matriz de navegadores RNF-04 conforme suporte do CI; medir p95 na rede controlada RNF-05. A disponibilidade do shell exige verificação sintética operacional a cada cinco minutos, separada dos testes E2E e da API externa.
- **Gates de entrega:** `pnpm lint`, `pnpm build`, `pnpm test` e `pnpm test:e2e`; nenhum gate é substituído por teste manual.

Usar fixtures determinísticas inspiradas no formato do provedor. Testes de funções, services, hooks e componentes não dependem de rede real; E2E também intercepta a API para evitar flakiness e dependência de disponibilidade externa. Cobertura percentual não substitui critérios de aceite: priorizar estados, falhas e limites especificados.

## Risks & Trade-offs

| Decisão | Alternativas consideradas | Trade-off e justificativa |
| --- | --- |
| React local + `useReducer` encapsulado em hook | Vários `useState`; Context/Redux ou outra biblioteca global | O reducer centraliza transições e basta para uma tela/fluxo. Tem mais estrutura que `useState`, mas evita estado global e dependências; reavaliar se surgirem múltiplos consumidores. |
| `fetch` nativo no service | Axios ou biblioteca de requests/cache | Menos dependências e controle direto de cancelamento; HTTP, validação, timeout e concorrência ficam sob responsabilidade do adaptador. Não há cache ou retry automático. |
| Service normaliza resposta em tipos internos | Expor payload do provedor à UI; criar backend/repositório intermediário | Isola componentes de mudanças externas sem camada extra para uma única fonte. Não oferece cache compartilhado, proxy, fallback de provedor nem proteção de credenciais (não há chave). |
| Celsius como unidade canônica; preferência em `localStorage` | Guardar ambas as escalas; persistir no servidor | Evita valores duplicados/conversões acumuladas e atende persistência local; não sincroniza entre dispositivos. Cidade e resultados não são persistidos por privacidade e escopo. |
| Uma consulta Forecast para dados atuais e diários | Chamadas separadas | Reduz requests e mantém painéis coerentes; uma falha afeta ambas as seções nessa tentativa. A chamada conjunta fornece os campos necessários. |
| E2E com rotas interceptadas | API real no CI; apenas testes unitários/componentes | Mocks tornam a suíte determinística e independente do SLA, mas não verificam disponibilidade/contrato real em produção. Service tests verificam o contrato conhecido; smoke test real, se adotado, deve ser opcional e separado dos gates. Playwright cobre integração e navegador, com custo/duração superiores. |
| Viewports representativos e asserções de layout | Todas as larguras; snapshots visuais em toda a matriz | Cinco larguras cobrem faixas e limites especificados com execução viável, mas não cada dispositivo. Asserções semânticas/overflow são menos frágeis que snapshots, embora possam não detectar diferenças visuais sutis. |
| Acesso direto do navegador à Open-Meteo | Backend próprio ou cache remoto | Evita infraestrutura e credenciais e respeita a ausência de chave; disponibilidade, limites e latência continuam dependentes do provedor, sem SLA assumido. |