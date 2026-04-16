import { Injectable } from '@nestjs/common';
import { ICvExportStrategy } from './export-strategy.interface';
import { ExportService } from '../export.service';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  TabStopType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  VerticalAlign,
  TableBorders,
  TabStopPosition,
  HeadingLevel,
  HeightRule,
} from 'docx';

@Injectable()
export class ModernWordStrategy implements ICvExportStrategy {
  constructor(private readonly exportService: ExportService) {}

  async export(cvData: any): Promise<Buffer> {
    const data = this.formatData(cvData);

    // Dynamic Font Sizing (Half-points: 10pt = 20)
    let baseSize = 20;
    let h1Size = 44;
    let h2Size = 26;
    let h3Size = 21;

    if (data.totalCharCount > 1500) {
      baseSize = 18;
      h1Size = 40;
      h2Size = 24;
      h3Size = 19;
    }
    if (data.totalCharCount > 2500) {
      baseSize = 17;
      h1Size = 36;
      h2Size = 22;
      h3Size = 18;
    }

    const dynamicSizes = { baseSize, h1Size, h2Size, h3Size };

    const doc = new Document({
      numbering: {
        config: [
          {
            reference: 'cv-bullets',
            levels: [
              {
                level: 0,
                format: 'bullet',
                text: '\u2022',
                alignment: AlignmentType.LEFT,
                style: {
                  paragraph: {
                    indent: { left: 360, hanging: 360 },
                  },
                },
              },
            ],
          },
        ],
      },
      styles: {
        paragraphStyles: [
          {
            id: 'Normal',
            name: 'Normal',
            run: {
              font: 'Arial',
              size: dynamicSizes.baseSize,
              color: '333333',
            },
            paragraph: {
              spacing: { line: 276 },
            },
          },
        ],
      },
      sections: [
        {
          properties: {
            page: {
              margin: { top: 0, bottom: 0, left: 0, right: 0 },
            },
          },
          children: [
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: TableBorders.NONE,
              rows: [
                new TableRow({
                  height: { value: 16838, rule: HeightRule.ATLEAST },
                  children: [
                    // --- SIDEBAR CELL (32%) ---
                    new TableCell({
                      width: { size: 32, type: WidthType.PERCENTAGE },
                      shading: { fill: '1A252F' },
                      verticalAlign: VerticalAlign.TOP,
                      margins: { top: 600, bottom: 600, left: 600, right: 600 },
                      children: this.buildSidebarChildren(data, dynamicSizes),
                    }),
                    // --- MAIN CONTENT CELL (68%) ---
                    new TableCell({
                      width: { size: 68, type: WidthType.PERCENTAGE },
                      shading: { fill: 'FFFFFF' },
                      verticalAlign: VerticalAlign.TOP,
                      margins: { top: 600, bottom: 600, left: 700, right: 600 },
                      children: this.buildMainChildren(data, dynamicSizes),
                    }),
                  ],
                }),
              ],
            }),
          ],
        },
      ],
    });

    return await Packer.toBuffer(doc);
  }

  private buildSidebarChildren(data: any, sizes: any): Paragraph[] {
    const children: Paragraph[] = [];

    // Name
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: data.fullName.toUpperCase(),
            bold: true,
            size: sizes.h1Size,
            color: 'FFFFFF',
          }),
        ],
        spacing: { after: 100 },
      }),
    );

    // Headline
    if (data.headline) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: data.headline,
              color: '3498DB',
              bold: true,
              size: sizes.baseSize + 2,
            }),
          ],
          spacing: { after: 300 },
        }),
      );
    }

    // Contact Header
    children.push(this.createSidebarHeader('CONTACT', sizes.h2Size));

    // Contact Items
    if (data.user?.email) {
      children.push(...this.createSidebarItem('Email', data.user.email, sizes.baseSize));
    }
    if (data.phone) {
      children.push(...this.createSidebarItem('Phone', data.phone, sizes.baseSize));
    }
    if (data.linkedin) {
      children.push(...this.createSidebarItem('LinkedIn', data.linkedin, sizes.baseSize));
    }
    if (data.github) {
      children.push(...this.createSidebarItem('GitHub', data.github, sizes.baseSize));
    }
    if (data.portfolio) {
      children.push(...this.createSidebarItem('Portfolio', data.portfolio, sizes.baseSize));
    }

    // Skills
    if (data.groupedSkills?.length) {
      children.push(this.createSidebarHeader('SKILLS', sizes.h2Size));
      data.groupedSkills.forEach((group: any) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${group.name}: `,
                bold: true,
                color: '3498DB',
                size: sizes.baseSize,
              }),
              new TextRun({
                text: group.items.join(', '),
                color: 'BDC3C7',
                size: sizes.baseSize,
              }),
            ],
            spacing: { before: 80, after: 80 },
          }),
        );
      });
    }

    // Languages
    if (data.languages?.length) {
      children.push(this.createSidebarHeader('LANGUAGES', sizes.h2Size));
      data.languages.forEach((lang: any) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${lang.name}: `,
                bold: true,
                color: '3498DB',
                size: sizes.baseSize,
              }),
              new TextRun({
                text: lang.proficiency,
                color: 'FFFFFF',
                size: sizes.baseSize,
              }),
            ],
            spacing: { before: 80, after: 80 },
          }),
        );
      });
    }

    return children;
  }

  private buildMainChildren(data: any, sizes: any): Paragraph[] {
    const children: Paragraph[] = [];

    // Professional Summary
    if (data.summary) {
      children.push(this.createMainHeader('PROFESSIONAL SUMMARY', sizes.h2Size));
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: data.summary,
              size: sizes.baseSize,
              color: '333333',
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200 },
        }),
      );
    }

    // Work Experience
    if (data.experiences?.length) {
      children.push(this.createMainHeader('WORK EXPERIENCE', sizes.h2Size));

      data.experiences.forEach((exp: any) => {
        // Job Title & Dates
        children.push(
          new Paragraph({
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
            children: [
              new TextRun({
                text: `${exp.jobTitle} ${exp.employmentTypeDisplay}`.trim(),
                bold: true,
                size: sizes.h3Size,
                color: '1A252F',
              }),
              new TextRun({ text: '\t' }),
              new TextRun({
                text: `${exp.startDate} - ${exp.isCurrentJob ? 'Present' : exp.endDate}`,
                bold: true,
                color: '3498DB',
              }),
            ],
            spacing: { before: 150 },
          }),
        );

        // Company & Location
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: exp.companyName,
                bold: true,
                size: sizes.baseSize,
                color: '333333',
              }),
              new TextRun({
                text: exp.location ? ` | ${exp.location}` : '',
                color: '7F8C8D',
                size: sizes.baseSize,
              }),
            ],
            spacing: { after: 100 },
          }),
        );

        // Bullets
        if (exp.bullets?.length) {
          exp.bullets.forEach((bullet: string) => {
            children.push(
              new Paragraph({
                text: bullet,
                numbering: { reference: 'cv-bullets', level: 0 },
                spacing: { after: 40 },
              }),
            );
          });
        }
      });
    }

    // Education
    if (data.educations?.length) {
      children.push(this.createMainHeader('EDUCATION', sizes.h2Size));

      data.educations.forEach((edu: any) => {
        children.push(
          new Paragraph({
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
            children: [
              new TextRun({
                text: edu.title,
                bold: true,
                size: sizes.h3Size,
                color: '1A252F',
              }),
              new TextRun({ text: '\t' }),
              new TextRun({
                text: `${edu.startDate} - ${edu.isCurrent ? 'Present' : edu.endDate}`,
                bold: true,
                color: '3498DB',
              }),
            ],
            spacing: { before: 150 },
          }),
        );
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: edu.institution,
                bold: true,
                size: sizes.baseSize,
                color: '333333',
              }),
              new TextRun({
                text: edu.location ? ` | ${edu.location}` : '',
                color: '7F8C8D',
                size: sizes.baseSize,
              }),
              new TextRun({
                text: edu.gpaDisplay ? ` • ${edu.gpaDisplay}` : '',
                color: '7F8C8D',
                size: sizes.baseSize,
              }),
            ],
            spacing: { after: 80 },
          }),
        );
      });
    }

    // Projects
    if (data.projects?.length) {
      children.push(this.createMainHeader('PROJECTS', sizes.h2Size));

      data.projects.forEach((proj: any) => {
        children.push(
          new Paragraph({
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
            children: [
              new TextRun({
                text: proj.name,
                bold: true,
                size: sizes.h3Size,
                color: '1A252F',
              }),
              new TextRun({ text: '\t' }),
              new TextRun({
                text: `${proj.startDate} - ${proj.endDate || 'Present'}`,
                bold: true,
                color: '3498DB',
              }),
            ],
            spacing: { before: 150 },
          }),
        );
        if (proj.bullets?.length) {
          proj.bullets.forEach((bullet: string) => {
            children.push(
              new Paragraph({
                text: bullet,
                numbering: { reference: 'cv-bullets', level: 0 },
                spacing: { after: 40 },
              }),
            );
          });
        }
      });
    }

    // Certifications
    if (data.certifications?.length) {
      children.push(this.createMainHeader('CERTIFICATIONS', sizes.h2Size));

      data.certifications.forEach((cert: any) => {
        children.push(
          new Paragraph({
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
            children: [
              new TextRun({
                text: cert.name,
                bold: true,
                size: sizes.h3Size,
                color: '1A252F',
              }),
              new TextRun({ text: '\t' }),
              new TextRun({
                text: cert.issueDate,
                bold: true,
                color: '3498DB',
              }),
            ],
            spacing: { before: 100 },
          }),
        );
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: cert.issuingOrganization,
                color: '7F8C8D',
                size: sizes.baseSize,
              }),
            ],
            spacing: { after: 80 },
          }),
        );
      });
    }

    return children;
  }

  // --- Helper Methods ---

  private createSidebarHeader(title: string, size: number): Paragraph {
    return new Paragraph({
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: size,
          color: 'FFFFFF',
        }),
      ],
      border: {
        bottom: {
          color: 'FFFFFF',
          space: 1,
          style: BorderStyle.SINGLE,
          size: 6,
        },
      },
      spacing: { before: 300, after: 150 },
    });
  }

  private createSidebarItem(label: string, value: string, size: number): Paragraph[] {
    return [
      new Paragraph({
        children: [
          new TextRun({
            text: label,
            bold: true,
            color: '3498DB',
            size: size - 2,
          }),
        ],
        spacing: { before: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: value,
            color: 'FFFFFF',
            size: size - 2,
          }),
        ],
        spacing: { after: 100 },
      }),
    ];
  }

  private createMainHeader(title: string, size: number): Paragraph {
    return new Paragraph({
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: size,
          color: '1A252F',
        }),
      ],
      heading: HeadingLevel.HEADING_2,
      border: {
        bottom: {
          color: '3498DB',
          space: 1,
          style: BorderStyle.SINGLE,
          size: 12,
        },
      },
      spacing: { before: 300, after: 150 },
    });
  }

  private formatData(data: any): any {
    const formatDate = (date: any) => {
      if (!date) return '';
      const d = new Date(date);
      if (isNaN(d.getTime())) return date;
      return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    const splitToBullets = (...texts: (string | undefined | null)[]): string[] => {
      const bullets: string[] = [];
      texts.forEach((text) => {
        if (!text) return;
        const parts = text
          .split(/\n|(?<=\.\s*)(?=[A-Z])/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
        bullets.push(...parts);
      });
      return bullets;
    };

    const categoryDisplayName: Record<string, string> = {
      programming_language: 'Programming Languages',
      backend: 'Backend & Databases',
      devops_infrastructure: 'DevOps & Infrastructure',
      security: 'Security',
      software_tools: 'Software & Tools',
      frontend: 'Frontend Development',
      technical: 'Technical Skills',
      database_storage: 'Database & Storage',
      data_science_analytics: 'Data Science & Analytics',
      ai_machine_learning: 'AI & Machine Learning',
      cloud_computing: 'Cloud Computing',
      networking: 'Networking',
      testing_qa: 'Testing & QA',
      architecture_design: 'Architecture & Design',
      methodology: 'Methodology',
      soft_skills: 'Soft Skills',
      domain_knowledge: 'Domain Knowledge',
    };

    const summary = data.summary || '';
    const experiences = (data.experiences ?? []).map((exp: any) => ({
      ...exp,
      startDate: formatDate(exp.startDate),
      endDate: formatDate(exp.endDate),
      employmentTypeDisplay: exp.employmentType
        ? `(${exp.employmentType.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())})`
        : '',
      bullets: splitToBullets(exp.description),
    }));

    const educations = (data.educations ?? []).map((edu: any) => ({
      ...edu,
      startDate: formatDate(edu.startDate),
      endDate: formatDate(edu.endDate),
      bullets: splitToBullets(edu.description),
      gpaDisplay: edu.gpa ? `GPA: ${Number(edu.gpa).toFixed(2)}` : '',
    }));

    const projects = (data.projects ?? []).map((proj: any) => ({
      ...proj,
      startDate: formatDate(proj.startDate),
      endDate: formatDate(proj.endDate),
      bullets: splitToBullets(proj.description),
    }));

    const allBullets = [
      ...experiences.flatMap((e: any) => e.bullets),
      ...projects.flatMap((p: any) => p.bullets),
      ...educations.flatMap((ed: any) => ed.bullets),
    ];
    const totalCharCount = summary.length + allBullets.join('').length;

    return {
      ...data,
      fullName: `${data.user?.firstName || ''} ${data.user?.lastName || ''}`.trim(),
      experiences,
      educations,
      projects,
      certifications: (data.certifications ?? []).map((cert: any) => ({
        ...cert,
        issueDate: formatDate(cert.issueDate),
      })),
      languages: (data.languages ?? []).map((lang: any) => ({
        ...lang,
        proficiency: lang.proficiency
          ? lang.proficiency.charAt(0).toUpperCase() + lang.proficiency.slice(1).toLowerCase()
          : '',
      })),
      groupedSkills: this.groupSkills(data.skills ?? [], categoryDisplayName),
      totalCharCount,
    };
  }

  private groupSkills(
    skills: any[],
    categoryMap: Record<string, string>,
  ): { name: string; items: string[] }[] {
    const ORDER = [
      'Programming Languages',
      'Backend & Databases',
      'Frontend Development',
      'DevOps & Infrastructure',
      'Cloud Computing',
      'Software & Tools',
    ];

    const groups: Record<string, string[]> = {};
    skills.forEach((skill) => {
      const raw = skill.category ?? 'technical';
      const label = categoryMap[raw] ?? raw;
      if (!groups[label]) groups[label] = [];
      groups[label].push(skill.name);
    });

    const result: { name: string; items: string[] }[] = [];
    ORDER.forEach((cat) => {
      if (groups[cat]?.length) {
        result.push({ name: cat, items: groups[cat] });
      }
    });
    Object.keys(groups).forEach((cat) => {
      if (!ORDER.includes(cat)) {
        result.push({ name: cat, items: groups[cat] });
      }
    });

    return result;
  }
}
