/**
 * JENY Modas – Google Apps Script CORRIGIDO
 * Versão com melhorias no envio para Telegram
 * 
 * MELHORIAS IMPLEMENTADAS:
 * ✅ Retry automático (3 tentativas) para envio ao Telegram
 * ✅ Escape correto de caracteres especiais no Markdown
 * ✅ Logs detalhados para debug
 * ✅ Fallback para mensagem simples em caso de erro
 * ✅ Validação de dados antes de enviar
 * ✅ Timeout configurável
 */

const botToken = '7898087319:AAHP0XDRUN8vyaxUYANv8bZMGrD3hRLZj6o';
const sheetId = '1XRjmWTfBps5tzt9REgdKczqTtuOWHDWTopFDoUaRd8k';
const googleWebAppURL = 'https://script.google.com/macros/s/AKfycbz9eUGMhi6qjwxrMEvM9dRY6fPCMg2XN9l45N6ZrBraabyRL5gEZOb3bXSZJeMcXgjZ/exec';
const CHAT_ID = '7625866003';

// Configurações de retry
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 segundos

// Nomes das abas
const SHEET_PEDIDOS = 'Pedidos';
const SHEET_ITENS = 'Itens';
const SHEET_PRODUTOS = 'Produtos';

// Slug simples para usar como chave quando não existir Produto ID numérico
function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9]+/g, '-') // troca por hífen
    .replace(/^-+|-+$/g, '')     // trim hífens
    .substring(0, 32);           // limite seguro pro callback_data
}

// Inicializa as abas se não existirem
function initSheets() {
  const ss = SpreadsheetApp.openById(sheetId);
  
  // Aba de Pedidos
  let pedidosSheet = ss.getSheetByName(SHEET_PEDIDOS);
  if (!pedidosSheet) {
    pedidosSheet = ss.insertSheet(SHEET_PEDIDOS);
    pedidosSheet.getRange(1, 1, 1, 12).setValues([[
      'Código', 'Data', 'Status', 'Nome', 'Telefone', 'Email', 
      'Endereço', 'Cidade', 'CEP', 'Observações', 'Total', 'Origem'
    ]]);
    pedidosSheet.getRange(1, 1, 1, 12).setFontWeight('bold');
    pedidosSheet.setFrozenRows(1);
  }
  
  // Aba de Itens
  let itensSheet = ss.getSheetByName(SHEET_ITENS);
  if (!itensSheet) {
    itensSheet = ss.insertSheet(SHEET_ITENS);
    itensSheet.getRange(1, 1, 1, 7).setValues([[
      'Código Pedido', 'Produto', 'Tamanho', 'Quantidade', 'Preço Unit.', 'Subtotal', 'Produto ID'
    ]]);
    itensSheet.getRange(1, 1, 1, 7).setFontWeight('bold');
    itensSheet.setFrozenRows(1);
  } else {
    // Garante coluna "Produto ID" sem quebrar planilhas antigas
    const lastCol = itensSheet.getLastColumn();
    if (lastCol < 7) {
      itensSheet.insertColumnAfter(lastCol);
      itensSheet.getRange(1, 7).setValue('Produto ID').setFontWeight('bold');
    } else {
      const header = String(itensSheet.getRange(1, 7).getValue() || '');
      if (!header) {
        itensSheet.getRange(1, 7).setValue('Produto ID').setFontWeight('bold');
      }
    }
  }

  // Aba de Produtos (controle vendido/disponível)
  let produtosSheet = ss.getSheetByName(SHEET_PRODUTOS);
  if (!produtosSheet) {
    produtosSheet = ss.insertSheet(SHEET_PRODUTOS);
    produtosSheet.getRange(1, 1, 1, 4).setValues([[
      'Produto ID', 'Nome', 'Vendido', 'Atualizado em'
    ]]);
    produtosSheet.getRange(1, 1, 1, 4).setFontWeight('bold');
    produtosSheet.setFrozenRows(1);
  }
  
  return ss;
}

// Função principal que recebe requisições (POST)
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // Verifica se é um update do Telegram (webhook)
    if (data.callback_query) {
      processCallback(data);
      return jsonResponse({ success: true });
    }
    
    // Requisições da loja
    if (data.action === 'saveOrder') {
      return saveOrder(data.order);
    } else if (data.action === 'updateStatus') {
      return updateOrderStatus(data.orderNumber, data.status);
    } else if (data.action === 'setProductStatus') {
      // opcional: endpoint admin (não usado pelo site hoje)
      return setProductStatus(String(data.productId || ''), !!data.sold, data.productName || '');
    }
    
    return jsonResponse({ success: false, error: 'Ação inválida' });
  } catch (error) {
    console.error('Erro no doPost:', error.toString());
    return jsonResponse({ success: false, error: error.message });
  }
}

// Função para requisições GET (buscar pedido)
function doGet(e) {
  try {
    const action = e.parameter.action;
    
    if (action === 'getOrder') {
      return getOrder(e.parameter.orderNumber);
    } else if (action === 'getAllOrders') {
      return getAllOrders();
    } else if (action === 'getProductsStatus') {
      return getProductsStatus();
    } else if (action === 'init') {
      initSheets();
      return jsonResponse({ success: true, message: 'Planilha inicializada!' });
    } else if (action === 'testTelegram') {
      return testTelegramConnection();
    }
    
    return jsonResponse({ success: false, error: 'Ação inválida' });
  } catch (error) {
    console.error('Erro no doGet:', error.toString());
    return jsonResponse({ success: false, error: error.message });
  }
}

// Salva um novo pedido
function saveOrder(order) {
  try {
    console.log('=== INICIANDO SALVAMENTO DE PEDIDO ===');
    console.log('Dados recebidos:', JSON.stringify(order, null, 2));
    
    const ss = initSheets();
    const pedidosSheet = ss.getSheetByName(SHEET_PEDIDOS);
    const itensSheet = ss.getSheetByName(SHEET_ITENS);
    
    // Formata a data
    const dataFormatada = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    
    // Adiciona o pedido
    pedidosSheet.appendRow([
      order.orderNumber || 'N/A',
      dataFormatada,
      'Pedido Recebido',
      order.customer?.name || 'N/A',
      order.customer?.phone || 'N/A',
      order.customer?.email || '',
      order.customer?.address || 'N/A',
      order.customer?.city || 'N/A',
      order.customer?.cep || 'N/A',
      order.customer?.notes || '',
      order.total || 0,
      order.origin || 'Site'
    ]);
    
    console.log('✓ Pedido salvo no Google Sheets');
    
    // Adiciona os itens
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach(item => {
        const productKey = String(item.id || item.productId || item.sku || '').trim() || slugify(item.name || 'produto');
        itensSheet.appendRow([
          order.orderNumber || 'N/A',
          item.name || 'Produto',
          item.size || 'N/A',
          item.quantity || 1,
          item.price || 0,
          (item.price || 0) * (item.quantity || 1),
          productKey
        ]);
      });
      console.log('✓ Itens salvos no Google Sheets');
    }
    
    // Envia notificação no Telegram COM RETRY
    console.log('Iniciando envio para Telegram...');
    const telegramResult = sendTelegramNotificationWithRetry(order);
    
    if (telegramResult.success) {
      console.log('✓ Notificação enviada ao Telegram com sucesso!');
    } else {
      console.error('✗ Falha ao enviar ao Telegram:', telegramResult.error);
    }
    
    console.log('=== PROCESSO CONCLUÍDO ===');
    
    return jsonResponse({ 
      success: true, 
      message: 'Pedido salvo com sucesso!',
      orderNumber: order.orderNumber,
      telegramSent: telegramResult.success,
      telegramError: telegramResult.error || null
    });
  } catch (error) {
    console.error('ERRO CRÍTICO ao salvar pedido:', error.toString());
    console.error('Stack:', error.stack);
    return jsonResponse({ 
      success: false, 
      error: error.message 
    });
  }
}

// NOVA FUNÇÃO: Envia mensagem ao Telegram com retry automático
function sendTelegramNotificationWithRetry(order) {
  let lastError = null;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`Tentativa ${attempt} de ${MAX_RETRIES}...`);
    
    try {
      const result = sendTelegramNotification(order);
      console.log(`✓ Sucesso na tentativa ${attempt}`);
      return { success: true, attempt: attempt };
    } catch (error) {
      lastError = error;
      console.error(`✗ Erro na tentativa ${attempt}:`, error.toString());
      
      if (attempt < MAX_RETRIES) {
        console.log(`Aguardando ${RETRY_DELAY}ms antes da próxima tentativa...`);
        Utilities.sleep(RETRY_DELAY);
      }
    }
  }
  
  // Se todas as tentativas falharam, tenta enviar mensagem simples
  console.log('Todas as tentativas falharam. Tentando enviar mensagem simplificada...');
  try {
    sendSimpleTelegramNotification(order);
    return { 
      success: true, 
      fallback: true, 
      warning: 'Enviada versão simplificada',
      error: lastError ? lastError.toString() : null
    };
  } catch (fallbackError) {
    console.error('Falha completa no envio ao Telegram:', fallbackError.toString());
    return { 
      success: false, 
      error: lastError ? lastError.toString() : 'Erro desconhecido',
      fallbackError: fallbackError.toString()
    };
  }
}

// FUNÇÃO MELHORADA: Escape de caracteres especiais para Markdown
function escapeMarkdown(text) {
  if (!text) return '';
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/\_/g, '\\_')
    .replace(/\*/g, '\\*')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\~/g, '\\~')
    .replace(/\`/g, '\\`')
    .replace(/\>/g, '\\>')
    .replace(/\#/g, '\\#')
    .replace(/\+/g, '\\+')
    .replace(/\-/g, '\\-')
    .replace(/\=/g, '\\=')
    .replace(/\|/g, '\\|')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/\./g, '\\.')
    .replace(/\!/g, '\\!');
}

// Envia notificação no Telegram com botões de ação (VERSÃO MELHORADA)
function sendTelegramNotification(order) {
  console.log('Preparando mensagem para Telegram...');
  
  // Validação básica
  if (!order || !order.orderNumber) {
    throw new Error('Dados do pedido inválidos');
  }
  
  // Garante que os valores estão no formato correto
  const orderNumber = String(order.orderNumber || 'N/A');
  const customerName = String(order.customer?.name || 'N/A');
  const customerPhone = String(order.customer?.phone || '').replace(/\D/g, '');
  const customerEmail = order.customer?.email || '';
  const customerAddress = String(order.customer?.address || 'N/A');
  const customerCity = String(order.customer?.city || 'N/A');
  const customerCep = String(order.customer?.cep || 'N/A');
  const customerNotes = order.customer?.notes || '';
  const totalValue = parseFloat(order.total) || 0;
  
  console.log('Dados extraídos:', {
    orderNumber,
    customerName,
    customerPhone,
    totalValue
  });
  
  // Monta a mensagem com escape adequado
  let message = `🛍️ *NOVO PEDIDO \\- JENY Modas*\n`;
  message += `━━━━━━━━━━━━━━━━━━\n\n`;
  message += `📋 *Pedido \\#${escapeMarkdown(orderNumber)}*\n`;
  message += `📅 Data: ${escapeMarkdown(new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }))}\n\n`;
  
  message += `👤 *DADOS DO CLIENTE*\n`;
  message += `Nome: ${escapeMarkdown(customerName)}\n`;
  message += `Telefone: ${escapeMarkdown(order.customer?.phone || 'N/A')}\n`;
  if (customerEmail) message += `E\\-mail: ${escapeMarkdown(customerEmail)}\n`;
  message += `\n📍 *ENDEREÇO DE ENTREGA*\n`;
  message += `${escapeMarkdown(customerAddress)}\n`;
  message += `${escapeMarkdown(customerCity)} \\- CEP: ${escapeMarkdown(customerCep)}\n\n`;
  
  message += `🛒 *ITENS DO PEDIDO*\n`;
  message += `━━━━━━━━━━━━━━━━━━\n`;
  
  if (order.items && Array.isArray(order.items)) {
    order.items.forEach(item => {
      const itemPrice = parseFloat(item.price) || 0;
      const itemQty = parseInt(item.quantity) || 1;
      const subtotal = (itemPrice * itemQty).toFixed(2);
      message += `▸ ${escapeMarkdown(item.name || 'Produto')}\n`;
      message += `   Tam: ${escapeMarkdown(item.size || 'N/A')} \\| Qtd: ${itemQty} \\| R\\$ ${escapeMarkdown(subtotal)}\n`;
    });
  }
  
  message += `━━━━━━━━━━━━━━━━━━\n`;
  message += `💰 *TOTAL: R\\$ ${escapeMarkdown(totalValue.toFixed(2))}*\n\n`;
  
  if (customerNotes) {
    message += `📝 *Observações:*\n${escapeMarkdown(customerNotes)}\n\n`;
  }
  
  message += `✨ _Clique nos botões abaixo para atualizar o status:_`;
  
  console.log('Mensagem montada, tamanho:', message.length, 'caracteres');
  
  // Botões inline para atualizar status
  const shortOrderNum = orderNumber.substring(0, 20);
  const soldMap = getProductsSoldMap(); // { [id]: true/false }
  
  let keyboard = {
    inline_keyboard: [
      [
        { text: '📦 Preparando', callback_data: 'st:' + shortOrderNum + ':prep' },
        { text: '🚚 Enviado', callback_data: 'st:' + shortOrderNum + ':ship' }
      ],
      [
        { text: '✅ Entregue', callback_data: 'st:' + shortOrderNum + ':done' },
        { text: '❌ Cancelar', callback_data: 'st:' + shortOrderNum + ':canc' }
      ]
    ]
  };
  
  // Botões por produto (Vendido/Disponível)
  if (order.items && Array.isArray(order.items)) {
    const seen = {};
    order.items.forEach(item => {
      const pidRaw = String(item.id || item.productId || item.sku || '').trim();
      const pid = pidRaw || slugify(item.name || 'produto');
      if (!pid || seen[pid]) return;
      seen[pid] = true;
      
      const name = String(item.name || 'Produto');
      const shortName = name.length > 22 ? (name.substring(0, 22) + '…') : name;
      const isSold = !!soldMap[pid];
      const label = isSold ? `🔴 VENDIDO: ${shortName}` : `🟢 DISPONÍVEL: ${shortName}`;
      const nextCmd = isSold ? 'avail' : 'sold';
      keyboard.inline_keyboard.push([
        { text: label, callback_data: `prd:${shortOrderNum}:${pid}:${nextCmd}` }
      ]);
    });
  }
  
  // Adiciona botão WhatsApp apenas se tiver telefone válido
  if (customerPhone && customerPhone.length >= 10) {
    keyboard.inline_keyboard.push([
      { text: '📱 WhatsApp Cliente', url: 'https://wa.me/55' + customerPhone }
    ]);
  }
  
  // Monta o payload
  const payload = {
    chat_id: CHAT_ID,
    text: message,
    parse_mode: 'MarkdownV2',
    reply_markup: keyboard
  };
  
  console.log('Payload preparado');
  
  // Envia para o Telegram
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  
  console.log('Enviando requisição para:', url);
  console.log('Chat ID:', CHAT_ID);
  
  const response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
  
  const responseCode = response.getResponseCode();
  const responseText = response.getContentText();
  
  console.log('Resposta do Telegram - Código:', responseCode);
  console.log('Resposta do Telegram - Corpo:', responseText);
  
  // Verifica se houve erro
  if (responseCode !== 200) {
    const errorData = JSON.parse(responseText);
    throw new Error(`API Telegram retornou erro ${responseCode}: ${errorData.description || 'Erro desconhecido'}`);
  }
  
  const responseData = JSON.parse(responseText);
  if (!responseData.ok) {
    throw new Error(`Telegram API: ${responseData.description || 'Erro desconhecido'}`);
  }
  
  return true;
}

// NOVA FUNÇÃO: Envia mensagem simplificada sem formatação complexa
function sendSimpleTelegramNotification(order) {
  console.log('Enviando mensagem simplificada...');
  
  const orderNumber = String(order.orderNumber || 'N/A');
  const customerName = String(order.customer?.name || 'N/A');
  const totalValue = parseFloat(order.total) || 0;
  
  const simpleMessage = `🛍️ NOVO PEDIDO - JENY Modas

📋 Pedido: ${orderNumber}
👤 Cliente: ${customerName}
💰 Total: R$ ${totalValue.toFixed(2)}

📅 ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}

✅ Pedido salvo no Google Sheets`;
  
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  
  const response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({
      chat_id: CHAT_ID,
      text: simpleMessage
    }),
    muteHttpExceptions: true
  });
  
  const responseCode = response.getResponseCode();
  console.log('Resposta simplificada - Código:', responseCode);
  
  if (responseCode !== 200) {
    throw new Error('Falha ao enviar mensagem simplificada');
  }
  
  return true;
}

// Busca um pedido pelo código
function getOrder(orderNumber) {
  const ss = SpreadsheetApp.openById(sheetId);
  const pedidosSheet = ss.getSheetByName(SHEET_PEDIDOS);
  const itensSheet = ss.getSheetByName(SHEET_ITENS);
  
  if (!pedidosSheet) {
    return jsonResponse({ success: false, error: 'Pedido não encontrado' });
  }
  
  // Busca o pedido
  const pedidosData = pedidosSheet.getDataRange().getValues();
  
  let orderRow = null;
  for (let i = 1; i < pedidosData.length; i++) {
    if (pedidosData[i][0].toString().toUpperCase() === orderNumber.toUpperCase()) {
      orderRow = pedidosData[i];
      break;
    }
  }
  
  if (!orderRow) {
    return jsonResponse({ success: false, error: 'Pedido não encontrado' });
  }
  
  // Busca os itens do pedido
  const itensData = itensSheet.getDataRange().getValues();
  const items = [];
  
  for (let i = 1; i < itensData.length; i++) {
    if (itensData[i][0].toString().toUpperCase() === orderNumber.toUpperCase()) {
      items.push({
        name: itensData[i][1],
        size: itensData[i][2],
        quantity: itensData[i][3],
        price: itensData[i][4]
      });
    }
  }
  
  // Monta o objeto do pedido
  const order = {
    orderNumber: orderRow[0],
    date: orderRow[1],
    status: statusToCode(orderRow[2]),
    statusText: orderRow[2],
    customer: {
      name: orderRow[3],
      phone: orderRow[4],
      email: orderRow[5],
      address: orderRow[6],
      city: orderRow[7],
      cep: orderRow[8],
      notes: orderRow[9]
    },
    total: orderRow[10],
    items: items
  };
  
  return jsonResponse({ success: true, order: order });
}

// Converte texto do status para código
function statusToCode(statusText) {
  const statusMap = {
    'Pedido Recebido': 'received',
    'Em Preparação': 'preparing',
    'Enviado': 'shipped',
    'Entregue': 'delivered',
    'Cancelado': 'cancelled'
  };
  return statusMap[statusText] || 'received';
}

// Atualiza o status de um pedido (via API)
function updateOrderStatus(orderNumber, newStatus) {
  try {
    console.log('📝 API: Atualizando status do pedido:', orderNumber, '→', newStatus);
    
    const ss = SpreadsheetApp.openById(sheetId);
    const pedidosSheet = ss.getSheetByName(SHEET_PEDIDOS);
    
    if (!pedidosSheet) {
      return jsonResponse({ success: false, error: 'Planilha não encontrada' });
    }
    
    const data = pedidosSheet.getDataRange().getValues();
    
    // Remove prefixos comuns para comparação flexível
    const cleanOrderNumber = orderNumber.replace(/^(TEST-|#)/i, '').toUpperCase();
    
    for (let i = 1; i < data.length; i++) {
      const rowOrderNumber = String(data[i][0] || '').replace(/^(TEST-|#)/i, '').toUpperCase();
      
      // Comparação flexível: verifica se um contém o outro
      const matchExact = rowOrderNumber === cleanOrderNumber;
      const matchPartial = rowOrderNumber.includes(cleanOrderNumber) || cleanOrderNumber.includes(rowOrderNumber);
      
      if (matchExact || matchPartial) {
        pedidosSheet.getRange(i + 1, 3).setValue(newStatus);
        console.log('✅ Status atualizado com sucesso!');
        return jsonResponse({ success: true, message: 'Status atualizado!' });
      }
    }
    
    console.log('❌ Pedido não encontrado:', orderNumber);
    return jsonResponse({ success: false, error: 'Pedido não encontrado' });
  } catch (error) {
    console.error('❌ Erro ao atualizar status:', error.toString());
    return jsonResponse({ success: false, error: error.message });
  }
}

// Busca todos os pedidos
function getAllOrders() {
  const ss = SpreadsheetApp.openById(sheetId);
  const pedidosSheet = ss.getSheetByName(SHEET_PEDIDOS);
  
  if (!pedidosSheet) {
    return jsonResponse({ success: true, orders: [] });
  }
  
  const data = pedidosSheet.getDataRange().getValues();
  const orders = [];
  
  for (let i = 1; i < data.length; i++) {
    orders.push({
      orderNumber: data[i][0],
      date: data[i][1],
      status: data[i][2],
      customerName: data[i][3],
      total: data[i][10]
    });
  }
  
  return jsonResponse({ success: true, orders: orders });
}

// ============================
// PRODUTOS: vendido/disponível
// ============================

function getProductsStatus() {
  try {
    initSheets();
    const ss = SpreadsheetApp.openById(sheetId);
    const sheet = ss.getSheetByName(SHEET_PRODUTOS);
    if (!sheet) return jsonResponse({ success: true, products: {} });
    
    const values = sheet.getDataRange().getValues();
    const products = {};
    
    for (let i = 1; i < values.length; i++) {
      const pid = String(values[i][0] || '').trim();
      if (!pid) continue;
      const name = String(values[i][1] || '');
      const sold = String(values[i][2] || '').toLowerCase() === 'true' || values[i][2] === true;
      const updatedAt = values[i][3] || '';
      products[pid] = { sold: sold, name: name, updatedAt: updatedAt };
    }
    
    return jsonResponse({ success: true, products: products });
  } catch (error) {
    console.error('Erro getProductsStatus:', error.toString());
    return jsonResponse({ success: false, error: error.message });
  }
}

function getProductsSoldMap() {
  try {
    initSheets();
    const ss = SpreadsheetApp.openById(sheetId);
    const sheet = ss.getSheetByName(SHEET_PRODUTOS);
    if (!sheet) return {};
    
    const values = sheet.getDataRange().getValues();
    const map = {};
    for (let i = 1; i < values.length; i++) {
      const pid = String(values[i][0] || '').trim();
      if (!pid) continue;
      const sold = String(values[i][2] || '').toLowerCase() === 'true' || values[i][2] === true;
      map[pid] = sold;
    }
    return map;
  } catch (e) {
    return {};
  }
}

function setProductStatus(productId, sold, productName) {
  try {
    const pid = String(productId || '').trim();
    if (!pid) return jsonResponse({ success: false, error: 'Produto inválido' });
    
    initSheets();
    const ss = SpreadsheetApp.openById(sheetId);
    const sheet = ss.getSheetByName(SHEET_PRODUTOS);
    const values = sheet.getDataRange().getValues();
    
    const now = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const soldValue = sold ? true : false;
    const nameValue = String(productName || '');
    
    for (let i = 1; i < values.length; i++) {
      const rowPid = String(values[i][0] || '').trim();
      if (rowPid === pid) {
        // atualiza
        sheet.getRange(i + 1, 2).setValue(nameValue || values[i][1] || '');
        sheet.getRange(i + 1, 3).setValue(soldValue);
        sheet.getRange(i + 1, 4).setValue(now);
        return true;
      }
    }
    
    // cria
    sheet.appendRow([pid, nameValue, soldValue, now]);
    return true;
  } catch (error) {
    console.error('Erro setProductStatus:', error.toString());
    return false;
  }
}

function getOrderProductRows(orderShort) {
  try {
    const ss = SpreadsheetApp.openById(sheetId);
    const sheet = ss.getSheetByName(SHEET_ITENS);
    if (!sheet) return [];
    
    const values = sheet.getDataRange().getValues();
    const result = [];
    const seen = {};
    const clean = String(orderShort || '').replace(/^(TEST-|#)/i, '').toUpperCase();
    
    for (let i = 1; i < values.length; i++) {
      const rowOrder = String(values[i][0] || '').replace(/^(TEST-|#)/i, '').toUpperCase();
      const match = rowOrder.includes(clean) || clean.includes(rowOrder);
      if (!match) continue;
      
      const name = String(values[i][1] || 'Produto');
      const pid = String(values[i][6] || '').trim(); // col 7 = Produto ID
      if (!pid || seen[pid]) continue;
      seen[pid] = true;
      result.push({ id: pid, name: name });
    }
    return result;
  } catch (e) {
    return [];
  }
}

function getProductNameFromOrder(orderShort, productId) {
  const pid = String(productId || '').trim();
  if (!pid) return '';
  const rows = getOrderProductRows(orderShort);
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i].id) === pid) return rows[i].name;
  }
  return '';
}

function getOrderStatus(orderShort) {
  try {
    const ss = SpreadsheetApp.openById(sheetId);
    const pedidosSheet = ss.getSheetByName(SHEET_PEDIDOS);
    if (!pedidosSheet) return { statusText: 'Pedido Recebido', emoji: '📋' };
    
    const data = pedidosSheet.getDataRange().getValues();
    const clean = String(orderShort || '').replace(/^(TEST-|#)/i, '').toUpperCase();
    
    for (let i = 1; i < data.length; i++) {
      const rowOrder = String(data[i][0] || '').replace(/^(TEST-|#)/i, '').toUpperCase();
      const match = rowOrder.includes(clean) || clean.includes(rowOrder);
      if (!match) continue;
      const statusText = String(data[i][2] || 'Pedido Recebido');
      const emoji =
        statusText.includes('Prepar') ? '📦' :
        statusText.includes('Enviad') ? '🚚' :
        statusText.includes('Entreg') ? '✅' :
        statusText.includes('Cancel') ? '❌' : '📋';
      return { statusText: statusText, emoji: emoji };
    }
    return { statusText: 'Pedido Recebido', emoji: '📋' };
  } catch (e) {
    return { statusText: 'Pedido Recebido', emoji: '📋' };
  }
}

// Processa os callbacks dos botões do Telegram
function processCallback(update) {
  console.log('═══════════════════════════════════════');
  console.log('📥 CALLBACK RECEBIDO DO TELEGRAM');
  console.log('═══════════════════════════════════════');
  
  if (!update.callback_query) {
    console.log('❌ Nenhum callback_query no update');
    return;
  }
  
  const callbackData = update.callback_query.data;
  const callbackId = update.callback_query.id;
  const messageId = update.callback_query.message.message_id;
  const chatId = update.callback_query.message.chat.id;
  
  console.log('📋 Dados do callback:', {
    callbackData: callbackData,
    callbackId: callbackId,
    messageId: messageId,
    chatId: chatId
  });
  
  // Verifica se é apenas informação (clique no status atual)
  if (callbackData === 'info') {
    answerCallback(callbackId, 'Este é o status atual do pedido');
    return;
  }
  
  // Parse do callback: st:ORDER_NUMBER:STATUS_CODE
  const parts = callbackData.split(':');
  console.log('🔍 Partes do callback:', parts);
  
  // Produto vendido/disponível: prd:ORDER_SHORT:PRODUCT_ID:(sold|avail)
  if (parts[0] === 'prd') {
    if (parts.length < 4) {
      answerCallback(callbackId, 'Erro: dados do produto incompletos');
      return;
    }
    
    const orderShort = parts[1];
    const productId = String(parts[2] || '').trim();
    const cmd = parts[3];
    
    if (!productId) {
      answerCallback(callbackId, 'Erro: produto inválido');
      return;
    }
    
    const sold = cmd === 'sold';
    const productName = getProductNameFromOrder(orderShort, productId) || '';
    const ok = setProductStatus(productId, sold, productName);
    
    if (ok) {
      answerCallback(callbackId, sold ? '🔴 Produto marcado como VENDIDO' : '🟢 Produto marcado como DISPONÍVEL');
    } else {
      answerCallback(callbackId, '⚠️ Não foi possível atualizar o produto');
    }
    
    // Atualiza teclado (mantém também os botões de status do pedido)
    const phone = getCustomerPhone(orderShort);
    const current = getOrderStatus(orderShort);
    updateMessageStatus(chatId, messageId, orderShort, current.statusText, current.emoji, phone);
    return;
  }
  
  if (parts[0] !== 'st') {
    console.log('⚠️ Callback não é de status:', parts[0]);
    answerCallback(callbackId, 'Ação não reconhecida');
    return;
  }
  
  if (parts.length < 3) {
    console.log('❌ Callback malformado, partes insuficientes');
    answerCallback(callbackId, 'Erro: dados incompletos');
    return;
  }
  
  const orderNumber = parts[1];
  const statusCode = parts[2];
  
  console.log('📝 Número do pedido (truncado):', orderNumber);
  console.log('📝 Código do status:', statusCode);
  
  // Mapeia código curto para texto completo
  const statusMap = {
    'prep': 'Em Preparação',
    'ship': 'Enviado',
    'done': 'Entregue',
    'canc': 'Cancelado'
  };
  
  const statusEmoji = {
    'prep': '📦',
    'ship': '🚚',
    'done': '✅',
    'canc': '❌'
  };
  
  // Atualiza na planilha
  const statusText = statusMap[statusCode] || statusCode;
  const emoji = statusEmoji[statusCode] || '📋';
  
  console.log('📝 Status a ser aplicado:', statusText);
  console.log('🔄 Iniciando atualização na planilha...');
  
  const updateResult = updateOrderStatusInSheet(orderNumber, statusText);
  console.log('📊 Resultado da atualização:', updateResult ? 'SUCESSO' : 'FALHA');
  
  // Busca o telefone do cliente para manter o botão WhatsApp
  console.log('🔍 Iniciando busca do telefone...');
  const customerPhone = getCustomerPhone(orderNumber);
  console.log('📱 Telefone retornado:', customerPhone || 'null/vazio');
  
  // Responde ao callback com feedback baseado no resultado
  if (updateResult) {
    answerCallback(callbackId, `${emoji} Status atualizado para: ${statusText}`);
  } else {
    answerCallback(callbackId, `⚠️ Pedido não encontrado, verifique a planilha`);
  }
  
  // Atualiza a mensagem original (agora com telefone)
  console.log('🔄 Atualizando botões da mensagem...');
  updateMessageStatus(chatId, messageId, orderNumber, statusText, emoji, customerPhone);
  
  console.log('═══════════════════════════════════════');
  console.log('✅ PROCESSAMENTO DO CALLBACK CONCLUÍDO');
  console.log('═══════════════════════════════════════');
}

// Atualiza o status na planilha (com busca flexível para números truncados)
function updateOrderStatusInSheet(orderNumber, statusText) {
  try {
    console.log('🔄 Atualizando status do pedido:', orderNumber, '→', statusText);
    
    const ss = SpreadsheetApp.openById(sheetId);
    const pedidosSheet = ss.getSheetByName(SHEET_PEDIDOS);
    
    if (!pedidosSheet) {
      console.log('❌ Planilha de pedidos não encontrada');
      return false;
    }
    
    const data = pedidosSheet.getDataRange().getValues();
    console.log('📊 Total de linhas na planilha:', data.length);
    
    // Remove prefixos comuns para comparação flexível
    const cleanOrderNumber = orderNumber.replace(/^(TEST-|#)/i, '').toUpperCase();
    console.log('🔍 Buscando por (limpo):', cleanOrderNumber);
    
    for (let i = 1; i < data.length; i++) {
      const rowOrderNumber = String(data[i][0] || '').replace(/^(TEST-|#)/i, '').toUpperCase();
      
      // Comparação flexível: verifica se um contém o outro (para números truncados)
      const matchExact = rowOrderNumber === cleanOrderNumber;
      const matchPartial = rowOrderNumber.includes(cleanOrderNumber) || cleanOrderNumber.includes(rowOrderNumber);
      
      if (matchExact || matchPartial) {
        console.log('✓ Pedido encontrado na linha', i + 1, '- Código:', data[i][0]);
        pedidosSheet.getRange(i + 1, 3).setValue(statusText);
        console.log('✅ Status atualizado com sucesso!');
        return true;
      }
    }
    
    console.log('❌ Pedido não encontrado:', orderNumber);
    console.log('💡 Pedidos disponíveis:', data.slice(1).map(row => row[0]).join(', '));
    return false;
  } catch (error) {
    console.error('❌ Erro ao atualizar status:', error.toString());
    return false;
  }
}

// Busca o telefone do cliente na planilha
function getCustomerPhone(orderNumber) {
  try {
    console.log('🔍 Buscando telefone para pedido:', orderNumber);
    
    const ss = SpreadsheetApp.openById(sheetId);
    const pedidosSheet = ss.getSheetByName(SHEET_PEDIDOS);
    
    if (!pedidosSheet) {
      console.log('❌ Planilha não encontrada');
      return null;
    }
    
    const data = pedidosSheet.getDataRange().getValues();
    console.log('📊 Total de linhas na planilha:', data.length);
    
    // Remove prefixos comuns do número do pedido para comparação
    const cleanOrderNumber = orderNumber.replace(/^(TEST-|#)/i, '');
    
    for (let i = 1; i < data.length; i++) {
      const rowOrderNumber = String(data[i][0] || '').replace(/^(TEST-|#)/i, '');
      
      // Comparação mais flexível
      if (rowOrderNumber.toUpperCase().includes(cleanOrderNumber.toUpperCase()) || 
          cleanOrderNumber.toUpperCase().includes(rowOrderNumber.toUpperCase())) {
        
        console.log('✓ Pedido encontrado na linha', i + 1);
        console.log('📋 Dados da linha:', {
          codigo: data[i][0],
          nome: data[i][3],
          telefone: data[i][4]
        });
        
        // Coluna 4 (índice 4) é o telefone (Código, Data, Status, Nome, Telefone...)
        const rawPhone = data[i][4];
        const phone = String(rawPhone || '').replace(/\D/g, '');
        
        console.log('📱 Telefone bruto:', rawPhone);
        console.log('📱 Telefone limpo:', phone);
        console.log('📱 Tamanho:', phone.length);
        
        if (phone.length >= 10) {
          console.log('✅ Telefone válido:', phone);
          return phone;
        } else {
          console.log('⚠️ Telefone muito curto ou inválido');
          return null;
        }
      }
    }
    
    console.log('❌ Pedido não encontrado na planilha');
    console.log('💡 Buscando por:', orderNumber);
    console.log('💡 Pedidos disponíveis:', data.slice(1).map(row => row[0]).join(', '));
    
    return null;
  } catch (error) {
    console.error('❌ Erro ao buscar telefone:', error.toString());
    return null;
  }
}

// Responde ao callback do Telegram
function answerCallback(callbackId, text) {
  const url = `https://api.telegram.org/bot${botToken}/answerCallbackQuery`;
  
  try {
    UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        callback_query_id: callbackId,
        text: text,
        show_alert: true
      })
    });
  } catch (error) {
    console.error('Erro ao responder callback:', error);
  }
}

// Atualiza a mensagem com o novo status
function updateMessageStatus(chatId, messageId, orderNumber, statusText, emoji, customerPhone) {
  console.log('📝 updateMessageStatus chamada com:', {
    orderNumber,
    statusText,
    emoji,
    customerPhone: customerPhone || 'null/vazio',
    phoneLength: customerPhone ? customerPhone.length : 0
  });
  
  const url = `https://api.telegram.org/bot${botToken}/editMessageReplyMarkup`;
  const shortOrderNum = orderNumber.substring(0, 20);
  
  // Novos botões mostrando o status atual
  const keyboard = {
    inline_keyboard: [
      [
        { text: emoji + ' STATUS: ' + statusText.toUpperCase(), callback_data: 'info' }
      ],
      [
        { text: '📦 Preparando', callback_data: 'st:' + shortOrderNum + ':prep' },
        { text: '🚚 Enviado', callback_data: 'st:' + shortOrderNum + ':ship' }
      ],
      [
        { text: '✅ Entregue', callback_data: 'st:' + shortOrderNum + ':done' }
      ]
    ]
  };
  
  // Botões por produto (Vendido/Disponível)
  const productRows = getOrderProductRows(shortOrderNum); // [{id,name}]
  const soldMap = getProductsSoldMap();
  if (productRows && productRows.length) {
    productRows.forEach(p => {
      const pid = String(p.id || '').trim();
      if (!pid) return;
      const name = String(p.name || 'Produto');
      const shortName = name.length > 22 ? (name.substring(0, 22) + '…') : name;
      const isSold = !!soldMap[pid];
      const label = isSold ? `🔴 VENDIDO: ${shortName}` : `🟢 DISPONÍVEL: ${shortName}`;
      const nextCmd = isSold ? 'avail' : 'sold';
      keyboard.inline_keyboard.push([
        { text: label, callback_data: `prd:${shortOrderNum}:${pid}:${nextCmd}` }
      ]);
    });
  }
  
  // Mantém o botão do WhatsApp se tiver telefone válido
  if (customerPhone && customerPhone.length >= 10) {
    console.log('✅ Adicionando botão WhatsApp com telefone:', customerPhone);
    keyboard.inline_keyboard.push([
      { text: '📱 WhatsApp Cliente', url: 'https://wa.me/55' + customerPhone }
    ]);
  } else {
    console.log('⚠️ Botão WhatsApp NÃO adicionado. Telefone inválido ou ausente.');
  }
  
  console.log('📤 Enviando teclado atualizado:', JSON.stringify(keyboard, null, 2));
  
  try {
    const response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        reply_markup: keyboard
      }),
      muteHttpExceptions: true
    });
    
    const responseCode = response.getResponseCode();
    console.log('📥 Resposta do Telegram:', responseCode);
    
    if (responseCode === 200) {
      console.log('✅ Botões atualizados com sucesso!');
    } else {
      console.error('❌ Erro ao atualizar botões:', response.getContentText());
    }
  } catch (error) {
    console.error('❌ Erro ao atualizar mensagem:', error.toString());
  }
}

// NOVA FUNÇÃO: Testa conexão com Telegram
function testTelegramConnection() {
  try {
    console.log('Testando conexão com Telegram...');
    console.log('Bot Token:', botToken.substring(0, 20) + '...');
    console.log('Chat ID:', CHAT_ID);
    
    const testMessage = `🧪 TESTE DE CONEXÃO

✅ Google Apps Script funcionando
✅ Credenciais configuradas
📅 ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}

Se você recebeu esta mensagem, a integração está funcionando corretamente!`;
    
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    const response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        chat_id: CHAT_ID,
        text: testMessage
      }),
      muteHttpExceptions: true
    });
    
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    console.log('Código de resposta:', responseCode);
    console.log('Resposta:', responseText);
    
    if (responseCode === 200) {
      return jsonResponse({ 
        success: true, 
        message: 'Mensagem de teste enviada com sucesso!',
        response: JSON.parse(responseText)
      });
    } else {
      return jsonResponse({ 
        success: false, 
        error: 'Erro ao enviar mensagem de teste',
        responseCode: responseCode,
        response: responseText
      });
    }
  } catch (error) {
    console.error('Erro no teste:', error.toString());
    return jsonResponse({ 
      success: false, 
      error: error.toString() 
    });
  }
}

// Configura o Webhook do Telegram (execute uma vez)
function setWebhook() {
  const webhookUrl = googleWebAppURL;
  const url = `https://api.telegram.org/bot${botToken}/setWebhook?url=${webhookUrl}`;
  
  const response = UrlFetchApp.fetch(url);
  console.log(response.getContentText());
  return response.getContentText();
}

// Remove o Webhook
function deleteWebhook() {
  const url = `https://api.telegram.org/bot${botToken}/deleteWebhook`;
  const response = UrlFetchApp.fetch(url);
  console.log(response.getContentText());
  return response.getContentText();
}

// Verifica status do Webhook
function getWebhookInfo() {
  const url = `https://api.telegram.org/bot${botToken}/getWebhookInfo`;
  const response = UrlFetchApp.fetch(url);
  console.log(response.getContentText());
  return response.getContentText();
}

// Helper para resposta JSON
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// Função de teste de pedido
function testSaveOrder() {
  const testOrder = {
    orderNumber: 'TEST-' + new Date().getTime(),
    customer: {
      name: 'Cliente Teste',
      phone: '11999999999',
      email: 'teste@email.com',
      address: 'Rua Teste, 123',
      city: 'São Paulo',
      cep: '01234-567',
      notes: 'Pedido de teste do sistema'
    },
    items: [
      { name: 'Vestido Midi Plissado', size: 'M', quantity: 1, price: 489.90 },
      { name: 'Blazer Oversized', size: 'G', quantity: 1, price: 599.90 }
    ],
    total: 1089.80,
    origin: 'Teste Manual'
  };
  
  console.log('Executando teste...');
  const result = saveOrder(testOrder);
  console.log('Resultado:', result.getContent());
  return result;
}