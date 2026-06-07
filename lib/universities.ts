import { getUniversitiesData } from "@/lib/data-source";

export const UNIVERSITIES_DATA = getUniversitiesData().map(
  (item) => {
    const university = { ...item };
    delete university.knowledge_text;
    return university;
  }
);
