# Discovery — Aplicação de Previsão do Tempo

## Contexto

A empresa solicitou uma aplicação para consulta de informações meteorológicas. Usuários devem conseguir buscar cidades, consultar o clima atual, ver a previsão dos próximos cinco dias e alternar a temperatura entre Celsius e Fahrenheit. A aplicação também deve poder ser usada em dispositivos móveis.

O briefing define as capacidades principais, mas não detalha o público-alvo, as características meteorológicas a exibir, metas de qualidade ou as plataformas móveis suportadas. A fonte de dados e algumas regras de produto foram definidas nas decisões abaixo; os demais pontos devem ser esclarecidos antes de fechar a especificação.

## Requisitos Funcionais

- **RF-01 — Buscar cidades:** permitir que o usuário pesquise cidades para selecionar a localidade cujas informações meteorológicas deseja consultar.
- **RF-02 — Consultar clima atual:** apresentar as condições meteorológicas atuais da cidade selecionada.
- **RF-03 — Consultar previsão de cinco dias:** apresentar a previsão do tempo para cinco dias da cidade selecionada.
- **RF-04 — Alternar unidade de temperatura:** permitir alternar entre Celsius e Fahrenheit e exibir as temperaturas na unidade escolhida.

## Requisitos Não-Funcionais

- **RNF-01 — Uso em dispositivos móveis:** a aplicação deve ser utilizável em dispositivos móveis. Interpretamos isso, provisoriamente, como uma interface web responsiva; a necessidade de aplicativos nativos permanece em aberto.
- **RNF-02 — Responsividade:** busca, seleção da cidade e leitura das informações meteorológicas devem funcionar em telas móveis sem perda de conteúdo ou de funcionalidades essenciais.

O briefing não define critérios mensuráveis de desempenho, disponibilidade, acessibilidade, compatibilidade entre navegadores ou segurança. Esses requisitos precisam ser detalhados na especificação.

## Riscos

- **Cidades homônimas:** resultados de busca ambíguos podem levar o usuário a consultar a localidade errada.
- **Indisponibilidade ou baixa qualidade dos dados:** falhas, atrasos ou cobertura incompleta da fonte meteorológica podem impedir ou comprometer a consulta.
- **Previsão sem granularidade definida:** “cinco dias” não esclarece se a previsão deve ser diária, horária ou ambas, nem como tratar o dia corrente.
- **Dados percebidos como atuais quando estão desatualizados:** não há frequência de atualização ou indicação de horário de coleta definida.
- **Experiência móvel inadequada:** sem critérios de responsividade e usabilidade, a aplicação pode ser tecnicamente acessível em dispositivos móveis, mas difícil de operar.

## Perguntas em Aberto

1. A busca deve aceitar nomes de cidades apenas ou também estados/regiões, países, códigos postais ou localização atual?
2. Como devem ser diferenciadas cidades com o mesmo nome (por exemplo, pela região e pelo país)?
3. A preferência de unidade deve ser mantida entre visitas ou valer apenas durante a sessão? Celsius como unidade padrão já foi decidido.
4. Quais informações devem compor o clima atual (por exemplo, temperatura, sensação térmica, condição, umidade e vento)?
5. A previsão de hoje mais os quatro dias seguintes deve ser diária, horária ou uma combinação?
6. Quais requisitos de cobertura, atualização e disponibilidade devem ser atendidos pelo Open-Meteo?
7. O que deve ocorrer quando não houver resultados, a fonte estiver indisponível ou uma consulta falhar?
8. Quais metas de desempenho, disponibilidade, acessibilidade, segurança e compatibilidade entre navegadores são necessárias?
9. Quais tamanhos de tela e plataformas devem ser suportados? A entrega será apenas web responsiva ou também incluirá aplicativos nativos?
10. A aplicação deve lembrar a última cidade consultada ou permitir favoritar e acompanhar várias cidades localmente? Não haverá autenticação nem persistência no servidor.

## Suposições

- A aplicação permite consultar uma cidade por vez; comparação simultânea entre cidades não foi solicitada.
- A busca é iniciada por texto digitado pelo usuário; uso de geolocalização não foi solicitado.
- Celsius e Fahrenheit alteram somente a unidade dos valores de temperatura, não outras unidades meteorológicas.
- O período da previsão foi definido como hoje mais os quatro dias seguintes; a granularidade e o tratamento do fuso horário ainda precisam ser detalhados.
- “Usar em dispositivos móveis” significa, provisoriamente, oferecer uma experiência web responsiva; aplicativos nativos não estão confirmados.
- Autenticação e persistência no servidor estão fora do escopo definido; favoritos, notificações e persistência local de preferências não foram solicitados ou ainda precisam de decisão.

## Decisões

- **Fonte de dados: Open-Meteo, sem API key.** Justificativa: adotar a fonte solicitada sem exigir configuração ou armazenamento de chave de API. Resolve a pergunta sobre qual fonte usar; cobertura, atualização, disponibilidade e tratamento de limites do serviço continuam em aberto.
- **Período da previsão: hoje mais os quatro dias seguintes.** Justificativa: define claramente quais cinco dias compõem a previsão. Resolve se o dia atual conta; a apresentação diária, horária ou combinada ainda precisa ser definida.
- **Unidade padrão: Celsius.** Justificativa: estabelece uma apresentação inicial consistente para usuários da interface em pt-BR, mantendo a opção de alternar para Fahrenheit. Resolve a unidade inicial; a persistência da escolha entre visitas permanece em aberto.
- **Sem autenticação e sem persistência no servidor.** Justificativa: mantém o acesso direto e evita criar escopo de contas e armazenamento de dados no servidor. Resolve se haverá login e persistência server-side; armazenamento local no dispositivo e funcionalidades como favoritos ainda precisam de decisão.
- **Idioma da UI: pt-BR.** Justificativa: define o idioma inicial da experiência para o público deste produto. Resolve a localização padrão da interface; cobertura geográfica e suporte a outros idiomas não estão definidos.
