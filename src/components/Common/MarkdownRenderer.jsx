/**
 * Componente simple para renderizar Markdown básico
 * Soporta: **negrita**, *cursiva*, listas, saltos de línea
 */
export default function MarkdownRenderer({ content, className = '' }) {
  if (!content) return null;

  const renderMarkdown = (text) => {
    // Escapar HTML para seguridad
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // **Negrita**
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-white">$1</strong>');
    
    // *Cursiva*
    html = html.replace(/\*(.+?)\*/g, '<em class="italic text-slate-100">$1</em>');
    
    // `Código`
    html = html.replace(/`(.+?)`/g, '<code class="px-1.5 py-0.5 bg-slate-700 rounded text-cyan-300 text-sm font-mono">$1</code>');
    
    // Listas (- item)
    html = html.replace(/^- (.+)$/gm, '<div class="flex gap-2 my-1"><span class="text-green-400">•</span><span>$1</span></div>');
    
    // Números de lista (1. item, 2. item)
    html = html.replace(/^(\d+)\. (.+)$/gm, '<div class="flex gap-2 my-1"><span class="text-green-400 font-bold">$1.</span><span>$2</span></div>');
    
    // Saltos de línea
    html = html.replace(/\n/g, '<br />');

    return html;
  };

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
    />
  );
}

