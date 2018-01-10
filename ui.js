function addClassName(element, className) {
    element.className += ' ' + className;
}

function removeClassName(element, className) {
    element.className = element.className.replace(new RegExp(`(?:^|\\s)${className}(?!\\S)`, 'g'), '')
}

function getTermGradeId(subjectName, term) { return `${subjectName}-${term}` }
function getTermGradeEnabledId(subjectName, term) { return `${getTermGradeId(subjectName, term)}-enabled`; }
function getTermGradeNumberId(subjectName, term)  { return `${getTermGradeId(subjectName, term)}-grade`; }
function getTermCountId(subjectName) { return `${subjectName}-totalterms`; }
function getTermCountTextId(subjectName) { return `${getTermCountId(subjectName)}-value`; }
function getPointCountId(subjectName) { return `${subjectName}-totalpoints`; }
function getExamGradeEnabledId(subjectName, gradeName) { return `${subjectName}-${gradeName}-enabled`; }
function getExamGradeNumberId(subjectName, gradeName) { return `${subjectName}-${gradeName}-grade`; }

function recalculateTermGrades() {
    var errors = unmetTermRequirements();
    recalculateTermCount(errors);
    recalculatePointCount();
    populateRulesTables(errors);
}

function recalculateExamGrades() {
}

function recalculateGradePlaceholders(subjectName) {
    var futureGrades = extrapolateFutureGrades(subjectName);
    TERMS.forEach(function (term) {
        var inputbox = document.getElementById(getTermGradeNumberId(subjectName, term));
        inputbox.placeholder = futureGrades;
    });
}

function recalculateTermCount(errors) {
    if (errors == undefined) errors = unmetTermRequirements();
    var totalTerms = 0;

    function recalculateSubjectTermCount(subjectName) {
        var termsEnabled = Object.values(subjects[subjectName].termGrades).filter(g => g.enabled).length;
        document.getElementById(getTermCountTextId(subjectName)).textContent = termsEnabled;
        totalTerms += termsEnabled;
    }

    function setIndicatorsOnCell(cell, failures) {
        if (failures.length == 0) {
            removeClassName(cell, 'invalid');
            cell.title = 'keine Fehler';
        } else {
            addClassName(cell, 'invalid');
            // U+2022 is a bullet point
            cell.title = ['Fehler (siehe Tabelle):']
                .concat(failures.map(e => e.group.description))
                .join('\n\u2022 ');
        }
    }

    function assignSubjectErrorStatus(subjectName) {
        setIndicatorsOnCell(document.getElementById(getTermCountId(subjectName)),
            errors.filter(e => e.failed.map(getSubjectName).includes(subjectName) && !e.group.failSum));
    }

    Object.keys(subjects).forEach(recalculateSubjectTermCount);
    Object.keys(subjects).forEach(assignSubjectErrorStatus);

    document.getElementById('total-terms-value').textContent = totalTerms;

    setIndicatorsOnCell(document.getElementById('total-terms'), errors.filter(e => e.group.failSum));
}

function recalculatePointCount() {
    var totalPoints = Object.keys(subjects).map(function (subjectName) {
        var points = Object.values(subjects[subjectName].termGrades)
            .filter(grade => grade.enabled)
            .map(grade => (grade.grade != undefined) ? grade.grade : extrapolateFutureGrades(subjectName))
            .reduce((a, b) => a + b);
        var pointsCell = document.getElementById(getPointCountId(subjectName));
        pointsCell.textContent = points;
        return points;
    }).reduce((a, b) => a + b);

    var totalPointsCell = document.getElementById('total-points');
    totalPointsCell.textContent = totalPoints;

    var resultCell = document.getElementById('result-1');
    // round half up; formula is E_I = 40 #points / #terms
    var totalTerms = parseInt(document.getElementById('total-terms-value').textContent);
    resultCell.textContent = Math.round(totalPoints / totalTerms * 40);
}

function populateRulesTables(errors) {
    var termsErrorsTable = document.getElementById('tbody-requirements-terms');
    clearTBody(termsErrorsTable);

    if (errors == undefined) errors = unmetTermRequirements();
    errors.forEach(function (error) {
        var errorRow = termsErrorsTable.insertRow(-1);
        errorRow.insertCell(-1).appendChild(document.createTextNode(error.groupName));
        errorRow.insertCell(-1).appendChild(document.createTextNode(error.group.description));
        errorRow.insertCell(-1).appendChild(document.createTextNode(
            error.group.failSum ? '(alle)' : error.failed.map(getSubjectName).join(', ')));
    });

    if (errors.length > 0) {
        removeClassName(document.getElementById('terms-errors'), 'empty');
    } else {
        addClassName(document.getElementById('terms-errors'), 'empty');
    }
}

function updateRequirementIndicators(errors) {
    if (errors == undefined) errors = unmetTermRequirements();
}

function getTermGradeNumberChangeHandler(subjectName, term) {
    return function (e) {
        var numString = e.target.value;
        var number = parseFloat(numString);
        if (isValidGrade(number) || numString == '') {
            subjects[subjectName].termGrades[term].grade = numString ? number : null;

            recalculateGradePlaceholders(subjectName);
            recalculatePointCount();

            removeClassName(e.target, 'invalid-input');
            if (numString == '') {
                addClassName(e.target, 'empty');
            } else {
                removeClassName(e.target, 'empty');
            }

            setSaveState('unsaved');
        } else {
            addClassName(e.target, 'invalid-input');
        }
    };
}

function getTermGradeEnabledChangeHandler(subjectName, term) {
    return function (e) {
        subjects[subjectName].termGrades[term].enabled = e.target.checked;
        recalculateTermGrades();
        setSaveState('unsaved');
    };
}

function getExamGradeNumberChangeHandler(subjectName, gradeName) {
    return function (e) {
    };
}

function getExamGradeEnabledChangeHandler(subjectName, term) {
    return function (e) {
    };
}

function clearTRow(trow)   { while (trow.cells.length > 0) trow.deleteCell(0); }
function clearTBody(tbody) { while (tbody.rows.length > 0) tbody.deleteRow(0); }

function populateTermHeaders() {
    var termsHeaderRow = document.getElementById('hdrow-terms');
    clearTRow(termsHeaderRow);
    TERMS.forEach(function (term) {
        var termHeader = document.createElement('th');
        termHeader.textContent = term;
        termsHeaderRow.appendChild(termHeader);
    });
    document.getElementById('hdr-terms-grades').colSpan = TERMS.length;

    var overallCol = document.getElementById('col-terms-terms');
    overallCol.span = TERMS.length;
    // width of one column under the <col>
    overallCol.style.width = `${50 / TERMS.length}%`;

    document.getElementById('lbl-terms-sum').colSpan = 2 + TERMS.length;
    document.getElementById('lbl-terms-result').colSpan = 3 + TERMS.length;
}

function createGradeCheckbox(subject, description, grade, id, changeHandler) {
    var checkbox = document.createElement('input');
    checkbox.title = `${subject}note (${description}) einbringen?`;
    checkbox.type = 'checkbox';
    checkbox.checked = grade.enabled;
    checkbox.className = 'grade-checkbox';
    checkbox.id = id;
    checkbox.addEventListener('input', changeHandler);
    return checkbox;
}

function createGradeNumberBox(subject, description, grade, id, changeHandler) {
    var textbox = document.createElement('input');
    textbox.title = `${subject}note (${description}) in Punkten (0-15). Falls leer, automatisch bestimmt als Durchschnitt anderer gegebenen Noten.`;
    textbox.type = 'number';
    textbox.min = MIN_VALID_GRADE;
    textbox.max = MAX_VALID_GRADE;
    textbox.step = 1;
    textbox.value = (grade.grade == null) ? '' : grade.grade;
    textbox.className = 'grade-value empty';
    textbox.id = id;
    textbox.addEventListener('input', changeHandler);
    return textbox;
}

function populateTermGradeTable() {
    populateTermHeaders();

    var tbody = document.getElementById('tbody-grades-terms');
    clearTBody(tbody);

    function populateGradeCell(cell, subject, term, grade) {
        cell.className = 'grade-cell';
        var description = `Halbjahr ${term}`;
        cell.appendChild(createGradeCheckbox(subject, description, grade, getTermGradeEnabledId(subject, term), getTermGradeEnabledChangeHandler(subject, term)));
        cell.appendChild(createGradeNumberBox(subject, description, grade, getTermGradeNumberId(subject, term), getTermGradeNumberChangeHandler(subject, term)));
    }

    var lastField = -1, lastFieldCell;

    Object.entries(subjects).forEach(function (s) {
        var name = s[0], val = s[1];
        var row = tbody.insertRow(-1);

        if (val.field != lastField) {
            lastFieldCell = row.insertCell(0);
            lastFieldCell.appendChild(document.createTextNode(FIELDS[val.field]));
            lastField = val.field;
        } else {
            lastFieldCell.rowSpan++;
        }

        var nameCell = row.insertCell(-1);
        var nameText = document.createTextNode(name);
        nameCell.appendChild(nameText);

        TERMS.forEach(term => populateGradeCell(row.insertCell(-1), name, term, val.termGrades[term]));

        var totalTermsCell = row.insertCell(-1);
        totalTermsCell.className = 'total-terms invalid';
        totalTermsCell.id = getTermCountId(name);
        var text = document.createElement('span');
        text.id = getTermCountTextId(name);
        totalTermsCell.appendChild(text);
        var error = document.createElement('span');
        error.className = 'error-indicator';
        totalTermsCell.appendChild(error);

        var totalPointsCell = row.insertCell(-1);
        totalPointsCell.className = 'total-points';
        totalPointsCell.id = getPointCountId(name);

        recalculateGradePlaceholders(name);
    });

    recalculateTermGrades();
}

function populateExamGradeTable() {
    var tbody = document.getElementById('tbody-grades-exam');
    clearTBody(tbody);

    function populateExamGradeCell(cell, subjectName, gradeName, grade) {
        cell.className = 'grade-cell';
        var description;
        switch (gradeName) {
            case 'written':
                description = 'schriftlich';
                break;
            case 'oral':
                description = 'mündlich';
                break;
            default:
                throw `Unknown exam grade type ${gradeName}`;
        }
        cell.appendChild(createGradeCheckbox(subjectName, description, grade, getExamGradeEnabledId(subjectName, gradeName), getExamGradeEnabledChangeHandler(subjectName, gradeName)));
        cell.appendChild(createGradeNumberBox(subjectName, description, grade, getExamGradeNumberId(subjectName, gradeName), getExamGradeNumberChangeHandler(subjectName, gradeName)));
    }

    Object.entries(subjects).forEach(function (entry) {
        var name = entry[0], subject = entry[1];
        var row = tbody.insertRow(-1);
        row.insertCell(-1).appendChild(document.createTextNode(name));
        Object.entries(subject.examGrades).forEach(function (entry) {
            var gradeName = entry[0], grade = entry[1];
            populateExamGradeCell(row.insertCell(-1), name, gradeName, grade);
        });
    });
}

// vim:foldmethod=marker:foldlevel=0:nowrap:textwidth=0:
