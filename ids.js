class IDs {

    static termGrade(subjectName, term) {
        return `${subjectName}-${term}`;
    }

    static termGradeEnabled(subjectName, term) {
        return `${this.termGrade(subjectName, term)}-enabled`;
    }

    static termGradeNumber(subjectName, term)  {
        return `${this.termGrade(subjectName, term)}-grade`;
    }

    static termCount(subjectName) {
        return `${subjectName}-totalterms`;
    }

    static termCountText(subjectName) {
        return `${this.termCount(subjectName)}-value`;
    }

    static termCountError(subjectName) {
        return `${this.termCount(subjectName)}-error`;
    }

    static termPointCount(subjectName) {
        return `${subjectName}-terms-totalpoints`;
    }

    static examPointCount(subjectName) {
        return `${subjectName}-exams-totalpoints`;
    }

    static examGradeEnabled(subjectName, gradeName) {
        return `${subjectName}-${gradeName}-enabled`;
    }

    static examGradeNumber(subjectName, gradeName) {
        return `${subjectName}-${gradeName}-grade`;
    }

}

// vim:foldmethod=marker:foldlevel=0:nowrap:textwidth=0:
