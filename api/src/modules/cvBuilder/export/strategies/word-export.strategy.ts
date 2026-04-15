import { Injectable } from '@nestjs/common';
import { ICvExportStrategy } from './export-strategy.interface';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';

@Injectable()
export class WordExportStrategy implements ICvExportStrategy {
  async export(cvData: any): Promise<Buffer> {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: `${cvData.user?.firstName} ${cvData.user?.lastName}`,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: `${cvData.user?.email || ''} | ${cvData.user?.headline || ''}`,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          new Paragraph({
            text: "PROFESSIONAL SUMMARY",
            heading: HeadingLevel.HEADING_2,
            thematicBreak: true,
          }),
          new Paragraph({
            text: cvData.summary,
            spacing: { after: 300 },
          }),

          ...this.createExperienceSection(cvData.experiences),
          ...this.createEducationSection(cvData.educations),
          ...this.createCertificationSection(cvData.certifications),
          ...this.createProjectSection(cvData.projects),
          ...this.createSkillsSection(cvData.skills),
        ],
      }],
    });

    return await Packer.toBuffer(doc);
  }

  private createExperienceSection(experiences: any[]): any[] {
    if (!experiences?.length) return [];
    const children: any[] = [
      new Paragraph({
        text: "EXPERIENCE",
        heading: HeadingLevel.HEADING_2,
        thematicBreak: true,
      }),
    ];

    experiences.forEach(exp => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: exp.jobTitle, bold: true }),
            new TextRun({ text: `\t${exp.startDate} - ${exp.isCurrentJob ? 'Present' : exp.endDate}`, bold: true }),
          ],
        }),
        new Paragraph({
          children: [new TextRun({ text: exp.companyName, italics: true })],
        }),
        new Paragraph({
          text: exp.description,
          spacing: { after: 200 },
        }),
      );
    });

    return children;
  }

  private createEducationSection(educations: any[]): any[] {
    if (!educations?.length) return [];
    const children: any[] = [
      new Paragraph({
        text: "EDUCATION",
        heading: HeadingLevel.HEADING_2,
        thematicBreak: true,
      }),
    ];

    educations.forEach(edu => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: edu.title, bold: true }),
            new TextRun({ text: `\t${edu.startDate} - ${edu.endDate}`, bold: true }),
          ],
        }),
        new Paragraph({
          text: `${edu.institution} | ${edu.degree}`,
          spacing: { after: 200 },
        }),
      );
    });

    return children;
  }

  private createCertificationSection(certifications: any[]): any[] {
    if (!certifications?.length) return [];
    const children: any[] = [
      new Paragraph({
        text: "CERTIFICATIONS",
        heading: HeadingLevel.HEADING_2,
        thematicBreak: true,
      }),
    ];

    certifications.forEach(cert => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: cert.name, bold: true }),
            new TextRun({ text: `\t${cert.issueDate}`, bold: true }),
          ],
        }),
        new Paragraph({
          text: cert.issuingOrganization,
          spacing: { after: 200 },
        }),
      );
    });

    return children;
  }

  private createProjectSection(projects: any[]): any[] {
    if (!projects?.length) return [];
    const children: any[] = [
      new Paragraph({
        text: "PROJECTS",
        heading: HeadingLevel.HEADING_2,
        thematicBreak: true,
      }),
    ];

    projects.forEach(project => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: project.name, bold: true }),
            new TextRun({ text: `\t${project.startDate} - ${project.endDate}`, bold: true }),
          ],
        }),
        new Paragraph({
          text: project.description,
        }),
        new Paragraph({
          text: `Stack: ${project.technologiesUsed}`,
          spacing: { after: 200 },
        }),
      );
    });

    return children;
  }

  private createSkillsSection(skills: any[]): any[] {
    if (!skills?.length) return [];
    return [
      new Paragraph({
        text: "SKILLS",
        heading: HeadingLevel.HEADING_2,
        thematicBreak: true,
      }),
      new Paragraph({
        text: skills.map(s => `${s.name} (${s.proficiency})`).join(", "),
      }),
    ];
  }
}
