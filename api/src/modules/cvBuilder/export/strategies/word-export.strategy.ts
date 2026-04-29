import { Injectable } from '@nestjs/common';
import { ICvExportStrategy } from './export-strategy.interface';
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  AlignmentType, 
  TabStopType, 
  TabStopPosition,
  ExternalHyperlink,
  BorderStyle
} from 'docx';

@Injectable()
export class WordExportStrategy implements ICvExportStrategy {
  async export(cvData: any): Promise<Buffer> {
    const data = this.formatData(cvData);
    
    const doc = new Document({
      title: `${data.user?.firstName} ${data.user?.lastName} - CV`,
      numbering: {
        config: [
          {
            reference: "bullet-points",
            levels: [
              {
                level: 0,
                format: "bullet",
                text: "\u2022",
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
            id: "Normal",
            name: "Normal",
            run: {
              font: "Arial",
              size: 15, // 7.5pt
              color: "000000",
            },
            paragraph: {
              spacing: { line: 324, before: 0, after: 0 }, // 1.35 line height
            },
          },
        ],
      },
      sections: [{
        properties: {
          page: {
            margin: {
              top: 567,     // 10mm
              bottom: 567,  // 10mm
              left: 850,    // 15mm
              right: 850,   // 15mm
            },
          },
        },
        children: [
          // HEADER
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `${data.user?.firstName} ${data.user?.lastName}`,
                bold: true,
                size: 30, // 15pt
              }),
              new TextRun({
                text: ` (${data.headline})`,
                bold: true,
                size: 26, // 13pt
              }),
            ],
          }),
          
          // Contact Row 1
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun(`${data.location || ''}`),
              ...(data.phone ? [
                new TextRun(" | "),
                new ExternalHyperlink({
                  children: [new TextRun({ text: data.phone, underline: {}, color: "000000" })],
                  link: `tel:${data.phone}`
                })
              ] : []),
              ...(data.user?.email ? [
                new TextRun(" | "),
                new ExternalHyperlink({
                  children: [new TextRun({ text: data.user.email, underline: {}, color: "000000" })],
                  link: `mailto:${data.user.email}`
                })
              ] : []),
            ],
          }),

          // Contact Row 2
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [
              ...(data.linkedin ? [
                new ExternalHyperlink({
                  children: [new TextRun({ text: data.linkedin, underline: {}, color: "000000" })],
                  link: data.linkedin
                })
              ] : []),
              ...(data.github ? [
                new TextRun(" | "),
                new ExternalHyperlink({
                  children: [new TextRun({ text: data.github, underline: {}, color: "000000" })],
                  link: data.github
                })
              ] : []),
              ...(data.portfolio ? [
                new TextRun(" | "),
                new ExternalHyperlink({
                  children: [new TextRun({ text: data.portfolio, underline: {}, color: "000000" })],
                  link: data.portfolio
                })
              ] : []),
            ],
          }),

          // SUMMARY
          ...this.createSectionTitle("Profile Summary"),
          new Paragraph({
            text: data.summary,
            alignment: AlignmentType.BOTH,
            spacing: { after: 200 },
          }),

          // SKILLS
          ...(data.groupedSkills?.length ? this.createSkillsSection(data.groupedSkills) : []),

          // EXPERIENCE
          ...(data.experiences?.length ? this.createExperienceSection(data.experiences) : []),

          // PROJECTS
          ...(data.projects?.length ? this.createProjectSection(data.projects) : []),

          // EDUCATION
          ...(data.educations?.length ? this.createEducationSection(data.educations) : []),

          // LANGUAGES
          ...(data.languages?.length ? this.createLanguageSection(data.languages) : []),

          // CERTIFICATIONS
          ...(data.certifications?.length ? this.createCertificationSection(data.certifications) : []),

          // AWARDS
          ...(data.awards?.length ? this.createAwardSection(data.awards) : []),
        ],
      }],
    });

    return await Packer.toBuffer(doc);
  }

  private createSectionTitle(title: string): Paragraph[] {
    return [
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 120, after: 100 },
        children: [
          new TextRun({
            text: title,
            bold: true,
            size: 20, // 10pt
          }),
        ],
        border: {
          bottom: { color: "000000", space: 1, style: BorderStyle.SINGLE, size: 6 },
        },
      }),
    ];
  }

  private createExperienceSection(experiences: any[]): Paragraph[] {
    const children: Paragraph[] = [...this.createSectionTitle("Professional Experience")];
    
    experiences.forEach(exp => {
      children.push(
        new Paragraph({
          tabStops: [{ type: TabStopType.RIGHT, position: 10205 }],
          children: [
            ...(exp.companyWebsite ? [
              new ExternalHyperlink({
                children: [new TextRun({ text: exp.companyName, bold: true, color: "000000" })],
                link: exp.companyWebsite
              })
            ] : [new TextRun({ text: exp.companyName, bold: true, color: "000000" })]),
            new TextRun({ text: ` - ${exp.jobTitle}${exp.employmentType ? ` (${exp.employmentType})` : ''}`, bold: true, color: "000000" }),
            new TextRun({ text: "\t", bold: true }),
            new TextRun({ 
              text: `${exp.startDate} - ${exp.isCurrentJob ? 'Present' : exp.endDate}${exp.location ? ` | ${exp.location}` : ''}`, 
              bold: true,
              color: "000000"
            }),
          ],
        }),
        ...(exp.bullets ? exp.bullets.map((b: string) => new Paragraph({
          text: b,
          numbering: { reference: "bullet-points", level: 0 },
          alignment: AlignmentType.BOTH,
          spacing: { after: 40 }
        })) : [])
      );
    });
    return children;
  }

  private createSkillsSection(skills: any[]): Paragraph[] {
    const children: Paragraph[] = [...this.createSectionTitle("Technical Skills")];
    skills.forEach(s => {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: `${s.name}: `, bold: true }),
          new TextRun(s.items),
        ],
        spacing: { after: 40 }
      }));
    });
    return children;
  }

  private createProjectSection(projects: any[]): Paragraph[] {
    const children: Paragraph[] = [...this.createSectionTitle("Project Experience")];
    projects.forEach(proj => {
      children.push(
        new Paragraph({
          tabStops: [{ type: TabStopType.RIGHT, position: 10205 }],
          children: [
            new TextRun({ text: `${proj.index}. `, bold: true, color: "000000" }),
            ...(proj.projectUrl ? [
              new ExternalHyperlink({
                children: [new TextRun({ text: proj.name, bold: true, color: "000000" })],
                link: proj.projectUrl
              })
            ] : [new TextRun({ text: proj.name, bold: true, color: "000000" })]),
            new TextRun({ text: "\t", bold: true }),
            new TextRun({ text: `${proj.startDate} - ${proj.endDate || 'Present'}`, bold: true, color: "000000" }),
          ],
        }),
        ...(proj.bullets ? proj.bullets.map((b: string) => new Paragraph({
          text: b,
          numbering: { reference: "bullet-points", level: 0 },
          alignment: AlignmentType.BOTH,
          spacing: { after: 40 }
        })) : [])
      );
    });
    return children;
  }

  private createEducationSection(educations: any[]): Paragraph[] {
    const children: Paragraph[] = [...this.createSectionTitle("Education")];
    educations.forEach(edu => {
      children.push(
        new Paragraph({
          tabStops: [{ type: TabStopType.RIGHT, position: 10205 }],
          spacing: { after: 40 },
          children: [
            new TextRun({ text: `${edu.degreeDisplay ? `${edu.degreeDisplay} of ` : ''}${edu.fieldOfStudy}`, bold: true, color: "000000" }),
            new TextRun({ text: "\t", bold: true }),
            new TextRun({ text: `${edu.startDate} - ${edu.isCurrent ? 'Present' : edu.endDate}`, bold: true, color: "000000" }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `${edu.institution}${edu.location ? ` | ${edu.location}` : ''}${edu.gpa ? ` | GPA: ${edu.gpa}` : ''}`, bold: true, color: "000000" }),
          ],
          spacing: { after: 40 }
        }),
        ...(edu.description ? [new Paragraph({ text: edu.description, spacing: { after: 80 } })] : [])
      );
    });
    return children;
  }

  private createLanguageSection(languages: any[]): Paragraph[] {
    const children: Paragraph[] = [...this.createSectionTitle("Languages")];
    languages.forEach(lang => {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: lang.name, bold: true }),
          new TextRun(`: ${lang.proficiency}`),
        ],
        spacing: { after: 40 }
      }));
    });
    return children;
  }

  private createCertificationSection(certifications: any[]): Paragraph[] {
    const children: Paragraph[] = [...this.createSectionTitle("Licenses & Certifications")];
    certifications.forEach(cert => {
      children.push(new Paragraph({
        tabStops: [{ type: TabStopType.RIGHT, position: 10205 }],
        children: [
          ...(cert.credentialUrl ? [
            new ExternalHyperlink({
              children: [new TextRun({ text: cert.name, bold: true, color: "000000" })],
              link: cert.credentialUrl
            })
          ] : [new TextRun({ text: cert.name, bold: true, color: "000000" })]),
          new TextRun({ text: ` (${cert.issuingOrganization})`, bold: true, color: "000000" }),
          new TextRun({ text: "\t", bold: true }),
          new TextRun({ text: cert.issueDate, bold: true, color: "000000" }),
        ],
        spacing: { after: 40 }
      }));
    });
    return children;
  }

  private createAwardSection(awards: any[]): Paragraph[] {
    const children: Paragraph[] = [...this.createSectionTitle("Awards & Honors")];
    awards.forEach(award => {
      children.push(
        new Paragraph({
          tabStops: [{ type: TabStopType.RIGHT, position: 10205 }],
          children: [
            new TextRun({ text: award.title, bold: true, color: "000000" }),
            new TextRun({ text: ` (${award.issuer})`, bold: true, color: "000000" }),
            new TextRun({ text: "\t", bold: true }),
            new TextRun({ text: award.issueDate, bold: true, color: "000000" }),
          ],
          spacing: { after: 40 }
        }),
        ...(award.description ? [new Paragraph({ text: award.description, spacing: { after: 80 } })] : [])
      );
    });
    return children;
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
    // 7.5pt with 1.35 line height yields ~50 lines per A4 page.
    // 1.5 pages = ~75 lines.
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
      projects: projects.map((p, i) => ({ ...p, index: i + 1 })), // Re-index in case of sort
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
}
