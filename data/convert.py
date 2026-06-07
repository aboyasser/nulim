import json

# 1. قراءة ملف البيانات الأساسي المستخرج للجامعات السعودية
with open('final_output.json', 'r', encoding='utf-8') as f:
    universities_data = json.load(f)

studio_tuning_data = []

# 2. المرور على الجامعات والتخصصات لتوليد عينات التدريب
for university in universities_data:
    uni_name = university.get('name', '').strip()
    city = university.get('city', '').strip()
    
    for program in university.get('programs', []):
        prog_name = program.get('name', '').strip()
        college = program.get('college', '').strip()
        track = program.get('track', '').strip()
        gender = program.get('gender', '').strip()
        location = program.get('location', '').strip()
        degree = program.get('degree', '').strip()
        
        # معالجة النسبة الدنيا في حال كانت فارغة
        min_rate = program.get('min_rate')
        min_rate_str = f"{min_rate}%" if min_rate else "غير محدد بدقة أو يعتمد على المقاعد المتاحة"
        
        # معالجة الصيغة الموزونة
        formula = program.get('formula', '').strip()
        if not formula:
            formula = "تخضع لمعايير القبول العامة للجامعة"

        # --- القالب الأول: استفسار تفصيلي شامل عن التخصص ---
        prompt_1 = f"ما هي تفاصيل وشروط القبول في تخصص {prog_name} المتاح في {uni_name}؟"
        response_1 = (f"تفاصيل القبول لتخصص ({prog_name}) في {uni_name} هي كالتالي:\n"
                      f"• الدرجة العلمية: {degree}\n"
                      f"• الكلية: {college}\n"
                      f"• مقر الدراسة: {location} (مدينة {city})\n"
                      f"• المسار المستهدف: {track}\n"
                      f"• الجنس المتاح له: {gender}\n"
                      f"• صيغة النسبة الموزونة: {formula}\n"
                      f"• الحد الأدنى للقبول: {min_rate_str}")

        # --- القالب الثاني: استفسار مخصص عن طريقة حساب الموزونة ---
        prompt_2 = f"كيف تحسب النسبة الموزونة لتخصص {prog_name} في {uni_name}؟"
        response_2 = f"النسبة الموزونة المعتمدة لتخصص {prog_name} في {uni_name} هي: {formula}."

        # --- القالب الثالث: استفسار عن الجنس والموقع ---
        prompt_3 = f"هل تخصص {prog_name} في {uni_name} فرع {location} متاح للطلاب أم للطالبات؟"
        response_3 = f"تخصص {prog_name} في {uni_name} بفرع {location} متاح لـ: {gender}."

        # تجميع القوالب وصياغتها بالهيكل المعتمد لـ Google AI Studio
        for p, r in [(prompt_1, response_1), (prompt_2, response_2), (prompt_3, response_3)]:
            example = {
                "contents": [
                    {
                        "role": "user",
                        "parts": [{"text": p}]
                    },
                    {
                        "role": "model",
                        "parts": [{"text": r}]
                    }
                ]
            }
            studio_tuning_data.append(example)

# 3. حفظ البيانات الناتجة بصيغة JSONL (سطر لكل كائن)
output_filename = 'gemini_studio_dataset.jsonl'
with open(output_filename, 'w', encoding='utf-8') as f:
    for entry in studio_tuning_data:
        f.write(json.dumps(entry, ensure_ascii=False) + '\n')

print(f"تم بنجاح توليد {len(studio_tuning_data)} عينة تدريبية متوافقة.")
print(f"تم حفظ الملف باسم: {output_filename}")
