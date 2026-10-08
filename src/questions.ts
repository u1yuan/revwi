export type Citation = { label: string; href: string }
type Assessment = 'Midterm Exam' | 'Summative Assessment 2'
type Module = 1 | 2 | 3 | 4

type Base = {
  id: string
  module: Module
  topic: string
  source: { assessment: Assessment; number: number }
  prompt: string
  explanation: string
  citations: Citation[]
  edit?: string
  code?: string
  exhibit?: { src: string; alt: string; credit: string }
}

export type ChoiceQuestion = Base & { type: 'single' | 'multiple'; choices: string[]; correct: number[] }
export type MatchingQuestion = Base & { type: 'matching'; targets: string[]; pairs: { term: string; target: number }[] }
export type Question = ChoiceQuestion | MatchingQuestion

const python = { label: 'Python documentation · Tutorial', href: 'https://docs.python.org/3/tutorial/' }
const linux = { label: 'GNU Coreutils · command reference', href: 'https://www.gnu.org/software/coreutils/manual/coreutils.html' }
const devasc = { label: 'Cisco · DEVASC course overview', href: 'https://www.cisco.com/c/dam/en_us/training-events/training-services/courses/developing-applications-and-automating-workflows-using-cisco-core-platforms-devasc.pdf' }
const devnet = { label: 'Cisco DevNet · About DevNet', href: 'https://developer.cisco.com/about/' }
const codeExchange = { label: 'Cisco DevNet · About Code Exchange', href: 'https://developer.cisco.com/site/codeexchange-about-page/' }
const automation = { label: 'Cisco DevNet · Network Automation', href: 'https://developer.cisco.com/network-automation/' }
const module3 = { label: 'DEVASC Module 3 · Software Development and Design', href: '/references/DEVASC_Module_3.md' }
const module4 = { label: 'DEVASC Module 4 · Understanding and Using APIs', href: '/references/DEVASC_Module_4.md' }

type Extra = Partial<Pick<Base, 'edit' | 'code' | 'exhibit' | 'citations'>>

function defaultCitations(module: Module, topic: string): Citation[] {
  if (module === 1) return /Python|data type|conditions|loop/i.test(topic) ? [python, devasc] : [linux, devasc]
  if (module === 2) return /Code Exchange/i.test(topic) ? [codeExchange] : /Automation|Ecosystem/i.test(topic) ? [automation] : [devnet]
  return module === 3 ? [module3] : [module4]
}

function choice(id: string, module: Module, topic: string, number: number, prompt: string, choices: string[], correct: number[], explanation: string, extra: Extra = {}): ChoiceQuestion {
  return {
    id, module, topic,
    source: { assessment: id.startsWith('midterm') ? 'Midterm Exam' : 'Summative Assessment 2', number },
    type: correct.length > 1 ? 'multiple' : 'single', prompt, choices, correct, explanation,
    citations: extra.citations ?? defaultCitations(module, topic),
    ...(extra.edit ? { edit: extra.edit } : {}),
    ...(extra.code ? { code: extra.code } : {}),
    ...(extra.exhibit ? { exhibit: extra.exhibit } : {}),
  }
}

function match(id: string, module: Module, topic: string, number: number, prompt: string, targets: string[], pairs: { term: string; target: number }[], explanation: string, extra: Extra = {}): MatchingQuestion {
  return {
    id, module, topic, source: { assessment: 'Midterm Exam', number }, type: 'matching', prompt, targets, pairs, explanation,
    citations: extra.citations ?? defaultCitations(module, topic),
    ...(extra.edit ? { edit: extra.edit } : {}),
  }
}

export const questions: Question[] = [
  choice('midterm-001', 1, 'Development environment', 1, 'Which lab includes system administration tasks?', ['API Lab', 'Python Lab', 'Linux Review Lab', 'Network Lab'], [2], 'The Linux Review Lab includes command-line and system-administration tasks.'),
  choice('midterm-002', 1, 'Python files', 2, 'Which Python method is used for reading and writing files?', ['writefile()', 'get()', 'open()', 'readfile()'], [2], 'open() opens a file and accepts modes such as r for reading and w for writing.'),
  choice('midterm-003', 1, 'Python loops', 3, 'Which Python loop is often used to iterate over a list?', ['def', 'for', 'while', 'if'], [1], 'A for loop iterates directly over each item in a Python iterable such as a list.'),
  choice('midterm-004', 1, 'Python data types', 4, 'Which Python structure is immutable?', ['List', 'Set', 'Tuple', 'Dictionary'], [2], 'A tuple cannot have its elements replaced after creation; the other structures are mutable.'),
  choice('midterm-005', 1, 'Virtualization', 5, 'A VM is also known as a:', ['Guest', 'Server', 'Sandbox', 'Container'], [0], 'A virtual machine running under a hypervisor is commonly called a guest.'),
  choice('midterm-006', 1, 'Course scope', 6, 'The DEVASC course prepares learners for:', ['Network automation and programmability', 'Mobile app development', 'Cloud gaming', 'Basic PC repair'], [0], 'DEVASC develops software, API, and automation skills for programmable networks.'),
  choice('midterm-007', 1, 'Python foundations', 7, 'Python is described as:', ['Free, open, and multiplatform', 'A proprietary language', 'Only used for gaming', 'Only used for mobile apps'], [0], 'Python is open source and runs on major operating systems.'),
  choice('midterm-008', 1, 'Python data types', 8, 'What symbol is used to define a dictionary in Python?', ['{}', '()', '[]', '<>'], [0], 'Dictionary displays and literals use curly braces around key-value pairs.'),
  choice('midterm-009', 1, 'Course scope', 9, 'Which module objective is emphasized in Module 1?', ['Use Python and Linux skills', 'Learn APIs', 'Manage cloud networks', 'Configure routers'], [0], 'Module 1 establishes the Python, Linux, and development-environment skills used later in DEVASC.'),
  choice('midterm-010', 1, 'Python conditions', 10, 'What Python statement is used for decision-making?', ['if', 'def', 'while', 'for'], [0], 'The if statement conditionally selects which block of code runs.'),
  choice('midterm-011', 1, 'Development environment', 11, 'What does VM stand for?', ['Virtual Model', 'Virtual Management', 'Virtual Machine', 'Virtual Module'], [2], 'VM abbreviates virtual machine, an isolated computer environment hosted through virtualization.'),
  choice('midterm-012', 1, 'Python labs', 12, 'Which lab covers reviewing data types and variables?', ['Python Programming Review Lab', 'Linux Review Lab', 'API Lab', 'Networking Lab'], [0], 'The Python Programming Review Lab covers Python variables and built-in data types.'),
  choice('midterm-013', 1, 'Linux commands', 13, 'Which of these is a Linux command to list files?', ['pwd', 'ls', 'cd', 'mkdir'], [1], 'ls lists directory contents; pwd, cd, and mkdir have different filesystem roles.'),
  choice('midterm-014', 1, 'Virtualization', 14, 'Which lab task involves preparing your computer for virtualization?', ['Linux Review', 'Networking Basics', 'Install the Virtual Lab Environment', 'Python Programming Review'], [2], 'Installing the Virtual Lab Environment prepares the host and VM used by the course labs.'),
  choice('midterm-015', 1, 'Linux foundations', 15, 'Linux is most commonly used in:', ['Gaming consoles only', 'Only Windows-based systems', 'Social media apps', 'Servers, IoT devices, smartphones'], [3], 'Linux is widely deployed across servers, embedded and IoT systems, and Android-based smartphones.'),
  choice('midterm-016', 1, 'Python conditions', 16, 'Under which condition will the elif statement be evaluated?', ['when the input is a string', 'when the first print statement fails', 'when the input is a float number', 'when the if statement is false'], [3], 'Python evaluates elif only when the preceding if condition is false.', {
    edit: 'Moved the inline script into a formatted code block and repaired spacing; logic and choices are unchanged.',
    code: 'aclNum = int(input("What is the IPv4 ACL number? "))\nif 1 <= aclNum <= 99:\n    print("This is a standard IPv4 ACL.")\nelif 100 <= aclNum <= 199:\n    print("This is an extended IPv4 ACL.")\nelse:\n    print("This is not a standard or extended IPv4 ACL.")',
  }),
  choice('midterm-017', 1, 'Linux permissions', 17, 'A Linux administrator lacks permission to configure a network interface. What should be entered before the configuration command?', ['use a different user account', 'change chmod permissions on the network configuration file', 'use the sudo command', 'identify a different network interface'], [2], 'sudo runs the authorized administrative command with elevated privileges.'),
  choice('midterm-018', 1, 'Linux networking', 18, 'What does the Linux command ifconfig -a display?', ['The host routing table.', 'The ARP table.', 'Both active and inactive interfaces.', 'Only active interfaces.'], [2], 'The -a option includes every interface, including interfaces that are currently inactive.', { edit: 'Shortened the scenario and answer wording without changing its technical meaning.' }),
  choice('midterm-019', 1, 'Python lists', 19, 'What is the value of switches after the script runs?', ["['SW4', 'SW1', 'SW2', 'SW3']", "['SW1', 'SW2', 'SW3', 'SW4']", "['SW4']", "['SW4', 'SW3', 'SW2', 'SW1']", "['SW1', 'SW2', 'SW3']"], [1], 'The loop appends every device name without R in its original order, including SW4.', {
    edit: 'Repaired a missing quote around SW1 and formatted the exported one-line script; intended logic is unchanged.',
    code: 'routers = []\nswitches = []\ndevices = ["RT1", "RT2", "RT3", "SW1", "SW2", "SW3"]\ndevices = devices + ["RT4", "SW4"]\nfor device in devices:\n    if "R" in device:\n        routers.append(device)\n    else:\n        switches.append(device)\nprint(switches)',
  }),
  choice('midterm-020', 1, 'Python data types', 20, 'Which data type represents ipAddress?', ['dictionary', 'tuple', 'array', 'list'], [0], 'Curly braces containing key-value pairs create a dictionary.', { edit: 'Separated the prompt from the code.', code: 'ipAddress = {"R1": "10.1.1.1", "R2": "10.2.2.1", "R3": "10.3.3.1"}' }),
  choice('midterm-021', 1, 'Python CLI', 21, 'Which command checks the installed Python version?', ['python3 -v', 'python3 -V', 'python3 -i', 'python3 -q'], [1], 'python3 -V (or --version) prints the interpreter version.', { edit: 'Normalized the source en dash in the first distractor to a command-line hyphen.' }),
  choice('midterm-022', 1, 'Linux permissions', 22, 'apt-get upgrade returns “permission denied” on Ubuntu. Which command should the user run?', ['sudo apt-get upgrade', 'apt-get install --allow', 'sudo apt-get install', 'allow apt-get upgrade'], [0], 'Package upgrades require administrative privileges, which sudo supplies for the command.', { edit: 'Condensed the scenario and normalized command-line hyphens.' }),
  choice('midterm-023', 1, 'Python expressions', 23, 'What is displayed by this Python code?', ['32', 'nothing, because print is wrong', 'SyntaxError because spaces are not allowed', '[22] + [10]'], [0], '22 + 10 evaluates to the integer 32, which print displays.', { edit: 'Moved the source code into a formatted block and corrected distractor capitalization.', code: 'addition = 22 + 10\nprint(addition)' }),
  choice('midterm-024', 1, 'Linux commands', 24, 'Which Linux command displays a long listing of the current directory?', ['ls -l', 'ls -a', 'ls -lr', 'ls'], [0], 'ls -l uses the long format with permissions, ownership, size, and timestamps.', { edit: 'Replaced the long terminal transcript with its defining output description.' }),
  choice('midterm-025', 1, 'Python lists', 25, 'What is the value of hostnames after the script runs?', ["['RT1', 'RT2', 'SW1', 'RT3', 'SW3']", "['RT1', 'RT2', 'SW1', 'SW2', 'SW3']", "['RT1', 'RT2', 'SW2', 'RT3', 'SW3']", "['RT1', 'RT2', 'RT3', 'SW2', 'SW3']"], [0], 'Index 3 contains SW2, so deleting it leaves RT1, RT2, SW1, RT3, and SW3.', { edit: 'Moved the source commands into a formatted block and repaired unmatched quote marks in one distractor.', code: 'devicenames = ["RT1", "RT2", "SW1", "SW2"]\nhostnames = devicenames + ["RT3", "SW3"]\ndel hostnames[3]\nprint(hostnames)' }),

  choice('midterm-026', 2, 'DevNet support', 26, 'DevNet forums are located at:', ['devnetsupport.cisco.com', 'facebook.com/cisco', 'dockerhub.com/cisco', 'github.com/devnet'], [0], 'Cisco routes developer support and community questions through its DevNet support services.', { citations: [{ label: 'Cisco DevNet · Support FAQ', href: 'https://developer.cisco.com/docs/devnet-support/support-faq/' }] }),
  choice('midterm-027', 2, 'Code Exchange', 27, 'Which DevNet resource is a repository of sample code?', ['Automation Exchange', 'Learning Labs', 'Code Exchange', 'Ecosystem Exchange'], [2], 'Code Exchange is Cisco DevNet’s curated collection of code repositories and automation examples.'),
  choice('midterm-028', 2, 'DevNet documentation', 28, 'Which online resource provides API documentation for developers?', ['Webex Teams', 'DevNet TV', 'Cisco Press', 'DevNet Home page at developer.cisco.com'], [3], 'The DevNet site provides Cisco API, SDK, and data-model documentation.'),
  choice('midterm-031', 2, 'Automation Exchange', 31, 'Which DevNet Exchange contains automation use cases for service providers?', ['Sandbox', 'Automation Exchange', 'Code Exchange', 'Ecosystem Exchange'], [1], 'Automation Exchange organized network-automation use cases across domains, including service-provider platforms.'),
  choice('midterm-032', 2, 'DevNet Sandboxes', 32, 'What is the purpose of DevNet Sandboxes?', ['Sell Cisco devices', 'Virtualize video games', 'Build physical networking labs', 'Provide hands-on exploration of software and APIs'], [3], 'Sandboxes provide pre-built Cisco environments for trying software, APIs, SDKs, and solutions.'),
  choice('midterm-034', 2, 'DevNet Sandboxes', 34, 'Which DevNet resource provides preconfigured environments with Cisco platforms?', ['Ecosystem Exchange', 'DevNet Sandbox', 'Code Exchange', 'GitHub'], [1], 'DevNet Sandbox supplies ready-to-use Cisco platform environments.'),
  choice('midterm-035', 2, 'Ecosystem Exchange', 35, 'Which DevNet Exchange lists solutions across industries and geographies?', ['Ecosystem Exchange', 'Router Exchange', 'Code Exchange', 'Automation Exchange'], [0], 'Ecosystem Exchange connects Cisco-platform solutions and services with customers across markets.'),
  choice('midterm-037', 2, 'DevNet platform', 37, 'DevNet developer program integrates which of the following?', ['Website, tools, sandboxes, forums, documentation', 'Virtual gaming environments', 'Cisco router sales', 'Linux-only training'], [0], 'DevNet combines developer documentation, learning tools, Sandboxes, and community support.'),
  choice('midterm-038', 2, 'Code Exchange', 38, 'Which DevNet Exchange uses GitHub repositories as its source?', ['Learning Labs', 'Automation Exchange', 'Ecosystem Exchange', 'Code Exchange'], [3], 'Code Exchange indexes qualified public GitHub repositories and links back to their source.'),
  choice('midterm-040', 2, 'Ecosystem Exchange', 40, 'What is the DevNet Ecosystem Exchange best for?', ['Storing Docker containers', 'Finding diverse Cisco-related solutions', 'Selling routers', 'Code-only libraries'], [1], 'Ecosystem Exchange helps users discover partner solutions and services built for Cisco platforms.'),
  choice('midterm-041', 2, 'DevNet platform', 41, 'What are three major areas that comprise DevNet? (Choose three.)', ['website creation and maintenance support', 'automation standards development', 'interactive developer community', 'training for unrelated technology vendors', 'integrated community forums', 'coordinated developer tools'], [2, 4, 5], 'DevNet centers on a collaborative developer community, integrated forums, and coordinated tools and learning resources.', { edit: 'Shortened repetitive distractor wording while preserving all six concepts.' }),
  choice('midterm-042', 2, 'DevNet accounts', 42, 'What is required when creating a Cisco DevNet account for Learning Labs and Sandbox access?', ['Share personal code first', 'Purchase a license', 'Use a Cisco employee email', 'Use an existing online identity or create a Cisco account'], [3], 'DevNet access uses a Cisco account or supported online identity; paid licensing and code submission are not prerequisites.', { edit: 'Condensed the scenario and choices without changing their meaning.' }),
  choice('midterm-044', 2, 'DevNet learning path', 44, 'What type of learner should take the DevNet Associate course?', ['only new software developers', 'only new network engineers', 'anyone interested in network automation and programmability', 'anyone that does not like working in teams and is a software developer'], [2], 'The course joins software development with network automation, so it serves learners across technical roles.'),
  choice('midterm-046', 2, 'Learning Labs', 46, 'What are two requirements for participating in DevNet Learning Labs? (Choose two.)', ['Log in with a DevNet account', 'Have an active internet connection', 'Pass the DEVASC exam', 'Purchase a Learning Labs license', 'Install a local developer environment'], [0, 1], 'Learning Labs are online and free; participation requires account access and an internet connection.'),
  choice('midterm-047', 2, 'Application connectivity', 47, 'What is required so clients can communicate with applications outside a local system?', ['a script', 'a network', 'an application', 'an API'], [1], 'A network provides connectivity between clients and applications on different systems.'),
  choice('midterm-048', 2, 'Learning Labs', 48, 'Which Learning Labs link provides access to the largest collections of labs?', ['Sections', 'Tracks', 'Bookends', 'Modules'], [1], 'Tracks group the broadest collections of related Learning Labs into guided paths.'),
  choice('midterm-049', 2, 'Automation Exchange', 49, 'Which DevNet resource provides network-automation use cases such as gathering data and activating policies across domains?', ['DevNet Learning Labs', 'Code Exchange', 'Automation Exchange', 'DevNet Sandbox'], [2], 'Automation Exchange presents use cases that progress from visibility to policy activation and operational automation.'),

  choice('midterm-051', 3, 'Data formats', 51, 'Which is the main advantage of YAML?', ['Human readability', 'Machine efficiency', 'Complexity', 'Binary storage'], [0], 'YAML uses readable text and indentation and is designed for easy human authoring.'),
  choice('midterm-052', 3, 'Agile', 52, 'Which Agile principle emphasizes customer involvement?', ['Customer collaboration', 'Ignoring change', 'Documentation', 'Following a strict plan'], [0], 'The Agile Manifesto values customer collaboration over contract negotiation.'),
  choice('midterm-053', 3, 'Design patterns', 53, 'Which design pattern notifies objects when state changes?', ['Observer', 'Factory', 'Singleton', 'Adapter'], [0], 'Observer maintains subscribers and notifies them when the observed subject changes.'),
  choice('midterm-054', 3, 'Testing', 54, 'Which testing ensures old features still work after changes?', ['Regression Testing', 'System Testing', 'Load Testing', 'Smoke Testing'], [0], 'Regression testing checks that changes have not broken previously working behavior.'),
  choice('midterm-055', 3, 'Python functions', 55, 'Which keyword defines a function in Python?', ['return', 'function', 'def', 'func'], [2], 'Python begins a function definition with the def keyword.'),
  choice('midterm-056', 3, 'Continuous Integration', 56, 'Continuous Integration (CI) focuses on:', ['Frequently merging code changes', 'Replacing Agile', 'Writing documentation', 'Final deployment'], [0], 'CI integrates small code changes frequently so automated checks can detect problems early.'),
  choice('midterm-057', 3, 'Git', 57, 'Which Git command initializes a repository?', ['git push', 'git status', 'git init', 'git clone'], [2], 'git init creates an empty Git repository or turns an existing folder into one.'),
  choice('midterm-058', 3, 'DevOps', 58, 'DevOps encourages collaboration between:', ['Developers and operations', 'Developers and clients', 'Customers and testers', 'Designers and analysts'], [0], 'DevOps joins software-development and IT-operations work across the delivery lifecycle.'),
  choice('midterm-059', 3, 'Software principles', 59, 'Which principle says “Keep It Simple, Stupid”?', ['SOLID', 'DRY', 'Agile', 'KISS'], [3], 'KISS is the acronym for “Keep It Simple, Stupid.”'),
  choice('midterm-060', 3, 'Git', 60, 'Which Git command combines branch changes?', ['git checkout', 'git init', 'git merge', 'git clone'], [2], 'git merge integrates changes from another branch into the current branch.'),
  choice('midterm-061', 3, 'Git', 61, 'Which Git command stages changes for commit?', ['git add', 'git commit', 'git branch', 'git push'], [0], 'git add places selected working-tree changes into the staging area.'),
  choice('midterm-062', 3, 'Agile', 62, 'What is the primary advantage of Agile?', ['Heavy documentation', 'Long release cycles', 'Flexibility and adaptability', 'Predictability'], [2], 'Agile’s iterative approach makes it easier to respond to changing needs and feedback.'),
  choice('midterm-063', 3, 'SDLC', 63, 'Which phase of the SDLC involves coding and building the software?', ['Design', 'Implementation', 'Maintenance', 'Requirements'], [1], 'The implementation phase turns the design into functional code.'),
  choice('midterm-064', 3, 'Software principles', 64, 'Which principle encourages short, focused functions?', ['YAGNI', 'KISS', 'DRY', 'Single Responsibility Principle'], [3], 'Single Responsibility keeps a unit focused on one reason to change, encouraging cohesive functions.'),
  choice('midterm-065', 3, 'Python modules', 65, 'How does an application use a module in Python?', ['with an assignment statement', 'by calling only the module name', 'with an include statement', 'with an import statement'], [3], 'An import statement loads a module so its definitions can be used.'),
  choice('midterm-066', 3, 'Git', 66, 'What are the three states of a Git file? (Choose three.)', ['locked', 'deleted', 'staged', 'secured', 'committed', 'modified'], [2, 4, 5], 'The module identifies committed, modified, and staged as the three Git file states.'),
  choice('midterm-067', 3, 'Waterfall', 67, 'Which statement describes Waterfall software development?', ['It eliminates waste to maximize value.', 'Each step must finish before the next starts.', 'Multiple steps always start simultaneously.', 'Work is split into sprints.'], [1], 'Waterfall proceeds sequentially, completing each defined phase before moving to the next.', { edit: 'Condensed the answer wording while preserving each methodology distinction.' }),
  choice('midterm-068', 3, 'MVC', 68, 'What is the controller’s role in the Model-View-Controller flow?', ['Format input only for the model.', 'Format user input for the model or view.', 'Display selected data.', 'Provide visual representations of data.'], [1], 'The controller mediates between model and view by handling and formatting user input.', { edit: 'Shortened the four choices without changing their roles.' }),
  choice('midterm-069', 3, 'MVC', 69, 'What is the view’s role in the Model-View-Controller flow?', ['Display the visual representation of selected data.', 'Manage application data and rules.', 'Format user input for the model.', 'Apply rules to input data.'], [0], 'The view presents the model’s selected data to the user.', { edit: 'Shortened the choices without changing their MVC roles.' }),
  choice('midterm-070', 3, 'Code review', 70, 'Which review method has the developer walk through code line by line with a reviewer and make changes immediately?', ['formal', 'over-the-shoulder', 'change-based', 'email pass-around'], [1], 'An over-the-shoulder review is a live walkthrough between the author and reviewer.'),
  match('midterm-071', 3, 'Git', 71, 'Match the Git command with its function.', ['updates the local repository from the remote', 'creates an empty repository or makes a folder a repository', 'updates the remote repository from local changes'], [{ term: 'git pull', target: 0 }, { term: 'git init', target: 1 }, { term: 'git push', target: 2 }], 'pull retrieves and integrates remote work, init creates a repository, and push sends local commits to a remote.', { edit: 'Shortened the repeated matching targets without changing their meaning.' }),
  choice('midterm-072', 3, 'Python functions', 72, 'Which two programming components are blocks of code that perform tasks when executed? (Choose two.)', ['parameters', 'arguments', 'methods', 'functions', 'objects'], [2, 3], 'Methods and functions are executable blocks of code; parameters and arguments supply their data.'),
  choice('midterm-073', 3, 'Git', 73, 'What are two characteristics of Git? (Choose two.)', ['It is a local-only VCS.', 'It is centralized.', 'It is open source.', 'It is Cisco proprietary.', 'It is Microsoft proprietary.', 'It is distributed.'], [2, 5], 'Git is an open-source distributed version-control system.'),
  choice('midterm-074', 3, 'Python classes', 74, 'Which command creates a Uri object whose url attribute is a valid URL?', ["url2 = Uri('http', 'www.cisco.com')", "url2 = Uri('http', '://', 'www.cisco.com')", "url2 = Uri('www.cisco.com', 'http')", "url2 = Uri(Uri, 'http://', 'www.cisco.com')"], [2], 'The constructor expects host first and protocol second, then joins them as protocol://host.', {
    edit: 'Repaired the exported constructor spelling (__init__), indentation, and inconsistent Uri/Url class names in the choices.',
    code: 'class Uri:\n    def __init__(self, host, prot):\n        self.host = host\n        self.prot = prot\n        self.url = self.prot + "://" + self.host',
  }),

  choice('midterm-075', 4, 'HTTP status', 75, 'Which status code means “Service Unavailable”?', ['502', '200', '503', '400'], [2], 'HTTP 503 means the server is temporarily unable to handle the request.'),
  choice('midterm-076', 4, 'API design', 76, 'Which API design style allows execution to continue while waiting for a response?', ['Asynchronous', 'REST', 'SOAP', 'Synchronous'], [0], 'Asynchronous processing lets the application continue other work while the response is pending.'),
  choice('midterm-077', 4, 'RPC', 77, 'RPC stands for:', ['Random Protocol Communication', 'Resource Protocol Control', 'Remote Procedure Call'], [2], 'RPC expands to Remote Procedure Call.'),
  choice('midterm-078', 4, 'Authentication', 78, 'Which authentication mechanism transmits Base64-encoded credentials?', ['Bearer Token', 'Basic Authentication', 'OAuth', 'API Key'], [1], 'Basic Authentication encodes a username:password pair with Base64; encoding is not encryption.'),
  choice('midterm-079', 4, 'Rate limits', 79, 'Which rate-limit algorithm uses tokens consumed per request?', ['Token Bucket', 'Leaky Bucket', 'Sliding Window Counter', 'Fixed Window Counter'], [0], 'Token Bucket removes a token for each accepted request and rejects requests when none remain.'),
  choice('midterm-080', 4, 'HTTP status', 80, 'Which category of HTTP status codes indicates success?', ['1xx', '4xx', '2xx', '3xx'], [2], 'The 2xx class reports successful receipt and handling of a request.'),
  choice('midterm-081', 4, 'Authentication', 81, 'Which authentication method uses unique alphanumeric keys assigned to users?', ['Basic Authentication', 'Bearer Token', 'API Key', 'Certificate'], [2], 'API-key authentication identifies a caller with an assigned key value.'),
  choice('midterm-082', 4, 'APIs', 82, 'What is the primary purpose of an API?', ['Let software communicate only with hardware', 'Let one piece of software communicate with another', 'Replace operating systems', 'Configure only network devices'], [1], 'An API defines how one software component requests services or data from another.'),
  choice('midterm-083', 4, 'Webhooks', 83, 'Which requirement is necessary to consume a webhook?', ['Send a GET request', 'Keep the application running to receive HTTP POST', 'Disable SSL', 'Poll the server'], [1], 'A webhook consumer must be available to receive the provider’s HTTP POST notifications.'),
  choice('midterm-084', 4, 'Authorization', 84, 'Which protocol is widely used for combining authentication and authorization?', ['Bearer Token', 'OAuth', 'API Key', 'Basic Authentication'], [1], 'OAuth provides delegated authorization and is commonly used alongside authentication flows.'),
  choice('midterm-085', 4, 'HTTP methods', 85, 'Which HTTP method is used to retrieve data from a server?', ['PUT', 'GET', 'DELETE', 'POST'], [1], 'GET requests a representation of a resource without asking the server to update it.'),
  choice('midterm-086', 4, 'HTTP methods', 86, 'Which HTTP method is used to remove a resource?', ['GET', 'DELETE', 'PUT', 'POST'], [1], 'DELETE requests removal of the target resource.'),
  choice('midterm-087', 4, 'URI', 87, 'Which part of a URI provides filtering or additional request details?', ['Authority', 'Query', 'Scheme', 'Path'], [1], 'The query component supplies scope, filtering, and other request details.'),
  choice('midterm-088', 4, 'Rate limits', 88, 'Which rate-limit algorithm checks requests within a moving time frame?', ['Token Bucket', 'Sliding Window Counter', 'Leaky Bucket', 'Fixed Window Counter'], [1], 'A sliding-window counter evaluates recent requests over a window that moves with the current time.'),
  choice('midterm-089', 4, 'URI', 89, 'Which part of a URI represents the host and port?', ['Path', 'Scheme', 'Authority', 'Query'], [2], 'The authority component contains the host and optional port.'),
  choice('midterm-091', 4, 'SOAP', 91, 'Which SOAP characteristic allows different application types and operating systems to communicate?', ['independence', 'interface uniformity', 'extensibility', 'neutrality'], [0], 'SOAP is independent: applications on different platforms and in different languages can communicate.', { edit: 'Clarified the source phrase “similar and dissimilar application types.”' }),
  choice('midterm-092', 4, 'Rate limits', 92, 'What are two purposes of rate limits on public, unrestricted APIs? (Choose two.)', ['Require multifactor authentication', 'Provide better service and response time', 'Limit authorization requests per call', 'Prevent server overload from too many requests', 'Limit how many passwords a client has'], [1, 3], 'Rate limiting protects capacity from request bursts and keeps service responsive for all users.'),
  choice('midterm-093', 4, 'Rate limits', 93, 'Which algorithm queues requests in arrival order and processes them at a fixed rate?', ['Token Bucket', 'Sliding Window Counter', 'Fixed Window Counter', 'Leaky Bucket'], [3], 'Leaky Bucket accepts requests into a queue and drains that queue at a fixed rate.'),
  choice('midterm-094', 4, 'APIs', 94, 'Why would a network engineer use APIs?', ['Bridge device features across unrelated layers', 'Automate configuration or data collection', 'Only provide management reports', 'Replace the security architecture'], [1], 'APIs let engineers automate repeatable configuration and data-collection workflows.'),
  match('midterm-095', 4, 'REST and CRUD', 95, 'Match the RESTful API method to the CRUD function.', ['UPDATE', 'DELETE', 'ERASE', 'CREATE', 'READ'], [{ term: 'GET', target: 4 }, { term: 'POST', target: 3 }, { term: 'DELETE', target: 2 }, { term: 'PUT/PATCH', target: 0 }], 'GET reads, POST creates, DELETE erases, and PUT or PATCH updates. “DELETE” remains an unused source distractor.', { edit: 'Added “the” to the prompt; preserved the source’s ERASE answer and unused DELETE distractor.' }),
  choice('midterm-096', 4, 'HTTP headers', 96, 'Which three values are valid for the Accept-Encoding request header? (Choose three.)', ['br', 'xz', 'gzip', 'zip', 'tar', '*'], [0, 2, 5], 'The module lists br, gzip, and the wildcard * among valid Accept-Encoding values.'),
  choice('midterm-097', 4, 'URI troubleshooting', 97, 'Refer to the exhibit. What error in the URI causes the MissingSchema traceback?', ['The query is missing.', 'The path is invalid.', 'The protocol is missing.', 'The destination host is invalid.'], [2], 'The URL starts with the host and lacks an http:// or https:// scheme, so requests reports MissingSchema.', {
    edit: 'Condensed the scenario while retaining the exhibit-dependent diagnosis.',
    exhibit: { src: '/exhibits/midterm-97.jpg', alt: 'Python requests code whose URL begins with sandboxdnac.cisco.com and a MissingSchema traceback.', credit: 'Midterm Exam question 97; locally bundled from the export.' },
  }),
  choice('midterm-098', 4, 'SOAP', 98, 'How many elements may a SOAP message contain?', ['3', '2', '5', '4'], [3], 'A SOAP XML document may contain Envelope, Header, Body, and Fault: four elements.'),

  choice('summative-002', 3, 'Testing', 2, 'Which testing checks small pieces of code in isolation?', ['Integration Testing', 'System Testing', 'Load Testing', 'Unit Testing'], [3], 'Unit testing checks individual functions, classes, or other small components in isolation.'),
  choice('summative-003', 3, 'Testing', 3, 'Which testing ensures modules work together correctly?', ['Stress Testing', 'Unit Testing', 'Regression Testing', 'Integration Testing'], [3], 'Integration testing checks the interfaces and behavior between combined components.'),
  choice('summative-005', 3, 'Python loops', 5, 'Which loop runs while a condition is true?', ['for', 'until', 'while', 'repeat'], [2], 'A while loop repeats as long as its condition evaluates to true.'),
  choice('summative-006', 3, 'Code quality', 6, 'Which practice improves readability?', ['Meaningful variable names', 'Inline logic everywhere', 'Long functions', 'Random variable names'], [0], 'Meaningful names communicate intent and reduce the effort needed to understand code.'),
  choice('summative-007', 3, 'Agile', 7, 'Which SDLC model uses short, iterative development cycles?', ['Waterfall', 'V-Model', 'Agile', 'Spiral'], [2], 'Agile delivers work in short iterations and adapts through frequent feedback.'),
  choice('summative-008', 3, 'Git', 8, 'Which Git command uploads commits to a remote?', ['git push', 'git init', 'git add', 'git commit'], [0], 'git push sends local commits to a configured remote repository.'),
  choice('summative-009', 3, 'Git', 9, 'Which Git command saves changes permanently to history?', ['git commit', 'git add', 'git branch', 'git log'], [0], 'git commit records the staged snapshot in repository history.'),
  choice('summative-010', 3, 'SDLC', 10, 'Which SDLC phase ensures the system aligns with business needs?', ['Testing', 'Implementation', 'Design', 'Requirements Analysis'], [3], 'Requirements analysis establishes what stakeholders and the business need the system to do.'),
  choice('summative-011', 3, 'Data formats', 11, 'Which format uses tags to store data?', ['YAML', 'XML', 'JSON', 'CSV'], [1], 'XML marks up data with nested opening and closing tags.'),
  choice('summative-012', 3, 'Python data types', 12, 'Which Python structure stores key-value pairs?', ['Tuple', 'Dictionary', 'List', 'Array'], [1], 'A dictionary maps unique keys to values.'),
  choice('summative-014', 3, 'Testing', 14, 'Which testing validates the full system functionality?', ['System Testing', 'Smoke Testing', 'Integration Testing', 'Unit Testing'], [0], 'System testing evaluates the complete integrated system against its requirements.'),
  choice('summative-016', 3, 'Data formats', 16, 'JSON arrays are represented with:', ['–', '{}', '[]', '<>'], [2], 'JSON encloses array elements in square brackets.'),
  choice('summative-019', 3, 'SDLC', 19, 'Which SDLC phase fixes bugs and improves software after release?', ['Design', 'Requirements', 'Maintenance', 'Testing'], [2], 'Maintenance covers post-release corrections, updates, and improvements.'),
  choice('summative-021', 3, 'Python conditions', 21, 'Which keyword is used for decision-making?', ['for', 'while', 'else', 'if'], [3], 'if begins a conditional decision in Python.'),
  choice('summative-022', 3, 'Git', 22, 'Which Git command copies a remote repository?', ['git pull', 'git clone', 'git init', 'git checkout'], [1], 'git clone creates a new local repository from an existing remote.'),
  choice('summative-023', 3, 'Agile', 23, 'Which Agile framework is based on sprints and stand-ups?', ['Scrum', 'Lean', 'XP', 'Kanban'], [0], 'Scrum organizes work into sprints and uses a daily stand-up for coordination.'),

  choice('summative-027', 4, 'HTTP status', 27, 'Which category of HTTP status codes indicates a server error?', ['2xx', '1xx', '3xx', '5xx'], [3], 'The 5xx class reports failures on the server side.'),
  choice('summative-029', 4, 'APIs', 29, 'What does API stand for?', ['Automated Protocol Interface', 'Application Programming Interface', 'Advanced Program Interaction'], [1], 'API expands to Application Programming Interface.'),
  choice('summative-030', 4, 'OAuth', 30, 'Which version of OAuth is not backward compatible?', ['OAuth 1.0', 'OAuth 2.0', 'None', 'OAuth 3.0'], [1], 'OAuth 2.0 is a separate framework and is not backward compatible with OAuth 1.0.'),
  choice('summative-032', 4, 'SOAP', 32, 'SOAP uses which format for messaging?', ['CSV', 'YAML', 'JSON', 'XML'], [3], 'SOAP messages are XML documents.'),
  choice('summative-033', 4, 'REST', 33, 'Which is NOT one of the six REST principles?', ['Stateless', 'Multi-threading', 'Client-Server', 'Cache'], [1], 'REST includes client-server, statelessness, and cacheability; multi-threading is not a REST constraint.'),
  choice('summative-034', 4, 'HTTP status', 34, 'Which error category represents client-side mistakes?', ['4xx', '2xx', '5xx', '1xx'], [0], 'The 4xx status class reports client errors such as invalid requests or missing resources.'),
  choice('summative-035', 4, 'HTTP status', 35, 'Which HTTP status code means “No Content”?', ['201', '204', '200', '404'], [1], 'HTTP 204 reports success with no response body.'),
  choice('summative-036', 4, 'Authentication', 36, 'Authentication proves:', ['Server availability', 'Data encryption', 'Permissions of the user', 'Identity of the user'], [3], 'Authentication verifies who the user or caller is.'),
  choice('summative-037', 4, 'HTTP headers', 37, 'In an HTTP header, information is formatted as:', ['Data|Type', 'Value-Name', 'Name:Value', 'Key=Value'], [2], 'An HTTP header field is written as a field name, colon, and field value.'),
  choice('summative-039', 4, 'HTTP status', 39, 'Which error category represents server-side mistakes?', ['4xx', '5xx', '2xx', '1xx'], [1], 'The 5xx class signals that the server failed to fulfill a valid request.'),
  choice('summative-040', 4, 'HTTP status', 40, 'Which HTTP status code means “OK”?', ['201', '200', '404', '400'], [1], 'HTTP 200 is the standard successful “OK” response.'),
  choice('summative-041', 4, 'Authorization', 41, 'Authorization defines:', ['Encryption standards', 'Token format', 'Permissions of the user', 'Identity of the user'], [2], 'Authorization determines what an authenticated user is allowed to access or do.'),
  choice('summative-042', 4, 'SOAP', 42, 'Which is NOT a characteristic of SOAP?', ['Independent', 'Extensible', 'Stateless', 'Neutral'], [2], 'The module identifies SOAP as independent, extensible, and protocol-neutral; stateless is not listed.'),
  choice('summative-043', 4, 'URI', 43, 'Which part of a URI specifies the protocol (http/https)?', ['Query', 'Scheme', 'Authority', 'Path'], [1], 'The scheme identifies the protocol, such as http or https.'),
  choice('summative-044', 4, 'Webhooks', 44, 'A webhook is also known as:', ['Forward API', 'Reverse API', 'RESTful API', 'Proxy API'], [1], 'Webhooks are called reverse APIs because consumers register to receive provider-initiated callbacks.'),
  choice('summative-045', 4, 'REST', 45, 'REST was authored by:', ['Tim Berners-Lee', 'Linus Torvalds', 'Roy Thomas Fielding', 'Dennis Ritchie'], [2], 'Roy Fielding defined the REST architectural style in his doctoral dissertation.'),
  choice('summative-049', 4, 'HTTP status', 49, 'Which HTTP status code means “Not Found”?', ['404', '400', '201', '200'], [0], 'HTTP 404 indicates that the server did not find the requested resource.'),
]

export const questionById = new Map(questions.map((question) => [question.id, question]))
