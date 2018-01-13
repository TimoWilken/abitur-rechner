function getSubjectTotalExamPoints(examGrades, extrapolatedGrade) {
    var writtenGrade = (examGrades.written.grade != undefined) ? examGrades.written.grade : extrapolatedGrade;
    var oralGrade = (examGrades.oral.grade != undefined) ? examGrades.oral.grade : extrapolatedGrade;
    if (examGrades.written.enabled) {
        if (examGrades.oral.enabled) {
            return 3*writtenGrade + oralGrade;
        } else {
            return 4 * writtenGrade;
        }
    } else {
        if (examGrades.oral.enabled) {
            return 4 * oralGrade;
        } else {
            return 0;
        }
    }
}

function getTotalSubjectExamsPoints(subjectName) {
    var examGrades = subjects[subjectName].examGrades,
        extrapolatedGrade = extrapolateFutureGrades(subjectName),
        points = getSubjectTotalExamPoints(examGrades, extrapolatedGrade);
    return [subjectName, points];
}

// vim:foldmethod=marker:foldlevel=0:nowrap:textwidth=0:
