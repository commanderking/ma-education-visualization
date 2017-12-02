const filterConstants = {
  YEAR: 'Year',
  SCHOOL_TYPE: 'School Type',
  SUBGROUP: 'Subgroup',
  SUBJECT: 'Subject'
}

const filterUtils = {
  filterByDistrictType: (data, schoolType) => {
    return data.filter((school) => {
      return school[filterConstants.SCHOOL_TYPE] === schoolType;
    });
  },
  filterByYear: (data, year) => {
    return data.filter((district) => {
      return district[filterConstants.YEAR] === year;
    });
  },
  filterByStudentType: (data, studentType) => {
    return data.filter((district) => {
      return district[filterConstants.SUBGROUP] === studentType;
    })
  },
  filterBySubject: (data, subject) => {
    return data.filter((district) => {
      return district[filterConstants.SUBJECT] === subject;
    })
  }
}
