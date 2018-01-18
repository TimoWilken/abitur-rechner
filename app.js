class App {

    constructor(subjectConfiguration = SubjectConfiguration.createDefault()) {
        this.config = subjectConfiguration;

        new TermGradeTable(this.config.fields);
        new ExamGradeTable();
        Object.values(this.config.subjects).forEach(this._recalculateGradePlaceholders.bind(this));
        // this._recalculateTermGrades();
        // this._recalculateExamGrades();
    }

    _recalculateTermGrades() {
        let errors = null;
        this._recalculateTermCount(errors);
        this._recalculatePointCount();
        this._populateRulesTable();
    }

    _recalculateExamGrades() {
        this._recalculatePointCount();
    }

    _recalculateGradePlaceholders(subject) {
        var futureGrades = subject.extrapolateGrade();
        TermGrades.TERMS.forEach(term =>
            document.getElementById(IDs.termGradeNumber(subject.name, term)).placeholder = futureGrades);
        // ExamGrades.EXAMS.forEach(exam =>
            // document.getElementById(IDs.examGradeNumber(subject.name, exam)).placeholder = futureGrades);
    }

}

// vim:foldmethod=marker:foldlevel=0:nowrap:textwidth=0:
