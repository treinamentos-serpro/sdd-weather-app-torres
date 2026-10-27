# Discovery — Aplicação de Previsão do Tempo

## Contexto

A empresa solicitou uma aplicação para consulta de informações meteorológicas. Usuários devem conseguir buscar cidades, consultar o clima atual, ver a previsão dos próximos cinco dias e alternar a temperatura entre Celsius e Fahrenheit. A aplicação também deve poder ser usada em dispositivos móveis.

O briefing define as capacidades principais, mas não detalha o público-alvo, as fontes de dados, as características meteorológicas a exibir, metas de qualidade ou as plataformas móveis suportadas. Esses pontos devem ser esclarecidos antes de fechar a especificação do produto.

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
3. Qual deve ser a unidade padrão: Celsius ou Fahrenheit? A preferência do usuário deve ser mantida entre visitas?
4. Quais informações devem compor o clima atual (por exemplo, temperatura, sensação térmica, condição, umidade e vento)?
5. A previsão de cinco dias deve ser diária, horária ou uma combinação? O dia atual conta como um dos cinco dias?
6. Qual fonte de dados meteorológicos deve ser utilizada e quais são seus requisitos de cobertura, atualização e disponibilidade?
7. O que deve ocorrer quando não houver resultados, a fonte estiver indisponível ou uma consulta falhar?
8. Quais metas de desempenho, disponibilidade, acessibilidade, segurança e compatibilidade entre navegadores são necessárias?
9. Quais tamanhos de tela e plataformas devem ser suportados? A entrega será apenas web responsiva ou também incluirá aplicativos nativos?
10. A aplicação deve lembrar a última cidade consultada ou permitir favoritar e acompanhar várias cidades?

## Suposições

- A aplicação permite consultar uma cidade por vez; comparação simultânea entre cidades não foi solicitada.
- A busca é iniciada por texto digitado pelo usuário; uso de geolocalização não foi solicitado.
- Celsius e Fahrenheit alteram somente a unidade dos valores de temperatura, não outras unidades meteorológicas.
- “Previsão de cinco dias” significa os cinco dias seguintes à consulta, sujeito à confirmação sobre o dia corrente e o fuso horário.
- “Usar em dispositivos móveis” significa, provisoriamente, oferecer uma experiência web responsiva; aplicativos nativos não estão confirmados.
- Autenticação, favoritos, notificações e persistência de preferências não foram solicitados.
