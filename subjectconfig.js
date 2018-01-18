class SubjectConfiguration extends Serializable() {

    constructor(fieldNames) {
        super();
        this.fields = fieldNames.map(name => new SubjectField(name));
        this.subjects = {};
        this.requirements = [];
    }

    addSubject(subject) {
        this.subjects[subject.name] = subject;
    }

    addRequirement(requirement) {
        this.requirements.push(requirement);
    }

    _createDefaultRequirements() {
        [
            new TermCountRequirement(
                'Es sind insgesamt 36 Halbjahresergebnisse einzubringen.',
                Object.values(this.subjects),
                TermCountRequirement.total(c => c === 36),
                true
            ),

            new TermCountRequirement(
                'Mindestens eine Fremd-/Landessprache muss voll eingebracht werden.',
                [this.subjects.Englisch, this.subjects.Französisch, this.subjects.Spanisch],
                TermCountRequirement.any(c => c === TermGrades.TERMS.length)
            ),

            new TermCountRequirement(
                'Höchstens 3 Halbjahre Sport können eingebracht werden.',
                [this.subjects.Sport],
                TermCountRequirement.all(c => c <= 3)
            ),
        ].forEach(r => this.addRequirement(r));
    }

    static createDefault() {
        function newTermGrades(enabled = false) {
            let termGrades = {};
            TermGrades.TERMS.forEach(term => termGrades[term] = new Grade(null, enabled));
            return new TermGrades(termGrades);
        }

        function newExamGrades(writtenEnabled = false, oralEnabled = false) {
            return new ExamGrades({
                written: new Grade(null, writtenEnabled),
                oral: new Grade(null, oralEnabled)
            });
        }

        let config = new this([
            'Sprachlich-literarisch-künstlerisch',
            'Gesellschafts\u00ADwissenschaftlich',
            'Mathematisch-naturwissen\u00ADschaftlich',
            'Andere',
        ]);

        [
            new Subject('Deutsch', config.fields[0], newTermGrades(true), newExamGrades(true)),
            new Subject('Englisch', config.fields[0], newTermGrades(true), newExamGrades()),
            new Subject('Französisch', config.fields[0], newTermGrades(), newExamGrades()),
            new Subject('Spanisch', config.fields[0], newTermGrades(), newExamGrades()),

            new Subject('Geschichte', config.fields[1], newTermGrades(true), newExamGrades(true)),
            new Subject('Erdkunde', config.fields[1], newTermGrades(), newExamGrades()),
            new Subject('Ethik', config.fields[1], newTermGrades(), newExamGrades()),

            new Subject('Mathematik', config.fields[2], newTermGrades(true), newExamGrades(true)),

            new Subject('Sport', config.fields[3], newTermGrades(true), newExamGrades()),
        ].forEach(config.addSubject.bind(config));

        config._createDefaultRequirements();

        return config;
    }

    toJSON() {
        return {
            fields: this.fields.map(field => field.toJSON()),
            subjects: Object.values(this.subjects).map(subject => subject.toJSON()),
        };
    }

    static fromJSON(jsonObject) {
        let config = new this(jsonObject.fields.map(field => SubjectField.fromJSON(field)));
        jsonObject.subjects.forEach(subject => config.addSubject(Subject.fromJSON(subject)));
        config._createDefaultRequirements();
        return config;
    }

}

// vim:foldmethod=marker:foldlevel=0:nowrap:textwidth=0:
