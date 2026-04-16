import { Injectable } from '@nestjs/common';
import { ICvExportStrategy } from './export-strategy.interface';
import { ExportService } from '../export.service';

@Injectable()
export class ModernPdfStrategy implements ICvExportStrategy {
  constructor(private readonly exportService: ExportService) {}

  async export(cvData: any): Promise<Buffer> {
    const formattedData = this.formatData(cvData);
    const template = this.getTemplate();
    const html = await this.exportService.renderTemplate(
      template,
      formattedData,
    );
    return this.exportService.generatePdf(html);
  }

  private formatData(data: any): any {
    const formatDate = (date: any) => {
      if (!date) return '';
      const d = new Date(date);
      if (isNaN(d.getTime())) return date;
      return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    const splitToBullets = (
      ...texts: (string | undefined | null)[]
    ): string[] => {
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

    // --- Dynamic Font Scaling Logic ---
    const allBullets = [
      ...experiences.flatMap((e: any) => e.bullets),
      ...projects.flatMap((p: any) => p.bullets),
      ...educations.flatMap((ed: any) => ed.bullets),
    ];
    const totalCharCount = summary.length + allBullets.join('').length;

    let baseFontSize = '10pt';
    let titleSize = '22pt';
    let h2Size = '13pt';

    // Aggressive scaling for ATS and 1-2 page fitting
    if (totalCharCount > 1500) {
      baseFontSize = '9pt';
      titleSize = '20pt';
      h2Size = '12pt';
    }
    if (totalCharCount > 2500) {
      baseFontSize = '8.5pt';
      titleSize = '18pt';
      h2Size = '11pt';
    }

    return {
      ...data,
      fullName:
        `${data.user?.firstName || ''} ${data.user?.lastName || ''}`.trim(),
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
          ? lang.proficiency.charAt(0).toUpperCase() +
            lang.proficiency.slice(1).toLowerCase()
          : '',
      })),
      groupedSkills: this.groupSkills(data.skills ?? [], categoryDisplayName),
      // Dynamic CSS variables passed to template
      baseFontSize,
      titleSize,
      h2Size,
    };
  }

  private groupSkills(
    skills: any[],
    categoryMap: Record<string, string>,
  ): { name: string; items: string }[] {
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

    const result: { name: string; items: string }[] = [];

    // Add ordered categories
    ORDER.forEach((cat) => {
      if (groups[cat]?.length) {
        result.push({ name: cat, items: groups[cat].join(', ') });
      }
    });

    // Add any remaining categories
    Object.keys(groups).forEach((cat) => {
      if (!ORDER.includes(cat)) {
        result.push({ name: cat, items: groups[cat].join(', ') });
      }
    });

    return result;
  }

  private getTemplate(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
    <style>
        @page {
            size: A4;
            margin: 0;
        }
        * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
        }
        html, body {
            margin: 0;
            padding: 0;
            width: 100%;
        }
        body {
            background: linear-gradient(to right, #1a252f 0%, #1a252f 32%, #ffffff 32%, #ffffff 100%);
            font-family: 'Roboto', sans-serif;
            font-size: {{baseFontSize}};
            color: #333;
            line-height: 1.3;
            margin: 0;
            padding: 0;
        }

        /* SIDEBAR (32%) */
        .sidebar {
            float: left;
            width: 32%;
            padding: 20px 15px;
            box-sizing: border-box;
            color: #ffffff;
        }

        /* MAIN CONTENT (68%) */
        .main {
            width: 68%;
            margin-left: 32%;
            padding: 20px 25px;
            box-sizing: border-box;
            background: transparent;
        }

        /* --- TYPOGRAPHY --- */
        h1 {
            font-size: {{titleSize}};
            font-weight: 700;
            margin: 0 0 5px 0;
            color: #ffffff;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .headline {
            font-size: calc({{baseFontSize}} + 1pt);
            color: #3498db;
            font-weight: 500;
            margin-bottom: 20px;
        }

        h2 {
            font-size: {{h2Size}};
            font-weight: 700;
            color: #1a252f;
            text-transform: uppercase;
            border-bottom: 2px solid #3498db;
            padding-bottom: 3px;
            margin: 15px 0 10px 0;
        }

        .sidebar h2 {
            color: #ffffff;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            font-size: calc({{baseFontSize}} + 1pt);
            margin-top: 20px;
        }

        h3 {
            font-size: calc({{baseFontSize}} + 0.5pt);
            font-weight: 700;
            margin: 0;
            color: #1a252f;
        }

        /* --- SIDEBAR ELEMENTS --- */
        .sidebar-item {
            margin-bottom: 10px;
            font-size: calc({{baseFontSize}} - 1pt);
            page-break-inside: avoid;
        }

        .sidebar-label {
            font-weight: 700;
            color: #3498db;
            display: block;
            margin-bottom: 1px;
        }

        .sidebar-link {
            color: #bdc3c7;
            text-decoration: none;
            word-break: break-all;
        }

        /* Skills Compression (Inline Spans) */
        .skill-group {
            margin-bottom: 8px;
            font-size: calc({{baseFontSize}} - 1pt);
            page-break-inside: avoid;
            line-height: 1.4;
        }

        .skill-category {
            color: #3498db;
            font-weight: bold;
        }

        .skill-list {
            color: #bdc3c7;
        }

        /* --- MAIN CONTENT ELEMENTS --- */
        .main-item {
            margin-bottom: 12px;
            page-break-inside: avoid;
        }

        .item-header {
            position: relative;
            margin-bottom: 2px;
            padding-right: 130px;
        }

        .item-meta {
            font-size: calc({{baseFontSize}} - 0.5pt);
            color: #7f8c8d;
            font-weight: 500;
        }

        .item-dates {
            position: absolute;
            right: 0;
            top: 0;
            font-weight: 600;
            color: #3498db;
            font-size: calc({{baseFontSize}} - 0.5pt);
        }

        ul {
            margin: 2px 0 0 0;
            padding-left: 15px;
            list-style-type: square;
        }

        li {
            margin-bottom: 2px;
            color: #34495e;
            font-size: calc({{baseFontSize}} - 0.5pt);
            text-align: justify;
        }

        a {
            color: #3498db;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="sidebar">
        <h1>{{user.firstName}}<br>{{user.lastName}}</h1>
        <div class="headline">{{headline}}</div>

        <h2>Contact</h2>
        <div class="sidebar-item">
            <span class="sidebar-label">Email</span>
            <a href="mailto:{{user.email}}" class="sidebar-link">{{user.email}}</a>
        </div>
        
        {{#if phone}}
        <div class="sidebar-item">
            <span class="sidebar-label">Phone</span>
            <span class="sidebar-link">{{phone}}</span>
        </div>
        {{/if}}

        {{#if linkedin}}
        <div class="sidebar-item">
            <span class="sidebar-label">LinkedIn</span>
            <a href="{{linkedin}}" target="_blank" class="sidebar-link">linkedin.com/in/profile</a>
        </div>
        {{/if}}

        {{#if github}}
        <div class="sidebar-item">
            <span class="sidebar-label">GitHub</span>
            <a href="{{github}}" target="_blank" class="sidebar-link">github.com/profile</a>
        </div>
        {{/if}}

        {{#if portfolio}}
        <div class="sidebar-item">
            <span class="sidebar-label">Portfolio</span>
            <a href="{{portfolio}}" target="_blank" class="sidebar-link">portfolio.me</a>
        </div>
        {{/if}}

        {{#if groupedSkills.length}}
        <h2>Skills</h2>
        {{#each groupedSkills}}
        <div class="skill-group">
            <span class="skill-category">{{name}}:</span>
            <span class="skill-list">{{items}}</span>
        </div>
        {{/each}}
        {{/if}}

        {{#if languages.length}}
        <h2>Languages</h2>
        {{#each languages}}
        <div class="sidebar-item">
            <span class="sidebar-label">{{name}}</span>
            <span class="sidebar-link">{{proficiency}}</span>
        </div>
        {{/each}}
        {{/if}}
    </div>

    <div class="main">
        {{#if summary}}
        <div class="main-item">
            <h2>Professional Summary</h2>
            <div style="color: #34495e; text-align: justify;">{{summary}}</div>
        </div>
        {{/if}}

        {{#if experiences.length}}
        <div>
            <h2>Work Experience</h2>
            {{#each experiences}}
            <div class="main-item">
                <div class="item-header">
                    <h3>{{jobTitle}} {{employmentTypeDisplay}}</h3>
                    <span class="item-dates">{{startDate}} — {{#if isCurrentJob}}Present{{else}}{{endDate}}{{/if}}</span>
                </div>
                <div class="item-meta">
                    <strong>{{companyName}}</strong>{{#if location}} | {{location}}{{/if}}
                </div>
                {{#if bullets.length}}
                <ul>
                    {{#each bullets}}<li>{{this}}</li>{{/each}}
                </ul>
                {{/if}}
            </div>
            {{/each}}
        </div>
        {{/if}}

        {{#if educations.length}}
        <div>
            <h2>Education</h2>
            {{#each educations}}
            <div class="main-item">
                <div class="item-header">
                    <h3>{{title}}</h3>
                    <span class="item-dates">{{startDate}} — {{#if isCurrent}}Present{{else}}{{endDate}}{{/if}}</span>
                </div>
                <div class="item-meta">
                    <strong>{{institution}}</strong>{{#if location}} | {{location}}{{/if}} {{#if gpaDisplay}}• {{gpaDisplay}}{{/if}}
                </div>
                {{#if bullets.length}}
                <ul>
                    {{#each bullets}}<li>{{this}}</li>{{/each}}
                </ul>
                {{/if}}
            </div>
            {{/each}}
        </div>
        {{/if}}

        {{#if projects.length}}
        <div>
            <h2>Projects</h2>
            {{#each projects}}
            <div class="main-item">
                <div class="item-header">
                    <h3>
                        {{#if projectUrl}}
                        <a href="{{projectUrl}}" target="_blank">{{name}}</a>
                        {{else}}
                        {{name}}
                        {{/if}}
                    </h3>
                    <span class="item-dates">{{startDate}} — {{#if endDate}}{{endDate}}{{else}}Present{{/if}}</span>
                </div>
                {{#if bullets.length}}
                <ul>
                    {{#each bullets}}<li>{{this}}</li>{{/each}}
                </ul>
                {{/if}}
            </div>
            {{/each}}
        </div>
        {{/if}}

        {{#if certifications.length}}
        <div class="certifications-section">
            <h2>Certifications</h2>
            {{#each certifications}}
            <div class="main-item">
                <div class="item-header" style="padding-right: 100px;">
                    <h3>
                        {{#if credentialUrl}}
                        <a href="{{credentialUrl}}" target="_blank">{{name}}</a>
                        {{else}}
                        {{name}}
                        {{/if}}
                    </h3>
                    <span class="item-dates">{{issueDate}}</span>
                </div>
                <div class="item-meta">{{issuingOrganization}}</div>
            </div>
            {{/each}}
        </div>
        {{/if}}
    </div>
</body>
</html>
    `;
  }
}
