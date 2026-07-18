export const UNIVERSITY_LINKS = [
  { name: 'جامعة الملك سعود', url: 'https://ksu.edu.sa' },
  { name: 'جامعة الملك عبدالعزيز', url: 'https://kau.edu.sa' },
  { name: 'جامعة الإمام محمد بن سعود الإسلامية', url: 'https://imamu.edu.sa' },
  { name: 'جامعة الأميرة نورة بنت عبدالرحمن', url: 'https://pnu.edu.sa' },
  { name: 'جامعة الملك خالد', url: 'https://kku.edu.sa' },
  { name: 'جامعة الطائف', url: 'https://tu.edu.sa' },
  { name: 'جامعة القصيم', url: 'https://qu.edu.sa' },
  { name: 'جامعة المجمعة', url: 'https://mu.edu.sa' },
  { name: 'جامعة تبوك', url: 'https://ut.edu.sa' },
  { name: 'جامعة الجوف', url: 'https://ju.edu.sa' },
  { name: 'جامعة حائل', url: 'https://uoh.edu.sa' },
  { name: 'جامعة الباحة', url: 'https://bu.edu.sa' },
  { name: 'جامعة بيشة', url: 'https://ub.edu.sa' },
  { name: 'جامعة شقراء', url: 'https://su.edu.sa' },
  { name: 'جامعة سطام بن عبدالعزيز', url: 'https://psau.edu.sa' },
  { name: 'جامعة عبدالرحمن بن فيصل', url: 'https://iau.edu.sa' },
  { name: 'جامعة جدة', url: 'https://uj.edu.sa' },
  { name: 'جامعة حفر الباطن', url: 'https://uhb.edu.sa' },
  { name: 'جامعة الحدود الشمالية', url: 'https://nbu.edu.sa' },
  {
    name: 'جامعة الملك سعود بن عبدالعزيز للعلوم الصحية',
    url: 'https://ksau-hs.edu.sa/Arabic/Pages/Home.aspx',
  },
  { name: 'جامعة نجران', url: 'https://portal.nu.edu.sa/ar/home' },
  { name: 'جامعة الملك فيصل', url: 'https://www.kfu.edu.sa/ar/Pages/Home.aspx' },
  { name: 'جامعة طيبة', url: 'https://www.taibahu.edu.sa/' },
  { name: 'جامعة أم القرى', url: 'https://uqu.edu.sa' },
  { name: 'الجامعة الإسلامية بالمدينة المنورة', url: 'https://iu.edu.sa/' },
  {
    name: 'وزارة الدفاع',
    url: 'https://afca.mod.gov.sa/',
    badge: 'كليات عسكرية',
  },
  {
    name: 'كلية الملك خالد العسكرية',
    url: 'https://kkmar.sang.gov.sa/kkrs/FrmInstruction.aspx',
    badge: 'كلية عسكرية',
  },
  {
    name: 'الأكاديمية الوطنية للصناعات العسكرية',
    url: 'https://adi.edu.sa',
    badge: 'مبتدئ بالتوظيف',
  },
];

const NAME_ALIASES = {
  'جامعة الامام محمدبن سعود': 'جامعة الإمام محمد بن سعود الإسلامية',
  'جامعة الإمام محمد بن سعود': 'جامعة الإمام محمد بن سعود الإسلامية',
  'جامعة الامام محمد بن سعود الإسلامية': 'جامعة الإمام محمد بن سعود الإسلامية',
  'جامعة الامام محمدبن سعود الإسلامية': 'جامعة الإمام محمد بن سعود الإسلامية',
  'جامعة الأميرة نورة': 'جامعة الأميرة نورة بنت عبدالرحمن',
  'جامعة سطام': 'جامعة سطام بن عبدالعزيز',
  'جامعة سطام بن عبدالعزيز': 'جامعة سطام بن عبدالعزيز',
  'جامعة ام القرى': 'جامعة أم القرى',
  'ام القرى': 'جامعة أم القرى',
  'أم القرى': 'جامعة أم القرى',
  'الجامعة الاسلامية بالمدينة المنورة': 'الجامعة الإسلامية بالمدينة المنورة',
  'الجامعة الإسلامية': 'الجامعة الإسلامية بالمدينة المنورة',
  'الجامعة الاسلامية': 'الجامعة الإسلامية بالمدينة المنورة',
  'إسلامية المدينة': 'الجامعة الإسلامية بالمدينة المنورة',
  'اسلامية المدينة': 'الجامعة الإسلامية بالمدينة المنورة',
  'وزارة_الدفاع': 'وزارة الدفاع',
  'كلية_الملك_خالد_العسكرية': 'كلية الملك خالد العسكرية',
  'جدة': 'جامعة جدة',
};

function getCanonicalUniversityName(name) {
  const trimmedName = (name || '').trim();
  if (!trimmedName) return '';

  return NAME_ALIASES[trimmedName] || trimmedName;
}

export function buildDisplayUniversities(extraUniversities = []) {
  const seen = new Set();
  const result = [];

  const addUniversity = (item) => {
    if (!item?.name) return;

    const canonicalName = getCanonicalUniversityName(item.name);
    if (!canonicalName || seen.has(canonicalName)) return;

    const knownMatch = UNIVERSITY_LINKS.find((university) => university.name === canonicalName);
    seen.add(canonicalName);

    result.push({
      name: canonicalName,
      url: knownMatch?.url || item.url,
      badge: knownMatch?.badge || item.badge,
    });
  };

  UNIVERSITY_LINKS.forEach(addUniversity);

  (extraUniversities || []).forEach((university) => {
    if (!university?.name) return;
    addUniversity(university);
  });

  return result.filter((university) => university.name);
}
