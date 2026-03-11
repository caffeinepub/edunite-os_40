export interface Standard {
  id: string;
  framework: "CCSS ELA" | "CCSS Math" | "NGSS";
  grade: string;
  domain: string;
  code: string;
  description: string;
}

export const STANDARDS_LIBRARY: Standard[] = [
  // ─── CCSS ELA — Reading: Literature ─────────────────────────────────────────

  {
    id: "CCSS.ELA-LITERACY.RL.K.1",
    framework: "CCSS ELA",
    grade: "K",
    domain: "Reading: Literature",
    code: "RL.K.1",
    description:
      "With prompting and support, ask and answer questions about key details in a text.",
  },
  {
    id: "CCSS.ELA-LITERACY.RL.K.3",
    framework: "CCSS ELA",
    grade: "K",
    domain: "Reading: Literature",
    code: "RL.K.3",
    description:
      "With prompting and support, identify characters, settings, and major events in a story.",
  },
  {
    id: "CCSS.ELA-LITERACY.RL.2.1",
    framework: "CCSS ELA",
    grade: "2",
    domain: "Reading: Literature",
    code: "RL.2.1",
    description:
      "Ask and answer such questions as who, what, where, when, why, and how to demonstrate understanding of key details in a text.",
  },
  {
    id: "CCSS.ELA-LITERACY.RL.2.5",
    framework: "CCSS ELA",
    grade: "2",
    domain: "Reading: Literature",
    code: "RL.2.5",
    description:
      "Describe the overall structure of a story, including describing how the beginning introduces the story and the ending concludes the action.",
  },
  {
    id: "CCSS.ELA-LITERACY.RL.4.1",
    framework: "CCSS ELA",
    grade: "4",
    domain: "Reading: Literature",
    code: "RL.4.1",
    description:
      "Refer to details and examples in a text when explaining what the text says explicitly and when drawing inferences from the text.",
  },
  {
    id: "CCSS.ELA-LITERACY.RL.4.3",
    framework: "CCSS ELA",
    grade: "4",
    domain: "Reading: Literature",
    code: "RL.4.3",
    description:
      "Describe in depth a character, setting, or event in a story or drama, drawing on specific details in the text (e.g., a character's thoughts, words, or actions).",
  },
  {
    id: "CCSS.ELA-LITERACY.RL.6.1",
    framework: "CCSS ELA",
    grade: "6",
    domain: "Reading: Literature",
    code: "RL.6.1",
    description:
      "Cite textual evidence to support analysis of what the text says explicitly as well as inferences drawn from the text.",
  },
  {
    id: "CCSS.ELA-LITERACY.RL.6.5",
    framework: "CCSS ELA",
    grade: "6",
    domain: "Reading: Literature",
    code: "RL.6.5",
    description:
      "Analyze how a particular sentence, chapter, scene, or stanza fits into the overall structure of a text and contributes to the development of the theme, setting, or plot.",
  },
  {
    id: "CCSS.ELA-LITERACY.RL.8.1",
    framework: "CCSS ELA",
    grade: "8",
    domain: "Reading: Literature",
    code: "RL.8.1",
    description:
      "Cite the textual evidence that most strongly supports an analysis of what the text says explicitly as well as inferences drawn from the text.",
  },
  {
    id: "CCSS.ELA-LITERACY.RL.9-10.1",
    framework: "CCSS ELA",
    grade: "9-10",
    domain: "Reading: Literature",
    code: "RL.9-10.1",
    description:
      "Cite strong and thorough textual evidence to support analysis of what the text says explicitly as well as inferences drawn from the text.",
  },
  {
    id: "CCSS.ELA-LITERACY.RL.9-10.2",
    framework: "CCSS ELA",
    grade: "9-10",
    domain: "Reading: Literature",
    code: "RL.9-10.2",
    description:
      "Determine a theme or central idea of a text and analyze in detail its development over the course of the text, including how it emerges and is shaped and refined by specific details.",
  },
  {
    id: "CCSS.ELA-LITERACY.RL.9-10.3",
    framework: "CCSS ELA",
    grade: "9-10",
    domain: "Reading: Literature",
    code: "RL.9-10.3",
    description:
      "Analyze how complex characters (e.g., those with multiple or conflicting motivations) develop over the course of a text, interact with other characters, and advance the plot or develop the theme.",
  },
  {
    id: "CCSS.ELA-LITERACY.RL.9-10.4",
    framework: "CCSS ELA",
    grade: "9-10",
    domain: "Reading: Literature",
    code: "RL.9-10.4",
    description:
      "Determine the meaning of words and phrases as they are used in the text, including figurative and connotative meanings; analyze the cumulative impact of specific word choices on meaning and tone.",
  },
  {
    id: "CCSS.ELA-LITERACY.RL.9-10.6",
    framework: "CCSS ELA",
    grade: "9-10",
    domain: "Reading: Literature",
    code: "RL.9-10.6",
    description:
      "Analyze a particular point of view or cultural experience reflected in a work of literature from outside the United States, drawing on a wide reading of world literature.",
  },
  {
    id: "CCSS.ELA-LITERACY.RL.11-12.1",
    framework: "CCSS ELA",
    grade: "11-12",
    domain: "Reading: Literature",
    code: "RL.11-12.1",
    description:
      "Cite strong and thorough textual evidence to support analysis of what the text says explicitly as well as inferences drawn from the text, including determining where the text leaves matters uncertain.",
  },
  {
    id: "CCSS.ELA-LITERACY.RL.11-12.6",
    framework: "CCSS ELA",
    grade: "11-12",
    domain: "Reading: Literature",
    code: "RL.11-12.6",
    description:
      "Analyze a case in which grasping a point of view requires distinguishing what is directly stated in a text from what is really meant (e.g., satire, sarcasm, irony, or understatement).",
  },

  // ─── CCSS ELA — Reading: Informational ──────────────────────────────────────

  {
    id: "CCSS.ELA-LITERACY.RI.4.3",
    framework: "CCSS ELA",
    grade: "4",
    domain: "Reading: Informational",
    code: "RI.4.3",
    description:
      "Explain events, procedures, ideas, or concepts in a historical, scientific, or technical text, including what happened and why, based on specific information in the text.",
  },
  {
    id: "CCSS.ELA-LITERACY.RI.6.8",
    framework: "CCSS ELA",
    grade: "6",
    domain: "Reading: Informational",
    code: "RI.6.8",
    description:
      "Trace and evaluate the argument and specific claims in a text, distinguishing claims that are supported by reasons and evidence from claims that are not.",
  },
  {
    id: "CCSS.ELA-LITERACY.RI.9-10.6",
    framework: "CCSS ELA",
    grade: "9-10",
    domain: "Reading: Informational",
    code: "RI.9-10.6",
    description:
      "Determine an author's point of view or purpose in a text and analyze how an author uses rhetoric to advance that point of view or purpose.",
  },
  {
    id: "CCSS.ELA-LITERACY.RI.11-12.7",
    framework: "CCSS ELA",
    grade: "11-12",
    domain: "Reading: Informational",
    code: "RI.11-12.7",
    description:
      "Integrate and evaluate multiple sources of information presented in different media or formats (e.g., visually, quantitatively) as well as in words in order to address a question or solve a problem.",
  },

  // ─── CCSS ELA — Writing ──────────────────────────────────────────────────────

  {
    id: "CCSS.ELA-LITERACY.W.4.1",
    framework: "CCSS ELA",
    grade: "4",
    domain: "Writing",
    code: "W.4.1",
    description:
      "Write opinion pieces on topics or texts, supporting a point of view with reasons and information.",
  },
  {
    id: "CCSS.ELA-LITERACY.W.6.1",
    framework: "CCSS ELA",
    grade: "6",
    domain: "Writing",
    code: "W.6.1",
    description:
      "Write arguments to support claims with clear reasons and relevant evidence.",
  },
  {
    id: "CCSS.ELA-LITERACY.W.8.2",
    framework: "CCSS ELA",
    grade: "8",
    domain: "Writing",
    code: "W.8.2",
    description:
      "Write informative/explanatory texts to examine a topic and convey ideas, concepts, and information through the selection, organization, and analysis of relevant content.",
  },
  {
    id: "CCSS.ELA-LITERACY.W.9-10.1",
    framework: "CCSS ELA",
    grade: "9-10",
    domain: "Writing",
    code: "W.9-10.1",
    description:
      "Write arguments to support claims in an analysis of substantive topics or texts, using valid reasoning and relevant and sufficient evidence.",
  },
  {
    id: "CCSS.ELA-LITERACY.W.9-10.2",
    framework: "CCSS ELA",
    grade: "9-10",
    domain: "Writing",
    code: "W.9-10.2",
    description:
      "Write informative/explanatory texts to examine and convey complex ideas, concepts, and information clearly and accurately through the effective selection, organization, and analysis of content.",
  },
  {
    id: "CCSS.ELA-LITERACY.W.9-10.3",
    framework: "CCSS ELA",
    grade: "9-10",
    domain: "Writing",
    code: "W.9-10.3",
    description:
      "Write narratives to develop real or imagined experiences or events using effective technique, well-chosen details, and well-structured event sequences.",
  },
  {
    id: "CCSS.ELA-LITERACY.W.11-12.1",
    framework: "CCSS ELA",
    grade: "11-12",
    domain: "Writing",
    code: "W.11-12.1",
    description:
      "Write arguments to support claims in an analysis of substantive topics or texts, using valid reasoning and relevant and sufficient evidence.",
  },

  // ─── CCSS ELA — Speaking & Listening ────────────────────────────────────────

  {
    id: "CCSS.ELA-LITERACY.SL.6.1",
    framework: "CCSS ELA",
    grade: "6",
    domain: "Speaking & Listening",
    code: "SL.6.1",
    description:
      "Engage effectively in a range of collaborative discussions (one-on-one, in groups, and teacher-led) with diverse partners on grade 6 topics, texts, and issues.",
  },
  {
    id: "CCSS.ELA-LITERACY.SL.9-10.4",
    framework: "CCSS ELA",
    grade: "9-10",
    domain: "Speaking & Listening",
    code: "SL.9-10.4",
    description:
      "Present information, findings, and supporting evidence clearly, concisely, and logically such that listeners can follow the line of reasoning.",
  },

  // ─── CCSS ELA — Language ─────────────────────────────────────────────────────

  {
    id: "CCSS.ELA-LITERACY.L.6.4",
    framework: "CCSS ELA",
    grade: "6",
    domain: "Language",
    code: "L.6.4",
    description:
      "Determine or clarify the meaning of unknown and multiple-meaning words and phrases based on grade 6 reading and content, choosing flexibly from a range of strategies.",
  },
  {
    id: "CCSS.ELA-LITERACY.L.9-10.5",
    framework: "CCSS ELA",
    grade: "9-10",
    domain: "Language",
    code: "L.9-10.5",
    description:
      "Demonstrate understanding of figurative language, word relationships, and nuances in word meanings.",
  },

  // ─── CCSS Math — Operations & Algebraic Thinking ────────────────────────────

  {
    id: "CCSS.MATH.CONTENT.K.OA.A.1",
    framework: "CCSS Math",
    grade: "K",
    domain: "Operations & Algebraic Thinking",
    code: "K.OA.A.1",
    description:
      "Represent addition and subtraction with objects, fingers, mental images, drawings, sounds, acting out situations, verbal explanations, expressions, or equations.",
  },
  {
    id: "CCSS.MATH.CONTENT.2.OA.A.1",
    framework: "CCSS Math",
    grade: "2",
    domain: "Operations & Algebraic Thinking",
    code: "2.OA.A.1",
    description:
      "Use addition and subtraction within 100 to solve one- and two-step word problems involving situations of adding to, taking from, putting together, taking apart, and comparing.",
  },
  {
    id: "CCSS.MATH.CONTENT.4.OA.A.1",
    framework: "CCSS Math",
    grade: "4",
    domain: "Operations & Algebraic Thinking",
    code: "4.OA.A.1",
    description:
      "Interpret a multiplication equation as a comparison, e.g., interpret 35 = 5 × 7 as a statement that 35 is 5 times as many as 7 and 7 times as many as 5.",
  },

  // ─── CCSS Math — Number & Operations ────────────────────────────────────────

  {
    id: "CCSS.MATH.CONTENT.2.NBT.A.1",
    framework: "CCSS Math",
    grade: "2",
    domain: "Number & Operations in Base Ten",
    code: "2.NBT.A.1",
    description:
      "Understand that the three digits of a three-digit number represent amounts of hundreds, tens, and ones.",
  },
  {
    id: "CCSS.MATH.CONTENT.4.NBT.B.5",
    framework: "CCSS Math",
    grade: "4",
    domain: "Number & Operations in Base Ten",
    code: "4.NBT.B.5",
    description:
      "Multiply a whole number of up to four digits by a one-digit whole number, and multiply two two-digit numbers.",
  },
  {
    id: "CCSS.MATH.CONTENT.6.NS.A.1",
    framework: "CCSS Math",
    grade: "6",
    domain: "The Number System",
    code: "6.NS.A.1",
    description:
      "Interpret and compute quotients of fractions, and solve word problems involving division of fractions by fractions.",
  },

  // ─── CCSS Math — Ratios & Proportional Relationships ────────────────────────

  {
    id: "CCSS.MATH.CONTENT.6.RP.A.1",
    framework: "CCSS Math",
    grade: "6",
    domain: "Ratios & Proportional Relationships",
    code: "6.RP.A.1",
    description:
      "Understand the concept of a ratio and use ratio language to describe a ratio relationship between two quantities.",
  },
  {
    id: "CCSS.MATH.CONTENT.7.RP.A.2",
    framework: "CCSS Math",
    grade: "6-8",
    domain: "Ratios & Proportional Relationships",
    code: "7.RP.A.2",
    description:
      "Recognize and represent proportional relationships between quantities.",
  },

  // ─── CCSS Math — Expressions & Equations ────────────────────────────────────

  {
    id: "CCSS.MATH.CONTENT.6.EE.A.1",
    framework: "CCSS Math",
    grade: "6",
    domain: "Expressions & Equations",
    code: "6.EE.A.1",
    description:
      "Write and evaluate numerical expressions involving whole-number exponents.",
  },
  {
    id: "CCSS.MATH.CONTENT.8.EE.A.1",
    framework: "CCSS Math",
    grade: "8",
    domain: "Expressions & Equations",
    code: "8.EE.A.1",
    description:
      "Know and apply the properties of integer exponents to generate equivalent numerical expressions.",
  },
  {
    id: "CCSS.MATH.CONTENT.8.EE.B.5",
    framework: "CCSS Math",
    grade: "8",
    domain: "Expressions & Equations",
    code: "8.EE.B.5",
    description:
      "Graph proportional relationships, interpreting the unit rate as the slope of the graph.",
  },

  // ─── CCSS Math — Functions ───────────────────────────────────────────────────

  {
    id: "CCSS.MATH.CONTENT.8.F.A.1",
    framework: "CCSS Math",
    grade: "8",
    domain: "Functions",
    code: "8.F.A.1",
    description:
      "Understand that a function is a rule that assigns to each input exactly one output. The graph of a function is the set of ordered pairs consisting of an input and the corresponding output.",
  },
  {
    id: "CCSS.MATH.CONTENT.HSF.IF.A.1",
    framework: "CCSS Math",
    grade: "HS",
    domain: "Functions",
    code: "HSF.IF.A.1",
    description:
      "Understand that a function from one set (called the domain) to another set (called the range) assigns to each element of the domain exactly one element of the range.",
  },
  {
    id: "CCSS.MATH.CONTENT.HSF.BF.A.1",
    framework: "CCSS Math",
    grade: "HS",
    domain: "Functions",
    code: "HSF.BF.A.1",
    description:
      "Write a function that describes a relationship between two quantities.",
  },

  // ─── CCSS Math — Geometry ────────────────────────────────────────────────────

  {
    id: "CCSS.MATH.CONTENT.4.G.A.1",
    framework: "CCSS Math",
    grade: "4",
    domain: "Geometry",
    code: "4.G.A.1",
    description:
      "Draw points, lines, line segments, rays, angles (right, acute, obtuse), and perpendicular and parallel lines. Identify these in two-dimensional figures.",
  },
  {
    id: "CCSS.MATH.CONTENT.8.G.B.7",
    framework: "CCSS Math",
    grade: "8",
    domain: "Geometry",
    code: "8.G.B.7",
    description:
      "Apply the Pythagorean Theorem to determine unknown side lengths in right triangles in real-world and mathematical problems in two and three dimensions.",
  },
  {
    id: "CCSS.MATH.CONTENT.HSG.CO.A.1",
    framework: "CCSS Math",
    grade: "HS",
    domain: "Geometry",
    code: "HSG.CO.A.1",
    description:
      "Know precise definitions of angle, circle, perpendicular line, parallel line, and line segment, based on the undefined notions of point, line, distance along a line, and distance around a circular arc.",
  },

  // ─── CCSS Math — Statistics & Probability ───────────────────────────────────

  {
    id: "CCSS.MATH.CONTENT.6.SP.A.1",
    framework: "CCSS Math",
    grade: "6",
    domain: "Statistics & Probability",
    code: "6.SP.A.1",
    description:
      "Recognize a statistical question as one that anticipates variability in the data related to the question and accounts for it in the answers.",
  },
  {
    id: "CCSS.MATH.CONTENT.HSS.ID.A.1",
    framework: "CCSS Math",
    grade: "HS",
    domain: "Statistics & Probability",
    code: "HSS.ID.A.1",
    description:
      "Represent data with plots on the real number line (dot plots, histograms, and box plots).",
  },
  {
    id: "CCSS.MATH.CONTENT.HSS.CP.A.1",
    framework: "CCSS Math",
    grade: "HS",
    domain: "Statistics & Probability",
    code: "HSS.CP.A.1",
    description:
      "Describe events as subsets of a sample space (the set of outcomes) using characteristics (or categories) of the outcomes, or as unions, intersections, or complements of other events.",
  },

  // ─── CCSS Math — Algebra ─────────────────────────────────────────────────────

  {
    id: "CCSS.MATH.CONTENT.HSA.SSE.A.1",
    framework: "CCSS Math",
    grade: "HS",
    domain: "Algebra",
    code: "HSA.SSE.A.1",
    description:
      "Interpret expressions that represent a quantity in terms of its context.",
  },
  {
    id: "CCSS.MATH.CONTENT.HSA.REI.B.3",
    framework: "CCSS Math",
    grade: "HS",
    domain: "Algebra",
    code: "HSA.REI.B.3",
    description:
      "Solve linear equations and inequalities in one variable, including equations with coefficients represented by letters.",
  },
  {
    id: "CCSS.MATH.CONTENT.HSA.CED.A.1",
    framework: "CCSS Math",
    grade: "HS",
    domain: "Algebra",
    code: "HSA.CED.A.1",
    description:
      "Create equations and inequalities in one variable and use them to solve problems.",
  },

  // ─── NGSS — Physical Science ─────────────────────────────────────────────────

  {
    id: "NGSS.K.PS2-1",
    framework: "NGSS",
    grade: "K-2",
    domain: "Physical Science",
    code: "K-PS2-1",
    description:
      "Plan and conduct an investigation to compare the effects of different strengths or different directions of pushes and pulls on the motion of an object.",
  },
  {
    id: "NGSS.3-5.PS1-1",
    framework: "NGSS",
    grade: "3-5",
    domain: "Physical Science",
    code: "3-5-PS1-1",
    description:
      "Develop models to describe that matter is made of particles too small to be seen.",
  },
  {
    id: "NGSS.3-5.PS2-1",
    framework: "NGSS",
    grade: "3-5",
    domain: "Physical Science",
    code: "3-5-PS2-1",
    description:
      "Support an argument that the gravitational force exerted by Earth on objects is directed down.",
  },
  {
    id: "NGSS.MS.PS1-1",
    framework: "NGSS",
    grade: "6-8",
    domain: "Physical Science",
    code: "MS-PS1-1",
    description:
      "Develop models to describe the atomic composition of simple molecules and extended structures.",
  },
  {
    id: "NGSS.MS.PS2-2",
    framework: "NGSS",
    grade: "6-8",
    domain: "Physical Science",
    code: "MS-PS2-2",
    description:
      "Plan an investigation to provide evidence that the change in an object's motion depends on the sum of the forces on the object and the mass of the object.",
  },
  {
    id: "NGSS.HS.PS1-1",
    framework: "NGSS",
    grade: "9-12",
    domain: "Physical Science",
    code: "HS-PS1-1",
    description:
      "Use the periodic table as a model to predict the relative properties of elements based on the patterns of electrons in the outermost energy level of atoms.",
  },
  {
    id: "NGSS.HS.PS2-1",
    framework: "NGSS",
    grade: "9-12",
    domain: "Physical Science",
    code: "HS-PS2-1",
    description:
      "Analyze data to support the claim that Newton's second law of motion describes the mathematical relationship among the net force on a macroscopic object, its mass, and its acceleration.",
  },

  // ─── NGSS — Life Science ─────────────────────────────────────────────────────

  {
    id: "NGSS.K.LS1-1",
    framework: "NGSS",
    grade: "K-2",
    domain: "Life Science",
    code: "K-LS1-1",
    description:
      "Use observations to describe patterns of what plants and animals (including humans) need to survive.",
  },
  {
    id: "NGSS.3-5.LS1-1",
    framework: "NGSS",
    grade: "3-5",
    domain: "Life Science",
    code: "3-5-LS1-1",
    description:
      "Develop models to describe that organisms have unique and diverse life cycles but all have in common birth, growth, reproduction, and death.",
  },
  {
    id: "NGSS.MS.LS1-1",
    framework: "NGSS",
    grade: "6-8",
    domain: "Life Science",
    code: "MS-LS1-1",
    description:
      "Conduct an investigation to provide evidence that living things are made of cells; either one cell or many different numbers and types of cells.",
  },
  {
    id: "NGSS.MS.LS4-2",
    framework: "NGSS",
    grade: "6-8",
    domain: "Life Science",
    code: "MS-LS4-2",
    description:
      "Apply concepts of statistics and probability to support explanations that organisms with an advantageous heritable trait tend to increase in proportion to organisms lacking this trait.",
  },
  {
    id: "NGSS.HS.LS1-1",
    framework: "NGSS",
    grade: "9-12",
    domain: "Life Science",
    code: "HS-LS1-1",
    description:
      "Construct an explanation based on evidence for how the structure of DNA determines the structure of proteins which carry out the essential functions of life through systems of specialized cells.",
  },
  {
    id: "NGSS.HS.LS3-1",
    framework: "NGSS",
    grade: "9-12",
    domain: "Life Science",
    code: "HS-LS3-1",
    description:
      "Ask questions to clarify relationships about the role of DNA and chromosomes in coding the instructions for characteristic traits passed from parents to offspring.",
  },

  // ─── NGSS — Earth & Space Science ───────────────────────────────────────────

  {
    id: "NGSS.K.ESS2-1",
    framework: "NGSS",
    grade: "K-2",
    domain: "Earth & Space Science",
    code: "K-ESS2-1",
    description:
      "Use and share observations of local weather conditions to describe patterns over time.",
  },
  {
    id: "NGSS.3-5.ESS1-1",
    framework: "NGSS",
    grade: "3-5",
    domain: "Earth & Space Science",
    code: "3-5-ESS1-1",
    description:
      "Support an argument that differences in the apparent brightness of the sun compared to other stars is due to their relative distances from Earth.",
  },
  {
    id: "NGSS.MS.ESS2-2",
    framework: "NGSS",
    grade: "6-8",
    domain: "Earth & Space Science",
    code: "MS-ESS2-2",
    description:
      "Construct an explanation based on evidence for how geoscience processes have changed Earth's surface at varying time and spatial scales.",
  },
  {
    id: "NGSS.MS.ESS3-3",
    framework: "NGSS",
    grade: "6-8",
    domain: "Earth & Space Science",
    code: "MS-ESS3-3",
    description:
      "Apply scientific principles to design a method for monitoring and minimizing a human impact on the environment.",
  },
  {
    id: "NGSS.HS.ESS1-1",
    framework: "NGSS",
    grade: "9-12",
    domain: "Earth & Space Science",
    code: "HS-ESS1-1",
    description:
      "Develop a model based on evidence to illustrate the life span of the sun and the role of nuclear fusion in the sun's core to release energy that eventually reaches Earth in the form of radiation.",
  },
  {
    id: "NGSS.HS.ESS2-2",
    framework: "NGSS",
    grade: "9-12",
    domain: "Earth & Space Science",
    code: "HS-ESS2-2",
    description:
      "Analyze geoscience data to make the claim that one change to Earth's surface can create feedbacks that cause changes to other Earth systems.",
  },
  {
    id: "NGSS.HS.ESS3-1",
    framework: "NGSS",
    grade: "9-12",
    domain: "Earth & Space Science",
    code: "HS-ESS3-1",
    description:
      "Construct an explanation based on evidence for how the availability of natural resources, occurrence of natural hazards, and changes in climate have influenced human activity.",
  },
];
