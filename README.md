# App de Notas Capacitor

Um aplicativo de notas simples criado para servir como modelo de desenvolvimento mobile usando tecnologias web modernas. Similar ao Cordova, mas com tecnologia atual (Capacitor + Ionic).

## 🚀 Tecnologias Utilizadas

- **Capacitor** - Framework moderno para apps híbridos
- **Ionic** - Biblioteca de componentes UI mobile-first
- **HTML/CSS/JavaScript** - Desenvolvimento web padrão
- **Vite** - Build tool rápido e moderno
- **Web Components** - Componentes reutilizáveis

## 🏗️ Build na Nuvem com GitHub Actions

Este projeto é compilado usando GitHub Actions, o que permite:

### ✅ Vantagens
- **Desenvolvimento em PC fraco** - Sem precisar instalar Android Studio (8GB+)
- **Economia de espaço** - Zero dependências nativas na máquina local
- **Ambiente limpo** - PC continua leve apenas com VS Code + Node.js
- **Build reproduzível** - Sempre o mesmo ambiente, sem problemas de configuração

### ⏱️ Performance
- **Tempo médio de build**: ~4 minutos
- **Uso local**: Apenas desenvolvimento web com hot reload
- **Build na nuvem**: Processo pesado rodando nos servidores do GitHub

## 📱 Funcionalidades do App

- ✅ Criar notas com título e conteúdo
- ✅ Localização automática ao salvar
- ✅ Busca em tempo real
- ✅ Dark/Light theme automático
- ✅ Exportar/importar notas
- ✅ Interface responsiva e moderna

## 🛠️ Como Usar

### Desenvolvimento Local
```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm start
```

O app estará disponível em `http://localhost:5173` com hot reload.

### Build para APK
O build é feito manualmente via GitHub Actions:

1. Acesse: `https://github.com/shuantsu/testandroid/actions`
2. Clique no workflow "Build Android APK"
3. Botão "Run workflow" → "Run workflow"
4. Aguarde o build e baixe o APK gerado

## ⚙️ Configuração do Workflow

### Trigger Manual (Configuração Atual)
```yaml
on:
  workflow_dispatch:  # Apenas disparar manualmente
    inputs:
      build_reason:
        description: 'Motivo do build'
        required: false
        default: 'Build manual'
```

### Trigger Automático no Push
Se quiser voltar ao build automático, modifique `.github/workflows/build-android.yml`:

```yaml
on:
  push:
    branches: [main]  # Build em todo push na main
  workflow_dispatch:  # Permite também disparar manualmente
```

### Outros Triggers Possíveis
```yaml
on:
  push:
    branches: [main]
    paths-ignore:      # Ignorar mudanças em docs
      - 'README.md'
      - 'docs/**'
  pull_request:       # Build em PRs
    branches: [main]
  schedule:           # Build agendado
    - cron: '0 0 * * 1'  # Toda segunda-feira
```

## 🎯 Por Que Este Modelo?

### vs Cordova
- **Capacitor** é mais moderno e mantido pelo mesmo time do Ionic
- Plugins mais atualizados e melhor suporte a APIs nativas
- Melhor performance e integração com Progressive Web Apps

### vs React Native/Flutter
- Curva de aprendizado menor (usa web technologies)
- Reaproveitamento de conhecimento web existente
- Build mais simples e menos dependências

### vs Android Studio Local
- Economia de ~8GB de espaço em disco
- Sem problemas de configuração de ambiente
- Desenvolvimento mais rápido com hot reload no browser

## 📂 Estrutura do Projeto

```
src/
├── css/
│   ├── variables.css    # Temas dark/light
│   └── app.css         # Estilos principais
├── js/
│   ├── services/       # Storage e Geolocation
│   ├── components/     # Web Components
│   └── app.js         # App principal
└── index.html         # Interface com Ionic
```

## 🚀 Começando a Desenvolver

1. Clone este repositório
2. Execute `npm install`
3. Execute `npm start`
4. Desenvolva no browser com hot reload
5. Quando quiser testar no celular, dispare o build manual

**Desenvolvimento mobile moderno, leve e eficiente!** 📱✨
