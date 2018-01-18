class Requirement {

    constructor(description, subjects, predicate, failSum = false) {
        this.description = description;
        this.predicate = predicate;
        this.subjects = subjects;
        this.subjects.forEach(s => s.registerRequirement(this));
        this.failSum = !!failSum;
    }

    get failed() {
        return this.predicate(this.subjects);
    }

    static any(predicate) {
        return subjects => subjects.some(predicate) ? [] : subjects;
    }

    static all(predicate) {
        return function (subjects) {
            let failed = subjects.filter(s => !predicate(s));
            return (failed.length > 0) ? failed : [];
        };
    }

}


class TermCountRequirement extends Requirement {

    static any(predicate) {
        return Requirement.any(s => predicate(s.countEnabledTerms()));
    }

    static all(predicate) {
        return Requirement.all(s => predicate(s.countEnabledTerms()));
    }

    static total(predicate) {
        return subjects => predicate(sum(subjects.map(s => s.countEnabledTerms()))) ? [] : subjects;
    }

    static exclusive() {
        return subjects => (subjects.map(s => s.countEnabledTerms()).filter(c => c > 0).length > 1) ? subjects : [];
    }

}


class TermPointsRequirement extends Requirement {

    static any(predicate) {
        return Requirement.any(s => predicate(s.getTotalTermsPoints()));
    }

    static all(predicate) {
        return Requirement.all(s => predicate(s.getTotalTermsPoints()));
    }

}


class ExamPointsRequirement extends Requirement {

    static any(predicate) {
        return Requirement.any(s => predicate(s.getTotalExamsPoints()));
    }

    static all(predicate) {
        return Requirement.all(s => predicate(s.getTotalExamsPoints()));
    }

}

// vim:foldmethod=marker:foldlevel=0:nowrap:textwidth=0:
