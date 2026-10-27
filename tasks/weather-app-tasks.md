# Backlog de Tarefas — Weather App v1

Fonte: `plans/weather-app-plan.md`.

As tarefas estão agrupadas na sequência de implementação — contratos → funções puras → services → hook → componentes → integração → testes → hardening — e ordenadas pelas dependências. Todas iniciam como **Pendente**; conclua as dependências antes de iniciar uma tarefa dependente.

**Prioridade:** P0 = necessário para a primeira fatia utilizável ou bloqueador de segurança; P1 = necessário para completar qualidade/requisitos da v1 antes de produção; P2 = melhoria adiável sem descumprir o baseline. **Tamanho relativo:** P = pequeno e localizado; M = esforço moderado; G = maior complexidade de integração/validação. Não representa estimativa de duração.

## Entrega 1 — Contratos

### T-01 — Definir tipos do domínio

- **ID:** T-01
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** Criar contratos TypeScript para localidade, condição, clima atual, previsão diária, relatório, unidade e erros.
- **Critérios de aceite:**
  - `City`, `WeatherCondition`, `CurrentWeather`, `DailyForecast`, `WeatherReport`, `RequestError` e `OpenMeteoClient` seguem os contratos do plano.
  - Campos meteorológicos opcionais aceitam `null`; zero continua sendo um valor válido.
  - Temperaturas no modelo permanecem em Celsius; `observedAt` e `fetchedAt` têm semânticas distintas.
  - `pnpm build` completa sem erro de tipo para os contratos TypeScript strict.
- **Dependências:** nenhuma.
- **Arquivos prováveis:** `src/types/weather.ts`.
- **Rastreabilidade:** RF-01–RF-05; RNF-01, RNF-08, RNF-09.

## Entrega 2 — Funções puras

### T-02 — Validar consultas de cidade

- **ID:** T-02
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** Implementar função pura para limpar espaços externos e validar o tamanho da consulta antes do geocoding.
- **Critérios de aceite:**
  - Após `trim`, consultas com menos de 3 ou mais de 100 caracteres são inválidas.
  - Entradas válidas preservam acentos e pontuação sem normalização adicional.
  - A função não executa I/O nem altera a entrada recebida.
- **Dependências:** T-01.
- **Arquivos prováveis:** `src/lib/searchQuery.ts`.
- **Rastreabilidade:** RF-01; CA-01.4, CA-01.5, CA-01.11; RNF-08.

### T-03 — Implementar conversão de temperatura

- **ID:** T-03
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** Criar funções puras para conversão entre Celsius e Fahrenheit e formatação pt-BR.
- **Critérios de aceite:**
  - Conversões partem sempre do valor canônico em Celsius e não acumulam erro ao alternar unidades.
  - Temperaturas são arredondadas a uma casa decimal e usam vírgula decimal e símbolo correto.
  - `20 °C` resulta em `68,0 °F`, `-40 °C` em `-40,0 °F` e `12,34 °C` em `54,2 °F`.
  - Valores ausentes não são formatados como zero.
- **Dependências:** T-01.
- **Arquivos prováveis:** `src/lib/temperature.ts`.
- **Rastreabilidade:** RF-04; CA-04.1–CA-04.4, CA-04.6; RNF-01.

### T-04 — Mapear códigos meteorológicos WMO

- **ID:** T-04
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** Implementar o mapeamento puro de códigos WMO para rótulos em pt-BR com fallback neutro.
- **Critérios de aceite:**
  - Cada código presente no mapa retorna um `labelPtBr` não vazio em português e um ícone.
  - Um código fora do mapa retorna o fallback neutro definido e não lança erro.
  - A saída atende `WeatherCondition`.
- **Dependências:** T-01.
- **Arquivos prováveis:** `src/lib/weatherCodes.ts`.
- **Rastreabilidade:** RF-02, RF-03; CA-02.1, CA-03.1; RNF-01.

### T-05 — Normalizar datas e frescor da observação

- **ID:** T-05
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** Implementar funções puras de data/hora para preservar datas locais e classificar observações antigas.
- **Critérios de aceite:**
  - Datas diárias `YYYY-MM-DD` mantêm a data do fuso da localidade, sem deslocamento UTC.
  - Horário local da observação e offset recebido são convertidos em instante ISO-8601 UTC válido.
  - Observação com mais de duas horas é desatualizada; exatamente duas horas ou menos não é.
- **Dependências:** T-01.
- **Arquivos prováveis:** `src/lib/dateTime.ts`.
- **Rastreabilidade:** RF-02, RF-03; CA-02.5, CA-03.1; RNF-01.

## Entrega 3 — Acesso a dados

### T-06 — Implementar cliente Open-Meteo

- **ID:** T-06
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** G
- **Descrição:** Implementar `searchCities` e `getWeather` com chamadas aos endpoints de geocoding e forecast, validação e normalização.
- **Critérios de aceite:**
  - URL geocoding contém `name`, `count=10`, `language=pt` e `format=json`; normalização preserva ordem e retorna no máximo 10 localidades.
  - Cada resultado válido mapeia ID, nome, região, país e coordenadas a `City`; resposta válida sem resultados retorna `[]`.
  - URL forecast usa latitude/longitude fornecidas e inclui `current` (também `precipitation` e `pressure_msl`), `daily`, Celsius, km/h, `precipitation_unit=mm`, `timezone=auto` e `forecast_days=5`; normaliza precipitação em mm e pressão ao nível do mar em hPa para os novos campos nullable.
  - Fixture válida retorna `WeatherReport` com timezone, current, dias associados por índice, datas locais e `fetchedAt` ISO-8601.
  - Campo meteorológico opcional ausente ou nulo mapeia para `null`; estrutura incompatível rejeita `RequestError` com código `invalid-response`.
  - Cada método aceita `AbortSignal` e rejeita após 10 s; rede, HTTP não-2xx, timeout e payload inválido rejeitam com códigos correspondentes.
- **Dependências:** T-01, T-02, T-04, T-05.
- **Arquivos prováveis:** `src/services/openMeteoClient.ts`.
- **Rastreabilidade:** RF-01–RF-03, RF-05; CA-01.1–CA-01.4, CA-01.6, CA-01.10, CA-02.1–CA-02.5, CA-03.1–CA-03.5, CA-05.1–CA-05.2; RNF-05, RNF-07, RNF-09.

## Entrega 4 — Orquestração e estado

### T-07 — Implementar hook de aplicação

- **ID:** T-07
- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** G
- **Descrição:** Implementar `useWeatherApp` para coordenar busca, seleção, consulta, atualização manual, concorrência e unidade.
- **Critérios de aceite:**
  - Busca válida transita de `loading` para `success`, `empty` ou `error`; busca inválida resulta em zero chamadas a `searchCities`.
  - Seleção chama `getWeather` com as coordenadas selecionadas; resultado vazio resulta em zero chamadas a `getWeather`.
  - Busca e forecast têm estados separados; retry chama novamente apenas o método da operação com falha.
  - Respostas de busca/forecast resolvidas fora de ordem não alteram a última operação nem associam dados à cidade errada.
  - Falha de refresh da mesma cidade preserva relatório e `fetchedAt`; após selecionar outra cidade, relatório anterior não aparece associado à cidade ativa.
  - Unidade inicial é `celsius`; leitura/escrita é somente em `localStorage`; exceções de storage não impedem inicialização ou troca de unidade.
  - Avançar cinco minutos sem ação do usuário resulta em zero chamadas novas a `getWeather`.
- **Dependências:** T-01, T-06.
- **Arquivos prováveis:** `src/hooks/useWeatherApp.ts`.
- **Rastreabilidade:** RF-01–RF-05; CA-01.5–CA-01.9, CA-01.11, CA-02.2–CA-02.3, CA-03.2, CA-03.4, CA-04.1, CA-04.5, CA-05.1–CA-05.3; RNF-05, RNF-07–RNF-09.

## Entrega 5 — Componentes de UI

### T-08 — Implementar busca e estados de solicitação

- **ID:** T-08
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** Criar os componentes de busca, resultados selecionáveis e apresentação de loading, vazio e erro.
- **Critérios de aceite:**
  - Campo tem label acessível; busca e opções podem ser acionadas por teclado.
  - Cada resultado exibe nome e região/país disponíveis; coordenadas aparecem quando esses textos não distinguem resultados.
  - Loading, vazio e erro têm conteúdo textual distinto; erro oferece ação ligada ao callback de retry.
  - Estado e callbacks são controlados por props; componente não importa `services/` nem invoca `fetch`.
- **Dependências:** T-02, T-07.
- **Arquivos prováveis:** `src/components/CitySearch.tsx`, `src/components/RequestStatus.tsx`.
- **Rastreabilidade:** RF-01; CA-01.1–CA-01.11; RNF-01, RNF-03, RNF-08.

### T-09 — Implementar painéis meteorológicos

- **ID:** T-09
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** G
- **Descrição:** Criar apresentação de clima atual e previsão diária usando o modelo normalizado e a unidade escolhida.
- **Critérios de aceite:**
  - Fixture completa mostra cidade e cada métrica atual com os valores recebidos: temperatura, condição com ícone WMO, sensação térmica, umidade, vento, precipitação em mm, pressão ao nível do mar em hPa e horário.
  - Fixture de observação 2 h 1 min antiga mostra “Desatualizado”; fixture com 2 h não mostra o rótulo.
  - Lista datas locais em ordem e no máximo cinco dias; cada item mostra condição, mínima, máxima e probabilidade disponível.
  - Campo ausente mostra “Indisponível”; fixture com três de cinco dias identifica duas datas sem previsão e indica cobertura incompleta.
  - Loading/erro não apresenta valor antigo ou de outra cidade como atual/previsão válida.
  - Componentes recebem estado/dados por props e não importam serviços nem acessam `fetch`, storage ou relógio global.
- **Dependências:** T-01, T-03, T-04, T-05, T-07.
- **Arquivos prováveis:** `src/components/CurrentWeather.tsx`, `src/components/ForecastList.tsx`.
- **Rastreabilidade:** RF-02, RF-03; CA-02.1–CA-02.5, CA-03.1–CA-03.5; RNF-01, RNF-03, RNF-07.

### T-10 — Implementar controle de unidade

- **ID:** T-10
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** Criar controle acessível de Celsius/Fahrenheit conectado ao estado central da aplicação.
- **Critérios de aceite:**
  - Controle tem nome acessível, expõe unidade selecionada e pode ser operado por teclado.
  - Selecionar Celsius/Fahrenheit atualiza todas as temperaturas dos painéis; umidade, vento e precipitação permanecem inalterados.
  - Sem preferência válida, estado inicial é Celsius; após escolha, novo carregamento lê a mesma unidade de `localStorage`.
- **Dependências:** T-03, T-07.
- **Arquivos prováveis:** `src/components/TemperatureUnitControl.tsx`.
- **Rastreabilidade:** RF-04; CA-04.1–CA-04.5; RNF-03, RNF-08.

## Entrega 6 — Integração da aplicação

### T-11 — Compor tela principal

- **ID:** T-11
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** Conectar hook e componentes na tela principal, sem acoplar apresentação ao cliente HTTP.
- **Critérios de aceite:**
  - `App` conecta estado/callbacks do hook à busca, painéis, controle de unidade e botão de atualização.
  - Selecionar cidade chama a ação de seleção; botão “Atualizar” chama ação de refresh para cidade ativa.
  - Estados loading/vazio/erro do hook são encaminhados ao componente correspondente, incluindo retry.
  - `App.tsx` não importa `services/` nem invoca `fetch`.
- **Dependências:** T-08, T-09, T-10.
- **Arquivos prováveis:** `src/App.tsx`.
- **Rastreabilidade:** RF-01–RF-05; CA-01.1–CA-01.8, CA-02.1–CA-02.4, CA-03.1–CA-03.5, CA-04.1–CA-04.5, CA-05.1–CA-05.3; RNF-03, RNF-07.

### T-12 — Configurar entrada e estilos globais

- **ID:** T-12
- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** Conectar a aplicação ao ponto de entrada React/Vite e definir estilos globais do tema do projeto.
- **Critérios de aceite:**
  - `main.tsx` monta exatamente uma instância de `App` no elemento raiz.
  - `index.css` inclui as diretivas Tailwind configuradas e define o tema dark glassmorphism.
  - Nos cinco viewports da spec, `document.documentElement.scrollWidth <= window.innerWidth` no shell.
- **Dependências:** T-11.
- **Arquivos prováveis:** `src/main.tsx`, `src/index.css`.
- **Rastreabilidade:** RNF-01, RNF-02.

## Entrega 7 — Testes

### T-13 — Testar validação da busca

- **ID:** T-13
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** Cobrir limites, espaços e preservação de caracteres da função de busca.
- **Critérios de aceite:**
  - Testes cobrem vazio, espaços, 2, 3, 100 e 101 caracteres após `trim`.
  - `" São Paulo "` resulta em `"São Paulo"` e mantém acentos.
  - Testes não usam rede.
- **Dependências:** T-02.
- **Arquivos prováveis:** `tests/unit/lib/searchQuery.test.ts`.
- **Rastreabilidade:** RF-01; CA-01.4, CA-01.5, CA-01.11.

### T-14 — Testar conversão de temperatura

- **ID:** T-14
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** Criar testes unitários Vitest para conversões, arredondamento, unidades e valores ausentes.
- **Critérios de aceite:**
  - Vitest cobre as funções puras nos dois sentidos: Celsius → Fahrenheit e Fahrenheit → Celsius, com valores positivos e negativos.
  - As asserções confirmam `20 °C` → `68,0 °F`, `-40 °C` → `-40,0 °F`, `68 °F` → `20,0 °C` e `12,34 °C` → `54,2 °F`.
  - Testes confirmam uma casa decimal, símbolo/unidade correspondentes e que `null` permanece indisponível, não zero.
  - Cobertura adicional em `tests/unit/temperature.test.ts` verifica 0 °C → 32 °F, 100 °C → 212 °F, -40 °C → -40 °F e `unitLabel` para Celsius e Fahrenheit.
  - A suíte não usa DOM, rede ou mocks de `fetch`.
- **Dependências:** T-03.
- **Arquivos prováveis:** `tests/unit/lib/temperature.test.ts`.
- **Rastreabilidade:** RF-04; CA-04.1–CA-04.4, CA-04.6.

### T-15 — Testar mapeamento WMO

- **ID:** T-15
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** Cobrir grupos de condições suportados e o fallback do mapeador.
- **Critérios de aceite:**
  - Testes cobrem ao menos um código por grupo implementado.
  - Código desconhecido retorna o fallback esperado.
- **Dependências:** T-04.
- **Arquivos prováveis:** `tests/unit/lib/weatherCodes.test.ts`.
- **Rastreabilidade:** RF-02, RF-03; CA-02.1, CA-03.1.

### T-16 — Testar datas e frescor

- **ID:** T-16
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** P
- **Descrição:** Verificar preservação de datas locais, conversão de instante e limite de frescor.
- **Critérios de aceite:**
  - Observações de 1 h 59 min e exatamente 2 h são classificadas como recentes; 2 h 1 min como desatualizada.
  - Datas diárias em exemplos de fuso UTC positivo e negativo permanecem idênticas à string de entrada.
  - Um par conhecido de horário local e offset resulta no instante ISO-8601 UTC esperado.
- **Dependências:** T-05.
- **Arquivos prováveis:** `tests/unit/lib/dateTime.test.ts`.
- **Rastreabilidade:** RF-02, RF-03; CA-02.5, CA-03.1; RNF-01.

### T-17 — Testar cliente Open-Meteo

- **ID:** T-17
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** Criar testes Vitest do service com `fetch` mockado para validar requests, erros e normalização.
- **Critérios de aceite:**
  - Vitest substitui `fetch` e confirma URL/parâmetros dos dois endpoints, coordenadas selecionadas e encoding de `"São Paulo"`; nenhuma chamada real sai do teste.
  - Fixtures cobrem geocoding vazio, 11 resultados (ordem e limite 10), homônimos e campos opcionais ausentes.
  - Fixtures Forecast cobrem cinco e três dias, campos nulos/ausentes, unidade e timezone válidos, além de payload malformado.
  - Testes verificam `RequestError` correto para HTTP não-2xx, rejeição de rede, timeout de 10 s e cancelamento.
  - A suíte passa sem conexão com Open-Meteo.
- **Dependências:** T-06.
- **Arquivos prováveis:** `tests/unit/services/openMeteoClient.test.ts`.
- **Rastreabilidade:** RF-01–RF-03, RF-05; CA-01.1–CA-01.4, CA-01.6, CA-01.10, CA-02.1–CA-02.5, CA-03.1–CA-03.5, CA-05.1–CA-05.2; RNF-05, RNF-07, RNF-09.

### T-18 — Testar hook e transições de estado

- **ID:** T-18
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** Testar a orquestração do hook com o cliente Open-Meteo substituído por mock.
- **Critérios de aceite:**
  - Mocks cobrem loading → success/empty/error e verificam zero chamadas para input inválido.
  - Seleção chama forecast com coordenadas exatas; retry chama novamente somente a operação que falhou.
  - Promises controladas resolvidas em ordem inversa mantêm resultados e relatório correspondentes à última busca/cidade.
  - Erro de refresh mantém relatório e `fetchedAt` anteriores; selecionar cidade B nunca exibe relatório identificado como cidade A.
  - Timer controlado avança cinco minutos sem nova chamada automática.
  - Testes verificam unidade default/persistida e falha de `localStorage` na leitura ou escrita.
- **Dependências:** T-07.
- **Arquivos prováveis:** `tests/unit/hooks/useWeatherApp.test.ts`.
- **Rastreabilidade:** RF-01–RF-05; CA-01.5–CA-01.9, CA-01.11, CA-02.2–CA-02.3, CA-03.2, CA-03.4, CA-04.1, CA-04.5, CA-05.1–CA-05.3; RNF-05, RNF-07–RNF-09.

### T-19 — Testar componente de busca

- **ID:** T-19
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** Criar testes de componente com Testing Library para interação, validação, seleção e estados da busca.
- **Critérios de aceite:**
  - Asserções cobrem 0/2/3/100/101 caracteres, entrada `"São Paulo"` e trim dos espaços externos.
  - Testes separados renderizam os estados `loading`, `empty` (geocoding sem resultados), `error` e `success`; cada estado mostra a mensagem/lista esperada, identificável por role ou label.
  - Homônimos exibem distinção; selecionar a segunda opção invoca callback com ID e coordenadas da segunda cidade.
  - Acionar retry invoca o callback exatamente uma vez.
  - Interações de busca e seleção funcionam por teclado; testes não acessam service nem rede.
- **Dependências:** T-08.
- **Arquivos prováveis:** `tests/components/CitySearch.test.tsx`.
- **Rastreabilidade:** RF-01; CA-01.1–CA-01.11; RNF-01, RNF-03.

### T-20 — Testar painéis meteorológicos

- **ID:** T-20
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** Testar conteúdo, estados, dados parciais e acessibilidade dos painéis.
- **Critérios de aceite:**
  - Fixtures exercitam loading, erro, sucesso completo, campo ausente e previsão de três dias.
  - Asserções verificam cada métrica atual, nome da cidade, limite de frescor, ordem/datas previstas e mensagens de ausência.
  - Campo ausente nunca é renderizado como número zero; mensagens e campos são localizáveis por roles/labels.
- **Dependências:** T-09.
- **Arquivos prováveis:** `tests/components/WeatherViews.test.tsx`.
- **Rastreabilidade:** RF-02, RF-03; CA-02.1–CA-02.5, CA-03.1–CA-03.5; RNF-01, RNF-03.

### T-21 — Testar controle e persistência da unidade

- **ID:** T-21
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** Verificar interação acessível e persistência da unidade entre renderizações.
- **Critérios de aceite:**
  - Teste seleciona ambas as unidades por teclado e verifica estado acessível e temperaturas atualizadas nos dois painéis.
  - Remontagem com armazenamento compartilhado restaura Fahrenheit; preferência ausente/corrompida inicializa Celsius.
  - Mocks de `localStorage` que lançam em leitura/escrita não impedem renderização ou troca de unidade.
- **Dependências:** T-10.
- **Arquivos prováveis:** `tests/components/TemperatureUnitControl.test.tsx`.
- **Rastreabilidade:** RF-04; CA-04.1–CA-04.5; RNF-03, RNF-08.

### T-22 — Testar composição da aplicação

- **ID:** T-22
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** Cobrir integração entre hook e componentes no ambiente de teste React.
- **Critérios de aceite:**
  - Cliente mockado verifica resultados e relatório após busca e seleção, sem request real.
  - Antes da seleção, `getWeather` tem zero chamadas; depois dela recebe as coordenadas selecionadas.
  - Testes renderizam loading/erro/vazio/sucesso e verificam os callbacks de retry e refresh.
  - Busca, seleção, unidade e atualização são acessíveis por role/label e podem ser acionadas por teclado.
- **Dependências:** T-11, T-12.
- **Arquivos prováveis:** `tests/components/App.test.tsx`.
- **Rastreabilidade:** RF-01–RF-05; CA-01.3, CA-01.5–CA-01.8, CA-02.1–CA-02.4, CA-03.1–CA-03.5, CA-04.1–CA-04.5, CA-05.1–CA-05.3; RNF-03, RNF-07.

### T-23 — Testar fluxo E2E bem-sucedido

- **ID:** T-23
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** Validar no Playwright o caminho principal em viewport mobile com rotas Open-Meteo interceptadas.
- **Critérios de aceite:**
  - Com viewport de 375 CSS px, rotas interceptadas e sem chamadas externas, busca e seleção exibem clima atual e cinco datas; alternar para Fahrenheit e recarregar mantém Fahrenheit.
  - Atualização manual gera nova chamada para a cidade selecionada e renderiza a resposta fixture atualizada.
  - Todo o fluxo principal — busca, seleção, consulta, troca de unidade, reload e atualização manual — passa no viewport mobile de 375 CSS px.
- **Dependências:** T-12, T-22.
- **Arquivos prováveis:** `tests/e2e/weather-app.spec.ts`, `playwright.config.ts`.
- **Rastreabilidade:** RF-01–RF-05; CA-01.1–CA-01.3, CA-02.1, CA-03.1, CA-04.1–CA-04.5, CA-05.1–CA-05.2; RNF-04, RNF-07, RNF-09.

### T-24 — Testar erros e tentativas novamente em E2E

- **ID:** T-24
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** M
- **Descrição:** Cobrir estados recuperáveis de erro nos fluxos E2E.
- **Critérios de aceite:**
  - Contador de rotas confirma zero requests para consulta inválida e zero requests de forecast para geocoding vazio.
  - HTTP não-2xx e rede abortada encerram loading, mostram erro distinto de vazio e retry acionado pelo usuário faz uma nova tentativa.
  - Rota sem resposta excede 10 s, mostra erro de timeout e não gera nova tentativa sem ação do usuário.
  - Todas as rotas externas usadas são interceptadas.
- **Dependências:** T-23.
- **Arquivos prováveis:** `tests/e2e/weather-app.spec.ts`.
- **Rastreabilidade:** RF-01–RF-03; CA-01.5–CA-01.8, CA-02.2–CA-02.3, CA-03.2, CA-03.4; RNF-05, RNF-07.

### T-25 — Testar respostas parciais e concorrência em E2E

- **ID:** T-25
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** M
- **Descrição:** Validar respostas incompletas e respostas fora de ordem entre buscas e localidades.
- **Critérios de aceite:**
  - Fixture com três datas identifica duas indisponíveis e não renderiza valores numéricos inventados.
  - Duas buscas/consultas atrasadas resolvidas em ordem inversa mantêm visíveis resultados e relatório da operação mais recente.
  - Após selecionar cidade B, resposta tardia de cidade A nunca aparece sob o nome de B.
- **Dependências:** T-23.
- **Arquivos prováveis:** `tests/e2e/weather-app.spec.ts`.
- **Rastreabilidade:** CA-01.9, CA-02.1–CA-02.4, CA-03.1–CA-03.5; Edge Cases “Respostas fora de ordem” e “Resposta parcial”.

### T-26 — Validar viewports responsivos

- **ID:** T-26
- **Tipo:** Test
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** Verificar layout e fluxo principal em larguras mobile, tablet e desktop especificadas.
- **Critérios de aceite:**
  - Em cada largura 320, 375, 768, 1024 e 1440 CSS px, `document.documentElement.scrollWidth <= window.innerWidth`.
  - Em cada largura, bounding boxes dos controles e do conteúdo essencial permanecem na viewport e não se sobrepõem.
  - Fluxo principal passa com viewport configurado em 375 px; todas as rotas Open-Meteo são interceptadas.
- **Dependências:** T-23.
- **Arquivos prováveis:** `tests/e2e/non-functional.spec.ts`.
- **Rastreabilidade:** RNF-02.

### T-27 — Validar navegadores, teclado e estados acessíveis

- **ID:** T-27
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** G
- **Descrição:** Verificar compatibilidade e acessibilidade nos fluxos suportados.
- **Critérios de aceite:**
  - Configuração lista projetos das versões de Chrome, Edge, Firefox e Safari suportadas e executa o fluxo principal em cada projeto.
  - Checklist de release registra resultado de verificação em Safari iOS e Chrome Android nas versões estáveis atuais.
  - Um teste de teclado completa busca, seleção, troca de unidade e atualização sem mouse.
  - Árvore acessível expõe loading/erro como mensagens anunciáveis associadas às seções correspondentes.
- **Dependências:** T-23.
- **Arquivos prováveis:** `playwright.config.ts`, `tests/e2e/non-functional.spec.ts`.
- **Rastreabilidade:** RNF-03, RNF-04.

## Entrega 8 — Hardening e validação operacional

### T-28 — Configurar publicação por HTTPS

- **ID:** T-28
- **Tipo:** Infra
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** Configurar o hosting para servir o shell da aplicação por HTTPS.
- **Critérios de aceite:**
  - URL de produção responde em HTTPS com cadeia de certificado válida; HTTP redireciona para HTTPS quando suportado pela plataforma.
  - Inspeção de requests não encontra recursos HTTP nem avisos de conteúdo misto.
  - Regra de HTTPS está aplicada na plataforma de hosting/deploy e presente em configuração versionada.
- **Dependências:** T-12.
- **Arquivos prováveis:** configuração existente de hosting/deploy e headers/redirects da plataforma.
- **Rastreabilidade:** RNF-08.

### T-29 — Configurar monitoramento sintético do shell

- **ID:** T-29
- **Tipo:** Infra
- **Prioridade:** P1
- **Tamanho:** M
- **Descrição:** Configurar a verificação de disponibilidade do shell independentemente do provedor meteorológico.
- **Critérios de aceite:**
  - Configuração do monitor define intervalo de cinco minutos e verifica HTTP 200 mais carregamento do shell.
  - Relatório mensal calcula sucesso/total de verificações e alerta abaixo de 99,5%.
  - Probe verifica somente o shell, sem consultar Open-Meteo; falhas do provedor não alteram a métrica.
- **Dependências:** T-28.
- **Arquivos prováveis:** configuração do monitor sintético da plataforma.
- **Rastreabilidade:** RNF-06, RNF-07.

### T-30 — Medir desempenho sob rede controlada

- **ID:** T-30
- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** M
- **Descrição:** Medir o p95 de buscas e consultas bem-sucedidas sob as condições de rede da especificação.
- **Critérios de aceite:**
  - Execução aplica RTT de 100 ms e largura de banda de 50 Mbps e registra essa configuração.
  - Para cada busca/consulta bem-sucedida, mede do submit/seleção até a renderização dos resultados/dados.
  - Calcula e reporta p95 separadamente para busca e consulta; o teste falha se qualquer p95 exceder 3 s.
- **Dependências:** T-23.
- **Arquivos prováveis:** `tests/e2e/performance.spec.ts`, configuração de CI para execução do cenário.
- **Rastreabilidade:** RNF-05.

## Matriz de rastreabilidade dos requisitos funcionais

| Requisito da spec | Tarefas correspondentes | Cobertura |
| --- | --- | --- |
| **RF-01 — Buscar e selecionar cidades** | T-02, T-06, T-07, T-08, T-13, T-17, T-18, T-19, T-22, T-23, T-24, T-25 | Validação de entrada, geocoding e limite/ordem de resultados, seleção e distinção de homônimos, estados vazio/erro/loading, proteção contra resposta obsoleta e fluxo E2E. |
| **RF-02 — Consultar clima atual** | T-01, T-04, T-05, T-06, T-07, T-09, T-15, T-16, T-17, T-18, T-20, T-22, T-23, T-24, T-25 | Modelo e normalização dos dados atuais, condição WMO, timezone/frescor, apresentação de métricas e campos ausentes, estados de consulta e testes unitários, componentizados e E2E. |
| **RF-03 — Consultar previsão de cinco dias** | T-01, T-04, T-05, T-06, T-07, T-09, T-15, T-16, T-17, T-18, T-20, T-22, T-23, T-24, T-25 | Consulta diária no fuso local, mapeamento WMO, cinco datas, cobertura parcial e campos ausentes, apresentação e testes do service, componentes, integração e E2E. |
| **RF-04 — Alternar unidade de temperatura** | T-01, T-03, T-07, T-10, T-14, T-18, T-21, T-22, T-23 | Celsius padrão, conversões e arredondamento, aplicação a todas as temperaturas, persistência local, controle acessível e cobertura unitária, hook, componente e E2E. |
| **RF-05 — Atualizar dados** | T-06, T-07, T-11, T-18, T-22, T-23, T-24 | Consulta ao selecionar cidade, atualização manual, atualização do horário de sucesso, falhas/retentativa e ausência de atualização automática, cobertas no service, hook, integração e E2E. |

**Lacunas de cobertura funcional:** nenhum dos requisitos RF-01 a RF-05 está sem tarefa correspondente no backlog. Os requisitos não funcionais são rastreados separadamente nas tarefas e nos campos de rastreabilidade individuais.

### Cobertura automatizada do estado atual

- [Testes WMO](../tests/unit/lib/weatherCodes.test.ts): códigos conhecidos com descrição/ícone exatos e fallback desconhecido.
- [Testes de datas](../tests/unit/lib/format.test.ts): contrato atual de `formatDay(date)` em pt-BR, ano bissexto, virada de ano e rejeição de datas inválidas. O módulo atual não oferece índice relativo nem `getShortDate`.
- [Geocoding](../tests/unit/services/weatherService.test.ts) e [forecast](../tests/unit/services/getWeather.test.ts): `fetch` substituído por `vi.stubGlobal`, input vazio sem rede, mapeamento, ausência de resultados, HTTP/rede/timeout, cinco dias, campos nulos e respostas incompatíveis. Precipitação nula permanece indisponível, nunca é presumida como zero.
- [Conversão integrada](../tests/unit/components/TemperatureConversion.test.tsx): `UnitToggle` e `CurrentWeather` convertem 0 °C em 32 °F por interação, retornam a Celsius sem erro acumulado e preservam campos ausentes e outras grandezas. [SearchBar](../tests/unit/components/SearchBar.test.tsx) já cobre vazio/espaços, callback com trim, botão e teclado.
- [Hook](../tests/unit/hooks/useWeather.test.ts): inclui ausência de atualização automática após cinco minutos, além de concorrência, validação e retry já cobertos.
- [E2E complementar](../tests/e2e/weather.spec.ts): rotas determinísticas, busca pelo botão, conversão, viewport 375×812, geocoding `{}` sem forecast, falha HTTP/estrutural com remoção de dados antigos e retry na unidade escolhida, campos parcialmente nulos.
- [E2E de layout e acessibilidade](../tests/e2e/weather-app.spec.ts): medições de layout com `expect.poll` após carregamento das fontes, temperaturas delimitadas por região/card, foco por teclado, liberação garantida de resposta bloqueada e contraste medido nos estilos reais do botão normal/hover. O [Playwright](../playwright.config.ts) inicia servidor exclusivo com porta estrita, sem reaproveitar servidor existente.

**Lacunas identificadas na validação anterior:** seleção explícita/homônimos, persistência da unidade, horário/frescor da observação, atualização manual e previsão parcial motivaram a correção funcional descrita abaixo. A matriz histórica registra o estado antes dessa correção, não o comportamento atual.

### Verificação anterior dos gates e dos critérios de aceite — 2026-10-27

| Comando | Resultado final |
| --- | --- |
| `pnpm lint` | Aprovado, sem erros. |
| `pnpm build` | Aprovado, TypeScript e bundle de produção. |
| `pnpm test` | Aprovado, 184 testes em 15 arquivos. |
| `pnpm test:e2e` | Aprovado, 32 testes: 16 Chromium desktop e 16 WebKit com emulação de iPhone 13. |

A primeira tentativa E2E foi bloqueada pela porta 5173 ocupada. O [servidor exclusivo do Playwright](../playwright.config.ts) passou a usar 5174, mantendo `--strictPort` e `reuseExistingServer: false`; o processo de desenvolvimento existente não foi interrompido. A execução seguinte identificou bibliotecas WebKit ausentes, instaladas com `pnpm exec playwright install-deps webkit`. O [README](../README.md) documenta a instalação com dependências de sistema. Foi incluído o viewport de 1024 px; a suíte agora verifica 320, 375, 768, 1024, 1440 e 1920 px nos dois projetos.

**Registro histórico, anterior à correção funcional solicitada:** gates aprovados não equivaliam ao aceite integral. A matriz abaixo confronta o comportamento daquela revisão com os 30 critérios. Consulte a atualização funcional abaixo para o estado posterior.

| Critérios | Situação | Evidência ou lacuna |
| --- | --- | --- |
| CA-01.1, CA-01.2, CA-01.3, CA-01.10 | Não atendidos na UI | O [hook](../src/hooks/useWeather.ts) escolhe `cities[0]`; o [App](../src/App.tsx) não oferece opções selecionáveis nem distingue homônimos. O limite/ordem de dez resultados é testado somente no serviço. |
| CA-01.4 | Verificado | Trim e acentos preservados nos testes de [busca](../tests/unit/components/SearchBar.test.tsx) e [geocoding](../tests/unit/services/weatherService.test.ts). |
| CA-01.5 | Parcial | O hook rejeita entradas curtas sem rede, mas a [SearchBar](../src/components/SearchBar.tsx) bloqueia vazio/espaços sem exibir a orientação exigida. |
| CA-01.6, CA-01.7, CA-01.8 | Verificados no fluxo atual | Vazio sem forecast, erro recuperável/retry e loading cobertos por [App](../tests/unit/App.test.tsx), [serviço](../tests/unit/services/fetchWithTimeout.test.ts) e [E2E](../tests/e2e/weather-app.spec.ts). Timeout é comprovado no teste unitário; não há teste E2E de espera de 10 s. |
| CA-01.9 | Parcial | O [teste do hook](../tests/unit/hooks/useWeather.test.ts) comprova que a resposta antiga é ignorada, mas a busca fica desabilitada durante loading e o cenário A/B não é exercitado pela UI. |
| CA-01.11 | Verificado | O [hook](../tests/unit/hooks/useWeather.test.ts) rejeita mais de 100 caracteres antes da rede e o App apresenta a mensagem de erro. |
| CA-02.1 | Parcial | [CurrentWeather](../src/components/CurrentWeather.tsx) apresenta as métricas, mas não renderiza `observedAt`. |
| CA-02.2 | Parcial | Falhas HTTP/estruturais removem os valores e oferecem retry; porém `current: {}` é aceito pelo serviço como campos nulos e não oferece retry como consulta atual indisponível. |
| CA-02.3, CA-02.4 | Verificados | Loading e campos opcionais ausentes/nulos cobertos por [App](../tests/unit/App.test.tsx), [painel](../tests/unit/components/CurrentWeather.test.tsx) e [mapeamento](../tests/unit/services/getWeather.test.ts). |
| CA-02.5 | Não atendido | Não há classificação nem rótulo de observação com mais de duas horas em [CurrentWeather](../src/components/CurrentWeather.tsx). |
| CA-03.1 | Parcialmente comprovado | Cinco datas consecutivas retornadas pela API são mapeadas e exibidas em ordem. A suíte usa datas fixas e não comprova D a D+4 relativos ao dia atual no fuso da cidade. |
| CA-03.2, CA-03.4, CA-03.5 | Verificados no fluxo atual | Falhas estruturais/HTTP, loading e probabilidade ausente são cobertos pelo [serviço](../tests/unit/services/getWeather.test.ts), [painéis](../tests/unit/components/ForecastList.test.tsx) e [E2E](../tests/e2e/weather.spec.ts). |
| CA-03.3 | Não atendido | O [serviço](../src/services/weatherService.ts) rejeita menos de cinco datas; [ForecastList](../src/components/ForecastList.tsx) informa quantidade faltante quando recebe lista parcial diretamente, mas não cria registros para as datas ausentes. |
| CA-04.1, CA-04.2, CA-04.3, CA-04.4, CA-04.6 | Verificados | Celsius padrão, conversões a partir da fonte Celsius, arredondamento e alteração apenas das temperaturas cobertos por [funções](../tests/unit/lib/temperature.test.ts), [integração da conversão](../tests/unit/components/TemperatureConversion.test.tsx) e [E2E](../tests/e2e/weather.spec.ts). |
| CA-04.5 | Não atendido | A unidade existe somente no `useState` do [App](../src/App.tsx), sem persistência entre visitas. |
| CA-05.1 | Parcial | O hook consulta coordenadas da cidade recebida por `selectCity`, mas essa ação não está conectada a uma lista de seleção na UI. |
| CA-05.2 | Não atendido | Não há ação “Atualizar” nem exibição de `fetchedAt` no [App](../src/App.tsx). Retry após erro não substitui atualização manual de dados carregados. |
| CA-05.3 | Verificado | O [teste do hook](../tests/unit/hooks/useWeather.test.ts) avança cinco minutos e confirma ausência de consulta automática. |

**Limites da validação dos RNFs:** RNF-02 tem os viewports mínimos cobertos. Os testes de teclado, foco e contraste não certificam WCAG 2.2 AA integralmente (RNF-03). Chromium e WebKit emulado não comprovam a matriz de duas versões estáveis de todos os navegadores/plataformas (RNF-04). O timeout está coberto, mas não o p95 sob rede de 100 ms/50 Mbps (RNF-05). Disponibilidade mensal e HTTPS de produção não são comprováveis por estes gates locais (RNF-06/RNF-08). Localização temporal, persistência e seleção explícita ainda limitam RNF-01, RNF-08 e RNF-09. Os testes E2E interceptam a API e não medem a disponibilidade real da Open-Meteo.

### Correção das pendências funcionais — 2026-10-27

Esta atualização substitui o diagnóstico funcional da matriz histórica anterior.
Os critérios e requisitos da spec foram preservados, sem reduzir as exigências
para acomodar o comportamento antigo.

| Critérios antes pendentes/parciais | Correção e evidência |
| --- | --- |
| CA-01.1–CA-01.3, CA-01.10; CA-05.1 | [CityResults](../src/components/CityResults.tsx) lista até dez botões na ordem do provedor, mostra região/país e coordenadas para homônimos indistinguíveis. [useWeather](../src/hooks/useWeather.ts) aguarda seleção antes do forecast. Testes do [componente](../tests/unit/components/CityResults.test.tsx) e do [hook](../tests/unit/hooks/useWeather.test.ts) confirmam limite, ordem e a cidade passada à consulta. |
| CA-01.5, CA-01.11 | [SearchBar](../src/components/SearchBar.tsx) compartilha `validateCityQuery` com o hook e informa vazio/espaços, menos de três e mais de 100 caracteres em alerta associado ao campo, sem rede. Botão habilitado no vazio permite acionar a validação. |
| CA-01.9 | A busca permanece habilitada durante loading; uma nova busca invalida a anterior. [App.test.tsx](../tests/unit/App.test.tsx) e o teste do hook confirmam que a resposta antiga não sobrescreve os resultados recentes. |
| CA-02.1, CA-02.5 | [CurrentWeather](../src/components/CurrentWeather.tsx) mostra o horário da observação no fuso da cidade e “Desatualizado” somente após duas horas. Um timeout atualiza o rótulo sem polling de rede. [Testes do painel](../tests/unit/components/CurrentWeather.test.tsx) verificam a fronteira exata de duas horas e o cleanup do timer. |
| CA-02.2 | [weatherService](../src/services/weatherService.ts) rejeita `current: {}` ou sem nenhum valor meteorológico, mesmo com timestamp presente, acionando alerta e retry da cidade selecionada. Campos parcialmente ausentes continuam nulos e zeros são válidos. |
| CA-03.1, CA-03.3 | O serviço calcula D no fuso retornado e produz D..D+4. Datas faltantes viram registros com campos nulos e [ForecastList](../src/components/ForecastList.tsx) informa cobertura incompleta, sem inventar zeros. Testes do serviço fixam o relógio e incluem lacunas, UTC positivo/negativo e arrays inválidos. |
| CA-04.5 | [useTemperatureUnit](../src/hooks/useTemperatureUnit.ts) persiste somente a unidade; restaura Fahrenheit, usa Celsius sem preferência ou com conteúdo inválido e informa falhas de leitura/escrita sem impedir o uso na sessão. [Testes](../tests/unit/hooks/useTemperatureUnit.test.ts) verificam os quatro casos. |
| CA-05.2 | [RefreshWeather](../src/components/RefreshWeather.tsx) apresenta o horário da última consulta bem-sucedida e “Atualizar”. O hook refaz somente forecast para as coordenadas selecionadas; sucesso substitui `fetchedAt`, falha preserva o relatório anterior em memória sem exibi-lo como atual, e retry repete a atualização. |

As mudanças não adicionam atualização automática nem persistência de cidades.
A indicação de loading diferencia busca de cidades e consulta da previsão.
Foco, `aria-busy`, teclado e estados de erro são mantidos no fluxo explícito.
As limitações de comprovação dos RNFs de produção e da matriz completa de
navegadores permanecem independentes destas correções funcionais.

## Sequência sugerida em fatias verticais

Execute por fatia de ponta a ponta, antecipando feedback visual em vez de concluir toda uma camada antes de integrar a seguinte. As tarefas continuam sujeitas às dependências declaradas.

### Fatia 1 — Primeira consulta meteorológica visível

- **Sequência:** T-01 → (T-02 + T-13) → (T-03 + T-14) → (T-04 + T-15) → (T-05 + T-16) → (T-06 + T-17) → (T-07 + T-18) → (T-08 + T-19) → (T-09 + T-20) → (T-10 + T-21) → (T-11 + T-12 + T-22) → T-23.
- **Resultado demonstrável:** buscar e selecionar uma cidade, ver clima atual e cinco dias, alternar e persistir unidade; o E2E do fluxo principal roda em viewport mobile de 375 px. Cada teste focal acompanha sua implementação; integrar os componentes em `App` assim que estado e componente estiverem prontos, sem esperar o hardening.

### Fatia 2 — Cobertura e resiliência do fluxo

- **Tarefas:** T-24 e T-25.
- **Resultado verificável:** geocoding vazio, erros/timeout, retry manual, dados parciais e respostas fora de ordem se comportam conforme os critérios sem dados antigos ou incorretos apresentados como atuais.

### Fatia 3 — Responsividade e release confiável

- **Tarefas:** T-26 e T-27.
- **Resultado verificável:** viewports requeridos, teclado, estados anunciáveis e navegadores/plataformas suportados são verificados. Tratar esta fatia como gate de release, embora não bloqueie a primeira demonstração funcional.

### Fatia 4 — Operação em produção

- **Tarefas:** T-28 → T-29; T-30 pode avançar em paralelo após T-23.
- **Resultado verificável:** HTTPS, disponibilidade do shell separada da API externa e p95 medido sob rede controlada. Concluir antes da publicação/aceite de produção.

**Prioridade P2:** nenhuma tarefa foi classificada como P2. Todos os requisitos do baseline da spec têm cobertura e não devem ser tratados como adiáveis para uma entrega v1 completa.
