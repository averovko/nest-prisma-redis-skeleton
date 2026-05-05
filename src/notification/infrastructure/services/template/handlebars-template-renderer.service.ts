import { Injectable, Logger } from '@nestjs/common';
import * as Handlebars from 'handlebars';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { TemplateRendererPort } from '../../../domain/ports/template-renderer.port';
import { NotificationErrorFactory } from '../../../domain/errors/notification.error-factory';

@Injectable()
export class HandlebarsTemplateRendererService implements TemplateRendererPort {
  private readonly logger = new Logger(HandlebarsTemplateRendererService.name);
  private readonly templatesDir: string;
  private readonly compiledCache = new Map<
    string,
    Handlebars.TemplateDelegate
  >();

  constructor() {
    this.templatesDir = path.join(__dirname, '..', '..', 'templates');
    this.registerPartials();
  }

  async render(
    templateName: string,
    context: Record<string, unknown>,
  ): Promise<string> {
    try {
      const compiled = this.getCompiledTemplate(templateName);
      return compiled(context);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw NotificationErrorFactory.templateNotFound(templateName);
      }
      throw NotificationErrorFactory.templateRenderFailed(templateName, error);
    }
  }

  private getCompiledTemplate(
    templateName: string,
  ): Handlebars.TemplateDelegate {
    if (this.compiledCache.has(templateName)) {
      return this.compiledCache.get(templateName)!;
    }

    const templatePath = path.join(this.templatesDir, `${templateName}.hbs`);

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found: ${templateName}`);
    }

    const source = fs.readFileSync(templatePath, 'utf-8');
    const compiled = Handlebars.compile(source);
    this.compiledCache.set(templateName, compiled);
    return compiled;
  }

  private registerPartials(): void {
    const layoutsDir = path.join(this.templatesDir, 'layouts');
    if (!fs.existsSync(layoutsDir)) {
      return;
    }

    const files = fs.readdirSync(layoutsDir);
    for (const file of files) {
      if (!file.endsWith('.hbs')) continue;
      const partialName = path.basename(file, '.hbs');
      const partialPath = path.join(layoutsDir, file);
      const source = fs.readFileSync(partialPath, 'utf-8');
      Handlebars.registerPartial(partialName, source);
    }
  }
}
