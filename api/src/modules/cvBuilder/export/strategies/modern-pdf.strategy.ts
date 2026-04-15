import { Injectable } from '@nestjs/common';
import { ICvExportStrategy } from './export-strategy.interface';
import { ExportService } from '../export.service';

@Injectable()
export class ModernPdfStrategy implements ICvExportStrategy {
  constructor(private readonly exportService: ExportService) {}

  async export(cvData: any): Promise<Buffer> {
    const template = this.getTemplate();
    const html = await this.exportService.renderTemplate(template, cvData);
    return this.exportService.generatePdf(html);
  }

  private getTemplate(): string {
    return `
      <html>
        <head>
          <style>
            @page { margin: 0; }
            body { 
              font-family: 'Helvetica', 'Arial', sans-serif; 
              color: #333; 
              margin: 0; 
              padding: 0;
              display: flex;
              min-height: 100vh;
            }
            .sidebar { 
              width: 30%; 
              background: #2c3e50; 
              color: white; 
              padding: 40px 20px;
            }
            .main { 
              width: 70%; 
              padding: 40px;
              background: #fff;
            }
            .name { 
              font-size: 24px; 
              font-weight: bold; 
              margin-bottom: 5px; 
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .sidebar-section { margin-bottom: 30px; }
            .sidebar-title { 
              font-size: 14px; 
              text-transform: uppercase; 
              border-bottom: 1px solid rgba(255,255,255,0.2); 
              margin-bottom: 15px;
              padding-bottom: 5px;
              letter-spacing: 1.5px;
              color: #ecf0f1;
            }
            .contact-item { font-size: 12px; margin-bottom: 10px; color: #bdc3c7; word-break: break-all; }
            
            .main-section { margin-bottom: 35px; }
            .main-title { 
              font-size: 18px; 
              color: #2c3e50; 
              border-bottom: 2px solid #3498db; 
              display: inline-block; 
              margin-bottom: 20px;
              padding-right: 20px;
            }
            .experience-item { margin-bottom: 25px; }
            .exp-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 5px; }
            .job-title { font-weight: bold; font-size: 15px; color: #2980b9; }
            .exp-date { font-size: 12px; color: #7f8c8d; }
            .company-name { font-style: italic; font-size: 14px; color: #34495e; margin-bottom: 8px; }
            .description { font-size: 13px; line-height: 1.6; color: #444; }
            
            .skill-pill {
              background: #34495e;
              color: white;
              padding: 4px 10px;
              border-radius: 15px;
              font-size: 11px;
              display: inline-block;
              margin: 3px;
            }
          </style>
        </head>
        <body>
          <div class="sidebar">
            <div class="name">{{user.firstName}}<br/>{{user.lastName}}</div>
            <p style="font-size: 13px; color: #3498db; margin-bottom: 40px;">{{user.headline}}</p>
            
            <div class="sidebar-section">
              <div class="sidebar-title">Contact</div>
              <div class="contact-item"><b>Email:</b><br/>{{user.email}}</div>
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
