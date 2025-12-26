/**
 * ATELIER - Google Apps Script
 * API para armazenar e buscar pedidos no Google Sheets
 * 
 * INSTRUÇÕES:
 * 1. Acesse https://script.google.com
 * 2. Crie um novo projeto
 * 3. Cole este código
 * 4. Clique em Implantar > Nova implantação
 * 5. Selecione "App da Web"
 * 6. Executar como: "Eu"
 * 7. Quem pode acessar: "Qualquer pessoa"
 * 8. Copie a URL gerada e cole no CONFIG do script.js
 */

const botToken = '7898087319:AAHP0XDRUN8vyaxUYANv8bZMGrD3hRLZj6o';
const sheetId = '1XRjmWTfBps5tzt9REgdKczqTtuOWHDWTopFDoUaRd8k';
const googleWebAppURL = 'https://script.google.com/macros/s/AKfycbzA-94TBIImBhstGsB6p-zxiHs6dvNdTDzFaVjNFLuugu8HuXvcmAGZ_0R3_LUK1NH1/exec';

// Nomes das abas
const SHEET_PEDIDOS = 'Pedidos';
const SHEET_ITENS = 'Itens';

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
    itensSheet.getRange(1, 1, 1, 6).setValues([[
      'Código Pedido', 'Produto', 'Tamanho', 'Quantidade', 'Preço Unit.', 'Subtotal'
    ]]);
    itensSheet.getRange(1, 1, 1, 6).setFontWeight('bold');
    itensSheet.setFrozenRows(1);
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
    }
    
    return jsonResponse({ success: false, error: 'Ação inválida' });
  } catch (error) {
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
    } else if (action === 'init') {
      initSheets();
      return jsonResponse({ success: true, message: 'Planilha inicializada!' });
    }
    
    return jsonResponse({ success: false, error: 'Ação inválida' });
  } catch (error) {
    return jsonResponse({ success: false, error: error.message });
  }
}

// Salva um novo pedido
function saveOrder(order) {
  const ss = initSheets();
  const pedidosSheet = ss.getSheetByName(SHEET_PEDIDOS);
  const itensSheet = ss.getSheetByName(SHEET_ITENS);
  
  // Formata a data
  const dataFormatada = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  
  // Adiciona o pedido
  pedidosSheet.appendRow([
    order.orderNumber,
    dataFormatada,
    'Pedido Recebido',
    order.customer.name,
    order.customer.phone,
    order.customer.email || '',
    order.customer.address,
    order.customer.city,
    order.customer.cep,
    order.customer.notes || '',
    order.total,
    order.origin || 'Site'
  ]);
  
  // Adiciona os itens
  order.items.forEach(item => {
    itensSheet.appendRow([
      order.orderNumber,
      item.name,
      item.size,
      item.quantity,
      item.price,
      item.price * item.quantity
    ]);
  });
  
  // Envia notificação no Telegram
  sendTelegramNotification(order);
  
  return jsonResponse({ 
    success: true, 
    message: 'Pedido salvo com sucesso!',
    orderNumber: order.orderNumber 
  });
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
  const headers = pedidosData[0];
  
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

// Atualiza o status de um pedido
function updateOrderStatus(orderNumber, newStatus) {
  const ss = SpreadsheetApp.openById(sheetId);
  const pedidosSheet = ss.getSheetByName(SHEET_PEDIDOS);
  
  const data = pedidosSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString().toUpperCase() === orderNumber.toUpperCase()) {
      // Coluna C (índice 2) é o Status
      pedidosSheet.getRange(i + 1, 3).setValue(newStatus);
      return jsonResponse({ success: true, message: 'Status atualizado!' });
    }
  }
  
  return jsonResponse({ success: false, error: 'Pedido não encontrado' });
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

// Chat ID do vendedor
const CHAT_ID = '7625866003';

// Envia notificação no Telegram com botões de ação
function sendTelegramNotification(order) {
  try {
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
    
    let message = `🛍️ *NOVO PEDIDO - ATELIER*\n`;
    message += `━━━━━━━━━━━━━━━━━━\n\n`;
    message += `📋 *Pedido #${orderNumber}*\n`;
    message += `📅 Data: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}\n\n`;
    
    message += `👤 *DADOS DO CLIENTE*\n`;
    message += `Nome: ${customerName}\n`;
    message += `Telefone: ${order.customer?.phone || 'N/A'}\n`;
    if (customerEmail) message += `E-mail: ${customerEmail}\n`;
    message += `\n📍 *ENDEREÇO DE ENTREGA*\n`;
    message += `${customerAddress}\n`;
    message += `${customerCity} - CEP: ${customerCep}\n\n`;
    
    message += `🛒 *ITENS DO PEDIDO*\n`;
    message += `━━━━━━━━━━━━━━━━━━\n`;
    
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach(item => {
        const itemPrice = parseFloat(item.price) || 0;
        const itemQty = parseInt(item.quantity) || 1;
        message += `▸ ${item.name || 'Produto'}\n`;
        message += `   Tam: ${item.size || 'N/A'} | Qtd: ${itemQty} | R$ ${(itemPrice * itemQty).toFixed(2)}\n`;
      });
    }
    
    message += `━━━━━━━━━━━━━━━━━━\n`;
    message += `💰 *TOTAL: R$ ${totalValue.toFixed(2)}*\n\n`;
    
    if (customerNotes) {
      message += `📝 *Observações:*\n${customerNotes}\n\n`;
    }
    
    message += `✨ _Clique nos botões abaixo para atualizar o status:_`;
    
    // Botões inline para atualizar status
    const keyboard = {
      inline_keyboard: [
        [
          { text: '📦 Preparando', callback_data: `status:${orderNumber}:preparing` },
          { text: '🚚 Enviado', callback_data: `status:${orderNumber}:shipped` }
        ],
        [
          { text: '✅ Entregue', callback_data: `status:${orderNumber}:delivered` },
          { text: '❌ Cancelar', callback_data: `status:${orderNumber}:cancelled` }
        ],
        [
          { text: '📱 WhatsApp Cliente', url: `https://wa.me/55${customerPhone}` }
        ]
      ]
    };
    
    // Envia para o Telegram
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    const response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
        reply_markup: keyboard
      }),
      muteHttpExceptions: true
    });
    
    console.log('Telegram response:', response.getContentText());
    
  } catch (error) {
    console.error('Erro ao enviar Telegram:', error);
    
    // Fallback: envia mensagem simples sem botões
    try {
      const simpleMessage = `🛍️ Novo pedido #${order.orderNumber || 'N/A'}\nTotal: R$ ${order.total || 0}`;
      UrlFetchApp.fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify({
          chat_id: CHAT_ID,
          text: simpleMessage
        }),
        muteHttpExceptions: true
      });
    } catch (e) {
      console.error('Erro no fallback:', e);
    }
  }
}

// Processa os callbacks dos botões do Telegram
function processCallback(update) {
  if (!update.callback_query) return;
  
  const callbackData = update.callback_query.data;
  const callbackId = update.callback_query.id;
  const messageId = update.callback_query.message.message_id;
  const chatId = update.callback_query.message.chat.id;
  
  // Parse do callback: status:ORDER_NUMBER:NEW_STATUS
  const parts = callbackData.split(':');
  if (parts[0] !== 'status') return;
  
  const orderNumber = parts[1];
  const newStatus = parts[2];
  
  // Mapeia código para texto
  const statusMap = {
    'preparing': 'Em Preparação',
    'shipped': 'Enviado',
    'delivered': 'Entregue',
    'cancelled': 'Cancelado'
  };
  
  const statusEmoji = {
    'preparing': '📦',
    'shipped': '🚚',
    'delivered': '✅',
    'cancelled': '❌'
  };
  
  // Atualiza na planilha
  const statusText = statusMap[newStatus] || newStatus;
  updateOrderStatusInSheet(orderNumber, statusText);
  
  // Responde ao callback
  answerCallback(callbackId, `${statusEmoji[newStatus]} Status atualizado para: ${statusText}`);
  
  // Atualiza a mensagem original
  updateMessageStatus(chatId, messageId, orderNumber, statusText, statusEmoji[newStatus]);
}

// Atualiza o status na planilha
function updateOrderStatusInSheet(orderNumber, statusText) {
  const ss = SpreadsheetApp.openById(sheetId);
  const pedidosSheet = ss.getSheetByName(SHEET_PEDIDOS);
  
  if (!pedidosSheet) return;
  
  const data = pedidosSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString().toUpperCase() === orderNumber.toUpperCase()) {
      pedidosSheet.getRange(i + 1, 3).setValue(statusText);
      return;
    }
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
function updateMessageStatus(chatId, messageId, orderNumber, statusText, emoji) {
  const url = `https://api.telegram.org/bot${botToken}/editMessageReplyMarkup`;
  
  // Novos botões mostrando o status atual
  const keyboard = {
    inline_keyboard: [
      [
        { text: `${emoji} STATUS: ${statusText.toUpperCase()}`, callback_data: 'none' }
      ],
      [
        { text: '📦 Preparando', callback_data: `status:${orderNumber}:preparing` },
        { text: '🚚 Enviado', callback_data: `status:${orderNumber}:shipped` }
      ],
      [
        { text: '✅ Entregue', callback_data: `status:${orderNumber}:delivered` }
      ]
    ]
  };
  
  try {
    UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        reply_markup: keyboard
      })
    });
  } catch (error) {
    console.error('Erro ao atualizar mensagem:', error);
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

// Função de teste
function testSaveOrder() {
  const testOrder = {
    orderNumber: 'TEST123',
    customer: {
      name: 'Teste Cliente',
      phone: '11999999999',
      email: 'teste@email.com',
      address: 'Rua Teste, 123',
      city: 'São Paulo',
      cep: '01234-567',
      notes: 'Pedido de teste'
    },
    items: [
      { name: 'Vestido Midi', size: 'M', quantity: 1, price: 299.90 }
    ],
    total: 299.90
  };
  
  console.log(saveOrder(testOrder));
}

