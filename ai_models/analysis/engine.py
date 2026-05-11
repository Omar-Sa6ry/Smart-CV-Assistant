import re
import datetime
import numpy as np

# ── Shared Constants ──────────────────────────────────────────────────────────
ACTION_VERBS = [
    'architected','engineered','developed','optimized','spearheaded','orchestrated',
    'implemented','designed','accelerated','pioneered','integrated','leveraged',
    'managed','created','improved','increased','reduced','led','delivered','built',
    'launched','automated','deployed','migrated','refactored','scaled','streamlined'
]

CLICHES = [
    'responsible for','helped with','assisted with','worked on','hard worker',
    'team player','detail oriented','duties included','in charge of','passionate about'
]

SOFT_SKILLS = [
    'leadership','communication','teamwork','problem solving','critical thinking',
    'adaptability','time management','creativity','emotional intelligence','collaboration',
    'negotiation','presentation','mentoring','conflict resolution','decision making'
]

EDUCATION_LEVELS = {
    'Doctorate': [r'\bphd\b', r'\bdoctorate\b', r'\bdoctor of philosophy\b'],
    'Master': [r'\bmaster\b', r'\bmsc\b', r'\bmba\b', r'\bma\b'],
    'Bachelor': [r'\bbachelor\b', r'\bbsc\b', r'\bba\b', r'\bb\.?tech\b', r'\bb\.?e\.?\b'],
    'Diploma': [r'\bdiploma\b', r'\bassociate degree\b'],
    'Student': [r'\bstudent\b', r'\bundergraduate\b', r'\bundergrad\b', r'\bbachelor candidate\b', r'\bdegree expected\b']
}

SKILLS = {
    'Frontend Developer': {
        'core': ['javascript', 'html', 'css', 'typescript'],
        'important': [('react', 'vue', 'angular', 'nextjs', 'svelte'), 'tailwind', 'redux', 'webpack', 'git', 'vite'],
        'nice': ['figma', 'sass', 'bootstrap', 'storybook', 'jest', 'cypress', 'react native']
    },
    'Backend Developer': {
        'core': ['nodejs', 'python', 'java', 'sql', 'api', 'docker'],
        'important': [('postgresql', 'mysql', 'mongodb', 'redis', 'sql server'), 'microservices', ('nestjs', 'express', 'fastapi', 'django', 'spring boot', 'laravel'), 'restapi', 'kubernetes'],
        'nice': ['go', 'bullmq', 'nats', 'grpc', 'rabbitmq', 'kafka', 'typeorm', 'sequelize', 'mongoose', 'graphql', 'jwt', 'websockets', 'jest', 'linux', 'typescript']
    },
    'Full Stack Developer': {
        'core': ['javascript', 'nodejs', 'sql', 'api', 'git', 'html', 'css'],
        'important': ['typescript', ('mongodb', 'postgresql', 'mysql'), ('react', 'vue', 'angular', 'nextjs'), ('express', 'nestjs', 'fastapi', 'django'), 'docker', 'restapi'],
        'nice': ['fullstack', 'graphql', 'redis', ('aws', 'azure', 'gcp'), 'tailwind', 'ci/cd']
    },
    'Software Engineer': {
        'core': ['algorithms', 'data structures', 'oop', 'git', 'testing', 'software architecture'],
        'important': [('java', 'python', 'cplusplus', 'csharp', 'go'), 'sdlc', 'design patterns', 'system design'],
        'nice': ['clean architecture', 'solid principles', 'junit', 'tdd', 'distributed systems']
    },
    'Data Scientist': {
        'core': ['python', 'machinelearning', 'sql', 'statistics'],
        'important': [('pandas', 'numpy'), ('scikit-learn', 'tensorflow', 'pytorch'), 'nlp', 'data visualization', 'deeplearning'],
        'nice': ['r', 'spark', 'databricks', ('tableau', 'power bi'), 'mlops', 'jupyter']
    },
    'DevOps Engineer': {
        'core': ['docker', 'kubernetes', 'linux', 'cicd', 'git', 'cloud'],
        'important': [('aws', 'azure', 'gcp'), ('jenkins', 'github actions', 'gitlab ci'), ('terraform', 'ansible'), 'monitoring', 'bash'],
        'nice': [('prometheus', 'grafana'), 'helm', 'argocd', 'linux administration']
    },
    'Cybersecurity Analyst': {
        'core': ['network security', 'encryption', 'risk assessment', 'firewalls', 'siem', 'security audit'],
        'important': ['iam', 'cloud security', 'compliance', 'iso 27001', 'vulnerability', 'incident response'],
        'nice': ['threat hunting', 'jwt', 'api security', 'ceh', 'wireshark', 'metasploit']
    },
    'Mobile Developer': {
        'core': ['restapi', 'mobile development'],
        'important': [('flutter', 'react native', 'swift', 'kotlin', 'dart'), ('android', 'ios'), 'firebase', 'git', 'mobile security'],
        'nice': ['android studio', 'xcode', 'redux', 'jetpack compose', 'swiftui']
    },
    'Project Manager': {
        'core': ['agile', 'scrum', 'risk management', 'planning', 'leadership', 'project management'],
        'important': ['pmp', ('jira', 'trello', 'asana'), 'communication', 'budgeting', 'kanban', 'stakeholder management'],
        'nice': ['microsoft project', 'confluence', 'sdlc']
    },
    'Data Analyst': {
        'core': ['sql', 'excel', 'python', 'data visualization', 'reporting'],
        'important': [('tableau', 'power bi', 'looker'), 'r', 'pandas', 'statistics', 'data cleaning'],
        'nice': ['dax', 'bigquery', 'etl', 'google analytics']
    },
    'Data Engineer': {
        'core': ['sql', 'python', 'etl', 'pipeline', 'bigdata', 'data warehousing'],
        'important': ['spark', ('kafka', 'rabbitmq'), ('airflow', 'luigi'), ('hadoop', 'snowflake', 'redshift', 'bigquery'), 'nosql', ('aws', 'azure', 'gcp')],
        'nice': ['dbt', 'databricks', 'scala', 'pyspark']
    },
    'UI/UX Designer': {
        'core': ['user research', 'prototyping', 'wireframing', 'user experience'],
        'important': [('figma', 'adobe xd', 'sketch'), 'usability testing', 'interaction design', 'ui design'],
        'nice': ['html', 'css', 'zeplin', 'motion design', 'adobe creative suite']
    },
    'QA Engineer': {
        'core': ['testing', 'test cases', 'bug reporting', 'quality assurance', 'manual testing'],
        'important': [('selenium', 'cypress', 'playwright'), 'automation', 'jira', 'regression testing', 'test automation'],
        'nice': ['api testing', 'performance testing', 'postman', 'jmeter']
    },
    'Cloud Architect': {
        'core': [('aws', 'azure', 'gcp'), 'cloud architecture', 'infrastructure as code'],
        'important': [('terraform', 'cloudformation'), 'kubernetes', 'microservices', 'serverless', 'cloud migration'],
        'nice': ['lambda', 'route53', 'cloudwatch', 'multi-cloud']
    },
    'AI Engineer': {
        'core': ['python', 'deep learning', 'machine learning', 'neural networks', 'nlp'],
        'important': [('pytorch', 'tensorflow', 'keras'), ('openai', 'llm', 'huggingface'), 'computer vision', 'generative ai'],
        'nice': ['langchain', 'mlops', 'vector databases', 'prompt engineering']
    },
    'SRE Engineer': {
        'core': ['reliability', 'observability', 'linux', 'automation', 'incident management'],
        'important': [('prometheus', 'grafana', 'datadog'), 'slo/sli', 'kubernetes', 'bash', 'python'],
        'nice': ['chaos engineering', 'distributed systems', 'terraform', 'ansible']
    },
    'Product Owner': {
        'core': ['product strategy', 'backlog management', 'user stories', 'agile', 'roadmap'],
        'important': ['scrum', 'market research', 'stakeholder management', 'jira', 'mvp'],
        'nice': ['kanban', 'customer interviews', 'data-driven decisions', 'confluence']
    },
    'Embedded Systems Engineer': {
        'core': [('c', 'cpp'), 'rtos', 'microcontrollers', 'embedded systems'],
        'important': ['firmware', 'arm', 'iot', 'spi', 'i2c', 'bare metal'],
        'nice': ['raspberry pi', 'arduino', 'pbc design', 'oscilloscope', 'fpga']
    },
    'Blockchain Developer': {
        'core': ['solidity', 'ethereum', 'smart contracts', 'blockchain', 'cryptography'],
        'important': [('web3.js', 'ethers.js'), 'rust', 'hyperledger', 'dapps', 'truffle'],
        'nice': ['nft', 'defi', 'hardhat', 'ipfs', 'consensus algorithms']
    },
    'Solutions Architect': {
        'core': ['system design', 'software architecture', 'cloud', 'integration', 'scalability'],
        'important': ['microservices', 'api design', 'security', 'high availability', 'enterprise architecture'],
        'nice': ['digital transformation', 'saas', 'rest', 'graphql', 'uml']
    },
    'Business Analyst': {
        'core': ['requirements gathering', 'documentation', 'process mapping', 'gap analysis'],
        'important': ['sql', 'brd', 'frd', 'user stories', 'stakeholder communication'],
        'nice': ['visio', 'uml', 'tableau', 'agile', 'bpm n']
    },
    'Python Developer': {
        'core': ['python', 'restapi', 'sql', 'git'],
        'important': [('django', 'flask', 'fastapi'), 'pandas', 'numpy', 'pytest', 'celery', 'asyncio'],
        'nice': ['redis', 'beautifulsoup', 'scipy', 'poetry', 'sqlalchemy']
    },
    'Java Developer': {
        'core': ['java', 'maven', 'sql', 'git', 'oop'],
        'important': [('spring boot', 'spring', 'hibernate'), 'restapi', 'microservices', 'junit', 'docker', 'gradle'],
        'nice': ['kafka', 'redis', 'aws', 'kubernetes', 'microservices architecture']
    },
    'PHP Developer': {
        'core': ['php', 'mysql', 'html', 'css'],
        'important': [('laravel', 'symfony', 'codeigniter'), 'javascript', 'restapi', 'composer', 'git', 'oop'],
        'nice': ['vue', 'react', 'redis', 'docker', 'lamp stack']
    },
    'Network Engineer': {
        'core': ['routing', 'switching', 'cisco', 'tcp/ip', 'vpn', 'network administration'],
        'important': ['firewall', 'lan', 'wan', 'dns', 'dhcp', 'ccna', 'bgp'],
        'nice': ['ccnp', 'wireshark', 'ospf', 'mpls', 'sd-wan']
    },
    'Database Administrator': {
        'core': ['sql', 'database management', 'backup', 'performance tuning', 'security'],
        'important': [('oracle', 'mysql', 'postgresql', 'sql server'), 'replication', 'indexing'],
        'nice': ['mongodb', 'db2', 'clustering', 'partitioning', 'nosql']
    },
    'Marketing Specialist': {
        'core': ['digital marketing', 'seo', 'content marketing', 'social media', 'analytics'],
        'important': ['google ads', 'email marketing', 'sem', 'crm', 'campaigns', 'copywriting'],
        'nice': ['hubspot', 'hootsuite', 'a/b testing', 'marketing automation']
    },
    'HR Specialist': {
        'core': ['recruitment', 'interviewing', 'onboarding', 'employee relations'],
        'important': ['payroll', 'hris', 'training', 'labor law', 'talent acquisition', 'compliance'],
        'nice': ['succession planning', 'compensation', 'kpi', 'performance management']
    },
    'Accountant': {
        'core': ['accounting', 'excel', 'financial statements', 'tax', 'audit'],
        'important': ['erp', 'quickbooks', 'sap', 'budgeting', 'financial reporting', 'tax compliance'],
        'nice': ['vat', 'ifrs', 'gaap', 'cost accounting', 'financial analysis']
    }
}

# Skill Groups to avoid illogical recommendations (If you have one, you don't need the others)
SKILL_GROUPS = [
    ['nodejs', 'nestjs', 'express', 'fastapi', 'django', 'flask', 'laravel', 'spring boot', 'go', 'ruby on rails'],
    ['postgresql', 'mysql', 'sql server', 'oracle', 'mariadb', 'sqlite'],
    ['mongodb', 'dynamodb', 'couchbase', 'cassandra', 'redis', 'elasticsearch'],
    ['react', 'angular', 'vue', 'nextjs', 'svelte', 'jquery'],
    ['aws', 'azure', 'gcp', 'digitalocean', 'heroku', 'firebase'],
    ['docker', 'kubernetes', 'podman', 'terraform', 'ansible'],
    ['javascript', 'typescript', 'python', 'java', 'csharp', 'php', 'go', 'rust', 'ruby', 'cpp', 'c'],
    ['rabbitmq', 'kafka', 'nats', 'bullmq', 'redis pub/sub', 'activemq'],
    ['linux', 'unix', 'bash', 'shell', 'ubuntu', 'debian', 'centos']
]

# ── Logic Functions ───────────────────────────────────────────────────────────

def detect_experience_years(text):
    tl = text.lower()
    explicit = [int(y) for y in re.findall(r'(\d+)\+?\s*(?:years?|yrs?)', tl) if int(y) < 40]
    yr = datetime.datetime.now().year
    ranges = re.findall(r'((?:19|20)\d{2})\s*[-–to]+\s*((?:19|20)\d{2}|present|current|now)', tl)
    starts, ends = [], []
    for s, e in ranges:
        try:
            sy = int(s); ey = yr if e in ['present','current','now'] else int(e)
            if 1950 <= sy <= ey <= yr: starts.append(sy); ends.append(ey)
        except: pass
    range_yrs = (max(ends) - min(starts)) if starts else 0
    return max(max(explicit) if explicit else 0, range_yrs)

def detect_education_level(text):
    tl = text.lower()
    for level, patterns in EDUCATION_LEVELS.items():
        if any(re.search(p, tl) for p in patterns):
            return level
    return "Not Specified"

def detect_seniority(text, yrs):
    tl = text.lower()
    if yrs >= 5 or any(re.search(p, tl) for p in [r'\bsenior\b', r'\blead\b', r'\bmanager\b']):
        return "Senior Level"
    if yrs <= 1 or any(re.search(p, tl) for p in [r'\bjunior\b', r'\bintern\b', r'\bfresher\b']):
        return "Junior/Entry Level"
    return "Mid-Level"

def check_spelling(text):
    # Rule-based spelling error detection for common CV typos
    typos = {
        'teh': 'the', 'recieve': 'receive', 'managment': 'management',
        'experiance': 'experience', 'developement': 'development',
        'manger': 'manager', 'responcible': 'responsible', 'acheive': 'achieve',
        'impletmented': 'implemented', 'enviroment': 'environment',
        'sucess': 'success', 'comunication': 'communication', 'proffesional': 'professional'
    }
    
    words = re.findall(r'\b[a-z]{3,}\b', text.lower())
    errors = []
    for word in words:
        if word in typos and word not in errors:
            errors.append(word)
            
    return list(set(errors))

def detect_formatting(text):
    # Check for basic formatting and special characters
    has_tables = bool(re.search(r'[\u2500-\u257F]', text))  # Box drawing characters
    has_images = bool(re.search(r'\[image\]|<img|/Image', text, re.IGNORECASE))
    
    # Detect potential multi-column layout (Sign of a non-ATS-friendly Design CV)
    # Long lines with large gaps of whitespace in the middle often indicate columns.
    # However, we must ignore right-aligned dates which also use large gaps.
    lines = text.split('\n')
    lines_with_gaps = [line for line in lines if len(line) > 30 and re.search(r'\w{2,}\s{10,}\w{2,}', line)]
    column_lines = 0
    for line in lines_with_gaps:
        parts = re.split(r'\s{10,}', line)
        if len(parts) >= 2:
            right_part = parts[-1].strip().lower()
            # If the right part is a date (contains year or 'present'), ignore it
            if not re.search(r'\b(?:19|20)\d{2}\b|present|now|current', right_part):
                column_lines += 1
                
    has_columns = column_lines >= 4 # Need at least 4 lines of non-date columns to penalize
    
    # Check for excessive special characters that might confuse ATS
    # Allowed: alphanumeric, whitespace, standard punctuation, and common CV bullets/symbols
    special_chars_pattern = r'[^\w\s\.,;:\-\(\)\[\]\{\}@"\'\*\+/%\|&!؟\?•–—~©®·]'
    special_chars = re.findall(special_chars_pattern, text)
    has_special_chars = len(special_chars) > 30  # Increased threshold slightly
    
    # Simple formatting score calculation
    valid_lines = [l for l in lines if l.strip()]
    formatting_score = 100.0
    
    if len(valid_lines) < 10:
        formatting_score -= 20
        
    if has_tables:
        formatting_score -= 15
        
    if has_images:
        formatting_score -= 15
        
    if has_columns:
        formatting_score -= 40 # Heavier penalty for non-ATS-friendly layouts
        
    if has_special_chars:
        formatting_score -= 15
        
    return max(0.0, formatting_score), has_tables, has_images, has_special_chars, has_columns

def calculate_consistency_score(text):
    score = 100.0
    tl = text.lower()
    
    # Check date formats consistency
    found_patterns = []
    
    # 1. Month YYYY (e.g. Sep 2025)
    if re.search(r'\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* \d{4}\b', tl):
        found_patterns.append("month_year")
        # Remove these from text to avoid overlapping with standalone year
        tl = re.sub(r'\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* \d{4}\b', '', tl)
        
    # 2. MM/YYYY or DD/MM/YYYY
    if re.search(r'\b\d{1,2}/\d{4}\b|\b\d{1,2}/\d{1,2}/\d{4}\b', tl):
        found_patterns.append("slash_date")
        tl = re.sub(r'\b\d{1,2}/\d{4}\b|\b\d{1,2}/\d{1,2}/\d{4}\b', '', tl)
        
    # 3. Standalone YYYY
    if re.search(r'\b(19|20)\d{2}\b', tl):
        found_patterns.append("year_only")
            
    if len(found_patterns) > 1:
        score -= 10 * (len(found_patterns) - 1)
        
    # Check chronological sequence
    current_year = datetime.datetime.now().year
    ranges = re.findall(r'\b((?:19|20)\d{2})\s*[-–to]+\s*((?:19|20)\d{2}|present|current|now)\b', text.lower())
    
    extracted_ranges = []
    for s, e in ranges:
        try:
            sy = int(s)
            ey = current_year if e in ['present', 'current', 'now'] else int(e)
            if 1950 <= sy <= ey <= current_year + 5:
                extracted_ranges.append((sy, ey))
        except:
            pass
            
    out_of_order = False
    for i in range(len(extracted_ranges) - 1):
        curr_sy, curr_ey = extracted_ranges[i]
        next_sy, next_ey = extracted_ranges[i+1]
        
        # In a reverse chronological CV, the current end year should be >= next end year
        # Allow 1 year overlap/margin
        if curr_ey < next_ey - 1: 
            out_of_order = True
            break
            
    if out_of_order:
        score -= 15
        
    return max(0.0, score), out_of_order

def analyze_cv_engine(text, role, normalize_func, normalize_map):
    tl = text.lower()
    # Better cleaning for skill matching
    ts = re.sub(r'[^a-zA-Z0-9\s\.+#/-]', ' ', tl)
    ts = ' '.join(ts.split())
    
    # More targeted normalization (avoid breaking "express.js")
    for pattern, repl in normalize_map.items():
        if '.js' in pattern:
            continue # Let the normalize_func handle JS
        ts = re.sub(pattern, repl, ts)
        
    lines = [l.strip().lower() for l in text.split('\n') if l.strip()]

    # Strict section detection (Must be a short header line followed by content)
    sec_keys = {
        'Summary': ['summary','objective','about me','profile','professional summary','profile summary','introduction','executive summary'],
        'Experience': ['experience','work history','employment','professional experience','work experience','career history','professional background'],
        'Education': ['education','academic background','degrees','academic qualification','schooling','educational background'],
        'Projects': ['projects','personal projects','notable projects','technical projects','open source','portfolio','featured projects','feature project','key projects','key project','project work','project experience','projects experience'],
        'Skills': ['skills','technical skills','technologies','competencies','toolset','expertise','core competencies','technical expertise']
    }
    
    sec_status = {k: False for k in sec_keys}
    for sec, kws in sec_keys.items():
        for kw in kws:
            # Match if the keyword is the main content of a line (up to 15 chars padding)
            # OR if it's preceded by at least 5 spaces (common in multi-column layouts)
            pattern = r'^[^\w]*([a-zA-Z\s]{0,15})\b' + re.escape(kw) + r'\b([a-zA-Z\s]{0,15})[^\w]*$|\s{5,}\b' + re.escape(kw) + r'\b'
            if re.search(pattern, text, re.IGNORECASE | re.MULTILINE):
                sec_status[sec] = True
                break

    has_certs = 'certif' in tl or 'licen' in tl
    has_langs = bool(re.search(r'\blanguages?\b', tl))
    has_awards = 'award' in tl

    # Impact (Enhanced patterns matching standard ATS like Resume Worded)
    text_no_phones = re.sub(r'\+?\d{10,15}', '', text)
    raw_numbers = re.findall(r'\b\d{1,3}(?:,\d{3})*(?:\.\d+)?(?:[kKmMbB])?\+?%?\b', text_no_phones)
    
    metrics = []
    for n in raw_numbers:
        clean_num = re.sub(r'[^\d]', '', n)
        if clean_num:
            # Skip years (4 digits between 1950 and 2030)
            if len(clean_num) == 4 and 1950 <= int(clean_num) <= 2030:
                continue
            # Skip single digit '1' or '0' unless it has a symbol like 1k or 1%
            if (clean_num == '1' or clean_num == '0') and n == clean_num:
                continue
            metrics.append(n)
            
    metric_count = len(metrics)
    # Give a more generous score for metrics since we capture more
    impact_score = min(100.0, round(metric_count * 10.0, 1))

    # Language (Improved logic)
    verb_count = sum(1 for v in ACTION_VERBS if re.search(r'\b' + v + r'\b', tl))
    cliche_count = sum(1 for c in CLICHES if re.search(r'\b' + re.escape(c) + r'\b', tl))
    
    # Calculate language score, don't let it go below 0
    lang_score = max(0.0, min(100.0, 50.0 + (verb_count * 5.0) - (cliche_count * 10.0)))
    
    # Formatting & Details
    formatting_score, has_tables, has_images, has_special_chars, has_columns = detect_formatting(text)
    consistency_score, out_of_order = calculate_consistency_score(text)
    
    # Details score (combination of impact and section detail)
    details_score = min(100.0, 40.0 + (metric_count * 5) + (sum(sec_status.values()) * 5))

    # Soft Skills
    found_soft = [s for s in SOFT_SKILLS if re.search(r'\b' + s + r'\b', tl)]
    soft_score = min(100.0, len(found_soft) * 20.0)

    # Keywords (Weighted)
    role_key = next((k for k in SKILLS if k.lower() == role.lower()), 
                    next((k for k in SKILLS if k.lower() in role.lower()), None))
    found_skills, missing_core, missing_imp, missing_nice = [], [], [], []
    kw_score = 0.0

    # Normalize the text for skill checking
    norm_text = normalize_func(ts)
    # Add normalization for C# and C++ to handle common OCR/parsing issues
    norm_text = norm_text.replace('c #', 'csharp').replace('c#', 'csharp').replace('c++', 'cpp')
    
    # 1. Find ALL skills across ALL roles to ensure we read everything
    all_found_set = set()
    for r_key, r_dict in SKILLS.items():
        for s_item in r_dict['core'] + r_dict['important'] + r_dict['nice']:
            items_to_check = s_item if isinstance(s_item, tuple) else [s_item]
            for s in items_to_check:
                sk = normalize_func(s).replace('c#', 'csharp').replace('c++', 'cpp')
                # Multi-word phrase matching fix
                sk_pattern = r'\b' + r'\s+'.join(re.escape(w) for w in sk.split()) + r'\b'
                if re.search(sk_pattern, norm_text):
                    all_found_set.add(s)

    found_skills = list(all_found_set)

    if role_key:
        rd = SKILLS[role_key]
        
        # 2. Check missing skills specifically for the role
        for s_item in rd['core'] + rd['important'] + rd['nice']:
            if isinstance(s_item, tuple):
                if not any(s in found_skills for s in s_item):
                    formatted_missing = " or ".join(s_item)
                    if s_item in rd['core']: missing_core.append(formatted_missing)
                    elif s_item in rd['important']: missing_imp.append(formatted_missing)
                    else: missing_nice.append(formatted_missing)
            else:
                s = s_item
                if s not in found_skills:
                    if s in rd['core']: missing_core.append(s)
                    elif s in rd['important']: missing_imp.append(s)
                    else: missing_nice.append(s)

        total = 0
        gained = 0
        
        for s_item in rd['core']:
            total += 10
            if isinstance(s_item, tuple):
                if any(s in found_skills for s in s_item): gained += 10
            else:
                if s_item in found_skills: gained += 10
                
        for s_item in rd['important']:
            total += 5
            if isinstance(s_item, tuple):
                if any(s in found_skills for s in s_item): gained += 5
            else:
                if s_item in found_skills: gained += 5
                
        for s_item in rd['nice']:
            total += 2
            if isinstance(s_item, tuple):
                if any(s in found_skills for s in s_item): gained += 2
            else:
                if s_item in found_skills: gained += 2
        
        raw_pct = gained / max(total, 1)
        kw_score = round(min(100.0, (raw_pct ** 0.7) * 115), 1)

    # Scoring Final
    req_score = round(sum(sec_status.values()) / 5 * 100, 1)
    has_email = bool(re.search(r'[\w\.-]+@[\w\.-]+', text))
    has_phone = bool(re.search(r'\+?\d{10,15}', text))
    contact_score = sum([has_email, has_phone, 'linkedin' in tl, 'github' in tl]) * 25.0
    completeness_pct = req_score * 0.5 + contact_score * 0.5
    
    overall = round(
        kw_score * 0.35 + 
        lang_score * 0.15 + 
        formatting_score * 0.15 + # Increased weight
        completeness_pct * 0.10 + 
        impact_score * 0.15 +
        soft_score * 0.10, 
    1)
    
    # Penalize overall score for missing critical sections (ATS rejection simulation)
    # If Experience or Skills are missing, it's a huge red flag
    if not sec_status.get('Experience'):
        overall -= 15
    if not sec_status.get('Skills'):
        overall -= 10
    if has_columns:
        overall -= 10 # Extra overall penalty for bad layout
        
    overall = max(0.0, round(overall, 1))
    
    yrs = detect_experience_years(text)
    edu_level = detect_education_level(text)

    # Filter logical missing
    logical_missing = []
    all_missing = missing_core + missing_imp + missing_nice
    for ms in all_missing:
        if " or " in ms:
            logical_missing.append(ms)
            continue
        group = next((g for g in SKILL_GROUPS if ms.lower() in [i.lower() for i in g]), None)
        if group and any(s.lower() in [i.lower() for i in group] for s in found_skills):
            continue
        logical_missing.append(ms)

    missing_ranked = logical_missing[:10]
    spelling_errors = check_spelling(text)
    
    # Generate Suggestions
    suggestions_list = []
    
    if verb_count < 5:
        suggestions_list.append({
            "sectionName": "Experience",
            "priority": "High",
            "message": "Use stronger action verbs to describe your experience.",
            "originalText": "worked on, helped with",
            "suggestedText": "developed, implemented, orchestrated"
        })
        
    if metric_count < 3:
        suggestions_list.append({
            "sectionName": "Experience",
            "priority": "High",
            "message": "Add quantifiable achievements to demonstrate your impact.",
            "originalText": "improved performance",
            "suggestedText": "improved performance by 30%"
        })
        
    if missing_core:
        suggestions_list.append({
            "sectionName": "Skills",
            "priority": "High",
            "message": f"Add missing core skills for your role: {', '.join(missing_core[:3])}",
            "originalText": "",
            "suggestedText": ", ".join(missing_core[:3])
        })
        
    if not sec_status.get('Summary'):
        suggestions_list.append({
            "sectionName": "Summary",
            "priority": "Medium",
            "message": "Add a professional summary at the top of your CV.",
            "originalText": "",
            "suggestedText": ""
        })
        
    if not sec_status.get('Projects'):
        suggestions_list.append({
            "sectionName": "Projects",
            "priority": "Medium",
            "message": "Include a Projects section to showcase your practical experience.",
            "originalText": "",
            "suggestedText": ""
        })
        
    if cliche_count > 0:
        suggestions_list.append({
            "sectionName": "Summary/Experience",
            "priority": "Medium",
            "message": "Remove clichés and overused phrases.",
            "originalText": "hard worker, team player",
            "suggestedText": "collaborated with cross-functional teams"
        })

    if spelling_errors:
         suggestions_list.append({
            "sectionName": "General",
            "priority": "High",
            "message": f"Correct spelling errors found in your CV.",
            "originalText": ", ".join(spelling_errors[:3]),
            "suggestedText": ""
        })
        
    if out_of_order:
        suggestions_list.append({
            "sectionName": "Experience",
            "priority": "High",
            "message": "Reorder your experience section. CV dates should be in reverse chronological sequence (most recent first).",
            "originalText": "",
            "suggestedText": ""
        })

    if has_columns:
        suggestions_list.append({
            "sectionName": "Formatting",
            "priority": "High",
            "message": "Multiple columns detected. ATS systems often fail to parse multi-column layouts correctly. Consider using a single-column layout for better compatibility.",
            "originalText": "",
            "suggestedText": ""
        })

    return {
        "overallScore": overall,
        "kw_score": kw_score,
        "lang_score": lang_score,
        "impact_score": impact_score,
        "req_score": req_score,
        "formatting_score": formatting_score,
        "details_score": details_score,
        "consistency_score": consistency_score,
        "sec_status": sec_status,
        "found_skills": found_skills,
        "found_soft": found_soft,
        "missing_ranked": missing_ranked,
        "metric_count": metric_count,
        "verb_count": verb_count,
        "cliche_count": cliche_count,
        "spelling_errors": spelling_errors,
        "has_tables": has_tables,
        "has_images": has_images,
        "has_special_chars": has_special_chars,
        "has_columns": has_columns,
        "exp_years": yrs,
        "seniority": detect_seniority(text, yrs),
        "education_level": edu_level,
        "has_certs": has_certs,
        "has_langs": has_langs,
        "has_awards": has_awards,
        "contact_info": {"email": has_email, "phone": has_phone, "linkedin": "linkedin" in tl, "github": "github" in tl},
        "detailed_suggestions": suggestions_list
    }
