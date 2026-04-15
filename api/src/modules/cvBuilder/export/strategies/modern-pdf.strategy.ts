import { Injectable } from '@nestjs/common';
import { ICvExportStrategy } from './export-strategy.interface';
import { ExportService } from '../export.service';

@Injectable()
export class ModernPdfStrategy implements ICvExportStrategy {
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
    };
  }

  private getTemplate(): string {
    return `
      <html>
        <head>
          <style>
/* ... (style remains same) ... */
            .sidebar { 
              width: 30%; 
              background: #2c3e50; 
              color: white; 
              padding: 40px 20px;
            }
/* ... */
          </style>
        </head>
        <body>
          <div class="sidebar">
            <div class="name">{{user.firstName}}<br/>{{user.lastName}}</div>
            <p style="font-size: 13px; color: #3498db; margin-bottom: 40px;">{{user.headline}}</p>
            
            <div class="sidebar-section">
              <div class="sidebar-title">Contact</div>
              <div class="contact-item"><b>Email:</b><br/>{{user.email}}</div>
              {{#if phone}}
                <div class="contact-item"><b>Phone:</b><br/>{{phone}}</div>
              {{/if}}
              {{#if linkedin}}
                <div class="contact-item"><b>LinkedIn:</b><br/><a href="{{linkedin}}" style="color: #bdc3c7;">Link</a></div>
              {{/if}}
              {{#if github}}
                <div class="contact-item"><b>GitHub:</b><br/><a href="{{github}}" style="color: #bdc3c7;">Link</a></div>
              {{/if}}
              {{#if portfolio}}
                <div class="contact-item"><b>Portfolio:</b><br/><a href="{{portfolio}}" style="color: #bdc3c7;">Link</a></div>
              {{/if}}
            </div>

            <div class="sidebar-section">
              <div class="sidebar-title">Skills</div>
              {{#each skills}}
                <div class="skill-pill">{{name}}</div>
              {{/each}}
            </div>

            {{#if languages.length}}
            <div class="sidebar-section">
              <div class="sidebar-title">Languages</div>
              {{#each languages}}
                <div class="contact-item">{{name}} ({{proficiency}})</div>
              {{/each}}
            </div>
            {{/if}}
          </div>
          
          <div class="main">
            <div class="main-section">
              <div class="main-title">Profile</div>
              <p class="description">{{summary}}</p>
            </div>

            {{#if experiences.length}}
            <div class="main-section">
              <div class="main-title">Experience</div>
              {{#each experiences}}
              <div class="experience-item">
                <div class="exp-header">
                  <div class="job-title">{{jobTitle}}</div>
                  <div class="exp-date">{{startDate}} - {{#if isCurrentJob}}Present{{else}}{{endDate}}{{/if}}</div>
                </div>
                <div class="company-name">{{companyName}}</div>
                <div class="description">{{description}}</div>
              </div>
              {{/each}}
            </div>
            {{/if}}

            {{#if educations.length}}
            <div class="main-section">
              <div class="main-title">Education</div>
              {{#each educations}}
              <div class="experience-item">
                <div class="exp-header">
                  <div class="job-title">{{title}}</div>
                  <div class="exp-date">{{startDate}} - {{#if isCurrent}}Present{{else}}{{endDate}}{{/if}}</div>
                </div>
                <div class="company-name">{{institution}} | {{degree}}</div>
                <p class="description">{{description}}</p>
              </div>
              {{/each}}
            </div>
            {{/if}}

            {{#if certifications.length}}
            <div class="main-section">
              <div class="main-title">Certifications</div>
              {{#each certifications}}
              <div class="experience-item">
                <div class="exp-header">
                  <div class="job-title">{{name}}</div>
                  <div class="exp-date">{{issueDate}}</div>
                </div>
                <div class="company-name">{{issuingOrganization}}</div>
              </div>
              {{/each}}
            </div>
            {{/if}}

            {{#if projects.length}}
            <div class="main-section">
              <div class="main-title">Projects</div>
              {{#each projects}}
              <div class="experience-item">
                <div class="exp-header">
                  <div class="job-title">{{name}}</div>
                  <div class="exp-date">{{startDate}} - {{endDate}}</div>
                </div>
                <p class="description">{{description}}</p>
                <div class="description" style="font-size: 11px; margin-top: 5px;"><b>Stack:</b> {{technologiesUsed}}</div>
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
