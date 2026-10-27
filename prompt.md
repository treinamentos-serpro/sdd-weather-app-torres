# Prompt de implementação — T-01

```text
Você é o Code Agent do projeto SDD Weather App. Implemente somente a tarefa abaixo, respeitando as convenções do repositório e sem ampliar o escopo.

## Tarefa

T-01 — Definir tipos do domínio

Tipo: Data
Prioridade: P0
Tamanho: P

## Contexto

O projeto é uma SPA de previsão do tempo em TypeScript strict, React e Vite. A aplicação consulta a Open-Meteo para uma cidade selecionada. Os serviços devem normalizar as respostas externas para contratos internos, que serão consumidos por hooks e componentes.

As temperaturas do modelo são sempre armazenadas em Celsius. Campos meteorológicos que podem não vir da API devem aceitar `null`; zero continua sendo um valor válido. `observedAt` representa o instante da observação informado pela fonte; `fetchedAt` representa o instante em que uma resposta válida foi recebida pela aplicação.

## Implementação

Crie os contratos TypeScript exportados abaixo em `src/types/weather.ts`:

- `TemperatureUnit`: `"celsius" | "fahrenheit"`.
- `City`:
  - `id: string`
  - `name: string`
  - `region: string | null`
  - `country: string | null`
  - `latitude: number`
  - `longitude: number`
- `WeatherCondition`:
  - `code: number`
  - `labelPtBr: string`
- `CurrentWeather`:
  - `temperatureC: number | null`
  - `apparentTemperatureC: number | null`
  - `condition: WeatherCondition | null`
  - `relativeHumidityPercent: number | null`
  - `windSpeedKmh: number | null`
  - `observedAt: string | null`, instante ISO-8601 normalizado pelo serviço.
- `DailyForecast`:
  - `date: string`, data local no formato `YYYY-MM-DD`
  - `condition: WeatherCondition | null`
  - `temperatureMinC: number | null`
  - `temperatureMaxC: number | null`
  - `precipitationProbabilityMaxPercent: number | null`
- `WeatherReport`:
  - `city: City`
  - `timeZone: string`
  - `fetchedAt: string`, instante ISO-8601 em que a resposta válida foi recebida
  - `current: CurrentWeather`
  - `days: DailyForecast[]`, até cinco itens; cobertura parcial é permitida.
- `RequestErrorCode`: união `"network" | "timeout" | "http" | "invalid-response"`.
- `RequestError`:
  - `code: RequestErrorCode`
  - `messagePtBr: string`
- `OpenMeteoClient`:
  - `searchCities(query: string, signal?: AbortSignal): Promise<City[]>`
  - `getWeather(city: City, signal?: AbortSignal): Promise<WeatherReport>`

## Critérios de aceite

1. Todos os tipos e interfaces listados estão exportados de `src/types/weather.ts` com os nomes e campos indicados.
2. Os campos meteorológicos potencialmente ausentes usam união explícita com `null`; não usar `?` como substituto.
3. Os campos numéricos aceitam zero normalmente; não introduzir defaults nem lógica de conversão no modelo.
4. Temperaturas do modelo são nomeadas e tipadas em Celsius; `TemperatureUnit` representa as unidades de apresentação.
5. `observedAt` e `fetchedAt` são campos distintos, ambos `string`; `date` continua sendo uma data local, não um timestamp.
6. Os contratos compilam em TypeScript strict: `pnpm build` termina com sucesso.
7. Não adicionar `any`, dependências, lógica de serviço, componentes ou funcionalidades que pertençam a outras tarefas.
8. Não modificar arquivos fora do escopo, salvo se um ajuste estritamente necessário de import/build for descoberto; nesse caso, explique-o no resumo.

## Arquivos

- Criar/editar: `src/types/weather.ts`.
- Não criar testes ou alterar `tests/` nesta tarefa; testes específicos pertencem às tarefas posteriores do backlog.
- Antes de editar, verifique se o arquivo ou diretório já existe e integre qualquer conteúdo existente sem sobrescrever alterações alheias.

## Validação e entrega

Como esta tarefa modifica `src/`, execute os comandos do checklist do projeto:

- `pnpm lint`
- `pnpm build`
- `pnpm test`

Não faça commit. Ao concluir, informe brevemente o que foi criado e o resultado de cada comando.
```
