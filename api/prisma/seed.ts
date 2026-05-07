import * as dotenv from 'dotenv';
import * as path from 'path';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, SkillCategory } from '@prisma/client';

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const skillKeywords = [
  // Programming Languages
  { name: 'JavaScript', category: SkillCategory.programming_language, popularityScore: 100 },
  { name: 'TypeScript', category: SkillCategory.programming_language, popularityScore: 95 },
  { name: 'Python', category: SkillCategory.programming_language, popularityScore: 98 },
  { name: 'Java', category: SkillCategory.programming_language, popularityScore: 90 },
  { name: 'C#', category: SkillCategory.programming_language, popularityScore: 85 },
  { name: 'C++', category: SkillCategory.programming_language, popularityScore: 80 },
  { name: 'Go', category: SkillCategory.programming_language, popularityScore: 88 },
  { name: 'Rust', category: SkillCategory.programming_language, popularityScore: 82 },
  { name: 'PHP', category: SkillCategory.programming_language, popularityScore: 75 },
  { name: 'Ruby', category: SkillCategory.programming_language, popularityScore: 70 },
  { name: 'Swift', category: SkillCategory.programming_language, popularityScore: 78 },
  { name: 'Kotlin', category: SkillCategory.programming_language, popularityScore: 80 },

  // Frontend
  { name: 'React', category: SkillCategory.frontend, popularityScore: 98 },
  { name: 'Next.js', category: SkillCategory.frontend, popularityScore: 92 },
  { name: 'Vue.js', category: SkillCategory.frontend, popularityScore: 85 },
  { name: 'Angular', category: SkillCategory.frontend, popularityScore: 88 },
  { name: 'Svelte', category: SkillCategory.frontend, popularityScore: 75 },
  { name: 'Tailwind CSS', category: SkillCategory.frontend, popularityScore: 90 },
  { name: 'Redux', category: SkillCategory.frontend, popularityScore: 85 },
  { name: 'HTML5', category: SkillCategory.frontend, popularityScore: 100 },
  { name: 'CSS3', category: SkillCategory.frontend, popularityScore: 100 },

  // Backend
  { name: 'Node.js', category: SkillCategory.backend, popularityScore: 95 },
  { name: 'NestJS', category: SkillCategory.backend, popularityScore: 88 },
  { name: 'Express.js', category: SkillCategory.backend, popularityScore: 90 },
  { name: 'Django', category: SkillCategory.backend, popularityScore: 85 },
  { name: 'Flask', category: SkillCategory.backend, popularityScore: 80 },
  { name: 'Spring Boot', category: SkillCategory.backend, popularityScore: 88 },
  { name: 'ASP.NET Core', category: SkillCategory.backend, popularityScore: 85 },
  { name: 'Laravel', category: SkillCategory.backend, popularityScore: 82 },

  // Database
  { name: 'PostgreSQL', category: SkillCategory.database_storage, popularityScore: 92 },
  { name: 'MySQL', category: SkillCategory.database_storage, popularityScore: 90 },
  { name: 'MongoDB', category: SkillCategory.database_storage, popularityScore: 88 },
  { name: 'Redis', category: SkillCategory.database_storage, popularityScore: 85 },
  { name: 'Elasticsearch', category: SkillCategory.database_storage, popularityScore: 80 },
  { name: 'Prisma', category: SkillCategory.database_storage, popularityScore: 85 },
  { name: 'Firebase', category: SkillCategory.database_storage, popularityScore: 82 },

  // DevOps & Cloud
  { name: 'Docker', category: SkillCategory.devops_infrastructure, popularityScore: 95 },
  { name: 'Kubernetes', category: SkillCategory.devops_infrastructure, popularityScore: 90 },
  { name: 'AWS', category: SkillCategory.cloud_computing, popularityScore: 95 },
  { name: 'Azure', category: SkillCategory.cloud_computing, popularityScore: 88 },
  { name: 'Google Cloud Platform', category: SkillCategory.cloud_computing, popularityScore: 85 },
  { name: 'CI/CD', category: SkillCategory.devops_infrastructure, popularityScore: 92 },
  { name: 'GitHub Actions', category: SkillCategory.devops_infrastructure, popularityScore: 88 },
  { name: 'Terraform', category: SkillCategory.devops_infrastructure, popularityScore: 85 },

  // AI & Data Science
  { name: 'TensorFlow', category: SkillCategory.ai_machine_learning, popularityScore: 85 },
  { name: 'PyTorch', category: SkillCategory.ai_machine_learning, popularityScore: 88 },
  { name: 'Pandas', category: SkillCategory.data_science_analytics, popularityScore: 90 },
  { name: 'NumPy', category: SkillCategory.data_science_analytics, popularityScore: 88 },
  { name: 'Scikit-learn', category: SkillCategory.ai_machine_learning, popularityScore: 85 },

  // Mobile
  { name: 'React Native', category: SkillCategory.mobile, popularityScore: 88 },
  { name: 'Flutter', category: SkillCategory.mobile, popularityScore: 85 },

  // Tools & Methodologies
  { name: 'Git', category: SkillCategory.software_tools, popularityScore: 100 },
  { name: 'Jira', category: SkillCategory.software_tools, popularityScore: 85 },
  { name: 'Agile', category: SkillCategory.methodology, popularityScore: 95 },
  { name: 'Scrum', category: SkillCategory.methodology, popularityScore: 92 },
  { name: 'Unit Testing', category: SkillCategory.testing_qa, popularityScore: 90 },
  { name: 'GraphQL', category: SkillCategory.technical, popularityScore: 88 },
  { name: 'Microservices', category: SkillCategory.architecture_design, popularityScore: 90 },

  // Soft Skills
  { name: 'Team Leadership', category: SkillCategory.soft_skills, popularityScore: 85 },
  { name: 'Problem Solving', category: SkillCategory.soft_skills, popularityScore: 98 },
  { name: 'Communication', category: SkillCategory.soft_skills, popularityScore: 95 },
];

async function main() {
  console.log('Start seeding SkillKeywords');
  for (const skill of skillKeywords) {
    await prisma.skillKeyword.upsert({
      where: { name: skill.name },
      update: {},
      create: {
        ...skill,
        isVerified: true,
      },
    });
  }
  console.log('Seeding finished');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
