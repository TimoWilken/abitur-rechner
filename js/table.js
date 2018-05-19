import { addClassName, removeClassName } from 'util/functions.js';
import { Grade, TermGrades } from 'grades.js';
import { TermCountRequirement, TermPointsRequirement } from 'requirements.js';

export class Table {

    constructor(tableId) {
        this.table = document.getElementById(tableId);
    }

    get tbody() {
        return this.table.tBodies[0];
    }

    clearBody() {
        while (this.tbody.rows.length > 0) {
            this.tbody.deleteRow(0);
        }
    }

}


export class RulesTable extends Table {

    constructor(tableId, requirements) {
        super(tableId);
        requirements.subscribe(this._update);
    }

    _update(requirements) {
        this.clearBody();

        if (requirements.failed.length > 0) {
            removeClassName(this.table, 'empty');
        } else {
            addClassName(this.table, 'empty');
        }

        requirements.failed.forEach(function (req) {
            let row = this.table.insertRow();
            row.insertCell().appendChild(document.createTextNode(req.description));
            row.insertCell().appendChild(document.createTextNode(req.failed.map(s => s.name).join(', ')));
        });
    }

}


export class TermGradeTable extends Table {

    constructor(subjectFields, sumRequirements) {
        super('tbl-terms-grades');
        Object.defineProperty(this, '_subjectFields', { value: subjectFields });
        Object.defineProperty(this, '_sumRequirements', { value: sumRequirements });
        this.cells = {};

        let termsHeaderRow = document.getElementById('hdrow-terms');
        while (termsHeaderRow.cells.length > 0) {
            termsHeaderRow.deleteCell(0);
        }

        TermGrades.TERMS.forEach(term =>
            termsHeaderRow.appendChild(Object.assign(document.createElement('th'), { textContent: term })));
        document.getElementById('hdr-terms-grades').colSpan = TermGrades.TERMS.length;

        var overallCol = document.getElementById('col-terms-terms');
        overallCol.span = TermGrades.TERMS.length;
        // width of one column under the <col>
        overallCol.style.width = `${50 / TermGrades.TERMS.length}%`;

        document.getElementById('lbl-terms-sum').colSpan = 2 + TermGrades.TERMS.length;
        document.getElementById('lbl-terms-result').colSpan = 3 + TermGrades.TERMS.length;

        this.clearBody();
        this._subjectFields.forEach(function (field) {

            let nextRow = this.tbody.insertRow();
            let fieldHeader = nextRow.insertCell();
            fieldHeader.rowSpan = field.subjects.length;
            fieldHeader.appendChild(document.createTextNode(field.name));

            Object.entries(field.subjects).forEach(function ([index, subject]) {
                this._populateSubjectRow(subject, nextRow);
                if (index !== field.subjects.length - 1) {
                    nextRow = this.tbody.insertRow();
                }
            }.bind(this));
        }.bind(this));

        this._recalculateTermCount();
        this._recalculatePointCount();
    }

    _populateSubjectRow(subject, row) {
        row.insertCell().appendChild(document.createTextNode(subject.name));
        this.cells[subject.name] = {};
        TermGrades.TERMS.map(term => this.cells[subject.name][term] = new GradeCell(row.insertCell(), subject, subject.termGrades[term], `Halbjahr ${term}`,
            this._recalculateTermCount.bind(this), this._recalculatePointCount.bind(this)));

        this.cells[subject.name].totalTerms = Object.assign(row.insertCell(), { className: 'total-terms' });
        this.cells[subject.name].totalTerms.appendChild(document.createElement('span'));
        this.cells[subject.name].totalTerms.appendChild(Object.assign(document.createElement('span'), { className: 'error-indicator' }));

        this.cells[subject.name].totalPoints = Object.assign(row.insertCell(), { className: 'total-points' });
        this.cells[subject.name].totalPoints.appendChild(document.createElement('span'));
        this.cells[subject.name].totalPoints.appendChild(Object.assign(document.createElement('span'), { className: 'error-indicator' }));
    }

    _setIndicatorsOnCell(cell, failedReqs) {
        if (failedReqs.length === 0) {
            removeClassName(cell, 'invalid');
            cell.title = 'keine Fehler';
        } else {
            addClassName(cell, 'invalid');
            cell.title = ['Fehler (siehe Tabelle):', ...failedReqs.map(r => r.description)].join('\n\u2022 ');
        }
    }

    _recalculateTermCount() {
        let subjects = [].concat(...this._subjectFields.map(f => f.subjects));

        subjects.forEach(s => this.cells[s.name].totalTerms.firstChild.textContent = s.countEnabledTerms());
        subjects.forEach(s => this._setIndicatorsOnCell(this.cells[s.name].totalTerms,
            s.requirements.filter(r => r instanceof TermCountRequirement && !r.failSum && r.failed.length > 0)));

        document.getElementById('total-terms-value').textContent = sum(subjects.map(s => s.countEnabledTerms()));
        this._setIndicatorsOnCell(document.getElementById('total-terms'), this._sumRequirements.filter(r => r.failed.length > 0));
    }

    _recalculatePointCount() {
        let subjects = [].concat(...this._subjectFields.map(f => f.subjects));

        subjects.forEach(s => document.getElementById(this.cells[s.name].totalPoints.firstChild.textContent = s.getTotalTermsPoints()));
        subjects.forEach(s => this._setIndicatorsOnCell(this.cells[s.name].totalPoints,
            s.requirements.filter(r => r instanceof TermPointsRequirement && !r.failSum && r.failed.length > 0)));
    }

}


export class ExamGradeTable extends Table {
}


export class GradeCell {

    constructor(cellElement, subject, grade, description, onEnabledChange = () => undefined, onNumberChange = () => undefined) {
        this.onEnabledChange = onEnabledChange;
        this.onNumberChange = onNumberChange;
        this.subject = subject;
        this.grade = grade;
        this.description = description;
        cellElement.className = 'grade-cell';
        this.checkbox = cellElement.appendChild(this._createGradeCheckbox());
        this.numberbox = cellElement.appendChild(this._createGradeNumberBox());
        subject.subscribe(this._onSubjectChange.bind(this));
    }

    _createGradeCheckbox() {
        let checkbox = Object.assign(document.createElement('input'), {
            title: `${this.subject.name} (${this.description}) einbringen?`,
            type: 'checkbox',
            checked: this.grade.enabled,
            className: 'grade-checkbox',
        });
        checkbox.addEventListener('input', this._onEnabledChange.bind(this));
        return checkbox;
    }

    _createGradeNumberBox() {
        let numberBox = Object.assign(document.createElement('input'), {
            title: `Note in ${this.subject.name} (${this.description}) in Punkten (0${'\u2013'}15). Falls leer, automatisch bestimmt als Durchschnitt anderer gegebenen Noten.`,
            type: 'number',
            min: Grade.MIN_VALID_GRADE,
            max: Grade.MAX_VALID_GRADE,
            step: 1,
            value: (this.grade.grade == null) ? '' : this.grade.grade,
            placeholder: this.subject.extrapolateGrade(),
            className: 'grade-value' + ((this.grade.grade == null) ? ' empty' : ''),
        });
        numberBox.addEventListener('input', this._onNumberChange.bind(this));
        return numberBox;
    }

    _onSubjectChange(subject) {
        this.numberbox.placeholder = this.subject.extrapolateGrade();
    }

    _onEnabledChange(e) {
        this.grade.enabled = e.target.checked;
        this.onEnabledChange(this);
    }

    _onNumberChange(e) {
        let numString = e.target.value, number = parseFloat(numString);
        if (Grade.isValid(number) || numString == '') {
            this.grade.grade = numString ? number : null;

            removeClassName(e.target, 'invalid-input');
            if (numString == '') {
                addClassName(e.target, 'empty');
            } else {
                removeClassName(e.target, 'empty');
            }

            this.onNumberChange(this);
        } else {
            addClassName(e.target, 'invalid-input');
        }
    }

}
