'use client';

import { Report } from '@/types';
import { useState } from 'react';

interface ExportButtonsProps {
  report: Report;
}

export default function ExportButtons({ report }: ExportButtonsProps) {
  const [exportingDocx, setExportingDocx] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const exportDocx = async () => {
    setExportingDocx(true);
    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } = await import('docx');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const children: any[] = [];

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'AI Planning Report',
              bold: true,
              size: 48,
              color: '00C4CC',
              font: 'Calibri',
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        })
      );

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: report.problemStatement,
              italics: true,
              size: 24,
              color: '666666',
              font: 'Calibri',
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
        })
      );

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Generated: ${new Date(report.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
              size: 20,
              color: '999999',
              font: 'Calibri',
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        })
      );

      children.push(
        new Paragraph({
          border: {
            bottom: { style: BorderStyle.SINGLE, size: 1, color: '00F0FF' },
          },
          spacing: { after: 400 },
        })
      );

      for (const section of report.sections) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: section.title,
                bold: true,
                size: 32,
                color: '00C4CC',
                font: 'Calibri',
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 200 },
          })
        );

        const lines = section.content.split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;

          if (line.startsWith('### ')) {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: line.replace('### ', ''),
                    bold: true,
                    size: 26,
                    color: '333333',
                    font: 'Calibri',
                  }),
                ],
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 },
              })
            );
          } else if (line.startsWith('- ') || line.startsWith('* ')) {
            const text = line.replace(/^[\-\*] /, '');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const runs: any[] = [];

            const parts = text.split(/(\*\*.*?\*\*)/);
            for (const part of parts) {
              if (part.startsWith('**') && part.endsWith('**')) {
                runs.push(
                  new TextRun({
                    text: part.slice(2, -2),
                    bold: true,
                    size: 22,
                    font: 'Calibri',
                  })
                );
              } else {
                runs.push(
                  new TextRun({
                    text: part,
                    size: 22,
                    font: 'Calibri',
                    color: '444444',
                  })
                );
              }
            }

            children.push(
              new Paragraph({
                children: [
                  new TextRun({ text: '•  ', size: 22, font: 'Calibri', color: '00C4CC' }),
                  ...runs,
                ],
                spacing: { after: 80 },
                indent: { left: 720 },
              })
            );
          } else if (/^\d+\. /.test(line)) {
            const text = line.replace(/^\d+\. /, '');
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: text,
                    size: 22,
                    font: 'Calibri',
                    color: '444444',
                  }),
                ],
                spacing: { after: 80 },
                indent: { left: 720 },
              })
            );
          } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const runs: any[] = [];
            const parts = line.split(/(\*\*.*?\*\*)/);
            for (const part of parts) {
              if (part.startsWith('**') && part.endsWith('**')) {
                runs.push(
                  new TextRun({
                    text: part.slice(2, -2),
                    bold: true,
                    size: 22,
                    font: 'Calibri',
                  })
                );
              } else {
                runs.push(
                  new TextRun({
                    text: part,
                    size: 22,
                    font: 'Calibri',
                    color: '444444',
                  })
                );
              }
            }

            children.push(
              new Paragraph({
                children: runs,
                spacing: { after: 120 },
              })
            );
          }
        }

        children.push(
          new Paragraph({
            border: {
              bottom: { style: BorderStyle.SINGLE, size: 1, color: '00F0FF' },
            },
            spacing: { before: 200, after: 200 },
          })
        );
      }

      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                margin: {
                  top: 1440,
                  right: 1440,
                  bottom: 1440,
                  left: 1440,
                },
              },
            },
            children,
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const { saveAs } = await import('file-saver');
      saveAs(blob, `AI-Planning-Report-${Date.now()}.docx`);
    } catch (error) {
      console.error('DOCX export failed:', error);
    } finally {
      setExportingDocx(false);
    }
  };

  const exportPdf = async () => {
    setExportingPdf(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const maxWidth = pageWidth - margin * 2;
      let y = margin;

      const checkPageBreak = (needed: number) => {
        if (y + needed > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage();
          y = margin;
        }
      };

      // Title
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 196, 204);
      doc.text('AI Planning Report', pageWidth / 2, y, { align: 'center' });
      y += 12;

      // Problem statement
      doc.setFontSize(12);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      const problemLines = doc.splitTextToSize(report.problemStatement, maxWidth);
      doc.text(problemLines, pageWidth / 2, y, { align: 'center' });
      y += problemLines.length * 6 + 4;

      // Date
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Generated: ${new Date(report.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
        pageWidth / 2,
        y,
        { align: 'center' }
      );
      y += 10;

      // Divider — cyan line
      doc.setDrawColor(0, 240, 255);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;

      for (const section of report.sections) {
        checkPageBreak(20);

        // Section colored bar — cyan gradient
        doc.setFillColor(0, 196, 204);
        doc.roundedRect(margin, y, maxWidth, 10, 2, 2, 'F');
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(section.title, margin + 5, y + 7);
        y += 16;

        // Content
        const lines = section.content.split('\n');
        for (const line of lines) {
          if (!line.trim()) {
            y += 3;
            continue;
          }

          checkPageBreak(8);

          if (line.startsWith('### ')) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 196, 204);
            y += 3;
            const subLines = doc.splitTextToSize(line.replace('### ', ''), maxWidth);
            doc.text(subLines, margin, y);
            y += subLines.length * 5 + 3;
          } else if (line.startsWith('- ') || line.startsWith('* ')) {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(68, 68, 68);
            const cleanLine = line.replace(/^[\-\*] /, '').replace(/\*\*/g, '');
            const wrappedLines = doc.splitTextToSize('•  ' + cleanLine, maxWidth - 10);
            doc.text(wrappedLines, margin + 5, y);
            y += wrappedLines.length * 4.5 + 2;
          } else {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(68, 68, 68);
            const cleanLine = line.replace(/\*\*/g, '');
            const wrappedLines = doc.splitTextToSize(cleanLine, maxWidth);
            doc.text(wrappedLines, margin, y);
            y += wrappedLines.length * 4.5 + 2;
          }
        }

        y += 8;

        if (section !== report.sections[report.sections.length - 1]) {
          checkPageBreak(10);
          doc.setDrawColor(0, 240, 255);
          doc.setLineWidth(0.2);
          doc.line(margin, y, pageWidth - margin, y);
          y += 8;
        }
      }

      doc.save(`AI-Planning-Report-${Date.now()}.pdf`);
    } catch (error) {
      console.error('PDF export failed:', error);
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={exportDocx}
        disabled={exportingDocx}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 hover:scale-105"
        style={{
          background: 'var(--accent)',
          color: '#000',
          boxShadow: '0 0 15px var(--accent-glow-strong)',
        }}
      >
        {exportingDocx ? (
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )}
        DOCX
      </button>

      <button
        onClick={exportPdf}
        disabled={exportingPdf}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold glass transition-all disabled:opacity-50 hover:scale-105"
        style={{ color: 'var(--accent)' }}
      >
        {exportingPdf ? (
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        )}
        PDF
      </button>
    </div>
  );
}
