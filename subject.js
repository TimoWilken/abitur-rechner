class Subject extends Serializable {

    constructor(name, field, termGrades, examGrades) {
        super();
        this.name = name;
        this.field = field;
        if (this.field != null) this.field.registerSubject(this);
        this.termGrades = termGrades;
        this.examGrades = examGrades;
        this._requirements = [];
        Object.freeze(this);
    }

    registerRequirement(requirement) {
        this._requirements.push(requirement);
    }

    get requirements() {
        return this._requirements;
    }

    extrapolateGrade() {
        // Future term and exam grades are estimated as the unweighted average
        // of given term and exam grades, enabled or not (there is one average,
        // so e.g. given term grades influence extrapolated future exam grades)
        let getGradeValues = grades => Object.values(grades).filter(g => g.grade !== null).map(g => g.grade);
        let values = getGradeValues(this.termGrades).concat(getGradeValues(this.examGrades));
        return (values.length === 0) ? 0 : sum(values) / values.length;
    }

    getTotalTermsPoints() {
        return this.termGrades.getTotal(this.extrapolateGrade());
    }

    getTotalExamsPoints() {
        return this.examGrades.getTotal(this.extrapolateGrade());
    }

    countEnabledTerms() {
        return this.termGrades.countEnabled();
    }

    toJSON() {
        return {
            name: this.name,
            field: this.field.name,
            termGrades: this.termGrades.toJSON(),
            examGrades: this.examGrades.toJSON(),
        };
    }

    static fromJSON(jsonObject, fields) {
        return new Subject(jsonObject.name, fields[jsonObject.fieldIndex],
            TermGrades.fromJSON(jsonObject.termGrades),
            ExamGrades.fromJSON(jsonObject.examGrades));
    }

}


class SubjectField extends Serializable {

    constructor(name) {
        super();
        this.name = name;
        this._subjects = [];
    }

    registerSubject(subject) {
        // return subject to conserve Array.push syntax
        return this._subjects.push(subject);
    }

    get subjects() {
        return this._subjects;
    }

    toJSON() {
        // Subject field is stored on each subject!
        return { name: this.name };
    }

    static fromJSON(jsonObject) {
        return new SubjectField(jsonObject.name);
    }

}

// vim:foldmethod=marker:foldlevel=0:nowrap:textwidth=0:
