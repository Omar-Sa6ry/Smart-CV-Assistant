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

    /**
     * Splits one or more text fields into bullet-ready sentence array.
     * Splits on newlines or ". " followed by a capital letter.
     */
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

    // Canonical display names for skill categories (matches reference image)
    const categoryDisplayName: Record<string, string> = {
      programming_language: 'Programming Languages',
      backend_database: 'Backend & Databases/ORMs',
      devops_infrastructure: 'DevOps & Infrastructure',
      security: 'Security',
      software_tools: 'Software & Tools',
      frontend: 'Frontend (Basics)',
      soft_skills: 'Soft Skills',
      methodology: 'Methodology',
      technical: 'Other',
    };

    return {
      ...data,
      // Prefer explicit CV location, fall back to user city/country
      location: data.location || (data.user?.city ? `${data.user.city}, ${data.user.country}` : ''),
      experiences: (data.experiences ?? []).map((exp: any) => ({
        ...exp,
        startDate: formatDate(exp.startDate),
        endDate: formatDate(exp.endDate),
        // Merge description + achievements into bullets
        bullets: splitToBullets(exp.description, exp.achievements),
      })),
      educations: (data.educations ?? []).map((edu: any) => ({
        ...edu,
        // Prisma model uses `title` for field of study
        fieldOfStudy: edu.title,
        startDate: formatDate(edu.startDate),
        endDate: formatDate(edu.endDate),
      })),
      projects: (data.projects ?? []).map((proj: any, i: number) => ({
        ...proj,
        index: i + 1,
        startDate: formatDate(proj.startDate),
        endDate: formatDate(proj.endDate),
        bullets: splitToBullets(proj.description),
      })),
      certifications: (data.certifications ?? []).map((cert: any) => ({
        ...cert,
        issueDate: formatDate(cert.issueDate),
      })),
      groupedSkills: this.groupSkills(data.skills ?? [], categoryDisplayName),
    };
  }

  private groupSkills(
    skills: any[],
    categoryMap: Record<string, string>,
  ): { name: string; items: string }[] {
    // Fixed order matching the reference image
    const ORDER = [
      'Programming Languages',
      'Backend & Databases/ORMs',
      'DevOps & Infrastructure',
      'Security',
      'Software & Tools',
      'Frontend (Basics)',
      'Soft Skills',
      'Methodology',
      'Other',
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
      if (groups[cat]?.length) result.push({ name: cat, items: groups[cat].join(', ') });
    });
    // Append any category not in the fixed order
    Object.keys(groups).forEach(cat => {
      if (!ORDER.includes(cat)) result.push({ name: cat, items: groups[cat].join(', ') });
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
        margin: 12mm 15mm;
      }
      * { box-sizing: border-box; }
      body {
        font-family: Arial, Helvetica, sans-serif;
        font-size: 10.5px;
        color: #000;
        line-height: 1.45;
        margin: 0;
        padding: 0;
      }

      /* ── HEADER ─────────────────────────────── */
      .hdr { text-align: center; margin-bottom: 8px; }
      .hdr-name {
        font-size: 20px;
        font-weight: bold;
        display: block;
        margin-bottom: 2px;
      }
      .hdr-row { font-size: 10.5px; margin-top: 3px; }

      /* ── LINKS ──────────────────────────────── */
      a { color: #000; text-decoration: none; }
      .ul { text-decoration: underline; color: #000; }

      /* ── SECTION ────────────────────────────── */
      .sec { margin-top: 10px; }
      .sec-title {
        font-size: 13px;
        font-weight: bold;
        border-bottom: 1px solid #000;
        padding-bottom: 1px;
        margin-bottom: 6px;
      }

      /* ── SUMMARY ────────────────────────────── */
      .summary { text-align: justify; }

      /* ── EXPERIENCE / PROJECT ROW ───────────── */
      .item { margin-bottom: 8px; }
      .item-hdr {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
      }
      .item-left { font-weight: bold; flex: 1; }
      .item-right {
        white-space: nowrap;
        margin-left: 8px;
        font-weight: bold;
      }

      /* ── BULLETS ────────────────────────────── */
      .bul {
        margin: 2px 0 0 0;
        padding-left: 28px;
        list-style-type: disc;
      }
      .bul li {
        margin-bottom: 2px;
        text-align: justify;
      }

      /* ── SKILLS ─────────────────────────────── */
      .sk-ul {
        margin: 0;
        padding-left: 20px;
        list-style-type: disc;
      }
      .sk-ul li { margin-bottom: 3px; }

      /* ── EDUCATION ──────────────────────────── */
      .edu-sub { font-size: 10.5px; margin-top: 1px; }

      /* ── CERTIFICATIONS ─────────────────────── */
      .cert-ul {
        margin: 0;
        padding-left: 20px;
        list-style-type: disc;
      }
      .cert-row {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 2px;
      }
      .cert-name { flex: 1; }
      .cert-date {
        white-space: nowrap;
        margin-left: 10px;
        min-width: 60px;
        text-align: right;
      }
    </style>
  </head>
  <body>

    <!-- ══ HEADER ════════════════════════════════════════ -->
    <div class="hdr">
      <span class="hdr-name">{{user.firstName}} {{user.lastName}} &nbsp;&nbsp;({{user.headline}})</span>

      <div class="hdr-row">
        {{#if location}}{{location}}{{/if}}
        {{#if phone}} | <a href="tel:{{phone}}">{{phone}}</a>{{/if}}
        {{#if user.email}} | <a class="ul" href="mailto:{{user.email}}">{{user.email}}</a>{{/if}}
      </div>

      <div class="hdr-row">
        {{#if linkedin}}<a class="ul" href="{{linkedin}}" target="_blank">{{linkedin}}</a>{{/if}}
        {{#if github}} &nbsp;|&nbsp; <a class="ul" href="{{github}}" target="_blank">{{github}}</a>{{/if}}
        {{#if portfolio}} &nbsp;|&nbsp; <a class="ul" href="{{portfolio}}" target="_blank">{{portfolio}}</a>{{/if}}
      </div>
    </div>

    <!-- ══ PROFILE SUMMARY ═══════════════════════════════ -->
    <div class="sec">
      <div class="sec-title">Profile Summary</div>
      <div class="summary">{{summary}}</div>
    </div>

    <!-- ══ PROFESSIONAL EXPERIENCE ══════════════════════ -->
    {{#if experiences.length}}
    <div class="sec">
      <div class="sec-title">Professional Experience</div>

      {{#each experiences}}
      <div class="item">
        <div class="item-hdr">
          <span class="item-left">
            &bull;&nbsp;
            {{#if companyWebsite}}
              <a class="ul" href="{{companyWebsite}}" target="_blank">{{companyName}}</a>
            {{else}}
              {{companyName}}
            {{/if}}
            &nbsp;&ndash;&nbsp;<i>{{jobTitle}}</i>
            {{#if location}}&nbsp;|&nbsp;{{location}}{{/if}}
          </span>
          <span class="item-right">{{startDate}} &ndash; {{#if isCurrentJob}}Present{{else}}{{endDate}}{{/if}}</span>
        </div>

        {{#if bullets.length}}
        <ul class="bul">
          {{#each bullets}}<li>{{this}}</li>{{/each}}
        </ul>
        {{/if}}
      </div>
      {{/each}}
    </div>
    {{/if}}

    <!-- ══ TECHNICAL SKILLS ══════════════════════════════ -->
    {{#if groupedSkills.length}}
    <div class="sec">
      <div class="sec-title">Technical Skills</div>
      <ul class="sk-ul">
        {{#each groupedSkills}}
        <li><b>{{name}}:</b> {{items}}.</li>
        {{/each}}
      </ul>
    </div>
    {{/if}}

    <!-- ══ PROJECT EXPERIENCE ════════════════════════════ -->
    {{#if projects.length}}
    <div class="sec">
      <div class="sec-title">Project Experience</div>

      {{#each projects}}
      <div class="item">
        <div class="item-hdr">
          <span class="item-left">
            {{index}}.&nbsp;
            {{#if projectUrl}}
              <a class="ul" href="{{projectUrl}}" target="_blank"><u>{{name}}</u></a>
            {{else}}
              <u>{{name}}</u>
            {{/if}}
            {{#if location}}&nbsp;|&nbsp;{{location}}{{/if}}
          </span>
          <span class="item-right">
            {{startDate}}
            {{#if endDate}} &ndash; {{endDate}}{{else}} &ndash; Present{{/if}}
          </span>
        </div>

        {{#if bullets.length}}
        <ul class="bul">
          {{#each bullets}}<li>{{this}}</li>{{/each}}
        </ul>
        {{/if}}

        {{#if technologiesUsed}}
        <ul class="bul">
          <li><b>Technologies:</b> {{technologiesUsed}}</li>
        </ul>
        {{/if}}
      </div>
      {{/each}}
    </div>
    {{/if}}

    <!-- ══ EDUCATION ══════════════════════════════════════ -->
    {{#if educations.length}}
    <div class="sec">
      <div class="sec-title">Education</div>

      {{#each educations}}
      <div class="item">
        <div class="item-hdr">
          <span class="item-left">{{fieldOfStudy}}</span>
          <span class="item-right">{{startDate}} &ndash; {{#if isCurrent}}Present{{else}}{{endDate}}{{/if}}</span>
        </div>
        <div class="edu-sub">
          {{institution}}{{#if location}} | {{location}}{{/if}}
        </div>
        {{#if description}}
        <div class="edu-sub">{{description}}</div>
        {{/if}}
      </div>
      {{/each}}
    </div>
    {{/if}}

    <!-- ══ LICENSES & CERTIFICATIONS ════════════════════ -->
    {{#if certifications.length}}
    <div class="sec">
      <div class="sec-title">Licenses &amp; Certifications</div>
      <ul class="cert-ul">
        {{#each certifications}}
        <li>
          <div class="cert-row">
            <span class="cert-name">
              {{#if credentialUrl}}
                <a class="ul" href="{{credentialUrl}}" target="_blank">{{name}}</a>
              {{else}}
                {{name}}
              {{/if}}
              ({{issuingOrganization}})
            </span>
            <span class="cert-date">{{issueDate}}</span>
          </div>
        </li>
        {{/each}}
      </ul>
    </div>
    {{/if}}

  </body>
</html>
    `;
  }
}
