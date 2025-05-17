# MedicalReportGenerator Crew

Welcome to the MedicalReportGenerator Crew, an advanced AI-based system designed to generate formal medical reports from raw clinical notes and dictations, primarily in French. This project is powered by [crewAI](https://crewai.com), a framework for creating multi-agent AI systems that collaborate effectively on complex tasks.

## Project Overview

This system uses a team of specialized AI agents working together to transform unstructured French medical text into properly formatted radiology reports:

1. **Report Classifier (`report_classifier`)**: Identifies the specific type of medical examination (e.g., IRM du genou, IRM hépatique) from the input text. Its output is used for dynamic report titling and to guide focused RAG retrieval.
2. **Information Extractor (`information_extractor`)**: Identifies and extracts all relevant medical facts from the raw input, utilizing a RAG (Retrieval Augmented Generation) tool that can leverage similar reports from a knowledge base, filtered by the classified report type.
3. **Template Mapper (`template_mapper`)**: Maps extracted data to appropriate sections of a standard French radiology report (Indication, Technique, Incidences, Résultat, Conclusion).
4. **Report Section Generator (`report_section_generator`)**: Transforms the structured data for each section into professional medical language, in French.
5. **Semantic Validator (`semantic_validator`)**: Reviews the generated section content for clinical and semantic coherence, checking for contradictions or medically improbable statements, and suggests corrections if needed.
6. **Report Finalizer and Reviewer (`report_finalizer_and_reviewer`)**: Assembles the (potentially validated) sections into the final report structure. It uses the classified report type to generate a dynamic title (e.g., "Compte Rendu IRM du Genou") and ensures empty sections are appropriately marked (e.g., with "Néant").

The system outputs a professional radiology report in French, in both text and Word document (.docx) formats.

## Key Features & Recent Enhancements

- **Multi-Agent System**: Leverages multiple specialized AI agents for a modular and robust workflow.
- **French Language Focus**: All agents, tasks, and tools are configured to process and generate medical reports in French.
- **Dynamic Report Titling**: The title of the generated report is dynamically set based on the type of medical examination identified by the `report_classifier` agent.
- **Retrieval Augmented Generation (RAG)**: The `information_extractor` uses a RAG tool (`RAGMedicalReportsTool`) to retrieve relevant information from a knowledge base of existing French medical reports. This tool uses French stopwords for TF-IDF vectorization.
- **Report Type Classification**: A dedicated `MedicalReportClassifierTool` uses keyword matching to identify the specific type of IRM or other medical exam, with an expandable keyword list for various exam types (e.g., `irm_hepatique`, `irm_genou`, `irm_entero_mici`, `irm_epilepsie`).
- **Semantic Validation**: A `semantic_validator` agent reviews the drafted report sections for clinical and semantic consistency, aiming to detect contradictions or improbable statements.
- **Structured DOCX Output**: Generates a formatted Word document (`.docx`) with appropriate section headers (Indication, Technique, Incidences, Résultat, Conclusion) and handles empty sections elegantly by marking them as "Néant".
- **Configurable Workflow**: Agents and tasks are defined in YAML files (`config/agents.yaml`, `config/tasks.yaml`), allowing for easier customization of roles, goals, LLMs, and task descriptions.
- **Testing Framework**: Includes a `test()` function in `main.py` to evaluate the system using a set of test reports. This function extracts a prompt (currently the "Indication" section) from a test file, runs the full crew, and saves the generated report alongside the ground truth for manual comparison.
- **Professor's Requirements Alignment**: The project structure and functionality have been progressively updated to meet specific academic requirements, including data partitioning for knowledge base vs. test sets, and detailed instructions for report generation and validation.

## Requirements

- Python >=3.10 <3.13
- [UV](https://docs.astral.sh/uv/) for dependency management
- Google AI Studio account with API Key (uses Gemini 2.0 flash model)

## Installation

1. Ensure you have Python >=3.10 <3.13 installed on your system

2. Install UV (if not already installed):

```bash
pip install uv
```

3. Clone the repository and navigate to the project directory

4. Install dependencies:

```bash
crewai install
```

## Configuration Setup

1. Create a `.env` file in the project root based on the provided `.env.example`:

```bash
cp .env.exemple .env
```

2. Add your **Gemini API Key** to the `.env` file:

```
GEMINI_API_KEY=your_gemini_api_key_here
```

You can obtain a token from your [Google AI Studio account](https://aistudio.google.com/apikey).

## Running the Project

Run the medical report generator from the root folder of your project:

```bash
crewai run # Runs the main report generation with a sample input
```

To run the testing function:

```bash
crewai run test # (If configured in pyproject.toml) or python src/medical_report_generator/main.py test
```

This will:
1. Initialize all the AI agents.
2. For `run`: Process the sample French medical text in `main.py`.
3. For `test`: Load a random French test report from `knowledge/reports/testing/`, extract a prompt, and process it.
4. Generate a structured French radiology report.
5. Create a formatted `.docx` file (e.g., `radiology_report.docx` for `run`, or `generated_<test_file_name>.docx` for `test`).

## Customizing the Project

### Input Medical Text

- For the main `run` command: Modify the `raw_medical_input` variable in `src/medical_report_generator/main.py`.
- For `test` command: Place French `.txt` ground truth reports in `knowledge/reports/testing/`. Prompts are currently extracted from the "Indication:" section of these files.

### Knowledge Base (for RAG)

- Place your French example medical reports (as `.txt` files) in `knowledge/reports/training/`. These are used by the `RAGMedicalReportsTool`.

### Agent Configuration

Each agent can be customized in `src/medical_report_generator/config/agents.yaml`:
- Modify roles, goals, and backstories
- Change or configure the LLM models used

### Report Template & Task Workflow

The report structure, task descriptions (all in French), and inter-task data flow are defined in `src/medical_report_generator/config/tasks.yaml`. You can modify:
- Section names and organization
- Expected data formats
- Report generation instructions

## Project Structure

```
medical_report_generator/
├── .env                  # Environment variables (e.g., GEMINI_API_KEY)
├── knowledge/
│   ├── reports/
│   │   ├── training/     # .txt files for RAG knowledge base (in French)
│   │   └── testing/      # .txt ground truth files for testing (in French)
│   │   └── testing_outputs/ # Generated reports from the test function
├── pyproject.toml        # Project dependencies and configuration
├── README.md             # This documentation file
├── src/
│   └── medical_report_generator/
│       ├── config/
│       │   ├── agents.yaml   # Agent definitions (French roles/goals)
│       │   └── tasks.yaml    # Task definitions (French descriptions)
│       ├── crew.py           # Crew and agent/task orchestration
│       ├── main.py           # Main execution script (run, test)
│       └── tools/
│           ├── __init__.py
│           ├── classifier_tool.py # Report type classification
│           ├── rag_tool.py        # RAG implementation
│           └── custom_tool.py   # Placeholder for other custom tools
# ... other files like .gitignore, etc.
```

## How It Works

1. **Input**: French raw medical text is provided.
2. **Classification**: The `report_classifier` determines the specific IRM/exam type.
3. **Data Extraction (RAG-enhanced)**: The `information_extractor`, guided by the classified report type, uses the `RAGMedicalReportsTool` to fetch relevant examples from the French knowledge base and extracts key clinical details from the input.
4. **Template Mapping**: The `template_mapper` organizes extracted French information into standard report sections.
5. **Section Content Generation**: The `report_section_generator` writes professional French content for each section.
6. **Semantic Validation**: The `semantic_validator` reviews the drafted sections for clinical and semantic coherence in French.
7. **Final Assembly & Review**: The `report_finalizer_and_reviewer` uses the classified report type for a dynamic title and assembles the validated French sections into the complete report, handling empty sections with "Néant".
8. **Document Creation**: The system generates a formatted Word document (`.docx`) of the French report.

## Troubleshooting

- **Model Access Issues**: Ensure your gemini api key  has permission to access the model
- **Python Version Errors**: Verify you're using Python >=3.10 <3.13
- **Document Generation Errors**: Check that python-docx is properly installed

## Support

For questions about this project:
- Check the [crewAI documentation](https://docs.crewai.com)
- Visit the [crewAI GitHub repository](https://github.com/joaomdmoura/crewai)
- Join the [crewAI Discord community](https://discord.com/invite/X4JWnZnxPb)
