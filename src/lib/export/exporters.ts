import {
  DEFAULT_SECTION_ORDER,
  ResumeData,
  SectionKey,
} from "@/types/resume";
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";

export interface ExportOptions {
  sectionOrder?: SectionKey[];
  hiddenSections?: SectionKey[];
  fontSizePt?: 10 | 10.5 | 11;
}

function getActiveSections(options?: ExportOptions): SectionKey[] {
  const order = options?.sectionOrder?.length
    ? options.sectionOrder
    : DEFAULT_SECTION_ORDER;
  const hidden = new Set(options?.hiddenSections || []);
  return order.filter((s) => !hidden.has(s));
}

/**
 * Gera Texto Puro real (100% livre de sintaxe Markdown como #, **, ---)
 * Ideal para colagem direta em campos da Gupy, Workday e Lever.
 */
export function generatePlainText(
  resume: ResumeData,
  options?: ExportOptions
): string {
  const lines: string[] = [];
  const activeSections = getActiveSections(options);

  lines.push(resume.fullName.toUpperCase());
  lines.push(resume.headline);

  const contacts = [
    resume.location,
    resume.email,
    resume.phone,
    resume.linkedinUrl ? `LinkedIn: ${resume.linkedinUrl}` : "",
    resume.githubUrl ? `GitHub: ${resume.githubUrl}` : "",
    resume.portfolioUrl ? `Portfólio: ${resume.portfolioUrl}` : "",
  ].filter(Boolean);

  if (contacts.length > 0) {
    lines.push(contacts.join(" | "));
  }
  lines.push("");

  for (const section of activeSections) {
    if (section === "summary" && resume.summary) {
      lines.push("RESUMO PROFISSIONAL");
      lines.push(resume.summary);
      lines.push("");
    }

    if (section === "skills") {
      const hasSkills =
        resume.skills.technical?.length ||
        resume.skills.domain?.length ||
        resume.skills.tools?.length;
      if (hasSkills) {
        lines.push("COMPETÊNCIAS TÉCNICAS");
        if (resume.skills.technical?.length) {
          lines.push(`Linguagens & Tecnologias: ${resume.skills.technical.join(", ")}`);
        }
        if (resume.skills.domain?.length) {
          lines.push(`Metodologias & Práticas: ${resume.skills.domain.join(", ")}`);
        }
        if (resume.skills.tools?.length) {
          lines.push(`Ferramentas & DevOps: ${resume.skills.tools.join(", ")}`);
        }
        lines.push("");
      }
    }

    if (section === "experiences" && resume.experiences?.length) {
      lines.push("EXPERIÊNCIA PROFISSIONAL");
      for (const exp of resume.experiences) {
        lines.push(`${exp.role} | ${exp.company}`);
        lines.push(`${exp.period}${exp.location ? ` | ${exp.location}` : ""}`);
        if (exp.technologies?.length) {
          lines.push(`Tecnologias: ${exp.technologies.join(", ")}`);
        }
        for (const bullet of exp.bullets) {
          lines.push(`• ${bullet}`);
        }
        lines.push("");
      }
    }

    if (section === "projects" && resume.projects?.length) {
      lines.push("PROJETOS RELEVANTES");
      for (const proj of resume.projects) {
        lines.push(`${proj.name}${proj.url ? ` (${proj.url})` : ""}`);
        lines.push(proj.description);
        if (proj.technologies?.length) {
          lines.push(`Stack: ${proj.technologies.join(", ")}`);
        }
        lines.push("");
      }
    }

    if (section === "education" && resume.education?.length) {
      lines.push("FORMAÇÃO ACADÊMICA");
      for (const edu of resume.education) {
        lines.push(`${edu.degree} — ${edu.institution} (${edu.year})`);
      }
      lines.push("");
    }

    if (section === "certifications" && resume.certifications?.length) {
      lines.push("CERTIFICAÇÕES");
      for (const cert of resume.certifications) {
        lines.push(
          `${cert.name} — ${cert.issuer}${cert.year ? ` (${cert.year})` : ""}`
        );
      }
      lines.push("");
    }

    if (section === "languages" && resume.languages?.length) {
      lines.push("IDIOMAS");
      for (const lang of resume.languages) {
        lines.push(`${lang.language}: ${lang.proficiency}`);
      }
      lines.push("");
    }
  }

  return lines.join("\n").trim();
}

/**
 * Gera Markdown estruturado respeitando a ordem e visibilidade das seções
 */
export function generateMarkdown(
  resume: ResumeData,
  options?: ExportOptions
): string {
  const activeSections = getActiveSections(options);
  let md = `# ${resume.fullName}\n`;
  md += `**${resume.headline}**\n\n`;

  const contactParts = [resume.location, resume.email, resume.phone].filter(
    Boolean
  );
  if (contactParts.length) {
    md += `${contactParts.join(" | ")}\n`;
  }

  const links = [
    resume.linkedinUrl ? `LinkedIn: ${resume.linkedinUrl}` : "",
    resume.githubUrl ? `GitHub: ${resume.githubUrl}` : "",
    resume.portfolioUrl ? `Portfólio: ${resume.portfolioUrl}` : "",
  ].filter(Boolean);
  if (links.length) {
    md += `${links.join(" | ")}\n`;
  }

  md += `\n---\n\n`;

  for (const section of activeSections) {
    if (section === "summary" && resume.summary) {
      md += `## RESUMO PROFISSIONAL\n${resume.summary}\n\n`;
    }

    if (section === "skills") {
      md += `## COMPETÊNCIAS TÉCNICAS\n`;
      if (resume.skills.technical?.length) {
        md += `- **Linguagens & Tecnologias:** ${resume.skills.technical.join(", ")}\n`;
      }
      if (resume.skills.domain?.length) {
        md += `- **Metodologias & Práticas:** ${resume.skills.domain.join(", ")}\n`;
      }
      if (resume.skills.tools?.length) {
        md += `- **Ferramentas:** ${resume.skills.tools.join(", ")}\n`;
      }
      md += `\n`;
    }

    if (section === "experiences" && resume.experiences?.length) {
      md += `## EXPERIÊNCIA PROFISSIONAL\n`;
      for (const exp of resume.experiences) {
        md += `### ${exp.role} — ${exp.company}\n`;
        md += `*${exp.period}${exp.location ? ` | ${exp.location}` : ""}*\n`;
        if (exp.technologies?.length) {
          md += `*Tech Stack: ${exp.technologies.join(", ")}*\n`;
        }
        for (const b of exp.bullets) {
          md += `- ${b}\n`;
        }
        md += `\n`;
      }
    }

    if (section === "projects" && resume.projects?.length) {
      md += `## PROJETOS EM DESTAQUE\n`;
      for (const proj of resume.projects) {
        md += `### ${proj.name}${proj.url ? ` (${proj.url})` : ""}\n`;
        md += `${proj.description}\n`;
        if (proj.technologies?.length) {
          md += `*Tecnologias: ${proj.technologies.join(", ")}*\n`;
        }
        md += `\n`;
      }
    }

    if (section === "education" && resume.education?.length) {
      md += `## FORMAÇÃO ACADÊMICA\n`;
      for (const edu of resume.education) {
        md += `- **${edu.degree}** — ${edu.institution} (${edu.year})\n`;
      }
      md += `\n`;
    }

    if (section === "certifications" && resume.certifications?.length) {
      md += `## CERTIFICAÇÕES\n`;
      for (const cert of resume.certifications) {
        md += `- **${cert.name}** — ${cert.issuer}${cert.year ? ` (${cert.year})` : ""}\n`;
      }
      md += `\n`;
    }

    if (section === "languages" && resume.languages?.length) {
      md += `## IDIOMAS\n`;
      for (const lang of resume.languages) {
        md += `- **${lang.language}:** ${lang.proficiency}\n`;
      }
      md += `\n`;
    }
  }

  return md.trim();
}

/**
 * Exporta no padrão aberto JSON Resume (https://jsonresume.org/schema/)
 */
export function generateJsonResume(resume: ResumeData): string {
  const jsonResume = {
    $schema:
      "https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json",
    basics: {
      name: resume.fullName,
      label: resume.headline,
      email: resume.email || "",
      phone: resume.phone || "",
      url: resume.portfolioUrl || "",
      summary: resume.summary,
      location: {
        address: resume.location || "",
      },
      profiles: [
        ...(resume.linkedinUrl
          ? [{ network: "LinkedIn", url: resume.linkedinUrl }]
          : []),
        ...(resume.githubUrl
          ? [{ network: "GitHub", url: resume.githubUrl }]
          : []),
      ],
    },
    work: (resume.experiences || []).map((exp) => ({
      name: exp.company,
      position: exp.role,
      startDate: exp.period,
      location: exp.location || "",
      highlights: exp.bullets,
      keywords: exp.technologies || [],
    })),
    education: (resume.education || []).map((edu) => ({
      institution: edu.institution,
      area: edu.degree,
      studyType: edu.degree,
      endDate: edu.year,
    })),
    skills: [
      {
        name: "Linguagens & Tecnologias",
        keywords: resume.skills.technical || [],
      },
      {
        name: "Metodologias & Práticas",
        keywords: resume.skills.domain || [],
      },
      {
        name: "Ferramentas & DevOps",
        keywords: resume.skills.tools || [],
      },
    ],
    projects: (resume.projects || []).map((proj) => ({
      name: proj.name,
      description: proj.description,
      keywords: proj.technologies || [],
      url: proj.url || "",
    })),
    certificates: (resume.certifications || []).map((cert) => ({
      name: cert.name,
      issuer: cert.issuer,
      date: cert.year || "",
      url: cert.url || "",
    })),
    languages: (resume.languages || []).map((lang) => ({
      language: lang.language,
      fluency: lang.proficiency,
    })),
  };

  return JSON.stringify(jsonResume, null, 2);
}

export interface GupyQuickCopyBlock {
  id: string;
  label: string;
  helper: string;
  content: string;
}

/**
 * Cria blocos individuais prontos para colagem rápida nos campos de formulários Gupy / Workday
 */
export function generateGupyBlocks(resume: ResumeData): GupyQuickCopyBlock[] {
  const blocks: GupyQuickCopyBlock[] = [
    {
      id: "headline",
      label: "Título / Cargo Alvo",
      helper: "Cole no campo 'Título do Perfil' ou 'Objetivo Profissional'",
      content: resume.headline,
    },
    {
      id: "summary",
      label: "Resumo Profissional / Sobre Mim",
      helper: "Otimizado com palavras-chave de triagem e senioridade",
      content: resume.summary,
    },
    {
      id: "skills",
      label: "Lista Unificada de Hard Skills & Ferramentas",
      helper: "Ideal para campos de tags ou 'Conhecimentos Técnicos'",
      content: [
        ...(resume.skills.technical || []),
        ...(resume.skills.domain || []),
        ...(resume.skills.tools || []),
      ].join(", "),
    },
  ];

  (resume.experiences || []).forEach((exp, idx) => {
    const descLines: string[] = [
      `${exp.role} — ${exp.company} (${exp.period}${exp.location ? ` | ${exp.location}` : ""})`,
    ];
    if (exp.technologies?.length) {
      descLines.push(`Stack: ${exp.technologies.join(", ")}`);
    }
    for (const b of exp.bullets) {
      descLines.push(`• ${b}`);
    }

    blocks.push({
      id: `exp-${idx}`,
      label: `Experiência #${idx + 1}: ${exp.role} — ${exp.company}`,
      helper: `Período: ${exp.period}${exp.location ? ` (${exp.location})` : ""}`,
      content: descLines.join("\n"),
    });
  });

  return blocks;
}

function createSectionHeadingParagraph(title: string): Paragraph {
  return new Paragraph({
    spacing: { before: 220, after: 80 },
    border: {
      bottom: {
        color: "27272A",
        space: 4,
        style: BorderStyle.SINGLE,
        size: 6,
      },
    },
    children: [
      new TextRun({
        text: title.toUpperCase(),
        bold: true,
        size: 20, // 10pt
        font: "Calibri",
      }),
    ],
  });
}

function buildDocxDocument(
  resume: ResumeData,
  options?: ExportOptions
): Document {
  const activeSections = getActiveSections(options);
  const baseFontHalfPt = Math.round((options?.fontSizePt || 10.5) * 2);
  const children: Paragraph[] = [];

  // Cabeçalho do Candidato
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: resume.fullName,
          bold: true,
          size: 32, // 16pt
          font: "Calibri",
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: resume.headline,
          bold: true,
          size: baseFontHalfPt,
          font: "Calibri",
          color: "27272A",
        }),
      ],
    })
  );

  const contactItems = [
    resume.location,
    resume.email,
    resume.phone,
    resume.linkedinUrl,
    resume.githubUrl,
    resume.portfolioUrl,
  ].filter(Boolean);

  if (contactItems.length > 0) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 160 },
        children: [
          new TextRun({
            text: contactItems.join("  •  "),
            size: 18, // 9pt
            font: "Calibri",
            color: "52525B",
          }),
        ],
      })
    );
  }

  for (const section of activeSections) {
    if (section === "summary" && resume.summary) {
      children.push(createSectionHeadingParagraph("Resumo Profissional"));
      children.push(
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: resume.summary,
              size: baseFontHalfPt,
              font: "Calibri",
            }),
          ],
        })
      );
    }

    if (section === "skills") {
      children.push(createSectionHeadingParagraph("Competências Técnicas"));
      if (resume.skills.technical?.length) {
        children.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: "Linguagens & Tecnologias: ",
                bold: true,
                size: baseFontHalfPt,
                font: "Calibri",
              }),
              new TextRun({
                text: resume.skills.technical.join(" • "),
                size: baseFontHalfPt,
                font: "Calibri",
              }),
            ],
          })
        );
      }
      if (resume.skills.domain?.length) {
        children.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: "Práticas & Metodologias: ",
                bold: true,
                size: baseFontHalfPt,
                font: "Calibri",
              }),
              new TextRun({
                text: resume.skills.domain.join(" • "),
                size: baseFontHalfPt,
                font: "Calibri",
              }),
            ],
          })
        );
      }
      if (resume.skills.tools?.length) {
        children.push(
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({
                text: "Ferramentas & DevOps: ",
                bold: true,
                size: baseFontHalfPt,
                font: "Calibri",
              }),
              new TextRun({
                text: resume.skills.tools.join(" • "),
                size: baseFontHalfPt,
                font: "Calibri",
              }),
            ],
          })
        );
      }
    }

    if (section === "experiences" && resume.experiences?.length) {
      children.push(createSectionHeadingParagraph("Experiência Profissional"));
      for (const exp of resume.experiences) {
        children.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 100, after: 30 },
            children: [
              new TextRun({
                text: `${exp.role} | ${exp.company}`,
                bold: true,
                size: baseFontHalfPt,
                font: "Calibri",
              }),
              new TextRun({
                text: `   (${exp.period}${exp.location ? ` • ${exp.location}` : ""})`,
                size: 19,
                font: "Calibri",
                color: "52525B",
              }),
            ],
          })
        );

        if (exp.technologies?.length) {
          children.push(
            new Paragraph({
              spacing: { after: 40 },
              children: [
                new TextRun({
                  text: `Tecnologias: ${exp.technologies.join(", ")}`,
                  italics: true,
                  size: 19,
                  font: "Calibri",
                  color: "52525B",
                }),
              ],
            })
          );
        }

        for (const b of exp.bullets) {
          children.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { after: 35 },
              children: [
                new TextRun({
                  text: b,
                  size: baseFontHalfPt,
                  font: "Calibri",
                }),
              ],
            })
          );
        }
      }
    }

    if (section === "projects" && resume.projects?.length) {
      children.push(createSectionHeadingParagraph("Projetos Relevantes"));
      for (const proj of resume.projects) {
        children.push(
          new Paragraph({
            spacing: { before: 60, after: 20 },
            children: [
              new TextRun({
                text: proj.name,
                bold: true,
                size: baseFontHalfPt,
                font: "Calibri",
              }),
              ...(proj.url
                ? [
                    new TextRun({
                      text: ` (${proj.url})`,
                      size: 18,
                      font: "Calibri",
                      color: "52525B",
                    }),
                  ]
                : []),
            ],
          })
        );
        children.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: proj.description,
                size: baseFontHalfPt,
                font: "Calibri",
              }),
            ],
          })
        );
      }
    }

    if (section === "education" && resume.education?.length) {
      children.push(createSectionHeadingParagraph("Formação Acadêmica"));
      for (const edu of resume.education) {
        children.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: edu.degree,
                bold: true,
                size: baseFontHalfPt,
                font: "Calibri",
              }),
              new TextRun({
                text: ` — ${edu.institution} (${edu.year})`,
                size: baseFontHalfPt,
                font: "Calibri",
              }),
            ],
          })
        );
      }
    }

    if (section === "certifications" && resume.certifications?.length) {
      children.push(createSectionHeadingParagraph("Certificações"));
      for (const cert of resume.certifications) {
        children.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: cert.name,
                bold: true,
                size: baseFontHalfPt,
                font: "Calibri",
              }),
              new TextRun({
                text: ` — ${cert.issuer}${cert.year ? ` (${cert.year})` : ""}`,
                size: baseFontHalfPt,
                font: "Calibri",
              }),
            ],
          })
        );
      }
    }

    if (section === "languages" && resume.languages?.length) {
      children.push(createSectionHeadingParagraph("Idiomas"));
      children.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({
              text: resume.languages
                .map((l) => `${l.language}: ${l.proficiency}`)
                .join("  •  "),
              size: baseFontHalfPt,
              font: "Calibri",
            }),
          ],
        })
      );
    }
  }

  return new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720, // 0.5 inch
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children,
      },
    ],
  });
}

export async function generateDocxBuffer(
  resume: ResumeData,
  options?: ExportOptions
): Promise<Uint8Array> {
  const doc = buildDocxDocument(resume, options);
  const buffer = await Packer.toBuffer(doc);
  return new Uint8Array(buffer);
}

export async function generateDocxBlob(
  resume: ResumeData,
  options?: ExportOptions
): Promise<Blob> {
  const doc = buildDocxDocument(resume, options);
  return Packer.toBlob(doc);
}
