function addClassName(element, className) {
    element.className += ' ' + className;
}

function removeClassName(element, className) {
    element.className = element.className.replace(new RegExp(`(?:^|\\s)${className}(?!\\S)`, 'g'), '');
}

function recalculateTermGrades() {
    var errors = unmetTermRequirements();
    recalculateTermCount(errors);
    recalculatePointCount();
    populateRulesTables(errors);
}

function recalculateExamGrades() {
    recalculatePointCount();
}

function recalculateGradePlaceholders(subjectName) {
    var futureGrades = extrapolateFutureGrades(subjectName);
    TERMS.forEach(term =>
        document.getElementById(getTermGradeNumberId(subjectName, term)).placeholder = futureGrades);
    ['written', 'oral'].forEach(type =>
        document.getElementById(getExamGradeNumberId(subjectName, type)).placeholder = futureGrades);
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
    var totalTermPoints = Object.keys(subjects).map(getTotalSubjectTermsPoints)
        .map(function (entry) {
            var subjectName = entry[0], points = entry[1];
            document.getElementById(getTermPointCountId(subjectName)).textContent = points;
            return points;
        }).reduce(sum, 0);

    document.getElementById('terms-total-points').textContent = totalTermPoints;

    // round half up; formula is E_I = 40 #points / #terms
    var totalTerms = parseInt(document.getElementById('total-terms-value').textContent);
    document.getElementById('result-1').textContent = Math.round(totalTermPoints / totalTerms * 40);

    var totalExamPoints = Object.keys(subjects).map(getTotalSubjectExamsPoints)
        .map(function (entry) {
            var subjectName = entry[0], points = entry[1];
            document.getElementById(getExamPointCountId(subjectName)).textContent = points;
            return points;
        }).reduce(sum);

    document.getElementById('result-2').textContent = totalExamPoints;
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
        console.log('exam grade change handler: ' + subjectName + ' ' + gradeName);
        var numString = e.target.value;
        var number = parseFloat(numString);
        if (isValidGrade(number) || numString == '') {
            subjects[subjectName].examGrades[gradeName].grade = numString ? number : null;

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

function getExamGradeEnabledChangeHandler(subjectName, gradeName) {
    return function (e) {
        subjects[subjectName].examGrades[gradeName].enabled = e.target.checked;
        recalculateExamGrades();
        setSaveState('unsaved');
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
    textbox.className = 'grade-value' + ((grade.grade == null) ? ' empty' : '');
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
        totalPointsCell.id = getTermPointCountId(name);
    });
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

        var pointCountCell = row.insertCell(-1);
        pointCountCell.className = 'total-points';
        pointCountCell.id = getExamPointCountId(name);
    });
}

// vim:foldmethod=marker:foldlevel=0:nowrap:textwidth=0:
