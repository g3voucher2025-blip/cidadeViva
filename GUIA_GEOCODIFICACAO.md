# 🗺️ Guia de Geocodificação (CEP e Endereço)

Este guia explica como funciona a conversão automática de endereços e CEPs para coordenadas (latitude e longitude).

## 🎯 Funcionalidade

O sistema agora permite cadastrar pontos turísticos e eventos usando **endereço completo** ou **CEP**, sem precisar conhecer as coordenadas geográficas. O sistema converte automaticamente para latitude e longitude.

## 📋 Como Usar

### Opção 1: Buscar por CEP

1. **Digite o CEP** no campo "CEP" (formato: 00000-000)
2. **Ao sair do campo** (onblur), o sistema:
   - Busca o endereço completo usando ViaCEP
   - Preenche automaticamente o campo "Endereço Completo"
   - Tenta buscar as coordenadas automaticamente

### Opção 2: Digitar Endereço Completo

1. **Digite o endereço completo** no campo "Endereço Completo"
   - Exemplo: `Rua das Flores, 123, Centro, Três Lagoas - MS`
   - Ou: `Avenida Principal, 456, Bairro Novo, Campo Grande - MS`
2. **Clique em "🔍 Buscar Coordenadas"**
3. O sistema busca e preenche automaticamente as coordenadas

### Opção 3: Inserir Coordenadas Manualmente

1. Se preferir, você pode **inserir as coordenadas diretamente** nos campos Latitude e Longitude
2. Útil para locais sem endereço cadastrado ou coordenadas específicas

## 🔧 APIs Utilizadas

### ViaCEP (Busca de Endereço por CEP)
- **URL**: `https://viacep.com.br/ws/{cep}/json/`
- **Gratuita**: Sim
- **Limite**: Sem limite conhecido
- **Função**: Busca endereço completo a partir do CEP

### Nominatim (Geocodificação)
- **URL**: `https://nominatim.openstreetmap.org/search`
- **Gratuita**: Sim
- **Limite**: 1 requisição por segundo (respeitado automaticamente)
- **Função**: Converte endereço para coordenadas (lat/lng)
- **Requer**: User-Agent no header (já configurado)

## 📝 Estrutura de Dados no Firestore

Os dados salvos agora incluem:

```javascript
{
  name: "Lagoa Maior",
  description: "...",
  lat: -20.7836,
  lng: -51.7156,
  cep: "79600-000",           // Novo campo
  address: "Rua Principal, Centro, Três Lagoas - MS", // Novo campo
  category: "parque",
  images: [...],
  // ... outros campos
}
```

## ✨ Funcionalidades Implementadas

### 1. Formatação Automática de CEP
- Máscara automática: `00000-000`
- Remove caracteres não numéricos automaticamente

### 2. Busca Automática por CEP
- Ao digitar um CEP válido e sair do campo, busca o endereço
- Preenche automaticamente o campo de endereço
- Tenta geocodificar automaticamente após 500ms

### 3. Geocodificação de Endereço
- Converte endereço completo para coordenadas
- Mostra feedback visual (loading, sucesso, erro)
- Centraliza o mapa na localização encontrada
- Valida se as coordenadas foram encontradas

### 4. Validação
- Verifica se coordenadas foram preenchidas antes de salvar
- Permite inserção manual se a geocodificação falhar
- Mensagens de erro claras

## 🎨 Feedback Visual

### Durante a Busca
- **Loading**: "🔍 Buscando coordenadas..." (azul)
- **Sucesso**: "✅ Coordenadas encontradas!" (verde) - desaparece após 3s
- **Erro**: "❌ Erro ao buscar coordenadas..." (vermelho) - desaparece após 5s

## ⚠️ Limitações e Considerações

### Nominatim (OpenStreetMap)
- **Rate Limit**: 1 requisição por segundo (respeitado automaticamente)
- **Precisão**: Depende da qualidade dos dados do OpenStreetMap
- **Endereços no Brasil**: Funciona bem, mas endereços muito específicos podem não ser encontrados

### ViaCEP
- **Apenas CEPs brasileiros**
- Alguns CEPs podem não estar cadastrados
- Retorna logradouro, bairro, cidade e UF

## 🔄 Fluxo Completo

```
Usuário digita CEP
    ↓
Sistema busca endereço (ViaCEP)
    ↓
Preenche campo de endereço
    ↓
Aguarda 500ms
    ↓
Geocodifica endereço (Nominatim)
    ↓
Preenche coordenadas (lat/lng)
    ↓
Centraliza mapa na localização
    ↓
Usuário pode ajustar ou salvar
```

## 💡 Dicas de Uso

1. **CEP é mais rápido**: Se souber o CEP, use-o primeiro
2. **Endereço completo**: Quanto mais completo, melhor a precisão
3. **Inclua cidade e estado**: Sempre inclua cidade e UF no endereço
4. **Verifique no mapa**: Após buscar, o mapa centraliza na localização - verifique se está correto
5. **Ajuste manual se necessário**: Se a geocodificação não encontrar ou encontrar local errado, ajuste manualmente

## 🐛 Troubleshooting

### CEP não encontrado
- Verifique se o CEP está correto
- Alguns CEPs podem não estar cadastrados no ViaCEP
- Digite o endereço manualmente

### Endereço não encontrado
- Tente ser mais específico (inclua número, bairro, cidade)
- Verifique a ortografia
- Tente inserir coordenadas manualmente
- Use o mapa para clicar e pegar coordenadas

### Coordenadas incorretas
- A geocodificação pode não ser 100% precisa
- Verifique no mapa se a localização está correta
- Ajuste manualmente se necessário

## 📚 Recursos

- [ViaCEP API](https://viacep.com.br/)
- [Nominatim API](https://nominatim.org/release-docs/develop/api/Overview/)
- [OpenStreetMap](https://www.openstreetmap.org/)

---

**Pronto!** Agora você pode cadastrar pontos e eventos usando apenas endereço ou CEP. 🎉

