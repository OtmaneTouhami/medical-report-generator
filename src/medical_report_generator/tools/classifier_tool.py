from crewai.tools import BaseTool
from typing import Type, ClassVar
from pydantic import BaseModel, Field


class ClassifyReportInput(BaseModel):
    """Input schema for classifying medical report type."""

    raw_text: str = Field(..., description="The raw medical text to classify.")


class MedicalReportClassifierTool(BaseTool):
    name: str = "classify_report_type"
    description: str = (
        "Classifies the type of medical report (e.g., 'irm_hepatique', 'irm_prostate') "
        "based on the raw medical text input."
    )
    args_schema: Type[BaseModel] = ClassifyReportInput

    # Make sure the tool is properly registered with crewAI
    tool_name: ClassVar[str] = "classify_report_type"

    def _run(self, raw_text: str) -> str:
        """Classifies the type of medical report based on the raw text."""
        # This is a simplified classification approach
        # In a production system, you would use a more sophisticated ML model

        # Dictionary mapping keywords to report types
        report_type_keywords = {
            "irm_hepatique": ["foie", "hépatique", "liver", "hepatic", "biliaire", "cholangio-irm", "bili-irm"],
            "irm_genou": [
                "genou",
                "knee",
                "ménisque", "ménisques",
                "ligament croisé", "ligaments croisés", "lca", "lcp",
                "tibia",
                "fémur", "fémoral", "condyle"
            ],
            "irm_cerebrale": [
                "cerveau", "cérébral", "encéphale", "encéphalique",
                "brain",
                "crâne", "crânien",
                "skull",
                "neurologique", "neuro", "avc"
            ],
            "irm_prostate": ["prostate", "prostatique", "psa"],
            "irm_cardiaque": [
                "cœur", "cardiaque",
                "heart", "cardiac",
                "myocarde", "myocardique",
                "ventricule", "vg", "vd"
            ],
            "irm_rachis": [
                "rachis", "colonne vertébrale", "vertèbre", "vertébral", "disque intervertébral",
                "spine",
                "lombaire", "lombalgie",
                "cervical", "cervicalgie",
                "dorsal", "moelle épinière"
            ],
            "irm_epaule": ["épaule", "shoulder", "coiffe des rotateurs", "humérus", "rotateur", "tendon", "supra-épineux", "infra-épineux"],
            "irm_sein": ["sein", "mammaire", "breast", "mammographie", "nodule mammaire", "tumeur du sein"],
            "irm_pelvis": ["pelvis", "pelvien", "bassin", "endométriose", "utérus", "ovaires"],
            "irm_abdominale": [
                "abdomen", "abdominal",
                "estomac", "gastrique",
                "intestin", "grêle", "côlon", "pancréas", "rate"
            ],
            "irm_entero_mici": ["crohn", "mici", "intestin grêle", "iléon", "jéjunum", "entéro", "entérographie par irm", "maladie inflammatoire chronique de l'intestin"],
            "irm_epilepsie": ["épilepsie", "crise épileptique", "crises", "activité épileptiforme", "sclérose hippocampique", "dysplasie corticale", "EEG"],
            # Add more report types as needed
        }

        # Normalize the input text (lowercase)
        normalized_text = raw_text.lower()

        # Count occurrences of keywords for each report type
        type_scores = {}
        for report_type, keywords in report_type_keywords.items():
            score = 0
            for keyword in keywords:
                score += normalized_text.count(keyword)
            if score > 0:
                type_scores[report_type] = score

        # Determine the report type with the highest score
        if type_scores:
            best_match = max(type_scores.items(), key=lambda x: x[1])
            return best_match[0]
        else:
            # Default if no keywords match
            return "irm_general"
