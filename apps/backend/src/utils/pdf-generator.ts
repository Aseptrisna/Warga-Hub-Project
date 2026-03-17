import * as puppeteer from 'puppeteer';
import * as Handlebars from 'handlebars';
import * as path from 'path';
import * as fs from 'fs';

export class PdfGenerator {
  private static browser: puppeteer.Browser | null = null;

  /**
   * Initialize browser (singleton)
   */
  private static async getBrowser(): Promise<puppeteer.Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }
    return this.browser;
  }

  /**
   * Generate PDF from HTML template with data
   */
  static async generatePDF(
    htmlTemplate: string,
    data: Record<string, any>,
    options?: {
      filename?: string;
      outputDir?: string;
      qrCode?: string;
    },
  ): Promise<{ pdfPath: string; pdfUrl: string }> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      // Compile Handlebars template
      const template = Handlebars.compile(htmlTemplate);

      // Add QR code to data if provided
      const templateData = {
        ...data,
        qrCode: options?.qrCode || null,
        generatedDate: new Date().toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        }),
      };

      const html = template(templateData);

      // Set content
      await page.setContent(html, {
        waitUntil: 'networkidle0',
      });

      // Generate filename
      const timestamp = Date.now();
      const filename = options?.filename || `letter-${timestamp}.pdf`;
      const outputDir = options?.outputDir || path.join(process.cwd(), 'uploads', 'letters');

      // Ensure directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const pdfPath = path.join(outputDir, filename);

      // Generate PDF
      await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm',
        },
      });

      // Generate URL (relative to uploads)
      const pdfUrl = `/uploads/letters/${filename}`;

      return { pdfPath, pdfUrl };
    } finally {
      await page.close();
    }
  }

  /**
   * Close browser (cleanup)
   */
  static async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

// Register Handlebars helpers
Handlebars.registerHelper('formatDate', function (date: Date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
});

Handlebars.registerHelper('uppercase', function (str: string) {
  return str ? str.toUpperCase() : '';
});

Handlebars.registerHelper('lowercase', function (str: string) {
  return str ? str.toLowerCase() : '';
});
