function getTermGradeId(subjectName, term) { return `${subjectName}-${term}` }
function getTermGradeEnabledId(subjectName, term) { return `${getTermGradeId(subjectName, term)}-enabled`; }
function getTermGradeNumberId(subjectName, term)  { return `${getTermGradeId(subjectName, term)}-grade`; }
function getTermCountId(subjectName) { return `${subjectName}-totalterms`; }
function getTermCountTextId(subjectName) { return `${getTermCountId(subjectName)}-value`; }
function getTermPointCountId(subjectName) { return `${subjectName}-terms-totalpoints`; }
function getExamPointCountId(subjectName) { return `${subjectName}-exams-totalpoints`; }
function getExamGradeEnabledId(subjectName, gradeName) { return `${subjectName}-${gradeName}-enabled`; }
function getExamGradeNumberId(subjectName, gradeName) { return `${subjectName}-${gradeName}-grade`; }

// vim:foldmethod=marker:foldlevel=0:nowrap:textwidth=0:
