import type { ExamRecord, ExamCategory } from '../types/exam';

export interface ExamPatternInfo {
  mode: string;
  totalQuestions: string;
  totalMarks: string;
  markingScheme: string;
  durationText: string;
  medium: string;
  shifts: string;
}

export interface SectionBreakdown {
  name: string;
  weightage: string;
  keyTopics: string[];
  strategy: string;
}

export interface PreparationPhase {
  title: string;
  timeframe: string;
  focus: string;
  deliverables: string[];
}

export interface DetailedExamContent {
  pattern: ExamPatternInfo;
  sections: SectionBreakdown[];
  phases: PreparationPhase[];
  examDayGuidelines: {
    mandatoryDocuments: string[];
    prohibitedItems: string[];
    dressCode: string[];
    reportingProtocol: string;
  };
  eligibilitySummary: string[];
  admitCardProtocol: string[];
  additionalFaqs: Array<{ question: string; answer: string }>;
}

export function getDetailedExamContent(exam: ExamRecord): DetailedExamContent {
  const duration = exam.durationMinutes || 180;
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  const durationText = `${duration} minutes (${hours > 0 ? `${hours} hour${hours > 1 ? 's' : ''}` : ''}${minutes > 0 ? ` ${minutes} mins` : ''})`;

  switch (exam.category) {
    case 'medical':
      return {
        pattern: {
          mode: exam.id.includes('ug') ? 'Pen-and-Paper (OMR Offline Mode)' : 'Computer-Based Test (CBT Online Mode)',
          totalQuestions: exam.id.includes('ug') ? '200 Questions (180 to be attempted across Section A & B)' : '200 Multiple Choice Questions',
          totalMarks: exam.id.includes('ug') ? '720 Marks' : '800 Marks',
          markingScheme: '+4 marks for each correct response, -1 mark penalty for each incorrect response, 0 for unattempted questions.',
          durationText,
          medium: exam.id.includes('ug') ? '13 Languages (English, Hindi, Assamese, Bengali, Gujarati, Kannada, Malayalam, Marathi, Odia, Punjabi, Tamil, Telugu, Urdu)' : 'English Only',
          shifts: exam.startTime && exam.endTime ? `${exam.startTime} to ${exam.endTime} IST (Single Afternoon Shift)` : 'Single Session: 02:00 PM to 05:20 PM IST',
        },
        sections: [
          {
            name: 'Biology (Botany & Zoology)',
            weightage: '50% of Paper (360 Marks / 90 Questions to attempt)',
            keyTopics: ['Human Physiology (Endocrine, Circulatory, Neural Control)', 'Genetics & Evolution (Mendelian Genetics, DNA Replication, Protein Synthesis)', 'Ecology & Environment', 'Cell Biology & Biomolecules', 'Plant Physiology & Photosynthesis'],
            strategy: 'Biology is the primary rank-decider. Read every line, diagram caption, and summary table in Class 11 and Class 12 NCERT textbooks. Practice attempting 90 questions in 40 to 45 minutes during timed mock simulations to preserve time for numerical calculation in Physics.',
          },
          {
            name: 'Physics',
            weightage: '25% of Paper (180 Marks / 45 Questions to attempt)',
            keyTopics: ['Mechanics (Work Energy Power, Rotational Dynamics, Gravitation)', 'Electrodynamics & Current Electricity', 'Modern Physics (Photoelectric Effect, Nuclear Physics, Semiconductors)', 'Optics (Ray and Wave Optics)', 'Thermodynamics & Kinetic Theory'],
            strategy: 'Focus heavily on formula memorization and units/dimensions. Solve the previous 15 years of NEET and AIPMT question papers. Pay special attention to Modern Physics and Semiconductors, which offer consistent high-yield returns with direct formula applications.',
          },
          {
            name: 'Chemistry',
            weightage: '25% of Paper (180 Marks / 45 Questions to attempt)',
            keyTopics: ['Inorganic Chemistry (Coordination Compounds, Chemical Bonding, p-Block & d-Block)', 'Organic Chemistry (Name Reactions, Reaction Mechanisms, Biomolecules)', 'Physical Chemistry (Electrochemistry, Chemical Kinetics, Solutions, Thermodynamics)'],
            strategy: 'Treat NCERT as the definitive bible for Inorganic and Organic Chemistry. Tabulate named reactions and their intermediate reagents. In Physical Chemistry, practice numerical calculation by hand without relying on calculators to build computational speed.',
          },
        ],
        phases: [
          {
            title: 'Phase 1: NCERT Line-by-Line Mastery & Concept Foundation',
            timeframe: '60+ Days Out',
            focus: 'Exhaustive syllabus coverage with primary focus on Biology and NCERT line-by-line synthesis.',
            deliverables: ['Complete self-authored short notes for all 38 chapters in Biology.', 'Create formula sheets for Mechanics, Electrodynamics, and Physical Chemistry.', 'Solve chapter-wise previous year questions (PYQs) immediately after revising each textbook unit.'],
          },
          {
            title: 'Phase 2: Timed Sectional Speed Drills & Trap Identification',
            timeframe: '30 to 60 Days Out',
            focus: 'Transitioning from chapter knowledge to timed question execution with strict penalty minimization.',
            deliverables: ['Attempt daily 45-minute timed sectional tests for Physics and Chemistry.', 'Identify recurring calculation and conceptual errors in a dedicated error analysis logbook.', 'Conduct complete NCERT Inorganic line-by-line revision twice a week.'],
          },
          {
            title: 'Phase 3: Full-Length Simulation & Circadian Clock Synchronization',
            timeframe: 'Final 30 Days',
            focus: 'Replicating official test environment and training cognitive alertness during the exact session hours.',
            deliverables: ['Solve full 200-minute mock tests strictly between 02:00 PM and 05:20 PM IST on physical OMR sheets.', 'Eliminate afternoon naps to train peak neurological focus during official exam hours.', 'Review only formula sheets, error logbooks, and high-yield NCERT diagrams in the final 7 days.'],
          },
        ],
        examDayGuidelines: {
          mandatoryDocuments: [
            'Printed admit card on clear A4 paper with passport photograph firmly pasted and left-hand thumb impression affixed before reaching the centre.',
            'Original government-issued valid photo ID (Aadhaar Card with updated photograph, Passport, Voter ID, PAN Card, or Driving License).',
            'One additional passport-size photograph identical to the application upload for attendance sheet verification.',
            'Original PwD/PwBD certificate issued by the competent authority, if claiming reservation or compensatory time.',
          ],
          prohibitedItems: [
            'All electronic devices including mobile phones, smartwatches, Bluetooth headphones, fitness trackers, and health bands.',
            'Stationery items such as geometry boxes, pencil pouches, log tables, calculators, writing pads, or blank scrap sheets (pens are provided inside the hall).',
            'Wallets, handbags, goggles, caps, metallic ornaments, rings, bracelets, and metallic hairpins.',
            'Food items, snacks, or opaque water bottles (only transparent 500ml water bottles are allowed).',
          ],
          dressCode: [
            'Light clothes with half sleeves without large buttons, badges, brooches, or heavy embroidery.',
            'Slippers or sandals with low heels; closed shoes, boots, and sneakers are strictly prohibited.',
            'Candidates wearing customary or religious attire (e.g., burqa, turban, kirpan) must report to the examination center at least 2 hours before gate closure for mandatory physical frisking.',
          ],
          reportingProtocol: 'Report to your designated examination center strictly during your assigned reporting slot (typically between 11:30 AM and 01:30 PM IST). Center gates close permanently at 01:30 PM sharp; no candidate is admitted thereafter under any circumstances.',
        },
        eligibilitySummary: [
          'Candidate must have completed 17 years of age on or before December 31 of the examination year.',
          'Must have passed Physics, Chemistry, Biology/Biotechnology, and English individually with a minimum aggregate of 50% marks (40% for SC/ST/OBC-NCL, 45% for PwD) in the 10+2 qualifying examination.',
          'No upper age limit restriction applies as per current regulatory guidelines.',
          'Indian Nationals, NRIs, OCIs, and Foreign Nationals are eligible under respective quota regulations.',
        ],
        admitCardProtocol: [
          'The official conducting authority typically releases hall tickets 3 to 7 days prior to the examination date on their official portal.',
          'Verify that your name, roll number, photograph, signature, test center address, barcode, and medium of paper match your confirmation page.',
          'Ensure the barcode and QR code are printed clearly without smudges or creases.',
          'Immediately notify the official helpdesk portal if you observe any discrepancy in demographic details or examination medium.',
        ],
        additionalFaqs: [
          {
            question: `What is the negative marking penalty in ${exam.shortName}?`,
            answer: 'Each correct answer awards +4 marks, while each incorrect response incurs a deduction of -1 mark. Unanswered questions receive 0 marks. Marking two options for a single question is automatically scored as an incorrect attempt and penalized with -1 mark.',
          },
          {
            question: `Are scratch papers or rough sheets provided in ${exam.shortName}?`,
            answer: 'In pen-and-paper examinations, blank rough space is provided directly at the bottom and back of the test booklet. In online CBT examinations, blank scribble sheets are supplied by the center invigilator and must be surrendered before leaving.',
          },
          {
            question: `Can I change the examination center after admit card issuance?`,
            answer: 'No. The conducting authority strictly prohibits changes to designated examination centers, shift timings, or cities once the admit card has been officially generated.',
          },
          {
            question: `What should I do if my admit card photo is blurred or missing?`,
            answer: 'Carry two recent passport-size photographs identical to your application form along with a printout of your application confirmation page and valid government ID to the center superintendent on exam morning.',
          },
        ],
      };

    case 'engineering':
      return {
        pattern: {
          mode: 'Computer-Based Test (CBT Online Mode)',
          totalQuestions: exam.id.includes('gate') ? '65 Questions (10 General Aptitude + 55 Subject Specific)' : '90 Questions (75 to be attempted: 20 MCQs + 5 Numerical Value Questions per subject)',
          totalMarks: exam.id.includes('gate') ? '100 Marks' : '300 Marks',
          markingScheme: '+4 for correct MCQ, -1 for incorrect MCQ. Numerical questions carry +4 marks with -1 negative marking penalty. Unattempted questions receive 0.',
          durationText,
          medium: '13 National and Regional Languages including English and Hindi',
          shifts: exam.startTime && exam.endTime ? `${exam.startTime} to ${exam.endTime} IST` : 'Shift 1: 09:00 AM to 12:00 PM | Shift 2: 03:00 PM to 06:00 PM IST',
        },
        sections: [
          {
            name: 'Mathematics',
            weightage: '33.3% of Paper (100 Marks / 25 Questions to attempt)',
            keyTopics: ['Calculus (Definite Integrals, Differential Equations, Application of Derivatives)', 'Coordinate Geometry (Conic Sections, Circles, Straight Lines)', 'Vectors & 3D Geometry', 'Algebra (Matrices & Determinants, Sequences & Series, Complex Numbers)', 'Probability & Statistics'],
            strategy: 'Mathematics requires rigorous problem-solving speed and algebraic precision. Solve at least 30 multi-step problems daily. Prioritize Vectors, 3D Geometry, and Matrices as high-conversion scoring zones with deterministic step patterns.',
          },
          {
            name: 'Physics',
            weightage: '33.3% of Paper (100 Marks / 25 Questions to attempt)',
            keyTopics: ['Mechanics (System of Particles, Rotational Motion, Gravitation)', 'Electromagnetism (Electrostatics, Magnetic Effects of Current, EMI & AC)', 'Modern Physics & Semiconductors', 'Optics (Wave Optics & Ray Optics)', 'Thermal Physics & Fluids'],
            strategy: 'Focus on core physical intuition and boundary conditions. Modern Physics and Thermodynamics offer the highest score-to-time investment ratio. Maintain a dedicated notebook for dimensional analysis shortcuts and circuit simplification tricks.',
          },
          {
            name: 'Chemistry',
            weightage: '33.3% of Paper (100 Marks / 25 Questions to attempt)',
            keyTopics: ['Physical Chemistry (Thermodynamics, Chemical Equilibrium, Electrochemistry, Atomic Structure)', 'Organic Chemistry (Reaction Mechanisms, Electrophilic Substitution, Carbonyl Compounds)', 'Inorganic Chemistry (Coordination Compounds, Chemical Bonding, Periodicity)'],
            strategy: 'Chemistry is the fastest scoring section and should be completed within 40 to 45 minutes. Memorize NCERT inorganic facts thoroughly. For Organic Chemistry, map reaction mechanisms step-by-step rather than memorizing end products.',
          },
        ],
        phases: [
          {
            title: 'Phase 1: Deep Conceptual Mastery & Problem Mapping',
            timeframe: '60+ Days Out',
            focus: 'Rigorous derivation analysis and chapter-by-chapter problem sets.',
            deliverables: ['Solve level 1 and level 2 numerical exercises for all core engineering chapters.', 'Prepare clean formula sheets with vector notation and sign conventions.', 'Complete all previous 5 years JEE Main / GATE question papers by topic.'],
          },
          {
            title: 'Phase 2: Speed Drills & Numerical Section Calibration',
            timeframe: '30 to 60 Days Out',
            focus: 'Minimizing calculation errors in integer-type questions and optimizing question selection.',
            deliverables: ['Practice choosing the easiest 5 numerical questions out of 10 options under 15 minutes.', 'Conduct daily mixed 1-hour speed drills across Math and Physics.', 'Review calculation mistakes in dedicated logbooks to eliminate recurring algebra traps.'],
          },
          {
            title: 'Phase 3: Full Computer-Based Simulator Mocks',
            timeframe: 'Final 30 Days',
            focus: 'Computer screen endurance, keyboard numerical entry, and on-screen navigation pacing.',
            deliverables: ['Complete 10 to 12 full 3-hour computer-based mock tests with official palette colors.', 'Simulate the exact morning (09:00 AM - 12:00 PM) or afternoon (03:00 PM - 06:00 PM) shift timings.', 'Revise inorganic trends, named reactions, and mathematical integral formulas.'],
          },
        ],
        examDayGuidelines: {
          mandatoryDocuments: [
            'Clear printed copy of the Admit Card downloaded from the official portal with self-declaration undertaking duly filled.',
            'Original valid government photo ID (Aadhaar Card, Passport, Voter ID, PAN Card, or School ID with verified photo).',
            'One passport-size photograph identical to the photograph uploaded on the online application form.',
            'Transparent simple ballpoint pen (blue or black ink).',
          ],
          prohibitedItems: [
            'Any electronic device, mobile phone, smartwatch, digital watch, calculator, pager, or health band.',
            'Wallets, purses, goggles, caps, metallic ornaments, metallic buckles, and metallic accessories.',
            'Rough paper, books, notebooks, or written material (blank rough sheets are provided at each workstation).',
            'Opaque bottles, food items, or snacks.',
          ],
          dressCode: [
            'Casual, comfortable clothing with half sleeves without large metallic buttons or excessive pockets.',
            'Open sandals or slippers; shoes with thick rubber soles or high heels are strictly forbidden.',
            'Candidates with religious or customary apparel must report early for mandatory metal-detector screening.',
          ],
          reportingProtocol: 'Arrive at the examination venue at least 90 minutes before test commencement. Registration and biometric authentication desks close 30 minutes prior to exam start. Late arrivals are strictly denied entry.',
        },
        eligibilitySummary: [
          'Candidate must have passed the Class 12 or equivalent qualifying examination with Physics, Mathematics, and one of Chemistry/Biology/Technical Vocational subjects.',
          'General category candidates require a minimum aggregate of 75% marks in Class 12 or must rank in the top 20 percentile of their respective board for NIT/IIT/IIIT admissions (65% for SC/ST).',
          'Candidates can appear for JEE Main for three consecutive years starting from the year of passing Class 12.',
        ],
        admitCardProtocol: [
          'Admit cards are published approximately 3 to 5 days before each examination session on the official conducting authority portal.',
          'Carefully check your roll number, application number, assigned test center address, shift timing, and paper medium.',
          'Verify that your signature and photograph are crisp and that the QR verification code is undistorted.',
          'Contact the official testing agency helpline immediately if you identify any mismatch in your personal particulars.',
        ],
        additionalFaqs: [
          {
            question: `Is there negative marking in the numerical value section of ${exam.shortName}?`,
            answer: 'Yes. In contemporary JEE Main testing guidelines, both multiple-choice questions (MCQs) and numerical value questions carry a penalty of -1 mark for every incorrect answer. Correct answers award +4 marks.',
          },
          {
            question: `Are on-screen virtual calculators allowed in ${exam.shortName}?`,
            answer: 'In GATE examinations, a virtual on-screen scientific calculator is provided in the testing software. In JEE Main and JEE Advanced examinations, no calculators (physical or virtual) are permitted; all calculations must be performed manually on rough sheets.',
          },
          {
            question: `How are rough sheets managed during the computer-based test?`,
            answer: 'Candidates are provided with a blank scribbling pad / rough sheets at their workstation. You must write your roll number and name at the top of each sheet and return all sheets to the invigilator drop-box before leaving the lab.',
          },
          {
            question: `How is the NTA percentile calculated across multiple shifts?`,
            answer: 'Percentile scores reflect the percentage of candidates who scored equal to or below a raw mark in that specific shift. The formula is (100 × Number of candidates in the session with raw score ≤ T) ÷ (Total number of candidates in the session), eliminating variations in difficulty between morning and afternoon papers.',
          },
        ],
      };

    case 'government':
      return {
        pattern: {
          mode: exam.id.includes('upsc') ? 'Offline Pen-and-Paper (OMR for Prelims, Descriptive Conventional for Mains)' : 'Computer-Based Examination (CBT Online Mode)',
          totalQuestions: exam.id.includes('upsc') ? 'Paper 1: 100 GS Questions | Paper 2 (CSAT): 80 Aptitude Questions' : '100 Questions across 4 Tier-1 Sections',
          totalMarks: exam.id.includes('upsc') ? 'Prelims: 400 Marks (200 GS + 200 CSAT) | Mains: 1750 Marks' : '200 Marks (Tier 1)',
          markingScheme: 'Negative marking applies: 1/3rd of the marks assigned to that question are deducted for every wrong response. No penalty for blank questions.',
          durationText,
          medium: 'Bilingual (Hindi and English) across all standard national government examinations',
          shifts: exam.startTime && exam.endTime ? `${exam.startTime} to ${exam.endTime} IST` : 'Morning Session: 09:30 AM to 11:30 AM | Afternoon Session: 02:30 PM to 04:30 PM IST',
        },
        sections: [
          {
            name: 'General Studies (Paper 1)',
            weightage: 'Merit Determining Paper (200 Marks / 100 Questions)',
            keyTopics: ['Indian Polity & Governance (Constitution, Fundamental Rights, Judiciary, Panchayati Raj)', 'Indian Economy (Inflation, Monetary Policy, Fiscal Deficit, Budget, Banking)', 'Modern Indian History & Art & Culture', 'Physical, Human & Economic Geography', 'Environment, Ecology & Climate Change', 'Science & Technology and Current Affairs'],
            strategy: 'Read standard reference texts (M. Laxmikanth for Polity, Ramesh Singh/Nitin Singhania for Economy/Culture, NCERT 11 & 12). Focus on conceptual interlinkages between static syllabus and contemporary news. Practice elimination technique on multi-statement assertion questions.',
          },
          {
            name: 'Civil Services Aptitude Test / CSAT (Paper 2)',
            weightage: 'Qualifying Paper (200 Marks / 80 Questions — Minimum 33% / 66 Marks Required)',
            keyTopics: ['Reading Comprehension (Short Passages, Inference, Critical Assumptions)', 'Logical Reasoning & Analytical Ability', 'Basic Numeracy & Data Interpretation (Number System, Ratios, Percentages, Permutations)'],
            strategy: 'Never treat CSAT lightly. Solve previous 10 years of CSAT papers under strict 2-hour limits. Focus on high-accuracy reading comprehension and mastering foundational number systems to securely cross the 66-mark qualifying threshold.',
          },
        ],
        phases: [
          {
            title: 'Phase 1: Foundational Syllabus Synthesis & Static Revision',
            timeframe: '60+ Days Out',
            focus: 'Consolidating standard reference books and monthly current affairs compilations.',
            deliverables: ['Finish second revision of Indian Polity, Modern History, and Macroeconomics.', 'Compile personal short notes on Ramsar sites, National Parks, and Constitutional Articles.', 'Attempt weekly topic-wise test papers.'],
          },
          {
            title: 'Phase 2: Intensive Prelims Mock Test Series & Elimination Training',
            timeframe: '30 to 60 Days Out',
            focus: 'Training question elimination, intelligent risk calibration, and negative mark reduction.',
            deliverables: ['Solve 2 full-length GS mock papers every week under strict 09:30 AM exam timing.', 'Dedicate 2 hours daily to CSAT quantitative problem solving.', 'Maintain error logs of misread questions and over-guessed options.'],
          },
          {
            title: 'Phase 3: High-Yield Static Consolidation & Circadian Clock Sync',
            timeframe: 'Final 30 Days',
            focus: 'Repeated revision of high-scoring static charts, maps, and government schemes.',
            deliverables: ['Revise high-probability mapping topics (West Asia, Central Asia, Indian river basins).', 'Review all economic survey summaries and budget priority pillars.', 'Avoid introducing any new study materials; focus strictly on formula, notes, and PYQs.'],
          },
        ],
        examDayGuidelines: {
          mandatoryDocuments: [
            'Printed e-Admit Card on clean paper with clearly legible text and photograph.',
            'Original valid photo identity card matching the photo ID number entered during the online application.',
            'Two identical passport-size photographs if your e-admit card has a missing or blurred photo.',
            'Black ballpoint pen (mandatory for filling OMR circles and attendance registers).',
          ],
          prohibitedItems: [
            'Mobile phones, pagers, digital watches, smart bands, pen drives, memory cards, or Bluetooth devices.',
            'Books, notes, loose papers, bags, backpacks, calculator watches, or correction fluid.',
            'Valuable jewelry, metallic accessories, or communication devices.',
          ],
          dressCode: [
            'Simple comfortable attire suitable for extended sitting periods.',
            'Avoid heavy metallic accessories or outerwear with concealed compartments.',
            'Footwear should be easy to inspect at entry checkpoints.',
          ],
          reportingProtocol: 'Entry into the examination venue is closed strictly 30 minutes before the scheduled commencement of each session. No candidate is permitted inside after the entry cut-off time.',
        },
        eligibilitySummary: [
          'Candidate must hold a degree of any recognized university or possess an equivalent qualification.',
          'Must have attained the age of 21 years and must not have attained the age of 32 years on August 1 of the exam year (relaxable for OBC, SC/ST, and PwBD candidates).',
          'Maximum number of attempts: 6 attempts for General category, 9 attempts for OBC/EWS/PwBD, and unlimited attempts within age limit for SC/ST.',
        ],
        admitCardProtocol: [
          'The e-Admit Card is uploaded on the official commission portal approximately 2 to 3 weeks before the examination.',
          'Check your Roll Number, Name, Father Name, Test Center, and Sub-center code carefully.',
          'If you face issues downloading the e-Admit card, contact the facilitation counter at commission headquarters immediately.',
        ],
        additionalFaqs: [
          {
            question: `How does negative marking work in ${exam.shortName}?`,
            answer: 'For each question answered incorrectly by the candidate, one-third (0.33) of the marks assigned to that question will be deducted as penalty. If a question is left blank, there is no penalty.',
          },
          {
            question: `Is CSAT paper marks counted for the final cutoff in ${exam.shortName}?`,
            answer: 'No. The CSAT (Paper 2) is strictly qualifying in nature with a mandatory minimum requirement of 33% (66 marks out of 200). Your Prelims rank and qualification for Mains is determined solely by Paper 1 (General Studies) score.',
          },
          {
            question: `Which pen is permitted for filling OMR answer sheets?`,
            answer: 'Only Black Ballpoint Pen is permitted for darkening bubbles on official OMR answer sheets. Pencils, gel pens, and blue ink pens are strictly prohibited.',
          },
        ],
      };

    case 'board-exams':
      return {
        pattern: {
          mode: 'Pen-and-Paper Conventional Theory Examination (Descriptive Writing)',
          totalQuestions: '30 to 38 Questions divided across Section A (MCQs), Section B (Short), Section C (Long), and Section D (Case-Based)',
          totalMarks: '80 Marks Theory + 20 Marks Internal Assessment / Practical',
          markingScheme: 'Step-marking applies across all numerical and descriptive problems. No negative marking for incorrect answers.',
          durationText: '180 minutes (3 hours) + 15 minutes dedicated reading time',
          medium: 'English, Hindi, and respective Regional Languages',
          shifts: exam.startTime && exam.endTime ? `${exam.startTime} to ${exam.endTime} IST` : 'Single Morning Session: 10:30 AM to 01:30 PM IST (Reading starts 10:15 AM)',
        },
        sections: [
          {
            name: 'Objective & Multiple Choice Questions (Section A)',
            weightage: '20 Marks (16 MCQs + 4 Assertion-Reasoning Questions)',
            keyTopics: ['Direct NCERT textbook conceptual queries', 'Assertion-Reasoning logical deductions', 'Fundamental definitions and formula identification'],
            strategy: 'Read questions with extreme care during the 15-minute reading window. In Assertion-Reasoning questions, independently verify whether Reason correctly explains Assertion before picking option A or B.',
          },
          {
            name: 'Short Answer & Case-Based Applications (Section B & C)',
            weightage: '30 to 40 Marks (2-mark and 3-mark analytical questions)',
            keyTopics: ['Core derivations and labeled scientific diagrams', 'Step-by-step mathematical calculations with standard units', 'Textual interpretations and analytical explanations'],
            strategy: 'Use clean bullet points and underline key scientific terms. Always write standard units at the end of every numerical result to preserve step marks.',
          },
          {
            name: 'Long Analytical & Case Study Problems (Section D & E)',
            weightage: '20 to 30 Marks (4-mark and 5-mark extended answers)',
            keyTopics: ['In-depth conceptual derivations and comprehensive case-study context extraction', 'Extended analytical problems with internal choices'],
            strategy: 'Draw neat diagrams using pencil with clear labels. Read internal choice options thoroughly before beginning an answer to pick the option with clearer step marks.',
          },
        ],
        phases: [
          {
            title: 'Phase 1: Complete Textbook Synthesis & Exemplar Drills',
            timeframe: '60+ Days Out',
            focus: 'Completing all textbook in-text questions and NCERT Exemplar problems.',
            deliverables: ['Finish all back-of-chapter exercises and exemplar problems.', 'Prepare clean diagram sheets for Science and formula charts for Mathematics.', 'Practice handwriting presentation for English and language subjects.'],
          },
          {
            title: 'Phase 2: Official Sample Question Papers & Blueprint Analysis',
            timeframe: '30 to 60 Days Out',
            focus: 'Writing timed 3-hour sample papers based on the official annual board blueprint.',
            deliverables: ['Solve at least 5 official sample papers under strict 10:30 AM to 01:30 PM conditions.', 'Evaluate answer sheets against the official CBSE/Board marking scheme guidelines.', 'Focus on step-marking presentation in Mathematics and Science.'],
          },
          {
            title: 'Phase 3: High-Yield Revision & 15-Minute Reading Strategy',
            timeframe: 'Final 30 Days',
            focus: 'Refining answer presentation, time allocation, and avoiding silly calculation errors.',
            deliverables: ['Practice utilizing the 10:15 AM to 10:30 AM reading time to categorize questions into Easy, Medium, and Complex.', 'Revise definitions, formula sheets, and historical dates daily.', 'Ensure adequate sleep to maintain calm, confident writing rhythm.'],
          },
        ],
        examDayGuidelines: {
          mandatoryDocuments: [
            'Original Board Admit Card signed by the School Principal, candidate, and parent/guardian.',
            'Official School Identity Card.',
            'Transparent stationary pouch with blue/black ballpoint pens, pencils, eraser, and ruler.',
          ],
          prohibitedItems: [
            'Mobile phones, electronic watches, calculators, digital diaries, or Bluetooth accessories.',
            'Books, revision guides, unauthorized sheets, or writing on hands/rulers.',
            'Opaque pencil boxes, bags, or pouches.',
          ],
          dressCode: [
            'Regular school uniform is mandatory for all regular students.',
            'Private candidates should wear simple, light-colored clothes.',
          ],
          reportingProtocol: 'Students must enter the examination center by 10:00 AM. Question papers are distributed at 10:15 AM for the 15-minute mandatory reading period, and writing commences precisely at 10:30 AM.',
        },
        eligibilitySummary: [
          'Regular candidates must have completed a minimum of 75% attendance during the academic session.',
          'Passing criteria requires securing at least 33% marks in each subject (theory and practical separately) to be declared passed.',
        ],
        admitCardProtocol: [
          'Regular school candidates collect their stamped admit cards directly from their school administration.',
          'Private candidates download their admit cards directly from the official board web portal.',
          'Verify student name, father name, mother name, date of birth, subjects offered, and center code.',
        ],
        additionalFaqs: [
          {
            question: `Is step-marking awarded in ${exam.shortName}?`,
            answer: 'Yes. Board examinations follow strict step-marking schemes. Even if the final numerical answer is incorrect due to a minor arithmetic error, candidate earns credit for stating the correct formula, intermediate steps, and correct substitution.',
          },
          {
            question: `How should I utilize the 15-minute question paper reading time?`,
            answer: 'Use the 10:15 AM to 10:30 AM period to read all questions calmly, choose your preferred internal choice questions, and decide the order of sections to attempt. You are strictly forbidden from writing on the answer booklet during reading time.',
          },
          {
            question: `What is the passing criteria for ${exam.shortName}?`,
            answer: 'Candidates must secure a minimum of 33% marks in each subject. For subjects with practical assessments, candidate must obtain at least 33% marks in theory and 33% in practical/internal assessment individually.',
          },
        ],
      };

    case 'law':
      return {
        pattern: {
          mode: exam.id.includes('clat') ? 'Pen-and-Paper (Offline OMR Format)' : 'Computer-Based Test (CBT Online Mode)',
          totalQuestions: exam.id.includes('clat') ? '120 Passage-Based Multiple Choice Questions' : '150 Multiple Choice Questions',
          totalMarks: exam.id.includes('clat') ? '120 Marks' : '150 Marks',
          markingScheme: '+1 mark for each correct answer, -0.25 mark penalty for each incorrect answer, 0 for unattempted questions.',
          durationText: '120 minutes (2 hours)',
          medium: 'English Only',
          shifts: exam.startTime && exam.endTime ? `${exam.startTime} to ${exam.endTime} IST` : 'Single Afternoon Shift: 02:00 PM to 04:00 PM IST',
        },
        sections: [
          {
            name: 'Legal Reasoning',
            weightage: '25% of Paper (30 to 32 Questions)',
            keyTopics: ['Constitutional Law & Fundamental Rights', 'Law of Torts (Negligence, Strict Liability, Defamation)', 'Law of Contracts (Offer, Acceptance, Breach, Consideration)', 'Criminal Law (IPC/BNS principles, Mens Rea, Defences)', 'Contemporary Legal Issues & Landmark Supreme Court Judgments'],
            strategy: 'Never import external legal knowledge beyond the provided passage. The principle stated in the passage is sacrosanct; apply the given legal rule strictly to the facts without emotional speculation. Focus on identifying the core operative clause of the principle.',
          },
          {
            name: 'Current Affairs & General Knowledge',
            weightage: '25% of Paper (30 to 32 Questions)',
            keyTopics: ['Contemporary National & International Events', 'Major Geopolitical Summits & Treaties', 'Landmark Judicial Appointments & Legal Reforms', 'Economic Policies & Awards & Honours'],
            strategy: 'Read daily national broadsheets (The Hindu, Indian Express) and monthly legal compilations. Since questions are passage-based, understanding historical context and underlying institutional mechanisms is vital.',
          },
          {
            name: 'Logical Reasoning & English Language',
            weightage: '35% of Paper (40 to 45 Questions)',
            keyTopics: ['Critical Reasoning (Assumptions, Strengthening/Weakening, Inferences)', 'Analytical Arguments & Syllogisms', 'Reading Comprehension (Passage tone, main theme, vocabulary in context)'],
            strategy: 'Develop high-speed reading habits aiming for 300+ words per minute. Practice identifying premises, conclusion indicators, and logical fallacies in diverse editorial opinion pieces.',
          },
          {
            name: 'Quantitative Techniques',
            weightage: '10% to 15% of Paper (10 to 15 Questions)',
            keyTopics: ['Passage-Based Caselet Data Interpretation', 'Percentages, Ratios & Proportions', 'Profit, Loss & Discount', 'Basic Mensuration & Commercial Math'],
            strategy: 'All quantitative problems are structured as descriptive passage caselets. Practice extracting numeric variables from narrative text and applying direct arithmetic ratios.',
          },
        ],
        phases: [
          {
            title: 'Phase 1: Legal Aptitude Foundation & Reading Speed Conditioning',
            timeframe: '60+ Days Out',
            focus: 'Mastering core principles of Torts, Contracts, Criminal and Constitutional law while elevating reading pace.',
            deliverables: ['Read 3 editorial passages daily with timed comprehension drills.', 'Build personal compendium of legal maxims, constitutional amendments, and landmark case laws.', 'Complete topic-wise drills for Logical Reasoning and Quantitative caselets.'],
          },
          {
            title: 'Phase 2: Timed Sectional Pacing & Passage Traversal Drills',
            timeframe: '30 to 60 Days Out',
            focus: 'Training question triage and executing 120 passage-based questions within 120 minutes.',
            deliverables: ['Solve 2 full-length 2-hour sectional mock tests every week.', 'Target 1 minute per question across all sections.', 'Analyze negative marking traps where overthinking caused incorrect deductions.'],
          },
          {
            title: 'Phase 3: Real OMR Test Simulation & Clock Sync',
            timeframe: 'Final 30 Days',
            focus: 'Synchronizing biological rhythm to the 02:00 PM - 04:00 PM testing window with OMR darkening drills.',
            deliverables: ['Attempt 10 full-length mocks on physical OMR sheets between 02:00 PM and 04:00 PM IST.', 'Review current affairs compendiums of the last 12 months.', 'Maintain calm psychological composure for exam day endurance.'],
          },
        ],
        examDayGuidelines: {
          mandatoryDocuments: [
            'Printed copy of the Admit Card downloaded from the official Consortium portal.',
            'Original government photo ID proof (Aadhaar Card, Passport, PAN Card, Voter ID, or Driving License).',
            'Black or blue ballpoint pens for darkening OMR answer sheets.',
            'Transparent water bottle.',
          ],
          prohibitedItems: [
            'Any electronic device, mobile phone, smartwatch, digital band, calculator, or Bluetooth headset.',
            'Bags, pencil cases, study guides, notes, or loose sheets.',
            'Metallic jewelry or smart accessories.',
          ],
          dressCode: [
            'Casual, light attire without large metallic ornaments or badges.',
            'Simple sandals or slippers; avoid footwear with concealed thick soles.',
          ],
          reportingProtocol: 'Candidates must report to the allocated center at least 1 hour before test commencement. Entry gates close permanently 15 minutes before test start.',
        },
        eligibilitySummary: [
          'For UG Law: Candidate must have passed 10+2 or equivalent with minimum 45% marks (40% for SC/ST).',
          'Candidates appearing in the qualifying examination in the exam year are also eligible to apply.',
          'There is no upper age limit for appearing in CLAT or national law entrances.',
        ],
        admitCardProtocol: [
          'Admit cards are issued on the official Consortium portal approximately 10 to 14 days prior to test date.',
          'Verify candidate name, roll number, test venue address, barcode, and seat allocation code.',
        ],
        additionalFaqs: [
          {
            question: `Is there prior legal knowledge required for ${exam.shortName}?`,
            answer: 'No. The legal reasoning section tests your ability to apply rules stated within the passage to factual scenarios. Prior study of law is not tested or required; reading comprehension and analytical deduction are the primary skills evaluated.',
          },
          {
            question: `How many National Law Universities accept ${exam.shortName}?`,
            answer: 'CLAT scores are accepted by 24 participating National Law Universities across India as well as numerous premier private law institutes for 5-year integrated BA LLB, BBA LLB, and one-year LLM programs.',
          },
        ],
      };

    case 'management':
      return {
        pattern: {
          mode: 'Computer-Based Test (CBT Online Mode)',
          totalQuestions: exam.id.includes('cat') ? '66 Questions (48 MCQs + 18 Non-MCQ TITA Questions)' : '60 to 76 Questions across Sections',
          totalMarks: exam.id.includes('cat') ? '198 Marks' : '180 to 240 Marks',
          markingScheme: '+3 marks for each correct response, -1 mark penalty for incorrect MCQs. Non-MCQ / TITA (Type in the Answer) questions have zero negative marking penalty.',
          durationText: '120 minutes (CAT has strict 40-minute sectional time limits per section)',
          medium: 'English Only',
          shifts: exam.startTime && exam.endTime ? `${exam.startTime} to ${exam.endTime} IST` : 'Shift 1: 08:30 AM - 10:30 AM | Shift 2: 12:30 PM - 02:30 PM | Shift 3: 04:30 PM - 06:30 PM IST',
        },
        sections: [
          {
            name: 'Verbal Ability & Reading Comprehension (VARC)',
            weightage: '36.4% of Paper (24 Questions / 72 Marks — Strict 40 Min Sectional Lock)',
            keyTopics: ['Reading Comprehension (4 Passages with 4 questions each: Philosophy, Sociology, Economics, Science)', 'Para-Jumbles (Non-MCQ Sentence Rearrangement)', 'Para-Summary & Contextual Completion', 'Odd Sentence Out'],
            strategy: 'Read eclectic non-fiction from Aeon, The Economist, and Smithsonian. In RC, spend 6 minutes reading and 3 minutes answering per passage. Ensure high strike rate on TITA questions where wrong answers carry zero penalty.',
          },
          {
            name: 'Data Interpretation & Logical Reasoning (DILR)',
            weightage: '30.3% of Paper (20 Questions / 60 Marks — Strict 40 Min Sectional Lock)',
            keyTopics: ['Arrangements & Matrix Grids (Linear, Circular, Multi-dimensional)', 'Games & Tournaments (Round-Robin, Knockout, Seeding)', 'Venn Diagrams & Set Theory (3 & 4 Set Overlaps)', 'Routes & Networks, Optimization & Scheduling'],
            strategy: 'The primary skill in DILR is caselet selection. Spend the first 4 minutes scanning all 4 sets to pick the 2 most deterministic sets. Solving 2 complete sets with 100% accuracy yields a 95+ percentile in DILR.',
          },
          {
            name: 'Quantitative Aptitude (QA)',
            weightage: '33.3% of Paper (22 Questions / 66 Marks — Strict 40 Min Sectional Lock)',
            keyTopics: ['Arithmetic (Percentages, Profit/Loss, Ratio, Averages, Time & Work, TSD)', 'Algebra (Linear & Quadratic Equations, Functions, Sequences & Series, Logarithms)', 'Geometry & Mensuration', 'Modern Math & Number Systems'],
            strategy: 'Arithmetic and Algebra comprise over 70% of Quantitative Aptitude. Execute the ABC approach: Attempt easy arithmetic questions first (Round 1), Bookmark moderate algebra questions (Round 2), and avoid complex time-traps.',
          },
        ],
        phases: [
          {
            title: 'Phase 1: Concept Mastery & Mental Math Calibration',
            timeframe: '60+ Days Out',
            focus: 'Completing foundational arithmetic, algebra, and mastering core DILR matrix frameworks.',
            deliverables: ['Memorize fraction-to-percentage conversions up to 1/20, squares to 30, and cubes to 20.', 'Solve 30 QA questions and 2 DILR sets daily.', 'Read 2 long-form essays daily from philosophical and scientific journals.'],
          },
          {
            title: 'Phase 2: Sectional Testing & Strict 40-Minute Time Discipline',
            timeframe: '30 to 60 Days Out',
            focus: 'Mastering sectional transitions and question selection under strict time constraints.',
            deliverables: ['Attempt 3 sectional tests for each subject weekly under strict 40-minute lock.', 'Analyze accuracy vs speed trade-offs in dedicated test review sessions.', 'Master mental calculation to minimize on-screen virtual calculator latency.'],
          },
          {
            title: 'Phase 3: Full Computer-Based Simulator Mocks & Percentile Calibration',
            timeframe: 'Final 30 Days',
            focus: 'Endurance across full 2-hour exam shifts and managing energy levels across sectional locks.',
            deliverables: ['Take 12 to 15 full-length computer-based mocks at your exact allotted shift time.', 'Refine personal question selection criteria to avoid getting stuck in negative-marking traps.', 'Revise formula notebooks, geometric theorems, and common DILR puzzle templates.'],
          },
        ],
        examDayGuidelines: {
          mandatoryDocuments: [
            'Printed CAT/MBA admit card on A4 paper (laser print recommended) with passport photo affixed.',
            'Original valid government photo ID (College ID, Passport, PAN Card, Voter ID, Aadhaar Card, Driving License).',
            'Authorisation form or medical certificate if applicable.',
            'Transparent simple pen.',
          ],
          prohibitedItems: [
            'All electronic devices, mobile phones, watches (digital or analog), health bands, or earphones.',
            'Wallets, purses, goggles, caps, metallic ornaments, jackets with heavy zippers.',
            'Rough paper, calculators, or blank sheets (scribble pads are provided at your terminal).',
          ],
          dressCode: [
            'Simple clothing without pockets, large buttons, brooches, or metallic elements.',
            'Socks and shoes are strictly discouraged; sandals or slippers with thin soles are recommended.',
          ],
          reportingProtocol: 'Candidates must report to the test venue at least 90 minutes before their scheduled shift. Lab doors close strictly 15 minutes before the session starts.',
        },
        eligibilitySummary: [
          'Candidate must hold a Bachelor Degree with at least 50% marks or equivalent CGPA (45% for SC/ST/PwD).',
          'Candidates appearing for the final year of bachelor degree/equivalent qualification examination are also eligible.',
          'No age limitation applies for appearing in national management entrance examinations.',
        ],
        admitCardProtocol: [
          'Admit cards are released on the official portal approximately 3 to 4 weeks before exam day.',
          'Verify your candidate registration number, shift slot, reporting time, and test center Google Maps link.',
        ],
        additionalFaqs: [
          {
            question: `Can I switch between sections during ${exam.shortName}?`,
            answer: 'In CAT examinations, sectional switching is strictly prohibited. Each section (VARC, DILR, QA) has a mandatory 40-minute time lock. Once 40 minutes expire, the system automatically submits the section and advances to the next.',
          },
          {
            question: `Is an on-screen calculator provided in ${exam.shortName}?`,
            answer: 'Yes. An on-screen basic virtual calculator is provided in the computer-based testing interface. However, using mouse clicks for basic arithmetic is slow; mental math calculation is recommended for speed.',
          },
        ],
      };

    default:
      return {
        pattern: {
          mode: 'Computer-Based Test (CBT Online Mode) / National Entrance Format',
          totalQuestions: '100 to 150 Multiple Choice Questions',
          totalMarks: '300 to 400 Marks',
          markingScheme: '+4 for correct response, -1 penalty for incorrect response, 0 for unattempted questions.',
          durationText,
          medium: 'English and Hindi bilingual format',
          shifts: exam.startTime && exam.endTime ? `${exam.startTime} to ${exam.endTime} IST` : 'Scheduled Session Timing in Indian Standard Time',
        },
        sections: [
          {
            name: 'Domain Specific Core Aptitude',
            weightage: '50% of Paper Weightage',
            keyTopics: ['Core syllabus fundamentals', 'Analytical problem solving', 'Subject conceptual frameworks'],
            strategy: 'Focus on primary concepts and standard definitions. Review previous examination question trends to identify repeated topic clusters.',
          },
          {
            name: 'General Analytical Reasoning & Language',
            weightage: '50% of Paper Weightage',
            keyTopics: ['Logical deduction and analytical puzzles', 'Reading comprehension and vocabulary', 'Quantitative aptitude and data interpretation'],
            strategy: 'Build speed through timed daily practice. Focus on accuracy before attempting high volume.',
          },
        ],
        phases: [
          {
            title: 'Phase 1: Comprehensive Syllabus Mapping & Concept Grounding',
            timeframe: '60+ Days Out',
            focus: 'Thorough coverage of all prescribed syllabus modules and reference material.',
            deliverables: ['Complete self-authored chapter summaries and formula lists.', 'Solve topic-wise previous year questions.', 'Identify personal weak areas for targeted remediation.'],
          },
          {
            title: 'Phase 2: Timed Sectional Execution & Error Reduction',
            timeframe: '30 to 60 Days Out',
            focus: 'Simulating exam conditions and minimizing negative marking losses.',
            deliverables: ['Attempt 2 timed sectional tests weekly.', 'Maintain an error logbook to track avoidable mistakes.', 'Calibrate pacing to ensure all questions can be reviewed.'],
          },
          {
            title: 'Phase 3: Full-Length Mocks & Clock Adaptation',
            timeframe: 'Final 30 Days',
            focus: 'Full-length simulation during official exam hours and mental conditioning.',
            deliverables: ['Take at least 8 full-length mock tests under real exam conditions.', 'Synchronize daily study cycles with the official testing window.', 'Review formula notes and high-yield summary sheets.'],
          },
        ],
        examDayGuidelines: {
          mandatoryDocuments: [
            'Printed admit card downloaded from the official conducting authority portal.',
            'Original valid government-issued photo identity proof (Aadhaar, Passport, Voter ID, PAN).',
            'Passport-size photographs matching the online registration upload.',
            'Transparent ballpoint pen.',
          ],
          prohibitedItems: [
            'Mobile phones, smartwatches, digital bands, calculators, or communication gadgets.',
            'Notebooks, scrap sheets, bags, purses, or opaque containers.',
            'Metallic accessories or smart wearable devices.',
          ],
          dressCode: [
            'Simple, comfortable clothing without large metallic buttons or excessive pockets.',
            'Footwear with thin soles (sandals or slippers recommended).',
          ],
          reportingProtocol: 'Report to your designated test center at least 90 minutes before exam commencement. Entry gates close permanently 30 minutes before test start.',
        },
        eligibilitySummary: [
          'Candidate must satisfy the minimum educational criteria prescribed by the conducting body in the official gazette.',
          'Qualifying percentage requirements and reservation provisions apply as per Government of India guidelines.',
        ],
        admitCardProtocol: [
          'Admit cards are issued online on the official conducting authority website several days prior to the test.',
          'Verify candidate credentials, test date, venue address, and reporting time immediately upon downloading.',
        ],
        additionalFaqs: [
          {
            question: `What should I do if there is a mistake in my ${exam.shortName} admit card?`,
            answer: 'Contact the official conducting authority helpline and send an email with your application number, payment proof, and exact correction details before the examination date.',
          },
          {
            question: `Is rough work allowed during the computer-based test?`,
            answer: 'Yes. Invigilators supply physical rough sheets inside the examination room. All used and unused rough sheets must be handed back to the proctor before exiting.',
          },
        ],
      };
  }
}
