from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task
from medical_report_generator.tools import MedicalReportClassifierTool, RAGMedicalReportsTool

# If you want to run a snippet of code before or after the crew starts,
# you can use the @before_kickoff and @after_kickoff decorators
# https://docs.crewai.com/concepts/crews#example-crew-class-with-decorators


@CrewBase
class MedicalReportGenerator:
    """MedicalReportGenerator crew"""

    agents_config = "config/agents.yaml"
    tasks_config = "config/tasks.yaml"
    # Define the knowledge base path, adjust if your 'knowledge' folder is elsewhere
    knowledge_base_path = "knowledge/reports/training"

    @agent
    def report_classifier(self) -> Agent:
        return Agent(
            config=self.agents_config["report_classifier"],
            tools=[MedicalReportClassifierTool()],
            verbose=True,
        )

    @agent
    def information_extractor(self) -> Agent:
        return Agent(
            config=self.agents_config["information_extractor"],
            tools=[RAGMedicalReportsTool(knowledge_base_path=self.knowledge_base_path)],
            verbose=True,
        )

    @agent
    def template_mapper(self) -> Agent:
        return Agent(
            config=self.agents_config["template_mapper"],
            tools=[RAGMedicalReportsTool(knowledge_base_path=self.knowledge_base_path)],
            verbose=True,
        )

    @agent
    def report_section_generator(self) -> Agent:
        return Agent(
            config=self.agents_config["report_section_generator"],
            tools=[RAGMedicalReportsTool(knowledge_base_path=self.knowledge_base_path)],
            verbose=True,
        )

    @agent
    def report_finalizer_and_reviewer(self) -> Agent:
        return Agent(
            config=self.agents_config["report_finalizer_and_reviewer"],
            verbose=True,
        )

    @agent
    def semantic_validator(self) -> Agent:
        return Agent(
            config=self.agents_config["semantic_validator"],
            verbose=True
        )

    @task
    def classify_report_type(self) -> Task:
        return Task(
            config=self.tasks_config["classify_report_type"],
            agent=self.report_classifier(),
        )

    @task
    def extract_medical_data(self) -> Task:
        return Task(
            config=self.tasks_config["extract_medical_data"],
            agent=self.information_extractor(),
        )

    @task
    def map_data_to_template_sections(self) -> Task:
        return Task(
            config=self.tasks_config["map_data_to_template_sections"],
            agent=self.template_mapper(),
        )

    @task
    def generate_section_content(self) -> Task:
        return Task(
            config=self.tasks_config["generate_section_content"],
            agent=self.report_section_generator(),
            context = [self.map_data_to_template_sections()]
        )

    @task
    def validate_semantic_coherence(self) -> Task:
        return Task(
            config=self.tasks_config["validate_semantic_coherence"],
            agent=self.semantic_validator(),
            context=[self.generate_section_content()]
        )

    @task
    def assemble_and_review_report(self) -> Task:
        return Task(
            config=self.tasks_config["assemble_and_review_report"],
            agent=self.report_finalizer_and_reviewer(),
            context=[
                self.validate_semantic_coherence(), 
                self.classify_report_type()
            ]
        )

    @crew
    def crew(self) -> Crew:
        """Creates the MedicalReportGenerator crew"""
        return Crew(
            agents=self.agents,
            tasks=[
                self.classify_report_type(),
                self.extract_medical_data(),
                self.map_data_to_template_sections(),
                self.generate_section_content(),
                self.validate_semantic_coherence(),
                self.assemble_and_review_report(),
            ],
            process=Process.sequential,
            verbose=True,
        )
