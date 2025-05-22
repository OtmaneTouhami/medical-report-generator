from crewai.tools import BaseTool
from typing import Type, List, Dict, Optional
from pydantic import BaseModel, Field
import os
import re
from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Basic list of French stopwords
FRENCH_STOPWORDS = [
    "au",
    "aux",
    "avec",
    "ce",
    "ces",
    "dans",
    "de",
    "des",
    "du",
    "elle",
    "en",
    "et",
    "eux",
    "il",
    "ils",
    "je",
    "la",
    "le",
    "les",
    "leur",
    "lui",
    "ma",
    "mais",
    "me",
    "même",
    "mes",
    "moi",
    "mon",
    "ne",
    "nos",
    "notre",
    "nous",
    "on",
    "ou",
    "par",
    "pas",
    "pour",
    "qu",
    "que",
    "qui",
    "sa",
    "se",
    "ses",
    "son",
    "sur",
    "ta",
    "te",
    "tes",
    "toi",
    "ton",
    "tu",
    "un",
    "une",
    "vos",
    "votre",
    "vous",
    "c",
    "d",
    "j",
    "l",
    "à",
    "m",
    "n",
    "s",
    "t",
    "y",
    "été",
    "étée",
    "étées",
    "étés",
    "étant",
    "étante",
    "étants",
    "étantes",
    "suis",
    "es",
    "est",
    "sommes",
    "êtes",
    "sont",
    "serai",
    "seras",
    "sera",
    "serons",
    "serez",
    "seront",
    "aurais",
    "aura",
    "aurons",
    "aurez",
    "auront",
    "avais",
    "avait",
    "avions",
    "aviez",
    "avaient",
    "eut",
    "eûmes",
    "eûtes",
    "eurent",
    "ai",
    "as",
    "avons",
    "avez",
    "ont",
    "aurai",
    "auras",
    "aura",
    "aurons",
    "aurez",
    "auront",
    "fus",
    "fut",
    "fûmes",
    "fûtes",
    "furent",
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
    knowledge_base_path: Path = Field(
        default_factory=lambda: Path("knowledge/reports/training")
    )

    def __init__(self, knowledge_base_path: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        if knowledge_base_path is not None:
            self.knowledge_base_path = Path(knowledge_base_path)

        # Initialisation explicite des attributs privés
        self._vectorizer = TfidfVectorizer(
            stop_words=FRENCH_STOPWORDS, max_features=5000
        )
        self._reports_cache = {}

    def _read_report(self, file_path: str) -> Dict[str, str]:
        """Reads a medical report and extracts its sections."""
        if file_path in self._reports_cache:
            return self._reports_cache[file_path]

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
        except (FileNotFoundError, UnicodeDecodeError) as e:
            print(f"Erreur lecture fichier {file_path}: {e}")
            return {}

        sections = {}
        current_section = None
        section_content = []

        section_headers = [
            "TITRE:",
            "Indication:",
            "Technique:",
            "Incidences:",
            "Résultat:",
            "Conclusion:",
        ]

        lines = content.split("\\n")
        for line in lines:
            line_stripped = line.strip()

            # Vérification si c'est un en-tête de section
            is_header = False
            for header in section_headers:
                if line_stripped.startswith(header):
                    # Sauvegarder la section précédente
                    if current_section and section_content:
                        sections[current_section] = "\\n".join(section_content).strip()

                    # Extraction correcte du nom de section
                    current_section = line_stripped.split(":", 1)[
                        0
                    ]  # Split only on the first colon
                    section_content = []

                    # Si le contenu suit directement l'en-tête sur la même ligne
                    if len(line_stripped.split(":", 1)) > 1:
                        content_after_header = line_stripped.split(":", 1)[1].strip()
                        if content_after_header:
                            section_content.append(content_after_header)
                    is_header = True
                    break

            if (
                not is_header and current_section and line_stripped
            ):  # Ignorer les lignes vides et s'assurer que ce n'est pas un header
                section_content.append(line_stripped)

        # Ajouter la dernière section
        if current_section and section_content:
            sections[current_section] = "\\n".join(section_content).strip()

        self._reports_cache[file_path] = sections
        return sections

    def _extract_report_type_from_filename(self, filename: str) -> Optional[str]:
        """Extracts the report type from the filename."""
        basename = os.path.basename(filename)

        # Essayer plusieurs patterns
        patterns = [
            r"irm_([a-zA-Z0-9_\\-]+?)_\\d+\\.txt",  # irm_type_number.txt (type can have _, letters, numbers, -)
            r"irm_([a-zA-Z0-9_\\-]+?)\\.txt",  # irm_type.txt
            r"([a-zA-Z0-9_\\-]+?)_irm_\\d+\\.txt",  # type_irm_number.txt
            r"([a-zA-Z0-9_\\-]+?)\\.txt",  # type.txt (generic, less specific)
        ]

        for pattern in patterns:
            match = re.match(pattern, basename, re.IGNORECASE)
            if match:
                # Ensure we capture the correct group, usually the first one
                # For patterns like ([^_]+)_irm_\d+\.txt, group(1) is the type
                # For irm_([^_]+)\.txt, group(1) is the type
                # Check if match.groups() is not empty
                if match.groups():
                    return match.group(1).lower()

        return None

    def _get_all_reports(self) -> List[Dict]:
        """Loads all reports from the knowledge base directory."""
        reports = []

        if not self.knowledge_base_path.exists():
            print(f"Attention: Le chemin {self.knowledge_base_path} n'existe pas.")
            return []

        try:
            for file_path_obj in self.knowledge_base_path.glob("*.txt"):
                file_path = str(file_path_obj)
                report_type = self._extract_report_type_from_filename(file_path)
                if report_type:
                    report_content = self._read_report(file_path)
                    if report_content:  # Seulement si le contenu a été lu avec succès
                        reports.append(
                            {
                                "path": file_path,
                                "type": report_type,
                                "content": report_content,
                            }
                        )
        except Exception as e:
            print(
                f"Erreur lors du chargement des rapports depuis {self.knowledge_base_path}: {e}"
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
        """Calculates the similarity of reports to the query using TF-IDF and cosine similarity."""
        if not reports:
            return []

        # Préparation du corpus
        corpus = []
        valid_reports = []

        # Ajouter la requête
        corpus.append(query)

        # Traiter chaque rapport
        for report in reports:
            # Combiner toutes les sections en un seul texte
            report_sections = []
            # Ensure content is a dict
            if isinstance(report.get("content"), dict):
                for section_name, section_content_value in report["content"].items():
                    if (
                        section_content_value
                        and isinstance(section_content_value, str)
                        and section_content_value.strip()
                    ):
                        report_sections.append(
                            f"{section_name}: {section_content_value}"
                        )

            if report_sections:  # Seulement si le rapport a du contenu
                report_text = " ".join(report_sections)
                corpus.append(report_text)
                valid_reports.append(report)
            else:
                # If report has no processable content, assign 0 similarity and keep it
                report["similarity"] = 0.0

        # If only query exists or no valid reports to compare against
        if len(corpus) < 2:
            # Assign 0 similarity to all original reports if no comparison happened
            for r_report in reports:
                if "similarity" not in r_report:
                    r_report["similarity"] = (
                        0.0  # Corrected variable name and formatting
                    )
            return sorted(reports, key=lambda x: x.get("similarity", 0), reverse=True)

        try:
            # Calcul de la matrice TF-IDF
            # Utilisation de TF-IDF pour la vectorisation
            # On utilise le corpus complet pour la vectorisation
            # et on ne garde que les rapports valides pour le calcul de similarité

            tfidf_matrix = self._vectorizer.fit_transform(corpus)

            # Calcul de similarité cosinus
            # tfidf_matrix[0:1] is the query vector
            # tfidf_matrix[1:] are the report vectors
            similarities = cosine_similarity(
                tfidf_matrix[0:1], tfidf_matrix[1:]
            ).flatten()

            # Ajout des scores aux rapports valides
            for i, similarity_score in enumerate(similarities):
                if i < len(valid_reports):  # Make sure we don't go out of bounds
                    valid_reports[i]["similarity"] = float(similarity_score)

            # Create a map of path to similarity for valid_reports
            similarity_map = {
                report["path"]: report.get("similarity", 0.0)
                for report in valid_reports
            }

            # Update original reports list with new similarities
            for report in reports:
                if report["path"] in similarity_map:
                    report["similarity"] = similarity_map[report["path"]]
                elif (
                    "similarity" not in report
                ):  # If not in valid_reports and no previous similarity
                    report["similarity"] = 0.0

            # Tri par similarité décroissante
            return sorted(reports, key=lambda x: x.get("similarity", 0), reverse=True)

        except Exception as e:
            print(f"Erreur calcul similarité: {e}")
            # Retourner les rapports sans score de similarité ou avec 0
            for report_item in reports:  # Ensure all reports in the original list get a default similarity # Corrected variable name
                if "similarity" not in report_item:
                    report_item["similarity"] = 0.0  # Corrected formatting
            return sorted(reports, key=lambda x: x.get("similarity", 0), reverse=True)

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
