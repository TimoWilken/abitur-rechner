class Table {

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


class RulesTable extends Table {

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


class TermGradeTable extends Table {

    constructor(subjectFields) {
        super('tbl-terms-grades');
        this._subjectFields = subjectFields;
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

        this._construct();
    }

    _construct() {
        this.clearBody();
        this._subjectFields.forEach(function (field) {

            let nextRow = this.tbody.insertRow();
            let fieldHeader = nextRow.insertCell();
            fieldHeader.rowSpan = field.subjects.length;

            Object.entries(field.subjects).forEach(function ([index, subject]) {
                this._populateSubjectRow(subject, nextRow);
                if (index !== field.subjects.length - 1) {
                    nextRow = this.tbody.insertRow();
                }
            }.bind(this));
        }.bind(this));
    }

    _populateSubjectRow(subject, row) {
        row.insertCell().appendChild(document.createTextNode(subject.name));
        this.cells[subject.name] = {};
        TermGrades.TERMS.map(term => this.cells[subject.name][term] = new TermGradeCell(row.insertCell(), subject, term));

        let totalTermsCell = row.insertCell();
        totalTermsCell.className = 'total-terms invalid';
        totalTermsCell.id = IDs.termCount(subject.name);
        let totalText = document.createElement('span'),
            totalError = document.createElement('span');
        totalText.id = IDs.termCountText(subject.name);
        totalError.id = IDs.termCountError(subject.name);
        totalError.className = 'error-indicator';
        totalTermsCell.appendChild(totalText);
        totalTermsCell.appendChild(totalError);

        let totalPointsCell = row.insertCell();
        totalPointsCell.className = 'total-points';
        totalPointsCell.id = IDs.termPointCount(subject.name);
    }

    _recalculateTermCount() {
        let subjects = [].concat(...this._subjectFields.map(f => f.subjects));
        let totalTerms = sum(subjects.map(s => s.countEnabledTerms()));

        subjects.forEach(s => undefined);
    }

}


class ExamGradeTable extends Table {
}


class GradeCell {

    constructor(subject, grade, description, onchange = () => undefined) {
        this.onchange = onchange;
        this.subject = subject;
        this.grade = grade;
        this.description = description;
    }

    createGradeCheckbox(id) {
        let checkbox = Object.assign(document.createElement('input'), {
            title: `${this.subject.name} (${this.description}) einbringen?`,
            type: 'checkbox',
            checked: this.grade.enabled,
            className: 'grade-checkbox',
            id: id,
        });
        checkbox.addEventListener('input', this._onEnabledChange.bind(this));
        return checkbox;
    }

    createGradeNumberBox(id) {
        let numberBox = Object.assign(document.createElement('input'), {
            title: `${this.subject.name} (${this.description}) in Punkten (0-15). Falls leer, automatisch bestimmt als Durchschnitt anderer gegebenen Noten.`,
            type: 'number',
            min: Grade.MIN_VALID_GRADE,
            max: Grade.MAX_VALID_GRADE,
            step: 1,
            value: (this.grade.grade == null) ? '' : this.grade.grade,
            className: 'grade-value' + ((this.grade.grade == null) ? ' empty' : ''),
            id: id,
        });
        numberBox.addEventListener('input', this._onNumberChange.bind(this));
        return numberBox;
    }

    _onEnabledChange(e) {
        this.grade.enabled = e.target.checked;
        this.onchange(this);
    }

    _onNumberChange(e) {
        let numString = e.target.value, number = parseFloat(numString);
        if (isValidGrade(number) || numString == '') {
            this.grade.grade = numString ? number : null;

            recalculateGradePlaceholders(subjectName);
            recalculatePointCount();

            removeClassName(e.target, 'invalid-input');
            if (numString == '') {
                addClassName(e.target, 'empty');
            } else {
                removeClassName(e.target, 'empty');
            }

            this.onchange(this);
        } else {
            addClassName(e.target, 'invalid-input');
        }
    }

}


class TermGradeCell extends GradeCell {

    constructor(cellElement, subject, term, onchange) {
        super(subject, subject.termGrades[term], `Halbjahr ${term}`, onchange);
        cellElement.className = 'grade-cell';
        cellElement.appendChild(this.createGradeCheckbox(IDs.termGradeEnabled(subject.name, term)));
        cellElement.appendChild(this.createGradeNumberBox(IDs.termGradeNumber(subject.name, term)));
        Object.freeze(this);
    }

}

// vim:foldmethod=marker:foldlevel=0:nowrap:textwidth=0:
