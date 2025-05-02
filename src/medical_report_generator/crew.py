from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task

# If you want to run a snippet of code before or after the crew starts,
# you can use the @before_kickoff and @after_kickoff decorators
# https://docs.crewai.com/concepts/crews#example-crew-class-with-decorators

@CrewBase
class MedicalReportGenerator():
    """MedicalReportGenerator crew"""

    agents_config = "config/agents.yaml"
    tasks_config = "config/tasks.yaml"

    @agent
    def information_extractor(self) -> Agent:
        return Agent(
            config=self.agents_config["information_extractor"],
            verbose=True,
        )

    @agent
    def template_mapper(self) -> Agent:
        return Agent(
            config=self.agents_config["template_mapper"],
            verbose=True,
        )

    @agent
    def report_section_generator(self) -> Agent:
        return Agent(
            config=self.agents_config["report_section_generator"],
            verbose=True,
        )

    @agent
    def report_finalizer_and_reviewer(self) -> Agent:
        return Agent(
            config=self.agents_config["report_finalizer_and_reviewer"],
            verbose=True,
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
        )

    @task
    def assemble_and_review_report(self) -> Task:
        return Task(
            config=self.tasks_config["assemble_and_review_report"],
            agent=self.report_finalizer_and_reviewer(),
        )

    @crew
    def crew(self) -> Crew:
        """Creates the MedicalReportGenerator crew"""
        return Crew(
            agents=self.agents,
            tasks=[
                self.extract_medical_data(),
                self.map_data_to_template_sections(),
                self.generate_section_content(),
                self.assemble_and_review_report(),
            ],
            process=Process.sequential,
            verbose=True,
        )
