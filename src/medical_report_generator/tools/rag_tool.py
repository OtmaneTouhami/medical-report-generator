from crewai.tools import BaseTool
from typing import Type, List, Dict, Optional
from pydantic import BaseModel, Field, PrivateAttr
import os
import re
from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Basic list of French stopwords
FRENCH_STOPWORDS = [
    'au', 'aux', 'avec', 'ce', 'ces', 'dans', 'de', 'des', 'du', 'elle', 'en', 'et', 'eux', 'il', 'ils',
    'je', 'la', 'le', 'les', 'leur', 'lui', 'ma', 'mais', 'me', 'même', 'mes', 'moi', 'mon', 'ne', 'nos',
    'notre', 'nous', 'on', 'ou', 'par', 'pas', 'pour', 'qu', 'que', 'qui', 'sa', 'se', 'ses', 'son',
    'sur', 'ta', 'te', 'tes', 'toi', 'ton', 'tu', 'un', 'une', 'vos', 'votre', 'vous', 'c', 'd', 'j',
    'l', 'à', 'm', 'n', 's', 't', 'y', 'été', 'étée', 'étées', 'étés', 'étant', 'étante', 'étants',
    'étantes', 'suis', 'es', 'est', 'sommes', 'êtes', 'sont', 'serai', 'seras', 'sera', 'serons',
    'serez', 'seront', 'aurais', 'aura', 'aurons', 'aurez', 'auront', 'avais', 'avait', 'avions',
    'aviez', 'avaient', 'eut', 'eûmes', 'eûtes', 'eurent', 'ai', 'as', 'avons', 'avez', 'ont', 'aurai',
    'auras', 'aura', 'aurons', 'aurez', 'auront', 'fus', 'fut', 'fûmes', 'fûtes', 'furent'
]

class RetrieveReportsInput(BaseModel):
    """Input schema for retrieving similar medical reports."""

    query: str = Field(..., description="The query to search for similar reports.")
    report_type: str = Field(
        ...,
        description="The type of report to retrieve (e.g., 'irm_hepatique', 'irm_prostate').",
    )
    top_k: int = Field(3, description="Number of reports to retrieve (default: 3).")


class RAGMedicalReportsTool(BaseTool):
    name: str = "retrieve_similar_reports"
    description: str = (
        "Retrieves similar medical reports from the knowledge base "
        "to use as reference when generating a new report."
    )
    args_schema: Type[BaseModel] = RetrieveReportsInput
    knowledge_base_path: Path = Field(default_factory=lambda: Path("knowledge/reports/training"))
    _vectorizer: TfidfVectorizer = PrivateAttr(default_factory=lambda: TfidfVectorizer(stop_words=FRENCH_STOPWORDS))
    _reports_cache: dict = PrivateAttr(default_factory=dict)

    def __init__(self, knowledge_base_path: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        if knowledge_base_path is not None:
            self.knowledge_base_path = Path(knowledge_base_path)
        # The _vectorizer and _reports_cache will be initialized by their default_factory

    def _read_report(self, file_path: str) -> Dict[str, str]:
        """Reads a report file and returns it as a dictionary of sections."""
        if file_path in self._reports_cache:
            return self._reports_cache[file_path]

        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Parse sections
        sections = {}
        current_section = None
        section_content = []

        lines = content.split("\n")
        for line in lines:
            line = line.strip()
            if line in [
                "TITRE:",
                "Indication:",
                "Technique:",
                "Incidences:",
                "Résultat:",
                "Conclusion:",
            ]:
                # Save previous section if exists
                if current_section:
                    sections[current_section] = "\n".join(section_content).strip()
                    section_content = []
                current_section = line.rstrip(":")
            elif current_section:
                section_content.append(line)

        # Add the last section
        if current_section and section_content:
            sections[current_section] = "\n".join(section_content).strip()

        # Cache the result
        self._reports_cache[file_path] = sections
        return sections

    def _extract_report_type_from_filename(self, filename: str) -> str:
        """Extract the report type from the filename."""
        # Expected format: irm_type_number.txt
        match = re.match(r"irm_([^_]+)_\d+\.txt", os.path.basename(filename))
        if match:
            return match.group(1)
        return None

    def _get_all_reports(self) -> List[Dict]:
        """Gets all reports from the knowledge base."""
        reports = []
        # Ensure knowledge_base_path is resolved correctly if it's relative
        # For now, assuming it's correctly set by __init__ or default_factory
        if not self.knowledge_base_path.exists():
            # Handle case where path doesn't exist, maybe return empty or log warning
            print(f"Warning: Knowledge base path {self.knowledge_base_path} does not exist.")
            return []
        for file_path in self.knowledge_base_path.glob("*.txt"):
            report_type = self._extract_report_type_from_filename(str(file_path))
            if report_type:
                report_content = self._read_report(str(file_path))
                reports.append(
                    {
                        "path": str(file_path),
                        "type": report_type,
                        "content": report_content,
                    }
                )
        return reports

    def _filter_reports_by_type(
        self, reports: List[Dict], report_type: str
    ) -> List[Dict]:
        """Filters reports by type."""
        if not report_type or report_type.lower() == "all":
            return reports

        return [
            report
            for report in reports
            if report_type.lower() in report["type"].lower()
        ]

    def _calculate_similarity(self, query: str, reports: List[Dict]) -> List[Dict]:
        """Calculates similarity between the query and each report."""
        if not reports:
            return []

        # Prepare corpus for vectorization
        corpus = [query]
        for report in reports:
            # Combine all sections into a single text for comparison
            report_text = " ".join([v for v in report["content"].values() if v])
            corpus.append(report_text)

        # Vectorize
        try:
            tfidf_matrix = self._vectorizer.fit_transform(corpus)

            # Calculate cosine similarity
            cosine_similarities = cosine_similarity(
                tfidf_matrix[0:1], tfidf_matrix[1:]
            ).flatten()

            # Add similarity scores to reports
            for i, similarity in enumerate(cosine_similarities):
                reports[i]["similarity"] = float(similarity)

            # Sort by similarity (descending)
            return sorted(reports, key=lambda x: x["similarity"], reverse=True)
        except Exception as e:
            print(f"Error calculating similarity: {e}")
            # If vectorization fails, return reports without sorting
            for report in reports:
                report["similarity"] = 0.0
            return reports

    def _format_report_for_output(self, report: Dict) -> str:
        """Formats a report for output."""
        output = []

        # Add path and similarity
        output.append(f"Report: {os.path.basename(report['path'])}")
        if "similarity" in report:
            output.append(f"Similarity: {report['similarity']:.4f}")
        output.append("")

        # Add content by section
        for section in [
            "TITRE",
            "Indication",
            "Technique",
            "Incidences",
            "Résultat",
            "Conclusion",
        ]:
            if section in report["content"]:
                output.append(f"{section}:")
                output.append(report["content"][section])
                output.append("")

        return "\n".join(output)

    def _run(self, query: str, report_type: str, top_k: int = 3) -> str:
        """Retrieves similar reports from the knowledge base."""
        # Get all reports
        all_reports = self._get_all_reports()

        # Filter by type if specified
        filtered_reports = self._filter_reports_by_type(all_reports, report_type)

        if not filtered_reports:
            return f"No reports found for type: {report_type}. Available types: {', '.join(set(report['type'] for report in all_reports))}"

        # Calculate similarity
        similar_reports = self._calculate_similarity(query, filtered_reports)

        # Get top_k reports
        top_reports = similar_reports[:top_k]

        # Format output
        output = []
        output.append(
            f"Retrieved {len(top_reports)} similar reports for query: '{query}'"
        )
        output.append("")

        for i, report in enumerate(top_reports, 1):
            output.append(f"--- Report {i} ---")
            output.append(self._format_report_for_output(report))

        return "\n".join(output)
