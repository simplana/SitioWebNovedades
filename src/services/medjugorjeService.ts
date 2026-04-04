// Imagen fija y persistente para todos los mensajes de la Virgen
const MEDJUGORJE_MESSAGE_IMAGE = 'https://iabrhkvwhmliemgioxce.supabase.co/storage/v1/object/public/restorations/messages/virgen-medjugorje.jpg';

interface MedjugorjeMessage {
  id: string;
  title: string;
  date: string;
  location: string;
  message: string;
  excerpt: string;
  isLatest?: boolean;
  image: string;
  originalDate: Date;
}

class MedjugorjeService {
  private readonly baseUrl = 'https://www.medjugorje.ws';
  private readonly corsProxy = 'https://api.allorigins.win/raw?url=';
  private messages: MedjugorjeMessage[] = [];
  private lastChecked: Date | null = null;
  private checkInterval: number = 24 * 60 * 60 * 1000; // 24 horas

  constructor() {
    this.loadStoredMessages();
    this.startAutoCheck();
  }

  // Cargar mensajes almacenados localmente
  private loadStoredMessages() {
    try {
      const stored = localStorage.getItem('medjugorje_messages');
      if (stored) {
        const data = JSON.parse(stored);
        this.messages = data.messages || [];
        this.lastChecked = data.lastChecked ? new Date(data.lastChecked) : null;
      }
    } catch (error) {
      console.error('Error loading stored messages:', error);
    }
  }

  // Guardar mensajes localmente
  private saveMessages() {
    try {
      const data = {
        messages: this.messages,
        lastChecked: this.lastChecked
      };
      localStorage.setItem('medjugorje_messages', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  }

  // 🕷️ WEB SCRAPER - Extraer mensajes de la página web
  async fetchLatestMessages(): Promise<MedjugorjeMessage[]> {
    try {
      console.log('🔄 Fetching Spanish messages from Medjugorje...');
      
      // Usar proxy CORS más confiable
      const targetUrl = `${this.baseUrl}/es/messages/`;
      console.log('🌐 Target URL:', targetUrl);
      
      // Intentar con diferentes proxies
      const proxies = [
        `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`,
        `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
        `https://cors-anywhere.herokuapp.com/${targetUrl}`,
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`
      ];
      
      let html = '';
      let success = false;
      
      for (const proxyUrl of proxies) {
        try {
          console.log('🔄 Trying proxy:', proxyUrl);
          const response = await fetch(proxyUrl);
          
          if (!response.ok) {
            console.log('❌ Proxy failed with status:', response.status);
            continue;
          }
          
          let data;
          try {
            data = await response.json();
            html = data.contents || data.data || data.body || '';
          } catch {
            html = await response.text();
          }
          
          if (html && html.length > 1000) {
            console.log('✅ Successfully fetched HTML, length:', html.length);
            success = true;
            break;
          }
        } catch (error) {
          console.log('❌ Proxy error:', error);
          continue;
        }
      }
      
      if (!success) {
        console.log('❌ All proxies failed, using fallback messages');
        return this.getFallbackMessages();
      }
      
      const messages = this.parseMessagesFromHTML(html);
      
      // Verificar si hay nuevos mensajes
      const hasNewMessages = this.checkForNewMessages(messages);
      
      if (hasNewMessages) {
        console.log('✨ New messages detected!');
        this.notifyNewMessage();
      }

      this.messages = messages;
      this.lastChecked = new Date();
      this.saveMessages();

      return messages;
    } catch (error) {
      console.error('❌ Error fetching Medjugorje messages:', error);
      // Si falla, usar mensajes de demostración
      return this.getFallbackMessages();
    }
  }

  // 🔍 HTML PARSER - Parsear HTML para extraer mensajes
  private parseMessagesFromHTML(html: string): MedjugorjeMessage[] {
    try {
      console.log('🔍 Parsing Spanish HTML for messages...');
      
      // Crear un parser DOM temporal
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const messages: MedjugorjeMessage[] = [];
      
      // Selectores específicos para la página española de Medjugorje.ws
      const messageContainers = doc.querySelectorAll('.messages');
      console.log(`🔍 Found ${messageContainers.length} message containers`);
      
      messageContainers.forEach((container, index) => {
        try {
          // Extraer fecha del título
          const titleElement = container.querySelector('.poselstvi-datum strong a');
          const dateText = titleElement?.textContent?.trim() || '';
          console.log(`📅 Found date: ${dateText}`);
          
          // Extraer mensaje del contenido
          const messageElement = container.querySelector('.poselstvi-mary');
          let messageText = '';
          
          if (messageElement) {
            // Limpiar el texto del mensaje, removiendo comillas y elementos innecesarios
            messageText = messageElement.textContent || '';
            messageText = messageText
              .replace(/^[""]/, '') // Remover comilla inicial
              .replace(/[""]$/, '') // Remover comilla final
              .replace(/Gracias por haber respondido a mi llamado\.?\s*$/, 'Gracias por haber respondido a mi llamado.') // Normalizar final
              .trim();
          }
          
          console.log(`📝 Message ${index + 1} preview: "${messageText.substring(0, 100)}..."`);
          
          if (messageText && messageText.length > 50 && this.isValidSpanishMessage(messageText)) {
            const isLatest = index === 0 && (dateText.includes('Ultimo') || dateText.includes('Último'));
            
            const message: MedjugorjeMessage = {
              id: `medjugorje-${Date.now()}-${index}`,
              title: this.generateSpanishTitle(messageText, dateText),
              date: this.parseSpanishDate(dateText),
              location: 'Medjugorje, Bosnia y Herzegovina',
              message: this.cleanMessage(messageText),
              excerpt: this.createExcerpt(messageText),
              isLatest: isLatest,
              image: MEDJUGORJE_MESSAGE_IMAGE,
              category: this.categorizeSpanishMessage(messageText, dateText),
              originalDate: this.parseSpanishDateToDate(dateText)
            };
            
            messages.push(message);
            console.log(`✅ Message ${index + 1} processed successfully`);
          }
        } catch (error) {
          console.error(`❌ Error processing message ${index + 1}:`, error);
        }
      });
      
      console.log(`✅ Total messages processed: ${messages.length}`);
      return messages.length > 0 ? messages : this.getFallbackMessages();
    } catch (error) {
      console.error('❌ Error parsing HTML:', error);
      return this.getFallbackMessages();
    }
  }

  // 🔍 SPANISH MESSAGE VALIDATOR - Validar si es un mensaje válido en español
  private isValidSpanishMessage(text: string): boolean {
    const lowerText = text.toLowerCase();
    
    // Palabras clave que indican un mensaje de la Virgen María en español
    const spanishKeywords = [
      'queridos hijos',
      'hijitos',
      'les invito',
      'os invito',
      'oren',
      'orad',
      'paz',
      'amor',
      'jesús',
      'dios',
      'corazón',
      'oración',
      'conversión',
      'gracias por haber respondido',
      'mi llamado'
    ];
    
    return spanishKeywords.some(keyword => lowerText.includes(keyword));
  }

  // 🏷️ SPANISH TITLE GENERATOR - Generar título basado en el contenido en español
  private generateSpanishTitle(message: string, dateText: string): string {
    if (dateText.includes('Ultimo') || dateText.includes('Último')) {
      return 'Último Mensaje de Nuestra Señora';
    }
    
    const keywords = {
      'paz': 'Mensaje de Paz',
      'oración': 'Llamada a la Oración',
      'conversión': 'Llamada a la Conversión',
      'familia': 'Mensaje sobre la Familia',
      'eucaristía': 'Invitación a la Adoración Eucarística',
      'rosario': 'Invitación al Santo Rosario',
      'amor': 'Mensaje de Amor Maternal',
      'esperanza': 'Mensaje de Esperanza',
      'santidad': 'Llamada a la Santidad'
    };

    const lowerMessage = message.toLowerCase();
    for (const [keyword, title] of Object.entries(keywords)) {
      if (lowerMessage.includes(keyword)) {
        return title;
      }
    }

    return 'Mensaje de Nuestra Señora';
  }

  // 🏷️ SPANISH MESSAGE CATEGORIZER - Categorizar mensaje en español
  private categorizeSpanishMessage(message: string, dateText: string): MedjugorjeMessage['category'] {
    const lowerDate = dateText.toLowerCase();
    
    // Categorías basadas en la realidad de Medjugorje
    if (lowerDate.includes('anual') || lowerDate.includes('mirjana') || lowerDate.includes('ivanka') || lowerDate.includes('jakov')) {
      return 'Mensaje Anual';
    } else if (lowerDate.includes('25 de')) {
      return 'Mensaje Mensual';
    } else if (lowerDate.includes('2 de')) {
      return 'Mensaje Especial';
    } else {
      return 'Mensaje Mensual';
    }
  }

  // 📅 SPANISH DATE PARSER - Parsear fecha en español
  private parseSpanishDate(dateText: string): string {
    try {
      // Extraer fecha del formato "Mensaje, 25 de julio de 2025"
      const dateMatch = dateText.match(/(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/);
      if (dateMatch) {
        const [, day, month, year] = dateMatch;
        const monthNames: { [key: string]: string } = {
          'enero': 'enero',
          'febrero': 'febrero', 
          'marzo': 'marzo',
          'abril': 'abril',
          'mayo': 'mayo',
          'junio': 'junio',
          'julio': 'julio',
          'agosto': 'agosto',
          'septiembre': 'septiembre',
          'octubre': 'octubre',
          'noviembre': 'noviembre',
          'diciembre': 'diciembre'
        };
        
        const monthName = monthNames[month.toLowerCase()] || month;
        return `${day} de ${monthName} de ${year}`;
      }
      
      // Si no se puede parsear, usar fecha actual
      return new Date().toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return new Date().toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
  }

  // 📅 SPANISH DATE TO DATE OBJECT - Convertir fecha española a objeto Date
  private parseSpanishDateToDate(dateText: string): Date {
    try {
      const dateMatch = dateText.match(/(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/);
      if (dateMatch) {
        const [, day, month, year] = dateMatch;
        const monthMap: { [key: string]: number } = {
          'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3,
          'mayo': 4, 'junio': 5, 'julio': 6, 'agosto': 7,
          'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
        };
        
        const monthIndex = monthMap[month.toLowerCase()];
        if (monthIndex !== undefined) {
          return new Date(parseInt(year), monthIndex, parseInt(day));
        }
      }
      
      return new Date();
    } catch {
      return new Date();
    }
  }

  // 🔍 MESSAGE VALIDATOR - Validar si es un mensaje válido de la Virgen
  private isValidMessage(text: string): boolean {
    const lowerText = text.toLowerCase();
    
    // Palabras clave que indican un mensaje de la Virgen María
    const virginKeywords = [
      'dear children',
      'my dear children', 
      'little children',
      'queridos hijos',
      'mis queridos hijos',
      'hijitos',
      'thank you for responding',
      'gracias por responder',
      'i invite you',
      'os invito',
      'pray',
      'orad',
      'peace',
      'paz',
      'love',
      'amor',
      'jesus',
      'jesús'
    ];
    
    return virginKeywords.some(keyword => lowerText.includes(keyword));
  }

  // 🧹 MESSAGE CLEANER - Limpiar y formatear mensaje
  private cleanMessage(message: string): string {
    return message
      .replace(/\s+/g, ' ')
      .replace(/"/g, '"')
      .replace(/"/g, '"')
      .replace(/'/g, "'")
      .replace(/'/g, "'")
      .replace(/…/g, '...')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
  }
  // 📝 TEXT EXTRACTOR - Extraer texto del mensaje
  private extractMessageText(element: Element): string {
    if (!element) return '';
    
    let textContent = element.textContent || '';
    
    // Si el elemento es muy corto, buscar en elementos hijos
    if (textContent.length < 50) {
      const childElements = element.querySelectorAll('p, div, span');
      const childTexts = Array.from(childElements).map(el => el.textContent || '').filter(text => text.length > 20);
      if (childTexts.length > 0) {
        textContent = childTexts.join(' ');
      }
    }
    
    // Limpiar y formatear el texto
    return textContent
      .replace(/\s+/g, ' ')
      .replace(/"/g, '"')
      .replace(/"/g, '"')
      .replace(/'/g, "'")
      .replace(/'/g, "'")
      .replace(/…/g, '...')
      .trim();
  }

  // ✂️ EXCERPT CREATOR - Crear excerpt del mensaje
  private createExcerpt(message: string): string {
    const sentences = message.split('.').filter(s => s.trim().length > 0);
    return sentences.slice(0, 2).join('.') + (sentences.length > 2 ? '...' : '.');
  }

  // 🏷️ TITLE GENERATOR - Generar título basado en el contenido
  private generateTitle(message: string): string {
    const keywords = {
      'paz': 'Mensaje de Paz',
      'oración': 'Llamada a la Oración',
      'conversión': 'Llamada a la Conversión',
      'familia': 'Mensaje sobre la Familia',
      'eucaristía': 'Invitación a la Adoración Eucarística',
      'rosario': 'Invitación al Santo Rosario',
      'amor': 'Mensaje de Amor Maternal'
    };

    const lowerMessage = message.toLowerCase();
    for (const [keyword, title] of Object.entries(keywords)) {
      if (lowerMessage.includes(keyword)) {
        return title;
      }
    }

    return 'Mensaje de Nuestra Señora';
  }

  // 🏷️ MESSAGE CATEGORIZER - Categorizar mensaje
  private categorizeMessage(message: string): MedjugorjeMessage['category'] {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('aparición') || lowerMessage.includes('vengo')) {
      return 'Aparición';
    } else if (lowerMessage.includes('escuché') || lowerMessage.includes('oí')) {
      return 'Locución';
    } else if (lowerMessage.includes('vi') || lowerMessage.includes('visión')) {
      return 'Visión';
    } else {
      return 'Mensaje Interior';
    }
  }

  // 📅 DATE FORMATTER - Formatear fecha
  private formatDate(dateText: string): string {
    try {
      const date = new Date(dateText);
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return new Date().toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
  }

  // 📅 PREVIOUS DATE GENERATOR - Generar fecha anterior
  private generatePreviousDate(index: number): string {
    const date = new Date();
    date.setMonth(date.getMonth() - (index + 1));
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  // 🖼️ IMAGE SELECTOR - Obtener imagen desde Supabase Storage
  private getRandomImage(): string {
    // Siempre retornar la misma imagen persistente desde Supabase Storage
    return MEDJUGORJE_MESSAGE_IMAGE;
  }

  // 🔍 NEW MESSAGE DETECTOR - Verificar nuevos mensajes
  private checkForNewMessages(newMessages: MedjugorjeMessage[]): boolean {
    if (this.messages.length === 0) return false;
    
    const latestStored = this.messages.find(m => m.isLatest);
    const latestNew = newMessages.find(m => m.isLatest);
    
    if (!latestStored || !latestNew) return false;
    
    return latestNew.message !== latestStored.message;
  }

  // 🔔 NOTIFICATION SYSTEM - Notificar nuevo mensaje
  private notifyNewMessage() {
    // Crear notificación del navegador si está permitido
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Nuevo Mensaje de la Virgen', {
        body: 'Se ha publicado un nuevo mensaje de Nuestra Señora en Medjugorje',
        icon: '/novedades_catolicas_logo_transparent.png'
      });
    }

    // Disparar evento personalizado
    window.dispatchEvent(new CustomEvent('newVirginMessage', {
      detail: { timestamp: new Date() }
    }));
  }

  // ⏰ AUTO-CHECK SYSTEM - Iniciar verificación automática
  private startAutoCheck() {
    // Verificar cada 24 horas
    setInterval(() => {
      this.fetchLatestMessages();
    }, this.checkInterval);

    // Verificación inicial si han pasado más de 24 horas
    if (!this.lastChecked || (Date.now() - this.lastChecked.getTime()) > this.checkInterval) {
      setTimeout(() => this.fetchLatestMessages(), 5000); // Esperar 5 segundos después de cargar
    }
  }

  // 🛡️ FALLBACK MESSAGES - Mensajes de respaldo si falla la conexión
  private getFallbackMessages(): MedjugorjeMessage[] {
    console.log('🛡️ Using fallback messages due to scraping failure');
    return [
      {
        id: 'fallback-latest',
        title: 'Mensaje de Nuestra Señora (Conexión no disponible)',
        date: new Date().toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        location: 'Medjugorje, Bosnia y Herzegovina',
        excerpt: 'No se pudo conectar con el sitio oficial de Medjugorje. Por favor, intenta actualizar más tarde.',
        message: `Lo sentimos, no pudimos conectar con el sitio oficial de Medjugorje para obtener el mensaje más reciente de la Santísima Virgen María.

Por favor, visita directamente: https://www.medjugorje.ws/en/messages/latest-message

O intenta actualizar esta página más tarde para obtener los mensajes más recientes.`,
        isLatest: true,
        image: MEDJUGORJE_MESSAGE_IMAGE,
        originalDate: new Date()
      }
    ];
  }

  // 🔌 PUBLIC API METHODS - Métodos públicos
  async getMessages(): Promise<MedjugorjeMessage[]> {
    if (this.messages.length === 0) {
      return await this.fetchLatestMessages();
    }
    return this.messages;
  }

  async refreshMessages(): Promise<MedjugorjeMessage[]> {
    return await this.fetchLatestMessages();
  }

  getLatestMessage(): MedjugorjeMessage | null {
    return this.messages.find(m => m.isLatest) || null;
  }

  getPreviousMessages(): MedjugorjeMessage[] {
    return this.messages.filter(m => !m.isLatest);
  }

  // 🔔 NOTIFICATION PERMISSION - Solicitar permisos de notificación
  async requestNotificationPermission(): Promise<boolean> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }
}

export const medjugorjeService = new MedjugorjeService();
export type { MedjugorjeMessage };
export { MEDJUGORJE_MESSAGE_IMAGE };