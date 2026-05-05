export const TEMPLATE_RENDERER_PORT = Symbol('TEMPLATE_RENDERER_PORT');

export interface TemplateRendererPort {
  render(templateName: string, context: Record<string, unknown>): Promise<string>;
}
