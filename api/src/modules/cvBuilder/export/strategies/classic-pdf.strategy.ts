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

    return {
      ...data,
      experiences: data.experiences?.map((exp: any) => ({
        ...exp,
        startDate: formatDate(exp.startDate),
        endDate: formatDate(exp.endDate),
      })),
      educations: data.educations?.map((edu: any) => ({
        ...edu,
        startDate: formatDate(edu.startDate),
        endDate: formatDate(edu.endDate),
      })),
      projects: data.projects?.map((proj: any) => ({
        ...proj,
        startDate: formatDate(proj.startDate),
        endDate: formatDate(proj.endDate),
      })),
      certifications: data.certifications?.map((cert: any) => ({
        ...cert,
        issueDate: formatDate(cert.issueDate),
      })),
      groupedSkills: this.groupSkills(data.skills),
    };
  }

  private groupSkills(skills: any[]): any[] {
    if (!skills) return [];
    const groups: { [key: string]: string[] } = {};
    
    skills.forEach(skill => {
      const category = skill.keyword?.category || 'General';
      const catName = category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ');
      
      if (!groups[catName]) groups[catName] = [];
      groups[catName].push(skill.name);
    });

    return Object.entries(groups).map(([name, items]) => ({
      name,
      items: items.join(', ')
    }));
  }

  private getTemplate(): string {
    return `
      <html>
        <head>
          <style>
            @page { 
              margin: 15mm; 
              size: A4;
            }
            body { 
              font-family: 'Arial', sans-serif; 
              color: #000; 
              line-height: 1.3; 
              margin: 0;
              padding: 0;
              font-size: 11px;
            }
            .header { 
              text-align: center; 
              margin-bottom: 15px;
            }
            .header h1 { 
              margin: 0; 
              font-size: 20px;
              font-weight: bold;
            }
            .header .headline {
              font-size: 14px;
              margin-top: 5px;
            }
            .contact-info { 
              font-size: 11px; 
              margin-top: 8px;
            }
            .links {
              font-size: 10px;
              margin-top: 5px;
              text-decoration: underline;
            }
            .section { 
              margin-top: 12px; 
            }
            .section-title { 
              font-weight: bold; 
              text-transform: capitalize; 
              border-bottom: 1px solid #000; 
              margin-bottom: 6px;
              font-size: 13px;
              width: 100%;
            }
            .summary {
              text-align: justify;
              margin-bottom: 10px;
            }
            .item { 
              margin-bottom: 10px; 
            }
            .item-header { 
              display: flex; 
              justify-content: space-between; 
              font-weight: bold; 
              font-size: 11px;
            }
            .item-sub {
              font-style: italic;
              margin-bottom: 4px;
            }
            .description { 
              margin-top: 3px; 
              padding-left: 15px;
            }
            .description ul {
              margin: 0;
              padding-left: 5px;
            }
            .description li {
              margin-bottom: 2px;
            }
            .skills-category {
              margin-bottom: 4px;
            }
            .skills-category b {
              font-weight: bold;
            }
            a {
              color: #000;
              text-decoration: underline;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>{{user.firstName}} {{user.lastName}}  ({{user.headline}})</h1>
            <div class="contact-info">
              {{#if user.city}}{{user.city}}, {{user.country}}{{/if}}
              {{#if user.phoneNumber}} | <a href="tel:{{user.phoneNumber}}">{{user.phoneNumber}}</a>{{/if}}
              {{#if user.email}} | <a href="mailto:{{user.email}}">{{user.email}}</a>{{/if}}
            </div>
            <div class="links">
               {{#if user.linkedin}}
                 <a href="{{user.linkedin}}" target="_blank">LinkedIn</a>
               {{/if}}
               {{#if user.github}}
                 {{#if user.linkedin}} | {{/if}}
                 <a href="{{user.github}}" target="_blank">GitHub</a>
               {{/if}}
               {{#if user.portfolio}}
                 {{#if user.linkedin}} | {{else}}{{#if user.github}} | {{/if}}{{/if}}
                 <a href="{{user.portfolio}}" target="_blank">Portfolio</a>
               {{/if}}
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Profile Summary</div>
            <div class="summary">{{summary}}</div>
          </div>

          {{#if experiences.length}}
          <div class="section">
            <div class="section-title">Professional Experience</div>
            {{#each experiences}}
            <div class="item">
              <div class="item-header">
                <span>
                  {{#if companyWebsite}}
                    <a href="{{companyWebsite}}" target="_blank">{{companyName}}</a>
                  {{else}}
                    {{companyName}}
                  {{/if}}
                  – {{jobTitle}}
                </span>
                <span>{{startDate}} – {{#if isCurrentJob}}Present{{else}}{{endDate}}{{/if}}</span>
              </div>
              <div class="description">
                <ul>
                  <li>{{description}}</li>
                </ul>
              </div>
            </div>
            {{/each}}
          </div>
          {{/if}}

          {{#if groupedSkills.length}}
          <div class="section">
            <div class="section-title">Technical Skills</div>
            <div class="description">
              <ul>
              {{#each groupedSkills}}
                <li class="skills-category"><b>{{name}}:</b> {{items}}.</li>
              {{/each}}
              </ul>
            </div>
          </div>
          {{/if}}

          {{#if projects.length}}
          <div class="section">
            <div class="section-title">Project Experience</div>
            {{#each projects}}
            <div class="item">
              <div class="item-header">
                <span>
                  {{#if projectUrl}}
                    <a href="{{projectUrl}}" target="_blank">{{name}}</a>
                  {{else}}
                    {{name}}
                  {{/if}}
                </span>
                <span>{{startDate}} – {{endDate}}</span>
              </div>
              <div class="description">
                <ul>
                  <li>{{description}}</li>
                  <li><b>Technologies:</b> {{technologiesUsed}}</li>
                </ul>
              </div>
            </div>
            {{/each}}
          </div>
          {{/if}}

          {{#if educations.length}}
          <div class="section">
            <div class="section-title">Education</div>
            {{#each educations}}
            <div class="item">
              <div class="item-header">
                <span>{{institution}}</span>
                <span>{{startDate}} – {{#if isCurrent}}Present{{else}}{{endDate}}{{/if}}</span>
              </div>
              <div class="item-sub">{{degree}} | {{title}}</div>
              <div class="description">{{description}}</div>
            </div>
            {{/each}}
          </div>
          {{/if}}

          {{#if certifications.length}}
          <div class="section">
            <div class="section-title">Licenses & Certifications</div>
            <div class="description">
              <ul>
              {{#each certifications}}
                <li style="display: flex; justify-content: space-between;">
                  <span>
                    {{#if credentialUrl}}
                      <b><a href="{{credentialUrl}}" target="_blank">{{name}}</a></b>
                    {{else}}
                      <b>{{name}}</b>
                    {{/if}}
                    - {{issuingOrganization}} 
                  </span>
                  <span>{{issueDate}}</span>
                </li>
              {{/each}}
              </ul>
            </div>
          </div>
          {{/if}}
        </body>
      </html>
    `;
  }
}
