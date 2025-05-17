# MedicalReportGenerator Crew

Welcome to the MedicalReportGenerator Crew, an advanced AI-based system designed to generate formal medical reports from raw clinical notes and dictations. This project is powered by [crewAI](https://crewai.com), a framework for creating multi-agent AI systems that collaborate effectively on complex tasks.

## Project Overview

This system uses a team of specialized AI agents working together to transform unstructured medical text into properly formatted radiology reports:

1. **Information Extractor**: Identifies and extracts all relevant medical facts from raw input
2. **Template Mapper**: Maps extracted data to appropriate sections of a standard radiology report 
3. **Report Section Generator**: Transforms structured data into professional medical language
4. **Report Finalizer and Reviewer**: Assembles and reviews the final report

The system outputs a professional radiology report in both text and Word document (.docx) formats.

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
crewai run
```

This will:
1. Initialize all the AI agents
2. Process the sample medical text in `main.py`
3. Generate a structured radiology report
4. Create a formatted `radiology_report.docx` file in the project root

## Customizing the Project

### Input Medical Text

To process your own medical text, modify the `raw_medical_input` variable in `src/medical_report_generator/main.py`.

### Agent Configuration

Each agent can be customized in `src/medical_report_generator/config/agents.yaml`:
- Modify roles, goals, and backstories
- Change or configure the LLM models used

### Report Template

The report structure is defined in `src/medical_report_generator/config/tasks.yaml`. You can modify:
- Section names and organization
- Expected data formats
- Report generation instructions

## Project Structure

```
medical_report_generator/
├── .env                  # Environment variables (HF_TOKEN)
├── pyproject.toml        # Project dependencies and configuration
├── README.md             # This documentation file
├── src/
│   └── medical_report_generator/
│       ├── config/
│       │   ├── agents.yaml   # Agent definitions and LLM configurations
│       │   └── tasks.yaml    # Task definitions and workflow
│       ├── crew.py           # Agent collaboration setup
│       ├── main.py           # Main execution script with sample input
│       └── tools/            # Custom tools for agents (if needed)
```

## How It Works

1. **Data Extraction**: The Information Extractor agent analyzes raw medical text to identify key clinical details
2. **Template Mapping**: The Template Mapper organizes extracted information into appropriate report sections
3. **Report Generation**: The Report Section Generator writes professional content for each section
4. **Review and Assembly**: The Finalizer assembles and formats the complete report
5. **Document Creation**: The system generates a formatted Word document

## Troubleshooting

- **Model Access Issues**: Ensure your gemini api key  has permission to access the model
- **Python Version Errors**: Verify you're using Python >=3.10 <3.13
- **Document Generation Errors**: Check that python-docx is properly installed

## Support

For questions about this project:
- Check the [crewAI documentation](https://docs.crewai.com)
- Visit the [crewAI GitHub repository](https://github.com/joaomdmoura/crewai)
- Join the [crewAI Discord community](https://discord.com/invite/X4JWnZnxPb)
