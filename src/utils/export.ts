import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { jsPDF } from 'jspdf';
import remarkGfm from 'remark-gfm';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { visit } from 'unist-util-visit';

interface TextNode {
  type: string;
  value?: string;
  children?: TextNode[];
  depth?: number;
}

const detectLanguage = (text: string): string => {
  const arabicPattern = /[\u0600-\u06FF]/;
  const frenchPattern = /[À-ÿ]|(\b(je|tu|il|nous|vous|ils|le|la|les|un|une|des|ce|cette|ces)\b)/i;
  
  if (arabicPattern.test(text)) return 'ar';
  if (frenchPattern.test(text)) return 'fr';
  return 'en';
};

async function parseMarkdown(content: string) {
  const processor = unified().use(remarkParse).use(remarkGfm);
  const ast = await processor.parse(content);
  return ast;
}

function getFontForLanguage(lang: string) {
  switch (lang) {
    case 'ar':
      return 'Noto Naskh Arabic';
    case 'fr':
      return 'Noto Sans';
    default:
      return 'Crimson Pro';
  }
}

export async function exportToPDF(content: string, title: string) {
  const lang = detectLanguage(content);
  const isRTL = lang === 'ar';
  const font = getFontForLanguage(lang);
  
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
  });

  // Set RTL if needed
  if (isRTL) {
    doc.setR2L(true);
  }

  // Add title
  doc.setFont(font, 'bold');
  doc.setFontSize(24);
  doc.text(title, isRTL ? doc.internal.pageSize.width - 20 : 20, 20, {
    align: isRTL ? 'right' : 'left',
  });

  // Parse markdown content
  const ast = await parseMarkdown(content);
  let yPosition = 40;
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  const textWidth = pageWidth - (margin * 2);

  // Process the AST
  visit(ast, (node: TextNode) => {
    if (node.type === 'heading') {
      doc.setFont(font, 'bold');
      doc.setFontSize(18 - (node.depth || 0) * 2);
      const text = node.children?.[0]?.value || '';
      doc.text(text, isRTL ? pageWidth - margin : margin, yPosition, {
        align: isRTL ? 'right' : 'left',
      });
      yPosition += 10;
    } else if (node.type === 'paragraph') {
      doc.setFont(font, 'normal');
      doc.setFontSize(12);
      const text = node.children?.map(child => child.value).join('') || '';
      const lines = doc.splitTextToSize(text, textWidth);
      
      // Check if we need a new page
      if (yPosition + (lines.length * 7) > doc.internal.pageSize.height - margin) {
        doc.addPage();
        yPosition = margin;
      }
      
      doc.text(lines, isRTL ? pageWidth - margin : margin, yPosition, {
        align: isRTL ? 'right' : 'left',
      });
      yPosition += lines.length * 7 + 5;
    }
  });

  // Save the PDF
  doc.save(`${title}.pdf`);
}

export async function exportToDocx(content: string, title: string) {
  const lang = detectLanguage(content);
  const isRTL = lang === 'ar';
  const font = getFontForLanguage(lang);

  // Parse markdown content
  const ast = await parseMarkdown(content);
  const children: Paragraph[] = [];

  // Add title
  children.push(
    new Paragraph({
      text: title,
      heading: HeadingLevel.TITLE,
      alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
      spacing: {
        after: 400,
      },
      children: [
        new TextRun({
          text: title,
          font,
          size: 36,
          bold: true,
        }),
      ],
    })
  );

  // Process the AST
  visit(ast, (node: TextNode) => {
    if (node.type === 'heading') {
      children.push(
        new Paragraph({
          alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
          heading: HeadingLevel.HEADING_1 + ((node.depth || 1) - 1),
          spacing: {
            before: 400,
            after: 200,
          },
          children: [
            new TextRun({
              text: node.children?.[0]?.value || '',
              font,
              size: 28 - ((node.depth || 0) * 2),
              bold: true,
            }),
          ],
        })
      );
    } else if (node.type === 'paragraph') {
      children.push(
        new Paragraph({
          alignment: isRTL ? AlignmentType.RIGHT : AlignmentType.LEFT,
          spacing: {
            before: 200,
            after: 200,
          },
          children: [
            new TextRun({
              text: node.children?.map(child => child.value).join('') || '',
              font,
              size: 24,
            }),
          ],
        })
      );
    }
  });

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1440, // 1 inch
            right: 1440,
            bottom: 1440,
            left: 1440,
          },
        },
      },
      children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}