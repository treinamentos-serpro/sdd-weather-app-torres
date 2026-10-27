# Backlog de Tarefas — Weather App v1

Fonte: `plans/weather-app-plan.md`.

As tarefas estão agrupadas por entrega e ordenadas respeitando suas dependências. Todas iniciam como **Pendente**; conclua as dependências antes de iniciar uma tarefa dependente.

## Entrega 1 — Contratos e funções puras

### T-01 — Definir tipos do domínio

- **ID:** T-01
- **Tipo:** Data
- **Descrição:** Criar contratos TypeScript para localidade, condição, clima atual, previsão diária, relatório, unidade e erros.
- **Critérios de aceite:**
  - `City`, `WeatherCondition`, `CurrentWeather`, `DailyForecast`, `WeatherReport`, `RequestError` e `OpenMeteoClient` seguem os contratos do plano.
  - Campos meteorológicos opcionais aceitam `null`; zero continua sendo um valor válido.
  - Temperaturas no modelo permanecem em Celsius; `observedAt` e `fetchedAt` têm semânticas distintas.
  - Tipos passam no TypeScript strict.
- **Dependências:** nenhuma.
- **Arquivos prováveis:** `src/types/weather.ts`.

### T-02 — Validar consultas de cidade

- **ID:** T-02
- **Tipo:** Data
- **Descrição:** Implementar função pura para limpar espaços externos e validar o tamanho da consulta antes do geocoding.
- **Critérios de aceite:**
  - Após `trim`, consultas com menos de 3 ou mais de 100 caracteres são inválidas.
  - Entradas válidas preservam acentos e pontuação sem normalização adicional.
  - A função não executa I/O nem altera a entrada recebida.
- **Dependências:** nenhuma.
- **Arquivos prováveis:** `src/lib/searchQuery.ts`.

### T-03 — Testar validação da busca

- **ID:** T-03
- **Tipo:** Test
- **Descrição:** Cobrir limites, espaços e preservação de caracteres da função de busca.
- **Critérios de aceite:**
  - Testes cobrem vazio, espaços, 2, 3, 100 e 101 caracteres após `trim`.
  - `" São Paulo "` resulta em `"São Paulo"` e mantém acentos.
  - Testes não usam rede.
- **Dependências:** T-02.
- **Arquivos prováveis:** `tests/unit/lib/searchQuery.test.ts`.

### T-04 — Implementar conversão de temperatura

- **ID:** T-04
- **Tipo:** Data
- **Descrição:** Criar funções puras para conversão entre Celsius e Fahrenheit e formatação pt-BR.
- **Critérios de aceite:**
  - Conversões partem sempre do valor canônico em Celsius e não acumulam erro ao alternar unidades.
  - Temperaturas são arredondadas a uma casa decimal e usam vírgula decimal e símbolo correto.
  - `20 °C` resulta em `68,0 °F`, `-40 °C` em `-40,0 °F` e `12,34 °C` em `54,2 °F`.
  - Valores ausentes não são formatados como zero.
- **Dependências:** T-01.
- **Arquivos prováveis:** `src/lib/temperature.ts`.

### T-05 — Testar conversão de temperatura

- **ID:** T-05
- **Tipo:** Test
- **Descrição:** Verificar conversões, arredondamento, unidades e valores ausentes.
- **Critérios de aceite:**
  - Testes cobrem conversão nos dois sentidos para valores positivos e negativos.
  - Testes confirmam os resultados exatos previstos no plano, inclusive `12,34 °C` → `54,2 °F`.
  - `null` continua indisponível e não vira zero.
- **Dependências:** T-04.
- **Arquivos prováveis:** `tests/unit/lib/temperature.test.ts`.

### T-06 — Mapear códigos meteorológicos WMO

- **ID:** T-06
- **Tipo:** Data
- **Descrição:** Implementar o mapeamento puro de códigos WMO para rótulos em pt-BR com fallback neutro.
- **Critérios de aceite:**
  - Códigos suportados retornam os rótulos pt-BR definidos para suas condições.
  - Código desconhecido retorna fallback neutro sem lançar erro.
  - A saída atende `WeatherCondition`.
- **Dependências:** T-01.
- **Arquivos prováveis:** `src/lib/weatherCode.ts`.

### T-07 — Testar mapeamento WMO

- **ID:** T-07
- **Tipo:** Test
- **Descrição:** Cobrir grupos de condições suportados e o fallback do mapeador.
- **Critérios de aceite:**
  - Testes cobrem ao menos um código por grupo implementado.
  - Código desconhecido retorna o fallback esperado.
- **Dependências:** T-06.
- **Arquivos prováveis:** `tests/unit/lib/weatherCode.test.ts`.

### T-08 — Normalizar datas e frescor da observação

- **ID:** T-08
- **Tipo:** Data
- **Descrição:** Implementar funções puras de data/hora para preservar datas locais e classificar observações antigas.
- **Critérios de aceite:**
  - Datas diárias `YYYY-MM-DD` mantêm a data do fuso da localidade, sem deslocamento UTC.
  - Horário da observação pode ser normalizado para instante ISO-8601 com o fuso/offset recebido.
  - Observação com mais de duas horas é desatualizada; exatamente duas horas ou menos não é.
- **Dependências:** T-01.
- **Arquivos prováveis:** `src/lib/dateTime.ts`.

### T-09 — Testar datas e frescor

- **ID:** T-09
- **Tipo:** Test
- **Descrição:** Verificar preservação de datas locais, conversão de instante e limite de frescor.
- **Critérios de aceite:**
  - Testes cobrem idades de 1 h 59 min, exatamente 2 h e 2 h 1 min.
  - Datas diárias são preservadas em fusos com deslocamento UTC.
  - Conversão de horário da observação valida o offset/fuso e não altera indevidamente a data local diária.
- **Dependências:** T-08.
- **Arquivos prováveis:** `tests/unit/lib/dateTime.test.ts`.

## Entrega 2 — Integração com Open-Meteo

### T-10 — Implementar cliente Open-Meteo

- **ID:** T-10
- **Tipo:** Data
- **Descrição:** Implementar `searchCities` e `getWeather` com chamadas aos endpoints de geocoding e forecast, validação e normalização.
- **Critérios de aceite:**
  - Geocoding usa `name`, `count=10`, `language=pt` e `format=json`; mantém a ordem e limita a dez resultados.
  - Resultados são convertidos para `City`; uma resposta válida sem resultados retorna lista vazia.
  - Forecast usa as coordenadas da cidade selecionada, os campos `current` e `daily`, Celsius, km/h, `timezone=auto` e cinco dias.
  - Resposta é validada e mapeada para `WeatherReport`, incluindo timezone, datas locais, condições WMO e `fetchedAt`.
  - Campos opcionais ausentes são `null`, não zero; payload incompatível resulta em erro tipado.
  - Cada chamada suporta `AbortSignal` e timeout de 10 segundos; erros de rede, HTTP, timeout e resposta inválida são distinguidos.
- **Dependências:** T-01, T-02, T-06, T-08.
- **Arquivos prováveis:** `src/services/openMeteoClient.ts`.

### T-11 — Testar cliente Open-Meteo

- **ID:** T-11
- **Tipo:** Test
- **Descrição:** Testar requisições e normalização dos endpoints com `fetch` mockado.
- **Critérios de aceite:**
  - Testes verificam endpoints, parâmetros, coordenadas selecionadas e codificação de caracteres acentuados.
  - Cobrem geocoding vazio, limite/ordem de resultados, homônimos e campos opcionais ausentes.
  - Cobrem payload válido/parcial/malformado, unidades, fuso, timeout, cancelamento, HTTP não-2xx e erro de rede.
  - Nenhum teste depende de rede externa.
- **Dependências:** T-10.
- **Arquivos prováveis:** `tests/unit/services/openMeteoClient.test.ts`.

## Entrega 3 — Orquestração e estado

### T-12 — Implementar hook de aplicação

- **ID:** T-12
- **Tipo:** Data
- **Descrição:** Implementar `useWeatherApp` para coordenar busca, seleção, consulta, atualização manual, concorrência e unidade.
- **Critérios de aceite:**
  - Busca válida expõe loading, sucesso, vazio ou erro; busca inválida não chama o serviço.
  - Selecionar cidade inicia forecast usando suas coordenadas; geocoding vazio não inicia forecast.
  - Busca e consulta meteorológica mantêm estados de loading/erro independentes e oferecem retry manual.
  - AbortController/request ID impedem que respostas obsoletas de busca ou forecast sobrescrevam a operação mais recente ou dados de outra cidade.
  - Erro ao atualizar preserva relatório anterior e `fetchedAt`, mas não o apresenta como dado recém-atualizado; relatório de cidade anterior não é atribuído à cidade recém-selecionada.
  - Unidade começa em Celsius, persiste somente no `localStorage` e falha de storage não impede a aplicação.
  - Nenhuma atualização meteorológica automática ocorre.
- **Dependências:** T-01, T-10.
- **Arquivos prováveis:** `src/hooks/useWeatherApp.ts`.

### T-13 — Testar hook e transições de estado

- **ID:** T-13
- **Tipo:** Test
- **Descrição:** Testar a orquestração do hook com o cliente Open-Meteo substituído por mock.
- **Critérios de aceite:**
  - Testes cobrem estados loading/success/empty/error, busca inválida, seleção, retry e preferência de unidade.
  - Respostas fora de ordem de busca e forecast não substituem o estado mais recente.
  - Falha de atualização preserva o timestamp anterior; mudança de cidade não mistura relatórios.
  - Nenhuma atualização automática é iniciada por passagem de tempo.
- **Dependências:** T-12.
- **Arquivos prováveis:** `tests/unit/hooks/useWeatherApp.test.ts`.

## Entrega 4 — Interface e composição

### T-14 — Implementar busca e estados de solicitação

- **ID:** T-14
- **Tipo:** UI
- **Descrição:** Criar os componentes de busca, resultados selecionáveis e apresentação de loading, vazio e erro.
- **Critérios de aceite:**
  - Formulário aceita teclado, tem nome/label semântico e apresenta validação de comprimento em pt-BR.
  - Resultados exibem nome, região e país disponíveis; coordenadas distinguem homônimos restantes.
  - Estados de loading, lista vazia e erro são visualmente e semanticamente distintos; erro permite nova tentativa.
  - O componente recebe estado e callbacks por props e não chama serviços nem `fetch`.
- **Dependências:** T-02, T-12.
- **Arquivos prováveis:** `src/components/CitySearch.tsx`, `src/components/RequestStatus.tsx`.

### T-15 — Testar componente de busca

- **ID:** T-15
- **Tipo:** Test
- **Descrição:** Cobrir interação, validação, seleção e estados do componente de busca.
- **Critérios de aceite:**
  - Testes cobrem input vazio/2/3/100/101 caracteres, acentos e espaços externos.
  - Loading, vazio, erro e sucesso são localizáveis por roles/labels e oferecem a interação esperada.
  - Homônimos exibem dados de distinção e seleção invoca callback com a cidade correta.
  - Testes não acessam a rede.
- **Dependências:** T-14.
- **Arquivos prováveis:** `tests/components/CitySearch.test.tsx`.

### T-16 — Implementar painéis meteorológicos

- **ID:** T-16
- **Tipo:** UI
- **Descrição:** Criar apresentação de clima atual e previsão diária usando o modelo normalizado e a unidade escolhida.
- **Critérios de aceite:**
  - Clima atual apresenta localidade, temperaturas, condição, sensação térmica, umidade, vento e horário recebido, quando disponíveis.
  - Observação acima de duas horas é marcada como desatualizada.
  - Previsão apresenta datas locais em ordem e até cinco dias, com condição, mínima, máxima e probabilidade de precipitação quando disponível.
  - Campos ausentes e dias sem previsão são identificados como indisponíveis; previsão incompleta não é apresentada como completa.
  - Erro/loading da consulta não mostra dados incompatíveis como atuais ou previstos.
  - Componentes recebem dados/estado por props e não fazem I/O.
- **Dependências:** T-01, T-04, T-06, T-08, T-12.
- **Arquivos prováveis:** `src/components/CurrentWeather.tsx`, `src/components/ForecastList.tsx`.

### T-17 — Testar painéis meteorológicos

- **ID:** T-17
- **Tipo:** Test
- **Descrição:** Testar conteúdo, estados, dados parciais e acessibilidade dos painéis.
- **Critérios de aceite:**
  - Fixtures cobrem sucesso completo/parcial, loading, erro e campos ausentes.
  - Testes verificam dados de cidade correta, frescor, cinco dias, previsão incompleta e indisponibilidade sem zero presumido.
  - Texto de estados e campos é identificável por roles/labels semânticos.
- **Dependências:** T-16.
- **Arquivos prováveis:** `tests/components/WeatherViews.test.tsx`.

### T-18 — Implementar controle de unidade

- **ID:** T-18
- **Tipo:** UI
- **Descrição:** Criar controle acessível de Celsius/Fahrenheit conectado ao estado central da aplicação.
- **Critérios de aceite:**
  - Unidade ativa é identificável e selecionável por teclado.
  - Alternar unidade atualiza todos os valores de temperatura nos painéis sem alterar outras grandezas.
  - Preferência persiste após reload no mesmo navegador; Celsius é padrão sem preferência válida.
- **Dependências:** T-04, T-12.
- **Arquivos prováveis:** `src/components/TemperatureUnitControl.tsx`.

### T-19 — Testar controle e persistência da unidade

- **ID:** T-19
- **Tipo:** Test
- **Descrição:** Verificar interação acessível e persistência da unidade entre renderizações.
- **Critérios de aceite:**
  - Testes confirmam seleção por teclado, unidade ativa e atualização dos valores de temperatura.
  - Fahrenheit persiste após remontagem/reload simulado; preferência ausente ou inválida retorna Celsius.
  - Falha de `localStorage` não impede a interface de funcionar.
- **Dependências:** T-18.
- **Arquivos prováveis:** `tests/components/TemperatureUnitControl.test.tsx`.

### T-20 — Compor tela principal

- **ID:** T-20
- **Tipo:** UI
- **Descrição:** Conectar hook e componentes na tela principal, sem acoplar apresentação ao cliente HTTP.
- **Critérios de aceite:**
  - `App` conecta `useWeatherApp` à busca, painéis, controle de unidade e atualização manual.
  - Forecast só começa após seleção; atualização refaz manualmente a consulta da cidade ativa.
  - Estados de loading, vazio e erro são exibidos com ação de recuperação apropriada.
  - A camada de apresentação não importa nem chama serviços diretamente.
- **Dependências:** T-14, T-16, T-18.
- **Arquivos prováveis:** `src/App.tsx`.

### T-21 — Configurar entrada e estilos globais

- **ID:** T-21
- **Tipo:** UI
- **Descrição:** Conectar a aplicação ao ponto de entrada React/Vite e definir estilos globais do tema do projeto.
- **Critérios de aceite:**
  - `main.tsx` monta `App` no elemento raiz sem duplicar lógica de negócio.
  - Estilos globais incluem Tailwind e estabelecem o tema dark glassmorphism.
  - O shell não apresenta overflow horizontal nem fundo/estilo incompatível com o tema.
- **Dependências:** T-20.
- **Arquivos prováveis:** `src/main.tsx`, `src/index.css`.

### T-22 — Testar composição da aplicação

- **ID:** T-22
- **Tipo:** Test
- **Descrição:** Cobrir integração entre hook e componentes no ambiente de teste React.
- **Critérios de aceite:**
  - O fluxo de busca, seleção e apresentação de relatório funciona sem rede real.
  - Nenhuma chamada meteorológica ocorre antes da seleção.
  - Loading, erro, vazio, sucesso, retry e atualização manual aparecem no componente de aplicação.
  - Mensagens de estado e controles principais são acessíveis por roles/labels e teclado.
- **Dependências:** T-20.
- **Arquivos prováveis:** `tests/components/App.test.tsx`.

## Entrega 5 — E2E, compatibilidade e requisitos operacionais

### T-23 — Testar fluxo E2E bem-sucedido

- **ID:** T-23
- **Tipo:** Test
- **Descrição:** Validar no Playwright o caminho principal com rotas Open-Meteo interceptadas.
- **Critérios de aceite:**
  - Fluxo busca → seleção → clima atual e cinco dias → Fahrenheit → reload preservando unidade → atualização manual passa.
  - Fixtures controladas cobrem respostas de geocoding e forecast.
  - O teste não depende da disponibilidade real do provedor.
- **Dependências:** T-21, T-22.
- **Arquivos prováveis:** `tests/e2e/weather-app.spec.ts`, `playwright.config.ts`.

### T-24 — Testar erros e tentativas novamente em E2E

- **ID:** T-24
- **Tipo:** Test
- **Descrição:** Cobrir estados recuperáveis de erro nos fluxos E2E.
- **Critérios de aceite:**
  - Busca inválida não envia request e geocoding vazio não inicia forecast.
  - Falha de rede/HTTP e timeout encerram loading, mostram erro distinto de vazio e permitem retry manual.
  - Timeout não provoca retry automático.
  - O teste usa rotas interceptadas, sem depender de rede externa.
- **Dependências:** T-23.
- **Arquivos prováveis:** `tests/e2e/weather-app.spec.ts`.

### T-25 — Testar respostas parciais e concorrência em E2E

- **ID:** T-25
- **Tipo:** Test
- **Descrição:** Validar respostas incompletas e respostas fora de ordem entre buscas e localidades.
- **Critérios de aceite:**
  - Forecast parcial identifica dias/campos ausentes sem inventar valores.
  - Resposta obsoleta de busca ou forecast não substitui os dados da operação/cidade mais recente.
  - Nenhum relatório de outra localidade é apresentado como pertencente à cidade ativa.
- **Dependências:** T-23.
- **Arquivos prováveis:** `tests/e2e/weather-app.spec.ts`.

### T-26 — Validar viewports responsivos

- **ID:** T-26
- **Tipo:** Test
- **Descrição:** Verificar layout e fluxo principal em larguras mobile, tablet e desktop especificadas.
- **Critérios de aceite:**
  - Viewports 320, 375, 768, 1024 e 1440 CSS px não apresentam overflow horizontal, sobreposição ou corte de conteúdo essencial.
  - Fluxo principal E2E funciona em viewport mobile de 375 px.
  - As verificações não dependem da disponibilidade da API externa.
- **Dependências:** T-23.
- **Arquivos prováveis:** `tests/e2e/non-functional.spec.ts`.

### T-27 — Validar navegadores, teclado e estados acessíveis

- **ID:** T-27
- **Tipo:** Test
- **Descrição:** Verificar compatibilidade e acessibilidade nos fluxos suportados.
- **Critérios de aceite:**
  - Playwright cobre Chrome, Edge, Firefox e Safari conforme projetos disponíveis no CI.
  - Safari no iOS e Chrome no Android têm procedimento de validação na plataforma/dispositivo disponível, sem declarar cobertura automática inexistente.
  - Busca, seleção, consulta e troca de unidade funcionam por teclado.
  - Estados de loading e erro são identificáveis por tecnologia assistiva.
- **Dependências:** T-23.
- **Arquivos prováveis:** `playwright.config.ts`, `tests/e2e/non-functional.spec.ts`.

### T-28 — Configurar publicação por HTTPS

- **ID:** T-28
- **Tipo:** Infra
- **Descrição:** Configurar o hosting para servir o shell da aplicação por HTTPS.
- **Critérios de aceite:**
  - URL publicada usa HTTPS e certificado válido.
  - A aplicação não solicita recursos por HTTP nem apresenta conteúdo misto.
  - A configuração de hosting/deploy existente documenta ou aplica o redirecionamento seguro pertinente.
- **Dependências:** T-21.
- **Arquivos prováveis:** configuração existente de hosting/deploy e headers/redirects da plataforma.

### T-29 — Configurar monitoramento sintético do shell

- **ID:** T-29
- **Tipo:** Infra
- **Descrição:** Configurar a verificação de disponibilidade do shell independentemente do provedor meteorológico.
- **Critérios de aceite:**
  - Verificação executa a cada cinco minutos e valida resposta HTTP 200 e carregamento do shell.
  - Disponibilidade mensal alvo de pelo menos 99,5% é calculada a partir das verificações.
  - Falhas da Open-Meteo não são contabilizadas como indisponibilidade do shell.
- **Dependências:** T-28.
- **Arquivos prováveis:** configuração do monitor sintético da plataforma.

### T-30 — Medir desempenho sob rede controlada

- **ID:** T-30
- **Tipo:** Test
- **Descrição:** Medir o p95 de buscas e consultas bem-sucedidas sob as condições de rede da especificação.
- **Critérios de aceite:**
  - Cenário de teste aplica RTT de 100 ms e largura de banda de 50 Mbps.
  - Mede o tempo até a interface renderizar resultados/dados para buscas e consultas bem-sucedidas.
  - O resultado verifica o alvo p95 de até três segundos e reporta falha se excedido.
- **Dependências:** T-23.
- **Arquivos prováveis:** `tests/e2e/performance.spec.ts`, configuração de CI para execução do cenário.
