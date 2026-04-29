import { Injectable } from '@nestjs/common';
import { ICvExportStrategy } from './export-strategy.interface';
import { ExportService } from '../export.service';

@Injectable()
export class ClassicPdfStrategy implements ICvExportStrategy {
  constructor(private readonly exportService: ExportService) {}

  async export(cvData: any): Promise<Buffer> {
    const formattedData = this.formatData(cvData);
    const template = this.getTemplate();
    const html = await this.exportService.renderTemplate(template, formattedData);
    return this.exportService.generatePdf(html);
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
      texts.forEach(text => {
        if (!text) return;
        const parts = text
          .split(/\n|(?<=\.\s*)(?=[A-Z])/)
          .map(s => s.trim())
          .filter(s => s.length > 0);
        bullets.push(...parts);
      });
      return bullets;
    };

    const categoryDisplayName: Record<string, string> = {
      programming_language: 'Programming Languages',
      backend: 'Backend & Databases/ORMs',
      devops_infrastructure: 'DevOps & Infrastructure',
      security: 'Security',
      software_tools: 'Software & Tools',
      frontend: 'Frontend (Basics)',
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

    let experiences = (data.experiences ?? []).map((exp: any) => ({
      ...exp,
      startDate: formatDate(exp.startDate),
      endDate: formatDate(exp.endDate),
      employmentType: exp.employmentType ? exp.employmentType.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : '',
      bullets: splitToBullets(exp.description),
      sortDate: exp.startDate ? new Date(exp.startDate).getTime() : 0,
    }));

    let projects = (data.projects ?? []).map((proj: any, i: number) => ({
      ...proj,
      index: i + 1,
      startDate: formatDate(proj.startDate),
      endDate: formatDate(proj.endDate),
      bullets: splitToBullets(proj.description),
      sortDate: proj.startDate ? new Date(proj.startDate).getTime() : 0,
    }));

    // SMART TRUNCATION LOGIC (Target 1.5 Pages)
    const MAX_ESTIMATED_LINES = 75;
    
    const calculateLines = () => {
      let count = 6; // Header + Profile Title
      if (data.summary) count += Math.ceil(data.summary.length / 110) + 1;
      
      const getSectionLines = (items: any[], hasBullets = true) => {
        if (!items.length) return 0;
        let sCount = 2; // Section title
        items.forEach(item => {
          sCount += 1.5; // Header line
          if (hasBullets) sCount += (item.bullets?.length || 0) * 1.1;
        });
        return sCount;
      };

      count += getSectionLines(experiences);
      count += getSectionLines(projects);
      if (data.educations?.length) count += 2 + (data.educations.length * 2.5);
      if (data.skills?.length) count += 8; // Technical skills block
      return count;
    };

    let currentLines = calculateLines();
    
    // Priority: Truncate older bullets first, but keep at least 2 per entry.
    if (currentLines > MAX_ESTIMATED_LINES) {
      const itemsToTrim = [
        ...experiences.map((_, i) => ({ type: 'exp', index: i, date: experiences[i].sortDate })),
        ...projects.map((_, i) => ({ type: 'proj', index: i, date: projects[i].sortDate }))
      ].sort((a, b) => a.date - b.date); // Oldest first

      let trimIdx = 0;
      while (currentLines > MAX_ESTIMATED_LINES && trimIdx < itemsToTrim.length) {
        const tr = itemsToTrim[trimIdx];
        const target = tr.type === 'exp' ? experiences[tr.index] : projects[tr.index];
        
        if (target.bullets && target.bullets.length > 2) {
          target.bullets.pop();
          currentLines = calculateLines();
        } else {
          trimIdx++;
        }
      }
    }

    return {
      ...data,
      location: data.location || (data.user?.city ? `${data.user.city}, ${data.user.country}` : ''),
      experiences,
      educations: (data.educations ?? []).map((edu: any) => {
        const degree = edu.degree ? edu.degree.charAt(0).toUpperCase() + edu.degree.slice(1) : '';
        const degreeDisplay = (edu.title && edu.title.toLowerCase().includes(degree.toLowerCase())) ? '' : degree;
        
        return {
          ...edu,
          fieldOfStudy: edu.title,
          startDate: formatDate(edu.startDate),
          endDate: formatDate(edu.endDate),
          degreeDisplay,
          gpa: edu.gpa ? Number(edu.gpa).toFixed(2) : null,
        };
      }),
      projects: projects.map((p, i) => ({ ...p, index: i + 1 })),
      certifications: (data.certifications ?? []).map((cert: any) => ({
        ...cert,
        issueDate: formatDate(cert.issueDate),
      })),
      languages: (data.languages ?? []).map((lang: any) => ({
        ...lang,
        proficiency: lang.proficiency ? lang.proficiency.charAt(0).toUpperCase() + lang.proficiency.slice(1).toLowerCase() : '',
      })),
      awards: (data.awards ?? []).map((award: any) => ({
        ...award,
        issueDate: formatDate(award.issueDate),
      })),
      groupedSkills: this.groupSkills(data.skills ?? [], categoryDisplayName),
    };
  }

  private groupSkills(
    skills: any[],
    categoryMap: Record<string, string>,
  ): { name: string; items: string }[] {
    const ORDER = [
      'Programming Languages',
      'Backend & Databases/ORMs',
      'DevOps & Infrastructure',
      'Security',
      'Software & Tools',
      'Frontend (Basics)',
    ];

    const groups: Record<string, string[]> = {};
    skills.forEach(skill => {
      const raw = skill.category ?? 'technical';
      const label = categoryMap[raw] ?? raw;
      if (!groups[label]) groups[label] = [];
      groups[label].push(skill.name);
    });

    const result: { name: string; items: string }[] = [];
    ORDER.forEach(cat => {
      if (groups[cat]?.length) {
        result.push({ name: cat, items: groups[cat].join(', ') + '.' });
      }
    });

    Object.keys(groups).forEach(cat => {
      if (!ORDER.includes(cat)) {
        result.push({ name: cat, items: groups[cat].join(', ') + '.' });
      }
    });

    return result;
  }

  private getTemplate(): string {
    return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <style>
      @page {
        size: A4;
        margin: 10mm 15mm;
      }
      * { box-sizing: border-box; }
      body {
        font-family: Arial, Helvetica, sans-serif;
        font-size: 7.5pt;
        color: #000;
        line-height: 1.35;
        margin: 0;
        padding: 0;
      }

      /* ── HEADER ─────────────────────────────── */
      header { text-align: center; margin-bottom: 8px; }
      h1 {
        font-size: 15pt;
        font-weight: bold;
        margin: 0;
        display: inline-block;
      }
      .hdr-headline {
        font-size: 13pt;
        font-weight: bold;
        display: inline-block;
        margin-left: 8px;
      }
      .hdr-row { font-size: 7.5pt; margin-top: 3px; }

      /* ── LINKS ──────────────────────────────── */
      a { color: #000; text-decoration: none; }
      .ul { text-decoration: underline; }

      /* ── SECTION ────────────────────────────── */
      section { margin-top: 12px; }
      h2 {
        font-size: 10pt;
        font-weight: bold;
        border-bottom: 1.2px solid #000;
        padding-bottom: 1px;
        margin: 0 0 6px 0;
      }

      /* ── SUMMARY ────────────────────────────── */
      .summary { text-align: justify; margin-bottom: 4px; }

      /* ── ITEM ROW ───────────── */
      .item { 
        margin-bottom: 8px; 
      }
      .item-header-group {
        position: relative;
        margin-bottom: 2px;
        min-height: 14px;
      }
      h3 {
        font-size: 9pt;
        font-weight: bold;
        margin: 0;
        padding-right: 160px; /* Increased padding to protect standard job titles */
      }
      .dates {
        position: absolute;
        right: 0;
        top: 0;
        white-space: nowrap;
        font-weight: bold;
        font-size: 7.5pt;
        text-align: right;
      }

      /* ── BULLETS ────────────────────────────── */
      ul {
        margin: 4px 0 0 0;
        padding-left: 24px;
        list-style-type: disc;
      }
      li {
        margin-bottom: 2px;
        text-align: justify;
      }

      /* ── SKILLS ─────────────────────────────── */
      .sk-container { margin-top: 2px; }
      .sk-item { margin-bottom: 3px; }

      /* ── LIST ROWS ──────────────────────────── */
      .list-row {
        position: relative;
        margin-bottom: 4px;
        min-height: 14px;
      }
    </style>
  </head>
  <body>

    <!-- HEADER -->
    <header>
      <h1>{{user.firstName}} {{user.lastName}}</h1>
      <span class="hdr-headline">({{headline}})</span>

      <div class="hdr-row">
        {{#if location}}{{location}}{{/if}}
        {{#if phone}} | <a href="tel:{{phone}}">{{phone}}</a>{{/if}}
        {{#if user.email}} | <a class="ul" href="mailto:{{user.email}}">{{user.email}}</a>{{/if}}
      </div>
      
      <div class="hdr-row">
        {{#if linkedin}}<a class="ul" href="{{linkedin}}" target="_blank">{{linkedin}}</a>{{/if}}
        {{#if github}} | <a class="ul" href="{{github}}" target="_blank">{{github}}</a>{{/if}}
        {{#if portfolio}} | <a class="ul" href="{{portfolio}}" target="_blank">{{portfolio}}</a>{{/if}}
      </div>
    </header>

    <!-- PROFILE SUMMARY -->
    <section>
      <h2>Profile Summary</h2>
      <div class="summary">{{summary}}</div>
    </section>

    <!-- SKILLS -->
    {{#if groupedSkills.length}}
    <section>
      <h2>Technical Skills</h2>
      <div class="sk-container">
        {{#each groupedSkills}}
        <div class="sk-item">
          <b>{{name}}:</b> {{items}}
        </div>
        {{/each}}
      </div>
    </section>
    {{/if}}

    <!-- EXPERIENCE -->
    {{#if experiences.length}}
    <section>
      <h2>Professional Experience</h2>

      {{#each experiences}}
      <div class="item">
        <div class="item-header-group">
          <h3>
            {{#if companyWebsite}}
              <a class="ul" href="{{companyWebsite}}" target="_blank">{{companyName}}</a>
            {{else}}
              {{companyName}}
            {{/if}}
            - {{jobTitle}} {{#if employmentType}}({{employmentType}}){{/if}}
          </h3>
          <span class="dates">{{startDate}} - {{#if isCurrentJob}}Present{{else}}{{endDate}}{{/if}}{{#if location}} | {{location}}{{/if}}</span>
        </div>

        {{#if bullets.length}}
        <ul>
          {{#each bullets}}<li>{{this}}</li>{{/each}}
        </ul>
        {{/if}}
      </div>
      {{/each}}
    </section>
    {{/if}}

    <!-- PROJECTS -->
    {{#if projects.length}}
    <section>
      <h2>Project Experience</h2>

      {{#each projects}}
      <div class="item">
        <div class="item-header-group">
          <h3>{{index}}. {{#if projectUrl}}<a class="ul" href="{{projectUrl}}" target="_blank">{{name}}</a>{{else}}{{name}}{{/if}}</h3>
          <span class="dates">{{startDate}} - {{#if endDate}}{{endDate}}{{else}}Present{{/if}}</span>
        </div>

        {{#if bullets.length}}
        <ul>
          {{#each bullets}}<li>{{this}}</li>{{/each}}
        </ul>
        {{/if}}
      </div>
      {{/each}}
    </section>
    {{/if}}

    <!-- EDUCATION -->
    {{#if educations.length}}
    <section>
      <h2>Education</h2>

      {{#each educations}}
      <div class="item">
        <div class="item-header-group">
          <h3>{{#if degreeDisplay}}{{degreeDisplay}} of {{/if}}{{fieldOfStudy}}</h3>
          <span class="dates">{{startDate}} - {{#if isCurrent}}Present{{else}}{{endDate}}{{/if}}</span>
        </div>
        <div style="font-weight: bold; margin-bottom: 2px; padding-right: 160px;">
          {{institution}}{{#if location}} | {{location}}{{/if}}{{#if gpa}} | GPA: {{gpa}}{{/if}}
        </div>
        {{#if description}}
        <div style="margin-top:2px;">{{description}}</div>
        {{/if}}
      </div>
      {{/each}}
    </section>
    {{/if}}

    <!-- LANGUAGES -->
    {{#if languages.length}}
    <section>
      <h2>Languages</h2>
      {{#each languages}}
      <div class="list-row">
        <span><b>{{name}}</b>: {{proficiency}}</span>
      </div>
      {{/each}}
    </section>
    {{/if}}

    <!-- LICENSES & CERTIFICATIONS -->
    {{#if certifications.length}}
    <section>
      <h2>Licenses &amp; Certifications</h2>
      {{#each certifications}}
      <div class="list-row">
        <span style="padding-right: 100px; display: block;">
          {{#if credentialUrl}}
            <a class="ul" href="{{credentialUrl}}" target="_blank">{{name}}</a>
          {{else}}
            {{name}}
          {{/if}}
          ({{issuingOrganization}})
        </span>
        <span class="dates">{{issueDate}}</span>
      </div>
      {{/each}}
    </section>
    {{/if}}

    {{#if awards.length}}
    <section>
      <h2>Awards &amp; Honors</h2>
      {{#each awards}}
      <div class="list-row">
        <span style="padding-right: 100px; display: block;">
          <b>{{title}}</b> ({{issuer}})
        </span>
        <span class="dates">{{issueDate}}</span>
        {{#if description}}
        <div style="margin-top:2px;">{{description}}</div>
        {{/if}}
      </div>
      {{/each}}
    </section>
    {{/if}}

  </body>
</html>
    `;
  }
}
