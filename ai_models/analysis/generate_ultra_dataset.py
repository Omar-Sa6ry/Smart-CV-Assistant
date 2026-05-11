import pandas as pd
import random
import os
import sys
import io

# Fix encoding for Windows console
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

SKILLS_DATA = {
    'Frontend Developer': {
        'core': ['JavaScript', 'React', 'HTML5', 'CSS3', 'TypeScript', 'Next.js'],
        'tools': ['Redux', 'Tailwind CSS', 'Sass', 'Webpack', 'Vite', 'Jest', 'Storybook', 'Figma'],
        'desc': ['Developing responsive user interfaces', 'Optimizing web performance', 'Implementing pixel-perfect designs', 'Integrating REST APIs']
    },
    'Backend Developer': {
        'core': ['Node.js', 'Python', 'Java', 'Go', 'Express', 'NestJS', 'Django', 'Spring Boot'],
        'tools': ['PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'RabbitMQ', 'AWS', 'GraphQL'],
        'desc': ['Building scalable microservices', 'Designing database schemas', 'Implementing secure authentication', 'Optimizing API response times']
    },
    'Full Stack Developer': {
        'core': ['MERN Stack', 'MEAN Stack', 'JavaScript', 'Python', 'React', 'Node.js', 'SQL'],
        'tools': ['Docker', 'AWS', 'Git', 'CI/CD', 'TypeScript', 'Serverless', 'Terraform'],
        'desc': ['Developing end-to-end applications', 'Managing cloud infrastructure', 'Leading full-stack teams', 'Full SDLC management']
    },
    'Data Scientist': {
        'core': ['Python', 'R', 'Machine Learning', 'Deep Learning', 'Statistics', 'NLP'],
        'tools': ['TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NumPy', 'Hadoop', 'Spark', 'Tableau'],
        'desc': ['Developing predictive models', 'Statistical data analysis', 'Implementing neural networks', 'Data cleaning and visualization']
    },
    'DevOps Engineer': {
        'core': ['Docker', 'Kubernetes', 'CI/CD', 'Terraform', 'Ansible', 'Linux', 'AWS'],
        'tools': ['Jenkins', 'GitLab', 'Prometheus', 'Grafana', 'Bash', 'CloudFormation', 'Azure', 'GCP'],
        'desc': ['Automating infrastructure deployment', 'Managing container orchestration', 'Implementing monitoring systems', 'Optimizing cloud costs']
    },
    'Cybersecurity Analyst': {
        'core': ['Network Security', 'Ethical Hacking', 'SIEM', 'Encryption', 'Risk Assessment'],
        'tools': ['Splunk', 'Wireshark', 'Metasploit', 'Kali Linux', 'Burp Suite', 'ISO 27001', 'NIST'],
        'desc': ['Monitoring network traffic for threats', 'Conducting vulnerability assessments', 'Implementing security protocols', 'Incident response']
    },
    'Mobile Developer': {
        'core': ['Flutter', 'React Native', 'Swift', 'Kotlin', 'Dart', 'iOS', 'Android'],
        'tools': ['Firebase', 'Android Studio', 'Xcode', 'SQLite', 'Fastlane', 'App Store deployment'],
        'desc': ['Developing cross-platform mobile apps', 'Implementing native modules', 'Mobile UI/UX optimization', 'State management']
    },
    'Software Engineer': {
        'core': ['C++', 'Java', 'Data Structures', 'Algorithms', 'OOP', 'System Design'],
        'tools': ['Git', 'JUnit', 'Design Patterns', 'Agile', 'Jira', 'Clean Architecture'],
        'desc': ['Developing complex software systems', 'Optimizing algorithmic performance', 'Software architecture design', 'Code refactoring']
    },
    'Database Administrator': {
        'core': ['SQL', 'Oracle', 'MySQL', 'Database Design', 'Performance Tuning'],
        'tools': ['SQL Server', 'PostgreSQL', 'Backup & Recovery', 'Replication', 'Clustering', 'Stored Procedures'],
        'desc': ['Managing enterprise databases', 'Database security and integrity', 'Optimization and query tuning', 'Data migration']
    },
    'Data Analyst': {
        'core': ['SQL', 'Excel', 'Data Visualization', 'Statistics', 'Business Intelligence'],
        'tools': ['Power BI', 'Tableau', 'Python', 'Looker', 'Google Analytics', 'DASH', 'Pandas'],
        'desc': ['Interpreting complex datasets', 'Generating business reports', 'Dashboard development', 'Identifying market trends']
    },
    'Data Engineer': {
        'core': ['ETL', 'Big Data', 'Python', 'Spark', 'Kafka', 'Data Warehousing'],
        'tools': ['Airflow', 'Snowflake', 'Redshift', 'Databricks', 'Hive', 'Flink', 'NoSQL'],
        'desc': ['Designing data pipelines', 'Managing big data infrastructure', 'Data ingestion and processing', 'Optimizing data flow']
    },
    'Network Engineer': {
        'core': ['Cisco', 'Routing & Switching', 'TCP/IP', 'Firewalls', 'VPN'],
        'tools': ['LAN/WAN', 'CCNA', 'CCNP', 'Wireshark', 'BGP', 'OSPF', 'Load Balancing'],
        'desc': ['Designing network infrastructure', 'Troubleshooting network issues', 'Network security management', 'Wireless networking']
    },
    'UI/UX Designer': {
        'core': ['User Research', 'Wireframing', 'Prototyping', 'Visual Design', 'HCI'],
        'tools': ['Figma', 'Adobe XD', 'Sketch', 'InVision', 'Principle', 'Zeplin', 'Usability Testing'],
        'desc': ['Creating user-centered designs', 'Conducting user testing sessions', 'Developing design systems', 'Iterative prototyping']
    },
    'QA Engineer': {
        'core': ['Manual Testing', 'Automation Testing', 'Test Cases', 'Quality Assurance'],
        'tools': ['Selenium', 'Cypress', 'Appium', 'Postman', 'Jmeter', 'Jira', 'Bugzilla', 'Regression Testing'],
        'desc': ['Executing automated test scripts', 'Quality control management', 'Bug tracking and reporting', 'API testing']
    },
    'Project Manager': {
        'core': ['Agile', 'Scrum', 'Stakeholder Management', 'Risk Management', 'Planning'],
        'tools': ['Jira', 'Trello', 'PMP', 'Microsoft Project', 'Kanban', 'Confluence', 'Resource Allocation'],
        'desc': ['Leading project teams', 'Defining project scope', 'Managing timelines and budgets', 'Cross-functional coordination']
    },
    'Graphic Designer': {
        'core': ['Visual Communication', 'Typography', 'Branding', 'Layout Design'],
        'tools': ['Photoshop', 'Illustrator', 'InDesign', 'Canva', 'CorelDraw', 'Creative Cloud'],
        'desc': ['Designing marketing materials', 'Logo and brand identity design', 'Print and digital media design', 'Creative art direction']
    },
    'Python Developer': {
        'core': ['Python', 'Django', 'Flask', 'FastAPI', 'Asynchronous Programming'],
        'tools': ['Celery', 'Pytest', 'Aiohttp', 'NumPy', 'SQLAlchemy', 'Pydantic'],
        'desc': ['Developing backend services in Python', 'Optimizing python scripts', 'Web scraping and automation', 'Scripting and tooling']
    },
    'Java Developer': {
        'core': ['Java', 'Spring Boot', 'Microservices', 'J2EE', 'Hibernate'],
        'tools': ['Maven', 'Gradle', 'JUnit', 'Eclipse', 'IntelliJ', 'Apache Tomcat'],
        'desc': ['Enterprise Java development', 'Spring framework implementation', 'Building RESTful web services', 'Java multithreading']
    },
    'PHP Developer': {
        'core': ['PHP', 'Laravel', 'Symfony', 'WordPress', 'MVC Architecture'],
        'tools': ['MySQL', 'Composer', 'Blade', 'Twig', 'Magento', 'Docker'],
        'desc': ['Dynamic web application development', 'Laravel framework expertise', 'CMS customization', 'Server-side logic']
    },
    'SOC Analyst': {
        'core': ['Security Monitoring', 'Log Analysis', 'Incident Response', 'Threat Intel'],
        'tools': ['SIEM', 'LogRhythm', 'ArcSight', 'TCP/IP', 'Blue Team', 'Endpoint Protection'],
        'desc': ['24/7 security monitoring', 'Analyzing security alerts', 'Triage and escalation', 'Malware analysis']
    },
    'Penetration Tester': {
        'core': ['Red Teaming', 'Vulnerability Research', 'Exploit Development', 'Web Hacking'],
        'tools': ['Metasploit', 'Empire', 'Cobalt Strike', 'Nmap', 'Burp Suite', 'OSCP'],
        'desc': ['Simulating cyber attacks', 'Identifying security loopholes', 'Reporting on technical risks', 'Reverse engineering']
    },
    'Marketing Specialist': {
        'core': ['Digital Marketing', 'SEO', 'SEM', 'Content Strategy', 'Social Media'],
        'tools': ['Google Ads', 'HubSpot', 'Mailchimp', 'Analytics', 'A/B Testing', 'Copywriting'],
        'desc': ['Managing marketing campaigns', 'Optimizing search engine ranking', 'Brand development', 'Customer acquisition']
    },
    'HR Specialist': {
        'core': ['Recruitment', 'Employee Relations', 'Talent Management', 'HR Compliance'],
        'tools': ['HRIS', 'LinkedIn Recruiter', 'ADP', 'Workday', 'Succession Planning'],
        'desc': ['Managing the hiring lifecycle', 'Employee onboarding and training', 'Developing HR policies', 'Performance management']
    },
    'Sales Representative': {
        'core': ['Business Development', 'Lead Generation', 'Negotiation', 'Account Management'],
        'tools': ['Salesforce', 'CRM', 'Cold Calling', 'Sales Pipeline', 'B2B Sales'],
        'desc': ['Driving revenue growth', 'Managing client relationships', 'Closing strategic deals', 'Market research']
    },
    'Accountant': {
        'core': ['Financial Accounting', 'Taxation', 'Auditing', 'Bookkeeping'],
        'tools': ['QuickBooks', 'SAP', 'Xero', 'Advanced Excel', 'Financial Reporting', 'GAAP'],
        'desc': ['Managing financial records', 'Preparing tax returns', 'Conducting internal audits', 'Budgeting and forecasting']
    },
    'Web Designer': {
        'core': ['Web Design', 'HTML/CSS', 'Responsive Design', 'Graphics'],
        'tools': ['WordPress', 'Elementor', 'Webflow', 'Bootstrap', 'Sketch', 'SASS'],
        'desc': ['Designing website layouts', 'Implementing responsive designs', 'CSS/HTML optimization', 'Modern web styling']
    }
}

def generate_sample(category):
    data = SKILLS_DATA[category]
    skills = random.sample(data['core'], random.randint(3, len(data['core']))) + \
             random.sample(data['tools'], random.randint(2, 5))
    
    descriptions = random.sample(data['desc'], random.randint(2, len(data['desc'])))
    
    templates = [
        f"Summary: Dedicated {category} with {random.randint(1, 15)} years of experience. \nSkills: {', '.join(skills)}. \nExperience: {' '.join(descriptions)}",
        f"Professional {category}. Core competencies: {', '.join(skills)}. Proven track record in {' and '.join(descriptions)}.",
        f"Goal-oriented {category}. Technical proficiency in {', '.join(skills)}. Key achievements: {'. '.join(descriptions)}.",
        f"Experience in {category} for {random.randint(2, 10)} years. Technical stack includes {', '.join(skills)}. Involved in {'. '.join(descriptions)}."
    ]
    return random.choice(templates)

TARGET_PER_CATEGORY = 4400
categories = list(SKILLS_DATA.keys())

all_data = []
print(f"Generating {len(categories) * TARGET_PER_CATEGORY} new samples...")

for cat in categories:
    for _ in range(TARGET_PER_CATEGORY):
        all_data.append([generate_sample(cat), cat])

df_ultra = pd.DataFrame(all_data, columns=['Raw_CV_Text', 'Target_Role'])

if os.path.exists('resume_dataset.csv'):
    df_old = pd.read_csv('resume_dataset.csv')
    df_final = pd.concat([df_old, df_ultra]).drop_duplicates().reset_index(drop=True)
else:
    df_final = df_ultra

df_final.to_csv('resume_dataset_ultra.csv', index=False)
print(f"Dataset Ultra saved! Total samples: {len(df_final)}")
